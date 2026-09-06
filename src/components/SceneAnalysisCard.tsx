import React from "react";
import { SceneAnalysis } from "../types";
import { Translation } from "../data/i18n";

interface SceneAnalysisCardProps {
  analysis: SceneAnalysis | null;
  isLoading: boolean;
  t: Translation;
}

export const SceneAnalysisCard: React.FC<SceneAnalysisCardProps> = ({
  analysis,
  isLoading,
  t,
}) => {
  if (!analysis && !isLoading) return null;

  return (
    <div className="bg-white/30 p-6 md:p-8 rounded-sm">
      <h2 className="font-sans text-xs uppercase tracking-wider text-brand-ink/50 font-medium mb-4">
        {t.sceneAnalysisTitle}
      </h2>

      {isLoading ? (
        <div className="animate-pulse flex flex-col gap-3 opacity-50">
          <div className="h-16 bg-black/[0.04] rounded-sm w-full"></div>
          <div className="h-14 bg-black/[0.04] rounded-sm w-full"></div>
          <div className="h-14 bg-black/[0.04] rounded-sm w-full"></div>
          <div className="h-16 bg-black/[0.04] rounded-sm w-full"></div>
        </div>
      ) : analysis ? (
        <div className="flex flex-col gap-3">
          {/* Atmosphere card */}
          <div className="bg-white/60 p-4 rounded-sm flex flex-col gap-1.5">
            <span className="font-sans text-[0.7rem] uppercase tracking-wider text-brand-ink/60 font-semibold">
              {t.analysisAtmosphere}
            </span>
            <p className="text-xs font-sans text-brand-ink/85 leading-relaxed">
              <span className="font-semibold text-brand-ink">{analysis.mood}.</span> {analysis.atmosphere}
            </p>
          </div>

          {/* Lighting card */}
          <div className="bg-white/60 p-4 rounded-sm flex flex-col gap-1.5">
            <span className="font-sans text-[0.7rem] uppercase tracking-wider text-brand-ink/60 font-semibold">
              {t.analysisLighting}
            </span>
            <p className="text-xs font-sans text-brand-ink/85 leading-relaxed">
              {analysis.lightingAndPalette}
            </p>
          </div>

          {/* Setting / Location card */}
          <div className="bg-white/60 p-4 rounded-sm flex flex-col gap-1.5">
            <span className="font-sans text-[0.7rem] uppercase tracking-wider text-brand-ink/60 font-semibold">
              {t.analysisSetting}
            </span>
            <p className="text-xs font-sans text-brand-ink/85 leading-relaxed">
              {analysis.setting}
            </p>
          </div>

          {/* Focal points card with separated items */}
          {analysis.focalPoints && analysis.focalPoints.length > 0 && (
            <div className="bg-white/60 p-4 rounded-sm flex flex-col gap-2">
              <span className="font-sans text-[0.7rem] uppercase tracking-wider text-brand-ink/60 font-semibold">
                {t.analysisFocalPoints}
              </span>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {analysis.focalPoints.map((point, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs font-sans text-brand-ink/85 bg-black/[0.04] px-2.5 py-1 rounded-sm"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
