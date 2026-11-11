import React from 'react';
import { MessageCircle } from 'lucide-react';
import { track } from '../lib/analytics';

interface ShareButtonProps {
  /** Headline or title that people will see in the WhatsApp message */
  headline: string;
  /** Optional short description */
  text?: string;
  /** Which part of the site the link should open, for example "news" or "events" */
  section: string;
  /** Icon-only round button (for photo cards) instead of the full labelled button */
  compact?: boolean;
  isDarkMode?: boolean;
}

// Shares a post to WhatsApp. The link opens the site at that section (and skips the intro).
export function ShareButton({ headline, text, section, compact = false, isDarkMode = true }: ShareButtonProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const clean = (text || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const body = clean ? `${clean.slice(0, 140)}${clean.length > 140 ? '...' : ''}\n` : '';
  const message = `*${headline}*\n${body}\nNASS LASU WebApp: ${origin}/#${section}`;
  const href = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Share ${headline} on WhatsApp`}
      onClick={(e) => {
        e.stopPropagation(); // sharing a card must not also open its gallery
        track('share_whatsapp', { section });
      }}
      className={
        compact
          ? 'inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg active:scale-95 transition-colors'
          : `inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-extrabold uppercase tracking-wider active:scale-95 transition-colors ${
              isDarkMode
                ? 'bg-green-600/15 hover:bg-green-600 text-green-400 hover:text-white border-green-500/40'
                : 'bg-green-50 hover:bg-green-600 text-green-700 hover:text-white border-green-500/50'
            }`
      }
    >
      <MessageCircle size={compact ? 18 : 16} />
      {!compact && <span>Share on WhatsApp</span>}
    </a>
  );
}
