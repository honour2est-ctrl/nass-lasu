import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen, Megaphone, Calendar, Siren, Sparkles, User as UserIcon, Crown, Users, Compass,
  ShoppingBag, Handshake, Award, Trophy, Building2, Globe, MessageSquare, MapPin, X,
} from 'lucide-react';

// Scroll to a section, leaving room for the fixed header at the top
export const scrollToSection = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.scrollMarginTop = '5rem';
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

type Tab = 'home' | 'vault' | 'news' | 'events' | '';

// Which bottom tab lights up for the section currently on screen
const SECTION_TO_TAB: Record<string, Tab> = {
  hero: 'home',
  quick: 'home',
  vault: 'vault',
  news: 'news',
  events: 'events',
};

const HomeIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9.5h13V10" />
    <path d="M10 19.5v-5h4v5" />
  </svg>
);

const GridIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
);

// Everything else on the site, reachable from "More"
const MORE_ITEMS: { id: string; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'vision', label: 'WebApp Story', icon: Sparkles },
  { id: 'executives', label: 'Excos', icon: UserIcon },
  { id: 'hall-of-fame', label: 'Hall of Fame', icon: Crown },
  { id: 'ssrc', label: 'SSRC Council', icon: Users },
  { id: 'departments', label: 'Departments', icon: Compass },
  { id: 'brands', label: 'Market', icon: ShoppingBag },
  { id: 'partners', label: 'Partners', icon: Handshake },
  { id: 'sponsors', label: 'Sponsors', icon: Award },
  { id: 'hotline', label: 'Hotline', icon: Siren },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'landmarks', label: 'Landmarks', icon: Building2 },
  { id: 'secretariat', label: 'Secretariat', icon: MapPin },
  { id: 'social', label: 'Follow Us', icon: Globe },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

interface MobileNavProps {
  isDarkMode: boolean;
  onEmergency: () => void;
}

// Bottom navigation for phones (hidden on larger screens, which keep the top menu)
export function MobileNav({ isDarkMode, onEmergency }: MobileNavProps) {
  const [active, setActive] = useState<Tab>('home');
  const [moreOpen, setMoreOpen] = useState(false);

  // Light up the tab for whatever part of the page is in the middle of the screen
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(SECTION_TO_TAB[(entry.target as HTMLElement).id] ?? '');
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Close the sheet with Escape, and keep the page behind it from scrolling
  useEffect(() => {
    if (!moreOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const goTo = (id: string) => {
    setMoreOpen(false);
    // let the sheet release the page scroll lock first
    setTimeout(() => scrollToSection(id), 60);
  };

  const tabs: { key: Tab | 'more'; label: string; icon: React.ReactNode; onClick: () => void }[] = [
    { key: 'home', label: 'Home', icon: <HomeIcon />, onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { key: 'vault', label: 'Vault', icon: <BookOpen size={20} />, onClick: () => scrollToSection('vault') },
    { key: 'news', label: 'News', icon: <Megaphone size={20} />, onClick: () => scrollToSection('news') },
    { key: 'events', label: 'Events', icon: <Calendar size={20} />, onClick: () => scrollToSection('events') },
    { key: 'more', label: 'More', icon: <GridIcon />, onClick: () => setMoreOpen(true) },
  ];

  const muted = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t pb-[env(safe-area-inset-bottom,0px)] ${
          isDarkMode ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-200'
        }`}
      >
        <div className="grid grid-cols-5 h-14">
          {tabs.map((t) => {
            const isActive = t.key === 'more' ? moreOpen : active === t.key;
            return (
              <button
                key={t.key}
                onClick={t.onClick}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer active:opacity-70 ${
                  isActive ? (isDarkMode ? 'text-yellow-400' : 'text-amber-700') : muted
                }`}
              >
                {isActive && <span aria-hidden="true" className={`absolute top-0 h-0.5 w-8 rounded-full ${isDarkMode ? 'bg-yellow-400' : 'bg-amber-600'}`} />}
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="All sections"
            className="md:hidden fixed inset-0 z-[90] flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button aria-label="Close menu" onClick={() => setMoreOpen(false)} className="absolute inset-0 bg-black/70 cursor-default" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className={`relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] ${
                isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-space-grotesk text-lg font-extrabold uppercase tracking-wide">All Sections</h2>
                <button
                  onClick={() => setMoreOpen(false)}
                  aria-label="Close menu"
                  className={`p-2 rounded-full cursor-pointer ${isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => { setMoreOpen(false); onEmergency(); }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 cursor-pointer active:scale-95"
                >
                  <span className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center"><Siren size={22} /></span>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Emergency</span>
                </button>
                {MORE_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => goTo(id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 cursor-pointer active:scale-95 ${
                      isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-yellow-400/15 text-yellow-400' : 'bg-amber-500/15 text-amber-700'}`}><Icon size={22} /></span>
                    <span className={`text-xs font-bold text-center leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
