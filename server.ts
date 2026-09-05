import express from "express";
import path from "path";
import dotenv from "dotenv";
import http from "http";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Support large image payloads for vision analysis
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy getter for GoogleGenAI client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Current flash models with automatic fallback on 503 high demand or 429 quota exhaustion
const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  },
) {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(
        `Model ${model} failed (trying fallback):`,
        err?.message || err,
      );
      // Try next model if current one experiences high demand (503), quota limits (429), or is temporarily unavailable
      continue;
    }
  }

  throw (
    lastError ||
    new Error(
      "All AI models are currently experiencing high demand. Please retry in a moment.",
    )
  );
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Endpoint: Analyze image and ghostwrite opening paragraph
async function streamWithFallback(ai, params, res) {
  let lastError = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: params.contents,
        config: params.config,
      });
      
      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} stream failed (trying fallback):`, err?.message || err);
    }
  }
  res.write(`data: ${JSON.stringify({ error: "Failed to generate stream" })}\n\n`);
  res.end();
}

app.post("/api/analyze-scene", async (req, res) => {
  try {
    const { image, options, language = "fr" } = req.body;

    if (!image || !image.data) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const ai = getGeminiClient();

    const tone = options?.tone || "Atmospheric & Poetic";
    const pov = options?.pov || "Third Person Limited";
    const pacing = options?.pacing || "Slow & Immersive";
    const customPrompt = options?.customPrompt
      ? `Author's specific inspiration/focus: "${options.customPrompt}".`
      : "";

    // Clean base64 string if it contains data URI header
    let base64Data = image.data;
    let mimeType = image.mimeType || "image/jpeg";
    if (base64Data.includes(";base64,")) {
      const parts = base64Data.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      base64Data = parts[1];
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    };

    const promptText = `
You are an award-winning literary novelist and master ghostwriter.
Observe this image with profound attention to atmosphere, lighting, emotional undertones, architectural or environmental details, and unspoken history.

Language Requirement: You must write the final JSON content (including the title, opening paragraph, setting, mood, hooks, and secret) strictly in ${language === "fr" ? "French" : "English"}.

Task:
1. Analyze the mood, sensory atmosphere, lighting/palette, and setting implied by this visual world.
2. Do NOT write the opening paragraph yet. We only need the analysis, title, hooks, and secret first.
   - Tone: ${tone}
   - Point of View: ${pov}
   - Pacing: ${pacing}
   ${customPrompt}



3. Suggest a memorable title, 3 narrative hooks / inciting incidents, and a compelling secret lying just outside the frame.

Return pure JSON conforming to the requested schema.
`.trim();

    const response = await generateWithFallback(ai, {
      contents: {
        parts: [imagePart, { text: promptText }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storyTitle: {
              type: Type.STRING,
              description: "An evocative literary title for this story.",
            },
            sceneAnalysis: {
              type: Type.OBJECT,
              properties: {
                mood: {
                  type: Type.STRING,
                  description:
                    "A resonant 2-4 word summary of the emotional mood.",
                },
                atmosphere: {
                  type: Type.STRING,
                  description:
                    "Sensory description of the air, sounds, climate, and psychological weight.",
                },
                lightingAndPalette: {
                  type: Type.STRING,
                  description:
                    "Analysis of light sources, shadows, and color temperature.",
                },
                setting: {
                  type: Type.STRING,
                  description:
                    "Where and when this world exists, including environmental cues.",
                },
                focalPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description:
                    "3 to 4 distinct visual details detected in the scene.",
                },
              },
              required: [
                "mood",
                "atmosphere",
                "lightingAndPalette",
                "setting",
                "focalPoints",
              ],
            },

            narrativeHooks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "3 provocative story questions or plot developments arising from this scene.",
            },
            hiddenSecret: {
              type: Type.STRING,
              description:
                "A secret or tension lingering just out of sight beyond the camera angle.",
            },
          },
          required: [
            "storyTitle",
            "sceneAnalysis",
            "narrativeHooks",
            "hiddenSecret",
          ],
        },
      },
    });

    const jsonText = response.text || "{}";
    const parsedData = JSON.parse(jsonText);

    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error in /api/analyze-and-write:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze image and generate story.",
    });
  }
});

app.post("/api/write-opening-stream", async (req, res) => {
  try {
    const { analysis, title, options, language = "fr" } = req.body;
    const ai = getGeminiClient();
    
    const tone = options?.tone || "Atmospheric & Poetic";
    const pov = options?.pov || "Third Person Limited";
    const pacing = options?.pacing || "Slow & Immersive";
    const customPrompt = options?.customPrompt ? `Author's specific inspiration/focus: "${options.customPrompt}".` : "";

    const promptText = `You are an award-winning literary novelist and master ghostwriter.
Write an unforgettable, mesmerizing opening paragraph (130 to 220 words) for a story titled "${title}".
    
Scene Analysis Context:
- Mood: ${analysis?.mood}
- Atmosphere: ${analysis?.atmosphere}
- Setting: ${analysis?.setting}
- Lighting: ${analysis?.lightingAndPalette}
- Focal Points: ${analysis?.focalPoints?.join(", ")}

Directives:
- Tone: ${tone}
- Point of View: ${pov}
- Pacing: ${pacing}
${customPrompt}
- Language: ${language === "fr" ? "French" : "English"}

Ground the reader immediately in sensory texture. Avoid generic cliché openings. Begin in media res or with an indelible sensory revelation. Return ONLY the paragraph text without any commentary, quotes, or JSON.`.trim();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await streamWithFallback(ai, {
      contents: promptText,
      config: {
        systemInstruction: language === "fr" ? "Tu es un maître écrivain et prête-plume de fiction. Produis uniquement le texte du paragraphe, sans aucun commentaire." : "You are a master fiction ghostwriter. Output only the requested story paragraph without commentary."
      }
    }, res);
  } catch (error) {
    console.error("Error in /api/write-opening-stream:", error);
    res.status(500).end();
  }
});

// Endpoint: Continue ghostwriting the next paragraph
app.post("/api/continue-story-stream", async (req, res) => {
  try {
    const { storyTitle, previousText, sceneContext, direction, language = "fr" } = req.body;

    if (!previousText) {
      return res.status(400).json({ error: "Missing previous text" });
    }

    const ai = getGeminiClient();

    const prompt = `
You are the ghostwriter continuing the story titled "${storyTitle || "Untitled"}".
Scene context and atmosphere: ${sceneContext || "Moody and cinematic"}.

Here is the story written so far:
"""
${previousText}
"""

${direction ? `Author's directive for what happens next: "${direction}"` : "Naturally continue the momentum of the narrative."}

Write the next paragraph (120-180 words) in ${language === "fr" ? "French" : "English"}. Match the exact literary voice, rhythm, and sensory depth established in the opening. Return only the new paragraph text.
`.trim();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    await streamWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          language === "fr" ? "Tu es un maître écrivain et prête-plume de fiction. Produis uniquement le paragraphe demandé, sans aucun commentaire." : "You are a master fiction ghostwriter. Output only the requested story paragraph without commentary.",
      },
    }, res);
  } catch (error: any) {
    console.error("Error in /api/continue-story:", error);
    return res.status(500).json({
      error: error?.message || "Failed to continue story.",
    });
  }
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const server = http.createServer(app);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Visual Ghostwriter server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
