import React from 'react';
import { ImageSlideshow } from './ImageSlideshow';

interface HeroBackdropProps {
  /** Web addresses of the Faculty of Science photos (uploaded in Admin -> Hero Photos) */
  photos: string[];
  alt?: string;
  isDarkMode: boolean;
}

// Visitors on Data Saver or a slow connection get just the first photo (no cycling, less data)
const lightMode = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as any).connection;
  return !!conn && (!!conn.saveData || /(^|-)2g|3g/.test(String(conn.effectiveType || '')));
};

// Faculty photos that fade slowly behind the top of the page, under a dark veil so the text stays easy to read
export function HeroBackdrop({ photos, alt = 'Faculty of Science, Lagos State University', isDarkMode }: HeroBackdropProps) {
  if (photos.length === 0) return null;
  const shown = lightMode() ? photos.slice(0, 1) : photos;
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
      <ImageSlideshow images={shown} alt={alt} interval={6000} showControls={false} priority />
      <div
        className={`absolute inset-0 ${
          isDarkMode
            ? 'bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950'
            : 'bg-gradient-to-b from-white/80 via-white/60 to-slate-100'
        }`}
      />
      {/* extra-soft fade at the bottom so the photo melts into the page */}
      <div
        className={`absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent ${isDarkMode ? 'to-slate-950' : 'to-slate-100'}`}
      />
    </div>
  );
}
