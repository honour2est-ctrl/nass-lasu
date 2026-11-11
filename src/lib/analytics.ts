// ---------------------------------------------------------------------------
// Visitor statistics with Vercel (no extra packages needed).
//  1. In Vercel: your project -> Analytics -> Enable, and Speed Insights -> Enable.
//  2. Deploy. Statistics then appear in those two tabs of the Vercel dashboard.
// Free (Hobby) plan: page views, visitors, devices, countries, where visitors came
// from (for example WhatsApp), and real-phone loading speed.
// track() events (button taps) show up on Vercel's Pro plan; on the free plan they are
// simply ignored, so the calls below do no harm.
// Your own visits from localhost are never counted.
// ---------------------------------------------------------------------------
type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    va?: (...args: any[]) => void;
    vaq?: any[];
    si?: (...args: any[]) => void;
    siq?: any[];
  }
}

let started = false;

const addScript = (src: string) => {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = src;
  document.head.appendChild(s);
};

export function initAnalytics() {
  if (started || typeof window === 'undefined') return;
  started = true;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return;

  window.va =
    window.va ||
    function () {
      (window.vaq = window.vaq || []).push(arguments);
    };
  window.si =
    window.si ||
    function () {
      (window.siq = window.siq || []).push(arguments);
    };
  addScript('/_vercel/insights/script.js');
  addScript('/_vercel/speed-insights/script.js');
}

/** Record that something happened, for example track('tile_click', { tile: 'vault' }) */
export function track(name: string, data?: EventData) {
  try {
    window.va?.('event', data ? { name, data } : { name });
  } catch {
    /* statistics must never break the site */
  }
}
