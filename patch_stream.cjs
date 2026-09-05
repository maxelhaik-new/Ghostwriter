const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          language === "fr" ? "Tu es un maître écrivain et prête-plume de fiction. Produis uniquement le paragraphe demandé, sans aucun commentaire." : "You are a master fiction ghostwriter. Output only the requested story paragraph without commentary.",
      },
    });

    const continuation = response.text?.trim() || "";
    return res.json({ success: true, continuation });`;

const replacement = `    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    await streamWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          language === "fr" ? "Tu es un maître écrivain et prête-plume de fiction. Produis uniquement le paragraphe demandé, sans aucun commentaire." : "You are a master fiction ghostwriter. Output only the requested story paragraph without commentary.",
      },
    }, res);`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
