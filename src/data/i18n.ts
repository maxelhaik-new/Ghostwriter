export type Language = "fr" | "en";

export interface Translation {
  appName: string;
  appSubtitle: string;
  newStory: string;
  uploadTitle: string;
  uploadSubtitle: string;
  uploadButton: string;
  analyzingImage: string;
  sceneAnalysisTitle: string;
  openingParagraphTitle: string;
  storySparksTitle: string;
  generating: string;
  tone: string;
  pov: string;
  pacing: string;
  customPrompt: string;
  customPromptPlaceholder: string;
  generateButton: string;
  continueButton: string;
  tones: { label: string; value: string }[];
  povs: { label: string; value: string }[];
  analysisMood: string;
  analysisAtmosphere: string;
  analysisLighting: string;
  analysisSetting: string;
  analysisFocalPoints: string;
  hiddenSecretTitle: string;
  supportsText: string;
  sampleWorlds: string;
  changeImage: string;
  dismiss: string;
  missingImageError: string;
}

export const TRANSLATIONS: Record<Language, Translation> = {
  fr: {
    appName: "Visual Ghostwriter",
    appSubtitle: "Analyse d'image & génération de premier paragraphe",
    newStory: "Nouvelle histoire",
    uploadTitle: "Déposez une image ici",
    uploadSubtitle: "ou parcourez",
    uploadButton: "Choisir une image",
    analyzingImage: "Analyse de la scène...",
    sceneAnalysisTitle: "Analyse de la scène",
    openingParagraphTitle: "Premier paragraphe",
    storySparksTitle: "Pistes narratives",
    generating: "Génération en cours...",
    tone: "Ton & Ambiance",
    pov: "Point de vue",
    pacing: "Rythme",
    customPrompt: "Instructions optionnelles",
    customPromptPlaceholder: "ex: Un messager fugitif se reposant...",
    generateButton: "Générer le paragraphe",
    continueButton: "Continuer l'histoire",
    tones: [
      { label: "Atmosphérique & Poétique", value: "Atmospheric & Poetic" },
      { label: "Noir & Sombre", value: "Noir & Gritty" },
      { label: "Gothique & Hanté", value: "Gothic & Haunting" },
      { label: "Merveilleux & Mythique", value: "Wonder & Mythic" },
      { label: "Suspense & Psychologique", value: "Suspense & Psychological" },
      { label: "Science-Fiction & Cybernétique", value: "Sci-Fi & Cybernetic" }
    ],
    povs: [
      { label: "Troisième Personne Limitée", value: "Third Person Limited" },
      { label: "Première Personne (\"Je\")", value: "First Person" },
      { label: "Troisième Personne Omnisciente", value: "Third Person Omniscient" },
      { label: "Deuxième Personne (\"Tu\")", value: "Second Person" }
    ],
    analysisMood: "Humeur",
    analysisAtmosphere: "Atmosphère Sensorielle",
    analysisLighting: "Lumière & Palette",
    analysisSetting: "Décor",
    analysisFocalPoints: "Éléments Clés",
    hiddenSecretTitle: "Secret Caché",
    supportsText: "Supporte JPEG, PNG, WEBP",
    sampleWorlds: "Ou testez avec un monde d'exemple :",
    changeImage: "Changer l'image",
    dismiss: "Fermer",
    missingImageError: "Veuillez d'abord sélectionner ou déposer une image."
  },
  en: {
    appName: "Visual Ghostwriter",
    appSubtitle: "Image-driven scene analysis & literary opening generator",
    newStory: "New Story",
    uploadTitle: "Drop an image here",
    uploadSubtitle: "or browse",
    uploadButton: "Choose an image",
    analyzingImage: "Analyzing scene...",
    sceneAnalysisTitle: "Scene Analysis",
    openingParagraphTitle: "Opening Paragraph",
    storySparksTitle: "Story Sparks",
    generating: "Generating...",
    tone: "Tone & Mood",
    pov: "Point of View",
    pacing: "Pacing",
    customPrompt: "Optional Instructions",
    customPromptPlaceholder: "e.g. A fugitive messenger resting...",
    generateButton: "Generate Opening",
    continueButton: "Continue Story",
    tones: [
      { label: "Atmospheric & Poetic", value: "Atmospheric & Poetic" },
      { label: "Noir & Gritty", value: "Noir & Gritty" },
      { label: "Gothic & Haunting", value: "Gothic & Haunting" },
      { label: "Wonder & Mythic", value: "Wonder & Mythic" },
      { label: "Suspense & Psychological", value: "Suspense & Psychological" },
      { label: "Sci-Fi & Cybernetic", value: "Sci-Fi & Cybernetic" }
    ],
    povs: [
      { label: "Third Person Limited", value: "Third Person Limited" },
      { label: "First Person (\"I\")", value: "First Person" },
      { label: "Third Person Omniscient", value: "Third Person Omniscient" },
      { label: "Second Person (\"You\")", value: "Second Person" }
    ],
    analysisMood: "Mood",
    analysisAtmosphere: "Sensory Atmosphere",
    analysisLighting: "Lighting & Palette",
    analysisSetting: "Setting",
    analysisFocalPoints: "Focal Elements",
    hiddenSecretTitle: "Hidden Secret",
    supportsText: "Supports JPEG, PNG, WEBP",
    sampleWorlds: "Or test with a sample world:",
    changeImage: "Change image",
    dismiss: "Dismiss",
    missingImageError: "Please select or upload an initial image first."
  }
};
