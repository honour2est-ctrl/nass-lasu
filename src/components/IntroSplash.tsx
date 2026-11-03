import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface IntroSplashProps {
  /** Called when the visitor taps Explore or Skip (or presses Enter / Escape). */
  onEnter: () => void;
}

// ---------------------------------------------------------------------------
// HOW THIS INTRO PROTECTS PHONES
//  full   : falling-symbol rain, scan line, spinning rings, glitch + decoding title.
//  lite   : used on weak phones / slow connections / Data Saver. No rain and no
//           animation loops, just a quick boot list and the welcome message.
//  static : used when the phone asks for reduced motion. Everything shows at once.
// Even in "full" mode a watchdog watches the frame rate and switches the heavy
// effects off by itself if the phone starts to struggle. Skip is always on screen.
// ---------------------------------------------------------------------------
type Mode = 'full' | 'lite' | 'static';

function detectMode(): Mode {
  if (typeof window === 'undefined') return 'full';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static';
  const nav: any = navigator;
  const conn = nav.connection;
  if (conn?.saveData) return 'lite';
  if (conn?.effectiveType && /(^|-)2g|3g/.test(String(conn.effectiveType))) return 'lite';
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return 'lite';
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2) return 'lite';
  return 'full';
}

// Lines of the "system start-up" shown while the intro boots
const BOOT_LINES = [
  { text: 'INITIALIZING NASS LASU WEBAPP', tag: '' },
  { text: 'LOADING ACADEMIC VAULT', tag: 'OK' },
  { text: 'CONNECTING FACULTY NETWORK', tag: 'OK' },
  { text: 'SYNCING NEWS & EVENTS', tag: 'OK' },
  { text: 'SECURING CONNECTION', tag: 'OK' },
  { text: 'SYSTEM ONLINE', tag: 'READY' },
];

// Falling symbols: binary, maths and science, in the brand yellow
const RAIN_CHARS = '01∑∫π∂√ΔΩ≈∞λθ{}<>/=+'.split('');

// Reveals text as if it were being decoded. Lives in its own small component so
// only this text re-renders while it animates, not the whole intro.
function DecodedLine({ text, run, instant, ms = 900 }: { text: string; run: boolean; instant: boolean; ms?: number }) {
  const [shown, setShown] = useState(instant ? text : '');
  useEffect(() => {
    if (instant) { setShown(text); return; }
    if (!run) { setShown(''); return; }
    const start = performance.now();
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/';
    const id = setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / ms);
      const revealed = Math.floor(progress * text.length);
      setShown(
        text
          .split('')
          .map((ch, i) => (ch === ' ' || i < revealed ? ch : glyphs[(Math.random() * glyphs.length) | 0]))
          .join('')
      );
      if (progress >= 1) { setShown(text); clearInterval(id); }
    }, 60);
    return () => clearInterval(id);
  }, [text, run, instant, ms]);
  return <>{shown || '\u00a0'}</>;
}

function DigitalRain({ onHeavy }: { onHeavy: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    // alpha:false lets the phone skip blending work; the fade fill is opaque anyway
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;
    const phone = window.innerWidth < 640;
    const interval = phone ? 85 : 70;       // about 12 to 14 frames a second: smooth enough, and light
    let raf = 0;
    let last = 0;
    let lastRaf = 0;
    let drops: number[] = [];
    let cols = 0;
    let size = 16;

    // Watchdog numbers
    let rafCount = 0;
    let janky = 0;
    let samples = 0;
    let workSum = 0;

    const resize = () => {
      // Phones draw at normal CSS resolution (not 2x or 3x): far fewer pixels to paint
      const scale = phone ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * scale);
      canvas.height = Math.floor(window.innerHeight * scale);
      size = (phone ? 15 : 16) * scale;
      cols = Math.ceil(canvas.width / size);
      drops = Array.from({ length: cols }, () => Math.random() * -40);
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${size}px monospace`;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);

      // Watch how the page is coping: very long gaps between frames mean the phone is struggling
      if (lastRaf) {
        rafCount++;
        if (rafCount > 20 && t - lastRaf > 120) janky++;
      }
      lastRaf = t;

      if (t - last < interval) return;
      last = t;

      const t0 = performance.now();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.13)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * size;
        ctx.fillStyle = Math.random() > 0.97 ? '#fff7cc' : 'rgba(250, 204, 21, 0.8)';
        ctx.fillText(RAIN_CHARS[(Math.random() * RAIN_CHARS.length) | 0], i * size, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }

      workSum += performance.now() - t0;
      samples++;
      if (samples >= 24) {
        // Too slow to draw, or too many stalled frames: give up on the rain for this visitor
        if (workSum / samples > 9 || janky > 5) onHeavy();
        samples = 0; workSum = 0; janky = 0;
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [onHeavy]);

  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 w-full h-full opacity-40 pointer-events-none" />;
}

// Only compositor-friendly properties (transform / opacity) are animated in loops.
const KEYFRAMES = `
@keyframes introScan { from { transform: translateY(-2vh); } to { transform: translateY(102vh); } }
@keyframes introSpin { to { transform: rotate(360deg); } }
@keyframes introSpinRev { to { transform: rotate(-360deg); } }
@keyframes introBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes introGlitch {
  0%, 60%, 100% { text-shadow: 0 0 18px rgba(250,204,21,.35); transform: translate(0); }
  15% { text-shadow: 3px 0 rgba(34,211,238,.9), -3px 0 rgba(244,63,94,.9); transform: translate(-2px, 1px); }
  30% { text-shadow: -3px 0 rgba(34,211,238,.9), 3px 0 rgba(244,63,94,.9); transform: translate(2px, -1px); }
  45% { text-shadow: 2px 0 rgba(34,211,238,.9), -2px 0 rgba(244,63,94,.9); transform: translate(-1px, 0); }
}
`;

function Bracket({ className }: { className: string }) {
  return <span aria-hidden="true" className={`absolute w-6 h-6 sm:w-8 sm:h-8 border-cyan-300/60 ${className}`} />;
}

// Full-screen welcome page shown once per visit. App.tsx decides when to show it.
export function IntroSplash({ onEnter }: IntroSplashProps) {
  const exploreRef = useRef<HTMLButtonElement>(null);
  const [mode] = useState<Mode>(detectMode);
  const [rainOk, setRainOk] = useState(true);
  const fancy = mode === 'full' && rainOk; // heavy effects on?

  const lineMs = mode === 'lite' ? 260 : 480;
  const [lines, setLines] = useState(mode === 'static' ? BOOT_LINES.length : 1);
  const ready = lines >= BOOT_LINES.length;
  const progress = Math.round((lines / BOOT_LINES.length) * 100);

  useEffect(() => {
    if (mode === 'static' || lines >= BOOT_LINES.length) return;
    const t = setTimeout(() => setLines((n) => n + 1), lineMs);
    return () => clearTimeout(t);
  }, [mode, lines, lineMs]);

  useEffect(() => {
    // Keep the page behind the intro from scrolling while it is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onEnter();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onEnter]);

  useEffect(() => {
    if (ready) exploreRef.current?.focus({ preventScroll: true });
  }, [ready]);

  const stopRain = React.useCallback(() => setRainOk(false), []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to the NASS LASU WebApp"
      data-intro-mode={fancy ? 'full' : mode === 'full' ? 'full-reduced' : mode}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="fixed inset-0 z-[300] overflow-y-auto overflow-x-hidden bg-slate-950 text-white"
    >
      <style>{KEYFRAMES}</style>

      {fancy && <DigitalRain onHeavy={stopRain} />}

      {/* One static layer: dark centre (keeps text readable over the rain) plus a faint circuit grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at center, rgba(2,6,23,0.94) 0%, rgba(2,6,23,0.62) 55%, rgba(2,6,23,0.92) 100%), linear-gradient(rgba(34,211,238,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.07) 1px, transparent 1px)',
          backgroundSize: 'auto, 44px 44px, 44px 44px',
        }}
      />

      {/* Scanning line (moves with transform only, so the phone's GPU does the work) */}
      {fancy && (
        <div
          aria-hidden="true"
          className="fixed left-0 right-0 top-0 h-px bg-cyan-300/60 shadow-[0_0_14px_3px_rgba(34,211,238,0.5)] pointer-events-none"
          style={{ animation: 'introScan 4.5s linear infinite', willChange: 'transform' }}
        />
      )}

      {/* Corner brackets and readouts */}
      <div className="fixed inset-3 sm:inset-5 pointer-events-none">
        <Bracket className="top-0 left-0 border-t-2 border-l-2" />
        <Bracket className="top-0 right-0 border-t-2 border-r-2" />
        <Bracket className="bottom-0 left-0 border-b-2 border-l-2" />
        <Bracket className="bottom-0 right-0 border-b-2 border-r-2" />
        <span className="absolute top-1 left-9 sm:left-12 font-mono text-[9px] sm:text-[10px] tracking-[0.25em] text-cyan-300/70">
          NASS-LASU // WEBAPP v36
        </span>
        <span className="hidden sm:block absolute bottom-1 left-12 font-mono text-[10px] tracking-[0.25em] text-cyan-300/70">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 align-middle" />
          SECURE CONNECTION
        </span>
        <span className="hidden sm:block absolute bottom-1 right-12 font-mono text-[10px] tracking-[0.25em] text-cyan-300/70">
          LAGOS STATE UNIVERSITY
        </span>
      </div>

      {/* Skip is available from the very first second */}
      <button
        onClick={onEnter}
        className="fixed top-5 right-6 sm:top-7 sm:right-12 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/70 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-slate-300 hover:border-yellow-400 hover:text-yellow-400 transition-colors cursor-pointer"
      >
        Skip <ArrowRight size={12} />
      </button>

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-5 py-12 sm:py-16 text-center">
        {/* Logo inside two rings. In full mode each ring spins on its own GPU layer. */}
        <motion.div
          initial={mode === 'static' ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center justify-center w-40 h-40 sm:w-52 sm:h-52 mb-6"
        >
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
            style={fancy ? { animation: 'introSpin 14s linear infinite', willChange: 'transform' } : undefined}
          >
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(34,211,238,0.55)" strokeWidth="1.5" strokeDasharray="6 10" />
          </svg>
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
            style={fancy ? { animation: 'introSpinRev 9s linear infinite', willChange: 'transform' } : undefined}
          >
            <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(250,204,21,0.8)" strokeWidth="2" strokeDasharray="60 30 10 30" />
          </svg>
          <img
            src="/nass_logo.jpg"
            alt="NASS LASU logo"
            width={128}
            height={128}
            decoding="async"
            className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-yellow-400/80 shadow-[0_0_40px_rgba(250,204,21,0.45)]"
          />
        </motion.div>

        {/* Boot progress, then the welcome message in the same space (no jumping) */}
        <div className="grid w-full max-w-3xl">
          <motion.div
            animate={{ opacity: ready ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className={`col-start-1 row-start-1 flex flex-col items-center ${ready ? 'pointer-events-none' : ''}`}
            aria-hidden={ready}
          >
            <div className="w-full max-w-sm font-mono text-[11px] sm:text-xs text-left leading-6 tracking-wider text-cyan-200/90">
              {BOOT_LINES.slice(0, lines).map((l, i) => (
                <div key={l.text} className="flex items-center justify-between gap-3">
                  <span>
                    <span className="text-yellow-400">&gt;</span> {l.text}
                    {i === lines - 1 && !ready && (
                      <span
                        className="ml-1 inline-block w-2 h-3.5 bg-yellow-400 align-middle"
                        style={fancy ? { animation: 'introBlink 0.8s steps(1) infinite' } : undefined}
                      />
                    )}
                  </span>
                  {l.tag && i < lines - 1 && <span className="text-emerald-400 font-bold">[{l.tag}]</span>}
                  {l.tag && i === lines - 1 && ready && <span className="text-emerald-400 font-bold">[{l.tag}]</span>}
                </div>
              ))}
            </div>
            <div className="mt-5 w-full max-w-sm">
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-yellow-400 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 font-mono text-[10px] tracking-[0.3em] text-slate-400">LOADING {progress}%</p>
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 10 }}
            transition={{ duration: 0.5 }}
            className={`relative z-[1] col-start-1 row-start-1 flex flex-col items-center ${ready ? '' : 'pointer-events-none'}`}
            aria-hidden={!ready}
          >
            <p className="font-mono text-[11px] sm:text-sm font-bold uppercase tracking-[0.5em] text-cyan-300">Welcome To</p>
            <h1
              className="mt-3 font-space-grotesk text-5xl sm:text-7xl lg:text-8xl font-black uppercase leading-[1.02] tracking-tight text-yellow-300"
              style={{
                // the glitch plays just twice when the title appears, then stops (no endless repainting)
                animation: fancy && ready ? 'introGlitch 1.1s linear 2' : undefined,
                textShadow: '0 0 18px rgba(250,204,21,0.35)',
              }}
              aria-label="NASS LASU WebApp"
            >
              <span aria-hidden="true" className="block text-white">
                <DecodedLine text="NASS LASU" run={ready} instant={!fancy} />
              </span>
              <span aria-hidden="true" className="block">
                <DecodedLine text="WEBAPP" run={ready} instant={!fancy} ms={1100} />
              </span>
            </h1>

            <div className="relative shrink-0 overflow-hidden mt-5 rounded-2xl border border-cyan-300/40 bg-slate-900/70 px-5 sm:px-7 py-2.5 shadow-[0_0_25px_rgba(34,211,238,0.18)]">
              <span className="relative block text-[11px] sm:text-sm font-extrabold uppercase leading-snug tracking-[0.12em] sm:tracking-[0.18em] text-yellow-300">
                1st Of Its Kind In Lagos State University
              </span>
            </div>

            <button
              ref={exploreRef}
              onClick={onEnter}
              tabIndex={ready ? 0 : -1}
              className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 px-10 py-3.5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Explore</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
