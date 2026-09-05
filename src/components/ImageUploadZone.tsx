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
    <div className="flex flex-col h-full border border-black/10 p-6 md:p-8 rounded-sm bg-brand-bg relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.15em] opacity-60 text-brand-ink">
          Source Scene // Data Input
        </h2>
        {imagePreview && (
          <button
            onClick={onClearImage}
            disabled={isLoading}
            className="text-xs font-mono uppercase tracking-wider text-brand-ink hover:opacity-70 transition-opacity underline disabled:opacity-50"
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
            className={`min-h-[220px] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors border ${
              isDragging
                ? "border-brand-ink bg-black/5"
                : "border-black/20 hover:border-brand-ink hover:bg-black/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="font-serif text-xl text-brand-ink mb-2">
              {t.uploadTitle}, <span className="underline decoration-1 underline-offset-4">{t.uploadSubtitle}</span>
            </p>
            <p className="font-mono text-[0.65rem] uppercase tracking-widest opacity-50">
              {t.supportsText}
            </p>
          </div>

          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] opacity-60 text-brand-ink mb-3">
              {t.sampleWorlds}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SAMPLE_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => handleSelectSample(scene)}
                  className="group text-left border border-black/10 p-2 flex flex-col transition-colors hover:border-brand-ink"
                >
                  <img
                    src={scene.url}
                    alt={scene.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-16 object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 mb-2"
                  />
                  <span className="font-mono text-[0.65rem] uppercase tracking-wider text-brand-ink truncate w-full px-1">
                    {scene.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          <div className="w-full h-[350px] bg-[#e8e4de] border border-black/10 flex items-center justify-center overflow-hidden">
            <img
              src={imagePreview}
              alt="Source scene"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[0.65rem] uppercase tracking-[0.15em] opacity-60 text-brand-ink mb-2">
                {t.tone}
              </label>
              <select
                value={options.tone}
                onChange={(e) => onOptionsChange({ ...options, tone: e.target.value })}
                disabled={isLoading}
                className="w-full text-xs font-mono uppercase tracking-wider py-2 px-3 border border-black/10 bg-transparent text-brand-ink focus:outline-none focus:border-brand-ink cursor-pointer rounded-none appearance-none"
              >
                {t.tones.map((tOpt) => (
                  <option key={tOpt.value} value={tOpt.value}>{tOpt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-[0.65rem] uppercase tracking-[0.15em] opacity-60 text-brand-ink mb-2">
                {t.pov}
              </label>
              <select
                value={options.pov}
                onChange={(e) => onOptionsChange({ ...options, pov: e.target.value })}
                disabled={isLoading}
                className="w-full text-xs font-mono uppercase tracking-wider py-2 px-3 border border-black/10 bg-transparent text-brand-ink focus:outline-none focus:border-brand-ink cursor-pointer rounded-none appearance-none"
              >
                {t.povs.map((pOpt) => (
                  <option key={pOpt.value} value={pOpt.value}>{pOpt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-[0.15em] opacity-60 text-brand-ink mb-2">
              {t.customPrompt}
            </label>
            <input
              type="text"
              placeholder={t.customPromptPlaceholder}
              value={options.customPrompt}
              onChange={(e) => onOptionsChange({ ...options, customPrompt: e.target.value })}
              disabled={isLoading}
              className="w-full text-sm font-serif italic py-2 px-3 border-b border-black/20 bg-transparent text-brand-ink focus:outline-none focus:border-brand-ink placeholder:text-black/30 rounded-none"
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="mt-4 w-full bg-brand-ink text-white py-4 px-6 text-[0.7rem] font-mono uppercase tracking-[0.1em] border-none cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isLoading ? t.generating : t.generateButton}
          </button>
        </div>
      )}
    </div>
  );
};
