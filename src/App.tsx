import React, { useState } from "react";
import { Header } from "./components/Header";
import { ImageUploadZone } from "./components/ImageUploadZone";
import { SceneAnalysisCard } from "./components/SceneAnalysisCard";
import { OpeningParagraphCard } from "./components/OpeningParagraphCard";
import { StorySparksCard } from "./components/StorySparksCard";
import { GhostwriteOptions, GhostwriteResult } from "./types";
import { Language, TRANSLATIONS } from "./data/i18n";
import { AlertCircle } from "lucide-react";

export default function App() {
  const [language, setLanguage] = useState<Language>("fr");
  const t = TRANSLATIONS[language];
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [options, setOptions] = useState<GhostwriteOptions>({
    tone: "Atmospheric & Poetic",
    pov: "Third Person Limited",
    pacing: "Slow & Immersive",
    customPrompt: "",
  });
  const [result, setResult] = useState<GhostwriteResult | null>(null);
  const [continuations, setContinuations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageSelected = (base64: string, mimeType: string) => {
    setImagePreview(base64);
    setImageData({ base64, mimeType });
    setErrorMessage(null);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageData(null);
    setResult(null);
    setContinuations([]);
    setErrorMessage(null);
  };

  const handleAnalyzeAndWrite = async () => {
    if (!imageData) {
      setErrorMessage(t.missingImageError);
      return;
    }
    if (isLoading || isContinuing) {
      console.warn("[App] Requête ignorée : une génération est déjà en cours.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    console.log("%c[App] Lancement de l'analyse et de l'écriture...", "color: #8b5cf6; font-weight: bold;");
    
    try {
      // Step 1: Get the scene analysis and metadata
      const response = await fetch("/api/analyze-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: { data: imageData.base64, mimeType: imageData.mimeType },
          options,
          language
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to analyze image.");
      }
      
      if (json.modelUsed) {
        console.log(
          `%c[Gemini] Modèle utilisé pour l'analyse : %c${json.modelUsed}`,
          "color: #3b82f6; font-weight: bold;",
          "color: #10b981; font-weight: bold;"
        );
      }

      const metaData = json.data;
      
      // Initialize result state with empty opening paragraph
      setResult({
        ...metaData,
        openingParagraph: ""
      });
      setContinuations([]);
      
      // We can stop the main loading spinner here since analysis is done
      setIsLoading(false);
      setIsContinuing(true); // Re-use isContinuing for the initial stream as well to show activity

      // Step 2: Stream the opening paragraph
      console.log("%c[App] Démarrage du flux d'ouverture...", "color: #8b5cf6;");
      const streamResponse = await fetch("/api/write-opening-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: metaData.sceneAnalysis,
          title: metaData.storyTitle,
          options,
          language
        }),
      });

      if (!streamResponse.ok || !streamResponse.body) {
        let errMsg = "Failed to start opening stream";
        try {
          const errData = await streamResponse.json();
          if (errData?.error) errMsg = errData.error;
        } catch {}
        throw new Error(errMsg);
      }

      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            let data: any = null;
            try {
              data = JSON.parse(dataStr);
            } catch (e) {
              console.warn("Parse error for chunk:", e);
              continue;
            }

            if (data?.error) {
              throw new Error(data.error);
            }

            if (data?.modelUsed) {
              console.log(
                `%c[Gemini] Modèle utilisé pour l'ouverture : %c${data.modelUsed}`,
                "color: #3b82f6; font-weight: bold;",
                "color: #10b981; font-weight: bold;"
              );
            }
            if (data?.chunk) {
              setResult(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  openingParagraph: prev.openingParagraph + data.chunk
                };
              });
            }
          }
        }
      }

    } catch (err: any) {
      console.error("Error generating story:", err);
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setIsContinuing(false);
    }
  };

  const handleContinueStory = async (direction: string) => {
    if (!result) return;
    if (isLoading || isContinuing) {
      console.warn("[App] Requête ignorée : une génération est déjà en cours.");
      return;
    }
    setIsContinuing(true);
    setErrorMessage(null);
    console.log("%c[App] Lancement de la suite de l'histoire...", "color: #8b5cf6; font-weight: bold;");
    
    // Add empty placeholder for the new continuation
    setContinuations(prev => [...prev, ""]);
    
    try {
      const currentDraft = [result.openingParagraph, ...continuations].join("\n\n");
      const response = await fetch("/api/continue-story-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyTitle: result.storyTitle,
          previousText: currentDraft,
          sceneContext: `${result.sceneAnalysis.mood}. Setting: ${result.sceneAnalysis.setting}`,
          direction,
          language
        }),
      });
      
      if (!response.ok || !response.body) {
        let errMsg = "Failed to start continuation stream";
        try {
          const errData = await response.json();
          if (errData?.error) errMsg = errData.error;
        } catch {}
        throw new Error(errMsg);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            let data: any = null;
            try {
              data = JSON.parse(dataStr);
            } catch (e) {
              console.warn("Parse error for chunk:", e);
              continue;
            }

            if (data?.error) {
              throw new Error(data.error);
            }

            if (data?.modelUsed) {
              console.log(
                `%c[Gemini] Modèle utilisé pour la suite : %c${data.modelUsed}`,
                "color: #3b82f6; font-weight: bold;",
                "color: #10b981; font-weight: bold;"
              );
            }
            if (data?.chunk) {
              setContinuations(prev => {
                const newArr = [...prev];
                newArr[newArr.length - 1] += data.chunk;
                return newArr;
              });
            }
          }
        }
      }
      
    } catch (err: any) {
      console.error("Error continuing story:", err);
      setErrorMessage(err.message || "Failed to generate continuation.");
      // Remove empty broken placeholder
      setContinuations(prev => {
        const newArr = [...prev];
        if (newArr[newArr.length - 1] === "") {
          newArr.pop();
        }
        return newArr;
      });
    } finally {
      setIsContinuing(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[1500px] mx-auto p-6 md:p-12 lg:p-16 flex flex-col">
      <Header
        hasActiveStory={!!result || !!imagePreview}
        onReset={handleClearImage}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
      />
      {errorMessage && (
        <div className="mb-8 p-4 rounded-sm bg-rose-900/10 flex items-center justify-between gap-3 font-sans text-xs text-rose-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider">Erreur :</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-sans text-xs uppercase tracking-wider hover:opacity-75 underline underline-offset-4 cursor-pointer">
            {t.dismiss}
          </button>
        </div>
      )}
      <main className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 lg:gap-16 items-start flex-1">
        <div className="flex flex-col gap-8">
          <ImageUploadZone
            imagePreview={imagePreview}
            onImageSelected={handleImageSelected}
            onClearImage={handleClearImage}
            options={options}
            onOptionsChange={setOptions}
            onSubmit={handleAnalyzeAndWrite}
            isLoading={isLoading || isContinuing}
            t={t}
          />
          <SceneAnalysisCard
            analysis={result ? result.sceneAnalysis : null}
            isLoading={isLoading}
            t={t}
          />
        </div>
        <div className="flex flex-col h-full">
          <OpeningParagraphCard
            title={result ? result.storyTitle : ""}
            openingParagraph={result ? result.openingParagraph : ""}
            continuations={continuations}
            isLoading={isLoading}
            onContinue={handleContinueStory}
            isContinuing={isContinuing}
            t={t}
          />
          <StorySparksCard
            hooks={result ? result.narrativeHooks : []}
            onSelectHook={(hook) => handleContinueStory(hook)}
            isLoading={isLoading}
            isContinuing={isContinuing}
            t={t}
          />
        </div>
      </main>
    </div>
  );
}
