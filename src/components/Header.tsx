import React from "react";
import { Language, Translation } from "../data/i18n";

interface HeaderProps {
  hasActiveStory: boolean;
  onReset: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  t: Translation;
}

export const Header: React.FC<HeaderProps> = ({
  hasActiveStory,
  onReset,
  language,
  onLanguageChange,
  t,
}) => {
  return (
    <header className="w-full flex flex-col md:flex-row justify-between items-baseline border-b border-black/5 pb-6 mb-8 gap-4">
      <div className="flex flex-col">
        <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-brand-ink">
          {t.appName}
        </h1>
        <p className="font-sans text-xs text-brand-ink/50 mt-1 font-normal">
          {t.appSubtitle}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        {hasActiveStory && (
          <button
            onClick={onReset}
            className="font-sans text-xs text-brand-ink/60 hover:text-brand-ink transition-colors underline underline-offset-4"
          >
            {t.newStory}
          </button>
        )}
        <div className="flex items-center bg-black/[0.04] p-1 rounded-sm">
          <button
            onClick={() => onLanguageChange("fr")}
            className={`px-3 py-1 text-xs font-sans font-medium transition-colors rounded-xs ${
              language === "fr"
                ? "bg-brand-ink text-white"
                : "text-brand-ink/60 hover:text-brand-ink"
            }`}
          >
            FR
          </button>
          <button
            onClick={() => onLanguageChange("en")}
            className={`px-3 py-1 text-xs font-sans font-medium transition-colors rounded-xs ${
              language === "en"
                ? "bg-brand-ink text-white"
                : "text-brand-ink/60 hover:text-brand-ink"
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
};
