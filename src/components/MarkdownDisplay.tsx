import React from 'react';

interface Props {
  content: string;
  isStreaming?: boolean;
  variant?: 'dark' | 'light';
}

const DARK = {
  h1: 'text-2xl font-bold mt-8 mb-3 pb-2 border-b leading-tight text-[#2aff6e] border-[#2aff6e]/20',
  h2: 'text-lg font-bold mt-7 mb-2 border-l-4 pl-3 leading-snug text-white border-[#2aff6e]',
  h3: 'text-base font-bold mt-5 mb-1.5 leading-snug text-gray-200',
  h4: 'text-sm font-bold mt-3 mb-1 uppercase tracking-wide text-gray-300',
  bullet: 'text-[#2aff6e]',
  bulletText: 'text-gray-300 text-sm leading-relaxed',
  numText: 'text-gray-300 text-sm leading-relaxed',
  num: 'text-[#2aff6e] shrink-0 font-bold text-xs mt-1 min-w-[14px]',
  blockquote: 'border-l-2 border-[#2aff6e]/40 pl-4 my-2 text-gray-400 text-sm italic leading-relaxed',
  p: 'text-gray-300 text-sm leading-relaxed',
  strong: 'text-white font-semibold',
  cursor: 'bg-[#2aff6e]',
  hr: 'border-t border-white/10 my-4',
  badge: 'inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#2aff6e]/10 text-[#2aff6e]',
};

const LIGHT = {
  h1: 'text-xl font-extrabold mt-6 mb-3 pb-2 border-b leading-tight text-[#21A87D] border-[#21A87D]/20',
  h2: 'text-base font-extrabold mt-5 mb-2 border-l-4 pl-3 leading-snug text-[#2B3138] border-[#21A87D]',
  h3: 'text-sm font-bold mt-4 mb-1.5 leading-snug text-[#4A525C]',
  h4: 'text-xs font-bold mt-3 mb-1 uppercase tracking-widest text-[#6B7380]',
  bullet: 'text-[#21A87D]',
  bulletText: 'text-[#4A525C] text-sm leading-relaxed',
  numText: 'text-[#4A525C] text-sm leading-relaxed',
  num: 'text-[#21A87D] shrink-0 font-bold text-xs mt-1 min-w-[14px]',
  blockquote: 'border-l-2 border-[#21A87D]/40 pl-4 my-2 text-[#6B7380] text-sm italic leading-relaxed',
  p: 'text-[#4A525C] text-sm leading-relaxed',
  strong: 'text-[#2B3138] font-semibold',
  cursor: 'bg-[#21A87D]',
  hr: 'border-t border-[#C8CED5] my-4',
  badge: 'inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#21A87D]/10 text-[#21A87D]',
};

function parseBold(text: string, strongClass: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className={strongClass}>{part.slice(2, -2)}</strong>
      : part,
  );
}

export default function MarkdownDisplay({ content, isStreaming, variant = 'dark' }: Props) {
  const C = variant === 'light' ? LIGHT : DARK;
  const lines = content.split('\n');

  return (
    <div className="font-sans space-y-1">
      {lines.map((raw, i) => {
        const isLastLine = i === lines.length - 1;
        const cursor = isStreaming && isLastLine
          ? <span className={`inline-block w-0.5 h-4 ml-0.5 animate-pulse align-middle ${C.cursor}`} />
          : null;

        if (raw.startsWith('# '))
          return <h1 key={i} className={C.h1}>{parseBold(raw.slice(2), C.strong)}{cursor}</h1>;

        if (raw.startsWith('## '))
          return <h2 key={i} className={C.h2}>{parseBold(raw.slice(3), C.strong)}{cursor}</h2>;

        if (raw.startsWith('### '))
          return <h3 key={i} className={C.h3}>{parseBold(raw.slice(4), C.strong)}{cursor}</h3>;

        if (raw.startsWith('#### '))
          return <h4 key={i} className={C.h4}>{raw.slice(5)}{cursor}</h4>;

        if (raw.match(/^---+$/))
          return <hr key={i} className={C.hr} />;

        if (raw.startsWith('- ') || raw.startsWith('* '))
          return (
            <div key={i} className="flex gap-2.5 pl-3 py-0.5">
              <span className={`shrink-0 mt-1 text-xs ${C.bullet}`}>•</span>
              <span className={C.bulletText}>{parseBold(raw.slice(2), C.strong)}{cursor}</span>
            </div>
          );

        if (/^\d+\.\s/.test(raw)) {
          const num = raw.match(/^(\d+)\./)?.[1];
          const text = raw.replace(/^\d+\.\s/, '');
          return (
            <div key={i} className="flex gap-2.5 pl-3 py-0.5">
              <span className={C.num}>{num}.</span>
              <span className={C.numText}>{parseBold(text, C.strong)}{cursor}</span>
            </div>
          );
        }

        if (raw.startsWith('> '))
          return <blockquote key={i} className={C.blockquote}>{raw.slice(2)}{cursor}</blockquote>;

        if (raw.trim() === '')
          return <div key={i} className="h-2" />;

        return <p key={i} className={C.p}>{parseBold(raw, C.strong)}{cursor}</p>;
      })}
    </div>
  );
}
