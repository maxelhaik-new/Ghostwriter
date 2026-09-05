const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

// Replace analyze-and-write endpoint with two endpoints: analyze-scene and write-opening-stream
serverCode = serverCode.replace(
  'app.post("/api/analyze-and-write", async (req, res) => {',
  `async function streamWithFallback(ai, params, res) {
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
          res.write(\`data: \${JSON.stringify({ chunk: chunk.text })}\\n\\n\`);
        }
      }
      res.write("data: [DONE]\\n\\n");
      res.end();
      return;
    } catch (err) {
      lastError = err;
      console.warn(\`Model \${model} stream failed (trying fallback):\`, err?.message || err);
    }
  }
  res.write(\`data: \${JSON.stringify({ error: "Failed to generate stream" })}\\n\\n\`);
  res.end();
}

app.post("/api/analyze-scene", async (req, res) => {`
);

serverCode = serverCode.replace(
  '2. Ghostwrite an unforgettable, mesmerizing opening paragraph to a story set directly in this scene.',
  '2. Do NOT write the opening paragraph yet. We only need the analysis, title, hooks, and secret first.'
);

serverCode = serverCode.replace(
  '   - The opening paragraph should be 130 to 220 words.',
  ''
);

serverCode = serverCode.replace(
  '   - Ground the reader immediately in sensory texture (smells, temperatures, acoustic reverberations, interplay of light and shadow).',
  ''
);

serverCode = serverCode.replace(
  '   - Avoid generic cliché openings like "It was a dark..." or "The city was...". Begin in media res or with an indelible sensory revelation.',
  ''
);

// Remove openingParagraph from schema
serverCode = serverCode.replace(
  `            openingParagraph: {
              type: Type.STRING,
              description:
                "The ghostwritten opening paragraph (130-220 words) with literary distinction.",
            },`,
  ''
);

serverCode = serverCode.replace(
  `            "sceneAnalysis",
            "openingParagraph",
            "narrativeHooks",`,
  `            "sceneAnalysis",
            "narrativeHooks",`
);

// Add write-opening-stream
serverCode = serverCode.replace(
  '// Endpoint: Continue ghostwriting the next paragraph',
  `app.post("/api/write-opening-stream", async (req, res) => {
  try {
    const { analysis, title, options, language = "fr" } = req.body;
    const ai = getGeminiClient();
    
    const tone = options?.tone || "Atmospheric & Poetic";
    const pov = options?.pov || "Third Person Limited";
    const pacing = options?.pacing || "Slow & Immersive";
    const customPrompt = options?.customPrompt ? \`Author's specific inspiration/focus: "\${options.customPrompt}".\` : "";

    const promptText = \`You are an award-winning literary novelist and master ghostwriter.
Write an unforgettable, mesmerizing opening paragraph (130 to 220 words) for a story titled "\${title}".
    
Scene Analysis Context:
- Mood: \${analysis?.mood}
- Atmosphere: \${analysis?.atmosphere}
- Setting: \${analysis?.setting}
- Lighting: \${analysis?.lightingAndPalette}
- Focal Points: \${analysis?.focalPoints?.join(", ")}

Directives:
- Tone: \${tone}
- Point of View: \${pov}
- Pacing: \${pacing}
\${customPrompt}
- Language: \${language === "fr" ? "French" : "English"}

Ground the reader immediately in sensory texture. Avoid generic cliché openings. Begin in media res or with an indelible sensory revelation. Return ONLY the paragraph text without any commentary, quotes, or JSON.\`.trim();

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

// Endpoint: Continue ghostwriting the next paragraph`
);

// Update continue-story to be a stream
serverCode = serverCode.replace(
  'app.post("/api/continue-story", async (req, res) => {',
  'app.post("/api/continue-story-stream", async (req, res) => {'
);

serverCode = serverCode.replace(
  `    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          language === "fr" ? "Tu es un maître écrivain et prête-plume de fiction. Produis uniquement le paragraphe demandé, sans aucun commentaire." : "You are a master fiction ghostwriter. Output only the requested story paragraph without commentary.",
      },
    });
    const continuation = response.text?.trim() || "";
    return res.json({ success: true, continuation });`,
  `    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await streamWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          language === "fr" ? "Tu es un maître écrivain et prête-plume de fiction. Produis uniquement le paragraphe demandé, sans aucun commentaire." : "You are a master fiction ghostwriter. Output only the requested story paragraph without commentary.",
      },
    }, res);`
);

fs.writeFileSync('server.ts', serverCode);
