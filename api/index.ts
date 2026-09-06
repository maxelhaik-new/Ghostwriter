import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

dotenv.config();

const app = express();

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

// Configured models: default gemini-3.1-flash-lite (fastest, active quota), fallback to gemini-flash-latest and 3.8 flash
const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

// Helper delay for backoff between fallback attempts
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function extractCleanErrorMessage(err: any): string {
  if (!err) return "Une erreur inattendue est survenue.";
  let msg = err.message || String(err);
  try {
    const raw = typeof err.message === "string" ? err.message.trim() : "";
    if (raw.startsWith("{")) {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      }
    } else if (err.error?.message) {
      msg = err.error.message;
    }
  } catch {}

  if (
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    err?.status === 429
  ) {
    return "La limite de requêtes de l'API est temporairement atteinte. Veuillez patienter quelques secondes avant de réessayer.";
  }
  return msg;
}

async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  },
): Promise<{ response: any; modelUsed: string }> {
  let lastError: any = null;

  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const model = CANDIDATE_MODELS[i];
    try {
      // Configure low thinking effort for maximum speed
      const mergedConfig = {
        ...params.config,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
          ...(params.config?.thinkingConfig || {}),
        },
      };

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: mergedConfig,
      });
      console.log(`[Gemini Server] Requête traitée avec succès par le modèle : ${model}`);
      return { response, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const is503Or429 =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("429") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("quota");

      console.log(
        `[Gemini Server] Modèle ${model} indisponible (${is503Or429 ? "pic de charge temporaire" : "statut: " + (err?.status || "erreur")}), passage au candidat suivant...`,
      );

      // If we have a next candidate and hit high demand, brief pause for backoff
      if (i < CANDIDATE_MODELS.length - 1 && is503Or429) {
        await delay(400);
      }
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

const apiRouter = express.Router();

// Health check endpoint
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Helper for streaming Gemini responses with low latency
let streamCallCount = 0;

async function streamWithFallback(ai: any, params: any, res: any) {
  const currentCallId = ++streamCallCount;
  let lastError = null;

  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const model = CANDIDATE_MODELS[i];
    let chunksSent = 0;

    try {
      const mergedConfig = {
        ...params.config,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
          ...(params.config?.thinkingConfig || {}),
        },
      };

      const responseStream = await ai.models.generateContentStream({
        model,
        contents: params.contents,
        config: mergedConfig,
      });
      
      console.log(`[Gemini Server Stream #${currentCallId}] Flux démarré avec succès par le modèle : ${model}`);
      // Notify client of the active model and call ID
      res.write(`data: ${JSON.stringify({ modelUsed: model, callId: currentCallId })}\n\n`);

      for await (const chunk of responseStream) {
        if (chunk.text) {
          chunksSent++;
          res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    } catch (err: any) {
      lastError = err;
      
      // If chunks were already written to the HTTP response, we cannot restart the stream with another model
      // without corrupting/duplicating the text on the client
      if (chunksSent > 0) {
        console.error(`[Gemini Server Stream #${currentCallId}] Échec en cours de flux avec ${model} après ${chunksSent} morceaux. Clôture.`);
        res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
        res.end();
        return;
      }

      const is503Or429 =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("429") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("quota");

      console.log(
        `[Gemini Server Stream #${currentCallId}] Modèle ${model} indisponible (${is503Or429 ? "pic de charge temporaire" : "statut: " + (err?.status || "erreur")}), passage au candidat suivant...`,
      );

      if (i < CANDIDATE_MODELS.length - 1 && is503Or429) {
        await delay(400);
      }
    }
  }
  const errStr = extractCleanErrorMessage(lastError);
  res.write(`data: ${JSON.stringify({ error: errStr })}\n\n`);
  res.end();
}

apiRouter.post("/analyze-scene", async (req, res) => {
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

    const { response, modelUsed } = await generateWithFallback(ai, {
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

    res.setHeader("X-Model-Used", modelUsed);
    return res.json({ success: true, data: parsedData, modelUsed });
  } catch (error: any) {
    console.error("Error in /api/analyze-scene:", error);
    return res.status(500).json({
      error: extractCleanErrorMessage(error),
    });
  }
});

apiRouter.post("/write-opening-stream", async (req, res) => {
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
    res.setHeader('X-Accel-Buffering', 'no');

    await streamWithFallback(ai, {
      contents: promptText,
      config: {
        systemInstruction: language === "fr" ? "Tu es un maître écrivain et prête-plume de fiction. Produis uniquement le texte du paragraphe, sans aucun commentaire." : "You are a master fiction ghostwriter. Output only the requested story paragraph without commentary."
      }
    }, res);
  } catch (error) {
    console.error("Error in /api/write-opening-stream:", error);
    const errStr = extractCleanErrorMessage(error);
    if (!res.headersSent) {
      res.status(500).json({ error: errStr });
    } else {
      res.write(`data: ${JSON.stringify({ error: errStr })}\n\n`);
      res.end();
    }
  }
});

// Endpoint: Continue ghostwriting the next paragraph
apiRouter.post("/continue-story-stream", async (req, res) => {
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
    res.setHeader('X-Accel-Buffering', 'no');
    
    await streamWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          language === "fr" ? "Tu es un maître écrivain et prête-plume de fiction. Produis uniquement le paragraphe demandé, sans aucun commentaire." : "You are a master fiction ghostwriter. Output only the requested story paragraph without commentary.",
      },
    }, res);
  } catch (error: any) {
    console.error("Error in /api/continue-story:", error);
    const errStr = extractCleanErrorMessage(error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: errStr,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: errStr })}\n\n`);
      res.end();
    }
  }
});

// Mount router on both /api (standard) and root / (in case Vercel rewrites strip prefix)
app.use("/api", apiRouter);
app.use(apiRouter);

// Global fallback error handler to guarantee JSON response
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});

export default app;
