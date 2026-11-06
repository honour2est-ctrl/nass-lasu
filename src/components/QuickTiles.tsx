import React from 'react';
import { BookOpen, Megaphone, Eye, Siren, ArrowRight } from 'lucide-react';
import { scrollToSection } from './MobileNav';

interface QuickTilesProps {
  isDarkMode: boolean;
  onEmergency: () => void;
}

// The four things students open most, one tap from the top of the page.
// On phones the four tiles sit in one short row of icons so they fit on the first screen.
export function QuickTiles({ isDarkMode, onEmergency }: QuickTilesProps) {
  const tiles = [
    { key: 'vault', title: 'Past Questions', desc: 'By department and level', icon: BookOpen, onClick: () => scrollToSection('vault'), danger: false },
    { key: 'news', title: 'News Flash', desc: 'Latest official updates', icon: Megaphone, onClick: () => scrollToSection('news'), danger: false },
    { key: 'events', title: 'Events & Photos', desc: 'Galleries and memories', icon: Eye, onClick: () => scrollToSection('events'), danger: false },
    { key: 'emergency', title: 'Emergency', desc: 'Call or send an alert', icon: Siren, onClick: onEmergency, danger: true },
  ];

  return (
    <section id="quick" aria-label="Quick links" className="px-4 max-w-7xl mx-auto w-full -mt-28 md:-mt-24">
      <div className="grid grid-cols-4 gap-2 md:gap-5">
        {tiles.map(({ key, title, desc, icon: Icon, onClick, danger }) => (
          <button
            key={key}
            onClick={onClick}
            className={`group flex flex-col md:block items-center md:items-stretch text-center md:text-left p-2.5 md:p-6 rounded-2xl md:rounded-3xl border transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] cursor-pointer ${
              danger
                ? isDarkMode
                  ? 'bg-red-500/10 border-red-400/40 hover:border-red-400'
                  : 'bg-red-50 border-red-300 hover:border-red-500'
                : isDarkMode
                  ? 'bg-white/5 border-white/10 hover:border-yellow-400/50'
                  : 'bg-white border-slate-200 hover:border-yellow-500 shadow-sm'
            }`}
          >
            <span
              className={`shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center mb-1.5 md:mb-3 ${
                danger ? 'bg-red-600 text-white' : 'bg-yellow-400 text-slate-900'
              }`}
            >
              <Icon size={22} />
            </span>
            <span className="block min-w-0 w-full">
              <span className="flex items-center justify-center md:justify-between gap-2">
                <span className={`text-xs md:text-base font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{title}</span>
                <ArrowRight size={16} className={`hidden md:block shrink-0 transition-transform group-hover:translate-x-1 ${danger ? 'text-red-400' : 'text-yellow-500'}`} />
              </span>
              <span className={`hidden md:block mt-1 text-[13px] leading-snug ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{desc}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
