import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Siren, PhoneCall, MessageCircle, Send, X } from 'lucide-react';
import { useQuickTilesInView } from '../lib/useQuickTilesInView';

// 09125603852 -> 0912 560 3852 (easier to read and to say aloud)
const formatNumber = (n: string): string => {
  const digits = n.replace(/\s+/g, '');
  return /^0\d{10}$/.test(digits) ? `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}` : n;
};

// Always-visible emergency button: a round SOS button on phones, a red pill on larger screens
export function EmergencyButton({ onOpen }: { onOpen: () => void }) {
  const tilesVisible = useQuickTilesInView(); // the Emergency tile is right there, so the round button waits
  return (
    <>
      <button
        onClick={onOpen}
        aria-label="Emergency help"
        className={`md:hidden fixed left-4 z-[60] bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] w-14 h-14 rounded-full bg-red-600 text-white border-2 border-white/80 shadow-[0_6px_20px_rgba(220,38,38,0.55)] flex flex-col items-center justify-center active:scale-95 cursor-pointer transition-all duration-200 ${tilesVisible ? 'opacity-0 pointer-events-none translate-y-2' : ''}`}
      >
        <Siren size={20} />
        <span className="text-[9px] font-black leading-none mt-0.5">SOS</span>
      </button>
      <button
        onClick={onOpen}
        aria-label="Emergency help"
        className="hidden md:flex fixed bottom-14 left-24 z-50 items-center gap-2 pl-4 pr-5 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <Siren size={18} />
        <span>Emergency</span>
      </button>
    </>
  );
}

interface EmergencySheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** The Emergency Squad numbers to show as tap-to-call buttons */
  numbers: string[];
  /** WhatsApp number in international format without the plus, e.g. 2347074351819 */
  whatsappNumber: string;
  /** Called when the visitor chooses to send a written alert instead of calling */
  onSendAlert: () => void;
  isDarkMode: boolean;
}

export function EmergencySheet({ isOpen, onClose, numbers, whatsappNumber, onSendAlert, isDarkMode }: EmergencySheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Emergency help"
          className="fixed inset-0 z-[90] flex items-end md:items-center justify-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button aria-label="Close emergency help" onClick={onClose} className="absolute inset-0 bg-black/75 cursor-default" />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`relative w-full md:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border-2 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] ${
              isDarkMode ? 'bg-slate-900 border-red-500/50 text-white' : 'bg-white border-red-300 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0"><Siren size={22} /></span>
                <div>
                  <h2 className="font-space-grotesk text-lg font-extrabold uppercase tracking-wide leading-tight">Emergency Help</h2>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Emergency Squad hotline · 24/7</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close emergency help"
                className={`p-2 rounded-full cursor-pointer ${isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
              >
                <X size={18} />
              </button>
            </div>

            <p className={`mb-4 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${isDarkMode ? 'bg-red-500/15 text-red-200' : 'bg-red-50 text-red-700'}`}>
              If someone's life is in danger, call now.
            </p>

            <div className="space-y-2.5">
              {numbers.map((n, i) => (
                <a
                  key={n}
                  href={`tel:${n.replace(/\s+/g, '')}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 font-bold transition-transform active:scale-[0.98] ${
                    i === 0
                      ? 'bg-red-600 text-white shadow-[0_4px_16px_rgba(220,38,38,0.4)]'
                      : isDarkMode
                        ? 'bg-white/5 border border-white/15 text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <PhoneCall size={18} />
                    <span className="text-base tracking-wide">{formatNumber(n)}</span>
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-widest opacity-90">Call</span>
                </a>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hello NASS LASU Welfare Office, I need help.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 hover:bg-green-500 px-4 py-3 text-sm font-bold text-white active:scale-[0.98]"
              >
                <MessageCircle size={18} />
                <span>Chat on WhatsApp</span>
              </a>
              <button
                onClick={onSendAlert}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold cursor-pointer active:scale-[0.98] ${
                  isDarkMode ? 'border-yellow-400/50 text-yellow-300' : 'border-yellow-500 text-yellow-700'
                }`}
              >
                <Send size={16} />
                <span>Can't call? Send an alert instead</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
