import React from "react";
import { Translation } from "../data/i18n";

interface StorySparksCardProps {
  hooks: string[];
  hiddenSecret: string;
  onSelectHook: (hook: string) => void;
  isLoading: boolean;
  t: Translation;
}

export const StorySparksCard: React.FC<StorySparksCardProps> = ({
  hooks,
  hiddenSecret,
  onSelectHook,
  isLoading,
  t,
}) => {
  if (!hooks.length && !isLoading) return null;

  return (
    <div className="mt-12 pt-8 border-t border-black/10">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.15em] opacity-60 text-brand-ink mb-6">
        {t.storySparksTitle}
      </div>

      {isLoading ? (
        <div className="animate-pulse flex gap-6 opacity-40">
          <div className="h-4 bg-brand-ink/20 rounded-sm w-1/3"></div>
          <div className="h-4 bg-brand-ink/20 rounded-sm w-1/3"></div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-8">
          {hooks.map((hook, idx) => (
            <button
              key={`hook-${idx}`}
              onClick={() => onSelectHook(hook)}
              className="text-left group flex-1 min-w-[200px]"
            >
              <div className="font-mono text-xs text-brand-ink/70 leading-relaxed group-hover:text-brand-ink transition-colors">
                <strong className="tracking-wider uppercase">Piste 0{idx + 1}:</strong> {hook}
              </div>
            </button>
          ))}
          
          {hiddenSecret && (
            <div className="w-full mt-4 p-4 border border-brand-accent/30 bg-brand-accent/5">
              <div className="font-mono text-xs text-brand-ink/80 leading-relaxed">
                <strong className="tracking-wider uppercase text-brand-accent">[{t.hiddenSecretTitle}]</strong> {hiddenSecret}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
