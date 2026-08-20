import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSlideshowProps {
  images: string[];
  interval?: number;
  alt: string;
  fallbackImage?: string;
}

const FALLBACK_MAP: Record<string, string> = {
  pageant: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
  awards: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
  food: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  default: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"
};

function getFallbackForAlt(alt: string): string {
  const lower = alt.toLowerCase();
  if (lower.includes('pageant') || lower.includes('fresher') || lower.includes('miss')) return FALLBACK_MAP.pageant;
  if (lower.includes('dinner') || lower.includes('award')) return FALLBACK_MAP.awards;
  if (lower.includes('food') || lower.includes('science vs')) return FALLBACK_MAP.food;
  return FALLBACK_MAP.default;
}

const cleanUrl = (raw: string): string => {
  const clean = raw.replace(/['"]/g, '').trim();
  const isFullUrl = clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:');
  return isFullUrl ? clean : encodeURI(clean);
};

// NOTE: this used to also scan Firebase Storage folder-by-folder (and, in the
// worst case, list every file in the entire bucket) trying to guess where an
// event's photos lived. That's what made galleries slow to appear and
// sometimes never start slideshowing at all. Now it just renders whatever is
// in the event's `images` field directly — which is exactly what the Admin
// Panel's photo uploads already write there.
export function ImageSlideshow({ images, interval = 3000, alt, fallbackImage }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const activeImages = (images || []).filter(Boolean);
  const activeCount = activeImages.length;

  useEffect(() => {
    setCurrentIndex(0);
  }, [images?.join('|')]);

  useEffect(() => {
    if (activeCount <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeCount);
    }, interval);
    return () => clearInterval(timer);
  }, [activeCount, interval]);

  // Preload the next couple of images so the cross-fade never has to wait
  useEffect(() => {
    if (activeCount <= 1) return;
    [(currentIndex + 1) % activeCount, (currentIndex + 2) % activeCount].forEach((idx) => {
      const url = activeImages[idx];
      if (url) { const img = new Image(); img.src = cleanUrl(url); }
    });
  }, [currentIndex, activeCount]);

  const defaultFallback = getFallbackForAlt(alt);
  const fallback = fallbackImage || defaultFallback;

  if (activeCount === 0) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-slate-900 group/slideshow">
        <img
          referrerPolicy="no-referrer"
          src={fallback}
          alt={alt}
          className="w-full h-full object-cover absolute inset-0 group-hover/slideshow:scale-105 transition-transform duration-1000"
        />
      </div>
    );
  }

  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex((prev) => (prev + 1) % activeCount); };
  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex((prev) => (prev - 1 + activeCount) % activeCount); };

  const currentRawUrl = activeImages[currentIndex] || '';
  const currentCleanUrl = currentRawUrl.replace(/['"]/g, '').trim();
  const isFailed = failedUrls[currentCleanUrl];
  const activeSrcUrl = isFailed ? fallback : cleanUrl(currentRawUrl);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-900 group/slideshow">
      <AnimatePresence mode="sync">
        <motion.img
          key={`${currentCleanUrl}-${currentIndex}`}
          referrerPolicy="no-referrer"
          src={activeSrcUrl}
          alt={`${alt} - ${currentIndex + 1}`}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1.0] }}
          onError={() => {
            if (!failedUrls[currentCleanUrl]) {
              console.warn(`[ImageSlideshow] Failed to load image: ${currentCleanUrl}`);
              setFailedUrls((prev) => ({ ...prev, [currentCleanUrl]: true }));
            }
          }}
          className="w-full h-full object-cover absolute inset-0 group-hover/slideshow:scale-105 transition-transform duration-1000"
        />
      </AnimatePresence>

      {activeCount > 1 && (
        <>
          <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 hover:bg-yellow-400 hover:text-slate-900 text-white rounded-full transition-all opacity-0 group-hover/slideshow:opacity-100 backdrop-blur-sm border border-white/20" aria-label="Previous slide">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 hover:bg-yellow-400 hover:text-slate-900 text-white rounded-full transition-all opacity-0 group-hover/slideshow:opacity-100 backdrop-blur-sm border border-white/20" aria-label="Next slide">
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {activeCount > 1 && (
        <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center items-center gap-1 px-4 pointer-events-auto">
          {activeImages.slice(0, 10).map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 bg-yellow-400' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
          {activeCount > 10 && <span className="text-[9px] text-white/70 font-mono ml-1 font-semibold select-none">+{activeCount - 10}</span>}
        </div>
      )}
    </div>
  );
}
