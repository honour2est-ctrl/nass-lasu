import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// "Install the app" support:
//  - adds the app manifest + colours to the page (no need to edit index.html for these)
//  - registers the offline/speed helper (public/sw.js) on the live https site only
//  - lets the More menu offer an Install button
// ---------------------------------------------------------------------------
type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

let deferredPrompt: any = null; // Chrome / Edge / Samsung Internet hand us this when the app can be installed
let justInstalled = false;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    justInstalled = true;
    deferredPrompt = null;
    notify();
  });
}

const isStandalone = (): boolean =>
  typeof window !== 'undefined' &&
  (!!window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);

const isIOS = (): boolean => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

const addTag = (tag: 'link' | 'meta', attrs: Record<string, string>, uniqueSelector: string) => {
  if (document.head.querySelector(uniqueSelector)) return;
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
};

export function initPwa() {
  if (typeof window === 'undefined') return;
  addTag('link', { rel: 'manifest', href: '/manifest.webmanifest' }, 'link[rel="manifest"]');
  addTag('meta', { name: 'theme-color', content: '#020617' }, 'meta[name="theme-color"]');
  addTag('link', { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' }, 'link[rel="apple-touch-icon"]');
  addTag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }, 'meta[name="apple-mobile-web-app-capable"]');
  addTag('meta', { name: 'apple-mobile-web-app-title', content: 'NASS LASU' }, 'meta[name="apple-mobile-web-app-title"]');

  // Only on the real (https) website, so it never gets in the way while you are developing
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    const register = () => navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }
}

export function useInstallPrompt() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const l = () => rerender((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const installed = justInstalled || isStandalone();
  return {
    installed,
    /** Android / desktop Chrome: one tap installs it */
    canPrompt: !!deferredPrompt && !installed,
    /** iPhone Safari has no install button; people use Share -> Add to Home Screen */
    showIOSHelp: isIOS() && !installed,
    promptInstall: async (): Promise<boolean> => {
      if (!deferredPrompt) return false;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      notify();
      return choice?.outcome === 'accepted';
    },
  };
}
