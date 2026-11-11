import React from 'react';
import { ChevronDown } from 'lucide-react';

interface ShowMoreButtonProps {
  expanded: boolean;
  onToggle: () => void;
  moreLabel: string;
  lessLabel: string;
  isDarkMode: boolean;
}

// The "Show all / Show fewer" button used to keep long sections short
export function ShowMoreButton({ expanded, onToggle, moreLabel, lessLabel, isDarkMode }: ShowMoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border text-xs font-extrabold uppercase tracking-widest transition-colors cursor-pointer ${
        isDarkMode
          ? 'bg-yellow-400/10 hover:bg-yellow-400 text-yellow-400 hover:text-slate-900 border-yellow-400/40'
          : 'bg-yellow-50 hover:bg-yellow-400 text-yellow-700 hover:text-slate-900 border-yellow-500/50'
      }`}
    >
      <span>{expanded ? lessLabel : moreLabel}</span>
      <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </button>
  );
}
