import { useEffect, useState } from 'react';

// True while the four quick tiles (section #quick) are on screen. On phones the floating
// SOS and chatbot buttons step aside during that time so they never cover the tiles.
export function useQuickTilesInView(): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = document.getElementById('quick');
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return inView;
}
