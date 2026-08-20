import React, { useEffect, useRef } from 'react';

const SYMBOLS = ["\uD83E\uDDEC", "\u2697\uFE0F", "\uD83D\uDD2C", "\u2211", "\u222B", "\u03C0", "\u221E", "\u232C", "\u2207", "\u03B8", "\u2202", "\u222F"];

export const BackgroundEngine = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const symbolsDivs: HTMLDivElement[] = [];
    const container = containerRef.current;
    if (!container) return;

    // Generate random symbols on screen
    for (let i = 0; i < 30; i++) {
      const sym = document.createElement('div');
      sym.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      sym.className = 'absolute text-yellow-500/20 text-4xl select-none transition-transform pointer-events-none duration-100 filter drop-shadow-md';
      sym.style.left = `${Math.random() * 100}vw`;
      sym.style.top = `${Math.random() * 100}vh`;
      
      // Store random base positions
      sym.dataset.baseX = Math.random().toString();
      sym.dataset.baseY = Math.random().toString();
      sym.dataset.speed = (Math.random() * 0.5 + 0.1).toString();
      
      container.appendChild(sym);
      symbolsDivs.push(sym);
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      symbolsDivs.forEach((sym, index) => {
        const speed = parseFloat(sym.dataset.speed || '0.1');
        const phase = index * 0.5;
        
        // Ripple wave based on sine of scroll position
        const offsetX = Math.sin((scrollY * 0.01) + phase) * 50 * speed;
        const offsetY = Math.cos((scrollY * 0.01) + phase) * 30 * speed;
        const rotate = Math.sin((scrollY * 0.02) + phase) * 45;
        const scale = 1 + Math.sin((scrollY * 0.015) + phase) * 0.5;

        sym.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotate(${rotate}deg)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial trigger
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      symbolsDivs.forEach(sym => sym.remove());
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-br from-[#020617] via-[#070e27] to-[#0b1536]">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
};
