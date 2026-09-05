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
    <header className="w-full flex flex-col md:flex-row justify-between items-baseline border-b border-black/10 pb-6 mb-8 gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-4xl md:text-5xl font-light tracking-tight text-brand-ink">
          {t.appName}
        </h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:block font-mono text-[0.65rem] uppercase tracking-[0.15em] opacity-60 text-brand-ink">
          Archive No. 042 // Story Generation Interface
        </div>
        
        <div className="flex items-center border border-black/10 p-1">
          <button
            onClick={() => onLanguageChange("fr")}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
              language === "fr"
                ? "bg-brand-ink text-brand-bg"
                : "text-brand-ink hover:bg-black/5"
            }`}
          >
            FR
          </button>
          <button
            onClick={() => onLanguageChange("en")}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
              language === "en"
                ? "bg-brand-ink text-brand-bg"
                : "text-brand-ink hover:bg-black/5"
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
};
