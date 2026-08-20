import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

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

  useEffect(() => {
    setGalleryImages(sortWithCoverFirst((images || []).filter(isValidUrl)));
  }, [images?.join('|')]);

  const handleNext = () => {
    if (galleryImages.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrev = () => {
    if (galleryImages.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 border border-white/10"
        >
          <X size={24} />
        </button>

        <div className="absolute top-6 left-6 z-50">
          <h2 className="text-xl md:text-2xl font-space-grotesk font-bold text-white tracking-tight">
            {title}
          </h2>
          {galleryImages.length > 0 && (
            <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mt-1">
              {currentIndex + 1} / {galleryImages.length}
            </p>
          )}
        </div>

        {galleryImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-8">
            <p className="text-base font-semibold">No images available for this event yet.</p>
          </div>
        ) : (
          <>
            <div className="relative w-full max-w-6xl aspect-[4/3] md:aspect-video flex items-center justify-center">
              <button
                onClick={handlePrev}
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
