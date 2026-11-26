import React from 'react';
import { ImageSlideshow } from './ImageSlideshow';

interface HeroBackdropProps {
  /** Photos uploaded through Admin -> Hero Photos */
  photos: string[];
  alt?: string;
  isDarkMode: boolean;
}

// All visitors receive the complete hero photo list.
// Data Saver and slow-connection settings do not disable the slideshow.
export function HeroBackdrop({
  photos,
  alt = 'Faculty of Science, Lagos State University',
  isDarkMode,
}: HeroBackdropProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
      <ImageSlideshow
        images={photos}
        alt={alt}
        interval={3000}
        showControls={false}
        priority
      />

      <div
        className={`absolute inset-0 ${
          isDarkMode
            ? 'bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950'
            : 'bg-gradient-to-b from-white/80 via-white/60 to-slate-100'
        }`}
      />

      <div
        className={`absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent ${
          isDarkMode ? 'to-slate-950' : 'to-slate-100'
        }`}
      />
    </div>
  );
}
