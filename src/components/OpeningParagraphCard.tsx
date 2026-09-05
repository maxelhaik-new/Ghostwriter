import React from "react";
import { Translation } from "../data/i18n";

interface OpeningParagraphCardProps {
  title: string;
  openingParagraph: string;
  continuations: string[];
  isLoading: boolean;
  onContinue: (direction: string) => void;
  isContinuing: boolean;
  t: Translation;
}

export const OpeningParagraphCard: React.FC<OpeningParagraphCardProps> = ({
  title,
  openingParagraph,
  continuations,
  isLoading,
  onContinue,
  isContinuing,
  t,
}) => {
  if (!title && !openingParagraph && !isLoading && !isContinuing) return null;

  return (
    <div className="flex-1 flex flex-col min-h-[300px]">
      <div className="flex flex-col justify-center h-full">
        {isLoading ? (
          <div className="w-full flex flex-col gap-6 animate-pulse opacity-40">
            <div className="h-8 bg-brand-ink/20 rounded-sm w-1/3 mb-4"></div>
            <div className="h-6 bg-brand-ink/20 rounded-sm w-full"></div>
            <div className="h-6 bg-brand-ink/20 rounded-sm w-11/12"></div>
            <div className="h-6 bg-brand-ink/20 rounded-sm w-full"></div>
            <div className="h-6 bg-brand-ink/20 rounded-sm w-4/5"></div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-8">
            {title && (
              <h2 className="font-serif text-3xl md:text-4xl font-light text-brand-ink tracking-tight border-b border-black/10 pb-4">
                {title}
              </h2>
            )}
            
            <div className="font-serif text-2xl md:text-[2rem] text-brand-ink leading-[1.6] space-y-8">
              {openingParagraph && openingParagraph.split("\n\n").map((para, idx) => (
                <p key={`opening-${idx}`} className={idx === 0 ? "first-letter:text-[4rem] first-letter:leading-[0.8] first-letter:mr-3 first-letter:float-left" : ""}>
                  {para}
                </p>
              ))}
              
              {continuations.map((cont, contIdx) => (
                <React.Fragment key={`cont-${contIdx}`}>
                  {cont && cont.split("\n\n").map((para, idx) => (
                    <p key={`cont-${contIdx}-${idx}`} className="animate-fadeIn">
                      {para}
                    </p>
                  ))}
                </React.Fragment>
              ))}
            </div>
            
            {isContinuing && (
              <div className="font-mono text-xs uppercase tracking-widest text-brand-ink/40 flex gap-1 animate-pulse mt-4">
                [GENERATING...]
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
