const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'Observe this image with profound attention to atmosphere, lighting, emotional undertones, architectural or environmental details, and unspoken history.',
  'Observe this image with profound attention to atmosphere, lighting, emotional undertones, architectural or environmental details, and unspoken history.\n\nLanguage Requirement: You must write the final JSON content (including the title, opening paragraph, setting, mood, hooks, and secret) strictly in ${language === "fr" ? "French" : "English"}.'
);

code = code.replace(
  'Write the next paragraph (120-180 words). Match the exact literary voice, rhythm, and sensory depth established in the opening. Return only the new paragraph text.',
  'Write the next paragraph (120-180 words) in ${language === "fr" ? "French" : "English"}. Match the exact literary voice, rhythm, and sensory depth established in the opening. Return only the new paragraph text.'
);

code = code.replace(
  '"You are a master fiction ghostwriter. Output only the requested story paragraph without commentary.",',
  'language === "fr" ? "Tu es un maître écrivain et prête-plume de fiction. Produis uniquement le paragraphe demandé, sans aucun commentaire." : "You are a master fiction ghostwriter. Output only the requested story paragraph without commentary.",'
);

fs.writeFileSync('server.ts', code);
console.log('Replacement done.');
