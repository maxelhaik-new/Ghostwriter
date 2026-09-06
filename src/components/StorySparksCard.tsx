import React from "react";
import { ArrowRight } from "lucide-react";
import { Translation } from "../data/i18n";

interface StorySparksCardProps {
  hooks: string[];
  onSelectHook: (hook: string) => void;
  isLoading: boolean;
  isContinuing?: boolean;
  t: Translation;
}

export const StorySparksCard: React.FC<StorySparksCardProps> = ({
  hooks,
  onSelectHook,
  isLoading,
  isContinuing = false,
  t,
}) => {
  if (!hooks.length && !isLoading) return null;

  return (
    <div className="mt-12 pt-6 border-t border-black/5">
      <div className="font-sans text-xs uppercase tracking-wider text-brand-ink/50 font-medium mb-4">
        {t.storySparksTitle}
      </div>

      {isLoading ? (
        <div className="animate-pulse flex gap-4 opacity-40">
          <div className="h-20 bg-black/[0.04] rounded-sm flex-1"></div>
          <div className="h-20 bg-black/[0.04] rounded-sm flex-1"></div>
          <div className="h-20 bg-black/[0.04] rounded-sm flex-1"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hooks.map((hook, idx) => (
            <button
              key={`hook-${idx}`}
              onClick={() => onSelectHook(hook)}
              disabled={isContinuing}
              className="text-left group bg-white/50 hover:bg-white/90 p-4 md:p-5 rounded-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex flex-col justify-between gap-3 cursor-pointer"
            >
              <div className="leading-relaxed">
                <span className="font-sans text-[0.7rem] uppercase tracking-wider text-brand-ink/60 block mb-1.5 font-medium">
                  Piste 0{idx + 1}
                </span>
                <p className="font-serif text-sm md:text-base text-brand-ink/85 group-hover:text-brand-ink transition-colors leading-snug">
                  {hook}
                </p>
              </div>
              <div className="flex items-center text-brand-ink/40 group-hover:text-brand-ink self-end mt-auto transition-colors pt-2">
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
