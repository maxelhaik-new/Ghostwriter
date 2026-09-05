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
    <div className="border border-black/10 p-6 md:p-8 rounded-sm bg-brand-bg">
      <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.15em] opacity-60 text-brand-ink mb-6">
        {t.sceneAnalysisTitle}
      </h2>

      {isLoading ? (
        <div className="animate-pulse flex flex-col gap-4 opacity-50">
          <div className="h-4 bg-brand-ink/20 rounded-sm w-3/4"></div>
          <div className="h-4 bg-brand-ink/20 rounded-sm w-full"></div>
          <div className="h-4 bg-brand-ink/20 rounded-sm w-5/6"></div>
        </div>
      ) : analysis ? (
        <div className="flex flex-col gap-4 text-xs font-mono text-brand-ink/80 leading-relaxed">
          <p>
            <strong className="text-brand-ink tracking-wider">[ATMOSPHERE]</strong> {analysis.mood}. {analysis.atmosphere}
          </p>
          <p>
            <strong className="text-brand-ink tracking-wider">[LIGHTING]</strong> {analysis.lightingAndPalette}
          </p>
          <p>
            <strong className="text-brand-ink tracking-wider">[LOCATION]</strong> {analysis.setting}
          </p>
          {analysis.focalPoints && analysis.focalPoints.length > 0 && (
            <p>
              <strong className="text-brand-ink tracking-wider">[FOCAL_POINTS]</strong> {analysis.focalPoints.join(", ")}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};
