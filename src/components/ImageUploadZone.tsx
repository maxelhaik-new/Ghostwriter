import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import { GhostwriteOptions, SampleScene } from "../types";
import { SAMPLE_SCENES } from "../data/sampleScenes";
import { Translation } from "../data/i18n";

interface ImageUploadZoneProps {
  imagePreview: string | null;
  onImageSelected: (base64: string, mimeType: string) => void;
  onClearImage: () => void;
  options: GhostwriteOptions;
  onOptionsChange: (options: GhostwriteOptions) => void;
  onSubmit: () => void;
  isLoading: boolean;
  t: Translation;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  imagePreview,
  onImageSelected,
  onClearImage,
  options,
  onOptionsChange,
  onSubmit,
  isLoading,
  t,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const optimizeImage = (file: File, callback: (base64: string, mimeType: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1400;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const optimizedBase64 = canvas.toDataURL(mimeType, 0.88);
          callback(optimizedBase64, mimeType);
        } else {
          callback(e.target?.result as string, file.type);
        }
      };
      img.onerror = () => {
        callback(e.target?.result as string, file.type);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    optimizeImage(file, (base64, mime) => {
      onImageSelected(base64, mime);
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSelectSample = async (scene: SampleScene) => {
    try {
      const response = await fetch(scene.url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onImageSelected(base64, blob.type || "image/jpeg");
        onOptionsChange({
          ...options,
          tone: scene.recommendedTone,
        });
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Failed to load sample scene image", err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/30 p-6 md:p-8 rounded-sm relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-sans text-xs uppercase tracking-wider text-brand-ink/50 font-medium">
          {imagePreview ? t.sceneAnalysisTitle : t.uploadButton}
        </h2>
        {imagePreview && (
          <button
            onClick={onClearImage}
            disabled={isLoading}
            className="text-xs font-sans text-brand-ink/70 hover:text-brand-ink transition-colors underline underline-offset-4 disabled:opacity-50"
          >
            {t.changeImage}
          </button>
        )}
      </div>

      {!imagePreview ? (
        <div className="flex-1 flex flex-col gap-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`min-h-[200px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all rounded-sm ${
              isDragging
                ? "bg-black/[0.06]"
                : "bg-white/50 hover:bg-white/80"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="font-serif text-lg md:text-xl text-brand-ink mb-1.5">
              {t.uploadTitle}, <span className="underline decoration-1 underline-offset-4">{t.uploadSubtitle}</span>
            </p>
            <p className="font-sans text-xs text-brand-ink/40 font-normal">
              {t.supportsText}
            </p>
          </div>

          <div>
            <p className="font-sans text-xs uppercase tracking-wider text-brand-ink/50 font-medium mb-3">
              {t.sampleWorlds}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => handleSelectSample(scene)}
                  className="group text-left p-1.5 rounded-sm bg-white/40 hover:bg-white/90 flex flex-col transition-all cursor-pointer"
                >
                  <img
                    src={scene.url}
                    alt={scene.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-16 object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 rounded-xs mb-1.5"
                  />
                  <span className="font-sans text-[0.65rem] text-brand-ink/75 group-hover:text-brand-ink truncate w-full px-1 font-medium">
                    {scene.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          <div className="w-full h-[320px] bg-black/5 rounded-sm flex items-center justify-center overflow-hidden">
            <img
              src={imagePreview}
              alt="Source scene"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-[0.7rem] uppercase tracking-wider text-brand-ink/60 font-semibold mb-2">
                {t.tone}
              </label>
              <select
                value={options.tone}
                onChange={(e) => onOptionsChange({ ...options, tone: e.target.value })}
                disabled={isLoading}
                className="w-full text-xs font-sans py-2.5 px-3 bg-white/60 hover:bg-white/90 focus:bg-white text-brand-ink focus:outline-none cursor-pointer rounded-sm appearance-none font-medium transition-colors"
              >
                {t.tones.map((tOpt) => (
                  <option key={tOpt.value} value={tOpt.value}>{tOpt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[0.7rem] uppercase tracking-wider text-brand-ink/60 font-semibold mb-2">
                {t.pov}
              </label>
              <select
                value={options.pov}
                onChange={(e) => onOptionsChange({ ...options, pov: e.target.value })}
                disabled={isLoading}
                className="w-full text-xs font-sans py-2.5 px-3 bg-white/60 hover:bg-white/90 focus:bg-white text-brand-ink focus:outline-none cursor-pointer rounded-sm appearance-none font-medium transition-colors"
              >
                {t.povs.map((pOpt) => (
                  <option key={pOpt.value} value={pOpt.value}>{pOpt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-sans text-[0.7rem] uppercase tracking-wider text-brand-ink/60 font-semibold mb-2">
              {t.customPrompt}
            </label>
            <input
              type="text"
              placeholder={t.customPromptPlaceholder}
              value={options.customPrompt}
              onChange={(e) => onOptionsChange({ ...options, customPrompt: e.target.value })}
              disabled={isLoading}
              className="w-full text-xs font-sans py-2.5 px-3 bg-white/60 hover:bg-white/90 focus:bg-white text-brand-ink focus:outline-none placeholder:text-brand-ink/30 rounded-sm transition-colors"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="mt-2 w-full bg-brand-ink text-white py-3.5 px-6 text-xs font-sans uppercase tracking-wider font-semibold rounded-sm cursor-pointer transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {isLoading ? t.generating : t.generateButton}
          </button>
        </div>
      )}
    </div>
  );
};
