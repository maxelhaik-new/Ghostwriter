export interface SceneAnalysis {
  mood: string;
  atmosphere: string;
  lightingAndPalette: string;
  setting: string;
  focalPoints: string[];
}

export interface GhostwriteResult {
  storyTitle: string;
  sceneAnalysis: SceneAnalysis;
  openingParagraph: string;
  narrativeHooks: string[];
  hiddenSecret: string;
}

export interface GhostwriteOptions {
  tone: string;
  pov: string;
  pacing: string;
  customPrompt: string;
}

export interface SampleScene {
  id: string;
  title: string;
  description: string;
  url: string;
  recommendedTone: string;
}
