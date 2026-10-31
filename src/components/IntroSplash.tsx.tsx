import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface IntroSplashProps {
  /** Called when the visitor taps Explore or Skip (or presses Enter / Escape). */
  onEnter: () => void;
}

// Full-screen welcome page shown once per visit. App.tsx decides when to show it.
export function IntroSplash({ onEnter }: IntroSplashProps) {
  const exploreRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Keep the page behind the intro from scrolling while it is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    exploreRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onEnter();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onEnter]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to the NASS LASU WebApp"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      className="fixed inset-0 z-[300] overflow-y-auto bg-slate-950"
    >
      {/* Soft yellow glow behind the content (kept off phones to stay fast) */}
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950 pointer-events-none" />

      <div className="relative min-h-full flex flex-col items-center justify-center px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8"
        >
          <div className="absolute -inset-3 rounded-full border border-yellow-400/30 animate-pulse" />
          <img
            src="/nass_logo.jpg"
            alt="NASS LASU logo"
            width={160}
            height={160}
            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-yellow-400/70 shadow-[0_0_40px_rgba(250,204,21,0.35)]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="font-mono text-xs sm:text-sm font-bold uppercase tracking-[0.5em] text-yellow-500 mb-3"
        >
          Welcome To
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="font-space-grotesk text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[1.05] tracking-tight bg-gradient-to-r from-white via-yellow-200 to-yellow-400 bg-clip-text text-transparent"
        >
          NASS LASU
          <br />
          WebApp
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="relative overflow-hidden mt-6 rounded-3xl border border-yellow-400/40 bg-slate-900/80 px-5 sm:px-7 py-2.5 shadow-[0_0_25px_rgba(250,204,21,0.2)]"
        >
          <div className="absolute inset-0 -translate-x-full md:animate-[shine_3.5s_infinite_linear] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <span className="relative block text-[11px] sm:text-sm font-extrabold uppercase leading-snug tracking-[0.12em] sm:tracking-[0.18em] text-yellow-300">
            1st Of Its Kind In Lagos State University
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-5 max-w-md text-xs sm:text-sm leading-relaxed text-slate-400"
        >
          Academic materials, faculty news, events and student services, all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <button
            ref={exploreRef}
            onClick={onEnter}
            className="group inline-flex items-center gap-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 px-9 py-3.5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[0_0_25px_rgba(250,204,21,0.45)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Explore</span>
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={onEnter}
            className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 hover:text-yellow-400 transition-colors cursor-pointer py-2 px-4"
          >
            Skip
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
