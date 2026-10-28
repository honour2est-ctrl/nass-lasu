import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

// Seconds each photo stays on screen while the slideshow plays
const AUTOPLAY_MS = 4000;

interface PageantGalleryProps {
  images?: string[];
  title: string;
  onClose: () => void;
}

const FALLBACK_MAP: Record<string, string> = {
  pageant: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  awards: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  default: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"
};

function getFallbackForTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('pageant') || lower.includes('fresher') || lower.includes('miss')) return FALLBACK_MAP.pageant;
  if (lower.includes('dinner') || lower.includes('award')) return FALLBACK_MAP.awards;
  if (lower.includes('food') || lower.includes('science vs')) return FALLBACK_MAP.food;
  return FALLBACK_MAP.default;
}

function getSafeImageSrc(url: string): string {
  if (!url) return '';
  const clean = url.replace(/['"]/g, '').trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }
  return encodeURI(clean);
}

const isValidUrl = (url: any) => typeof url === 'string' && (url.startsWith('/') || url.startsWith('./') || url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:'));

const sortWithCoverFirst = (list: string[]): string[] => {
  const result = [...list];
  const coverRegex = /cover/i;
  const photo22Regex = /(?:photo|pageant|image|img|pic|fresher)?[_\s%-]*22\b/i;

  result.sort((a, b) => {
    const decodedA = decodeURIComponent(a);
    const decodedB = decodeURIComponent(b);

    const isCoverA = coverRegex.test(decodedA);
    const isCoverB = coverRegex.test(decodedB);
    if (isCoverA && !isCoverB) return -1;
    if (!isCoverA && isCoverB) return 1;

    const is22A = photo22Regex.test(decodedA);
    const is22B = photo22Regex.test(decodedB);
    if (is22A && !is22B) return -1;
    if (!is22A && is22B) return 1;

    return 0;
  });

  return result;
};

export function PageantGallery({ images = [], title, onClose }: PageantGalleryProps) {
  const [galleryImages, setGalleryImages] = useState<string[]>(() => sortWithCoverFirst((images || []).filter(isValidUrl)));
  const [currentIndex, setCurrentIndex] = useState(0);
  // The slideshow plays by itself, unless the visitor's device asks for reduced motion
  const [isPlaying, setIsPlaying] = useState(
    () => !(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  );
  const [isHovering, setIsHovering] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setGalleryImages(sortWithCoverFirst((images || []).filter(isValidUrl)));
  }, [images?.join('|')]);

  // Keep the position valid if the list of photos changes
  useEffect(() => {
    if (currentIndex >= galleryImages.length && galleryImages.length > 0) setCurrentIndex(0);
  }, [galleryImages.length, currentIndex]);

  const handleNext = () => {
    if (galleryImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrev = () => {
    if (galleryImages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Slideshow: move to the next photo after a few seconds. Choosing a photo yourself
  // restarts the countdown, and hovering over the photo pauses it.
  useEffect(() => {
    if (!isPlaying || isHovering || galleryImages.length < 2) return;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [isPlaying, isHovering, currentIndex, galleryImages.length]);

  // Warm up the next photo so the slide change feels instant
  useEffect(() => {
    if (galleryImages.length < 2) return;
    const next = galleryImages[(currentIndex + 1) % galleryImages.length];
    if (next) {
      const preload = new Image();
      preload.src = getSafeImageSrc(next);
    }
  }, [currentIndex, galleryImages]);

  // Keyboard: arrow keys to move, Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryImages.length, onClose]);

  // Stop the page behind the gallery from scrolling while it is open
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  // Swipe left / right on phones
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) handleNext(); else handlePrev();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog" aria-modal="true" aria-label={title}
        className="fixed inset-0 z-[100] bg-slate-950/95 md:backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 border border-white/10"
        >
          <X size={24} />
        </button>

        <div className="absolute top-6 left-6 z-50">
          <h2 className="text-xl md:text-2xl font-space-grotesk font-bold text-white tracking-tight">
            {title}
          </h2>
          {galleryImages.length > 0 && (
            <div className="flex items-center gap-3 mt-1">
              <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest">
                {currentIndex + 1} / {galleryImages.length}
              </p>
              {galleryImages.length > 1 && (
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-yellow-400 hover:text-slate-900 text-white text-[11px] font-bold uppercase tracking-wider border border-white/10 transition-colors"
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {galleryImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-8">
            <p className="text-base font-semibold">No images available for this event yet.</p>
          </div>
        ) : (
          <>
            <div
              className="relative w-full max-w-6xl aspect-[4/3] md:aspect-video flex items-center justify-center"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <button
                onClick={handlePrev}
                aria-label="Previous photo"
                className="absolute left-2 md:-left-12 p-3 bg-white/10 hover:bg-yellow-400 hover:text-slate-900 rounded-full text-white transition-colors z-20 border border-white/10"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentIndex}
                    src={getSafeImageSrc(galleryImages[currentIndex])}
                    alt={`${title} - ${currentIndex + 1}`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getFallbackForTitle(title);
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-contain"
                  />
                </AnimatePresence>
              </div>

              <button
                onClick={handleNext}
                aria-label="Next photo"
                className="absolute right-2 md:-right-12 p-3 bg-white/10 hover:bg-yellow-400 hover:text-slate-900 rounded-full text-white transition-colors z-20 border border-white/10"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Thumbnail strip */}
            <div className="absolute bottom-6 left-0 right-0 px-6">
              <div className="flex gap-2 overflow-x-auto py-4 px-2 snap-x snap-mandatory hide-scrollbar justify-start md:justify-center">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Show photo ${idx + 1}`}
                    className={`relative flex-none snap-center transition-all overflow-hidden rounded-lg border-2 ${
                      idx === currentIndex
                        ? 'w-24 aspect-video border-yellow-400 scale-110 z-10'
                        : 'w-16 aspect-video border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'
                    }`}
                  >
                    <img
                      referrerPolicy="no-referrer"
                      src={getSafeImageSrc(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getFallbackForTitle(title);
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
