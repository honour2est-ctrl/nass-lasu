
import React, { useEffect, useState } from 'react';
import { useQuickTilesInView } from '../lib/useQuickTilesInView';

import './Chatbot.css';

const FRIENDLY: Record<string, string> = {
  rate_limited: "You've asked a lot of questions in a short time. Please wait a few minutes and try again.",
  blocked: "I can't help with that one. Please try rephrasing your question.",
  timeout: 'That took too long to answer. Please try again.',
  busy: 'The assistant is very busy right now. Please try again in a minute.',
};

type Message = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

const SUGGESTIONS = [
  'What are the responsibilities of the General Secretary?',
  'Explain the NASS-LASU Constitution.',
  'How does the Secretariat handle official correspondence?',
  'What are the financial guidelines of the House?',
];

export function Chatbot() {
  const tilesVisible = useQuickTilesInView();

  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [{
        text: 'Welcome to NASS AI, your intelligent NASS-LASU Secretariat Assistant. I am here to help you navigate the Constitution, Standing Orders, parliamentary procedures and Secretariat guidelines. How may I assist you today?'
      }]
    }
  ]);

  // Friendly introductory hint
  useEffect(() => {
    let seen = false;

    try {
      seen = !!sessionStorage.getItem('nass_chat_hint');
    } catch {}

    if (seen) return;

    const show = setTimeout(() => setShowHint(true), 6000);

    const hide = setTimeout(() => {
      setShowHint(false);
      try {
        sessionStorage.setItem('nass_chat_hint', '1');
      } catch {}
    }, 15000);

    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  const openChat = () => {
    setShowHint(false);

    try {
      sessionStorage.setItem('nass_chat_hint', '1');
    } catch {}

    setIsOpen(true);
  };

  // Send message to AI
  const sendMessage = async (
    text: string,
    e?: React.FormEvent
  ) => {
    e?.preventDefault();

    if (!text.trim() || loading) return;

    const userText = text.trim();
    setInput('');

    const newMessages: Message[] = [
      ...messages,
      {
        role: 'user',
        parts: [{ text: userText }]
      }
    ];

    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: newMessages
        })
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.text) {
        setMessages([
          ...newMessages,
          {
            role: 'model',
            parts: [{ text: data.text }]
          }
        ]);
      } else {
        const error: any = new Error(
          data?.error || 'Failed to generate response'
        );

        error.code = data?.code;
        throw error;
      }
    } catch (error) {
      console.error('NASS AI Error:', error);

      const code = (error as any)?.code;

      const errorMessage =
        FRIENDLY[code] ||
        'Sorry, I could not answer just now. Please check your connection and try again.';

      setMessages([
        ...newMessages,
        {
          role: 'model',
          parts: [{
            text: errorMessage +
              (code && !FRIENDLY[code] ? ` (ref: ${code})` : '')
          }]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    sendMessage(input, e);
  };

  return (
    <div className="nass-ai-root">

      {/* =====================================
          FUTURISTIC ENERGY ORB LAUNCHER
      ====================================== */}

      {!isOpen && (
        <div className="relative">

          {showHint && !tilesVisible && (
            <button
              onClick={openChat}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-yellow-400/40 bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl"
            >
              Questions? Ask Nass AI
            </button>
          )}

          <button
            className={`nass-orb-launcher ${
              tilesVisible ? 'max-md:opacity-0 max-md:pointer-events-none' : ''
            }`}
            onClick={openChat}
            aria-label="Open Nass AI Assistant"
            title="Ask Nass AI"
          >
            <div className="energy-glow" />

            <div className="energy-orbit orbit-one" />
            <div className="energy-orbit orbit-two" />
            <div className="energy-orbit orbit-three" />

            <div className="energy-particle particle-one" />
            <div className="energy-particle particle-two" />
            <div className="energy-particle particle-three" />

            <div className="energy-core">
              <div className="core-light" />

              <img
                src="/bot-avatar.jpg"
                alt="Nass AI"
                className="absolute inset-0 w-full h-full rounded-full object-cover"
              />
            </div>

            <span className="orb-label">
              NASS AI
            </span>

            <span className="orb-online">
              <span className="status-dot" />
              ONLINE
            </span>
          </button>
        </div>
      )}

      {/* =====================================
          MAIN CHAT WINDOW
      ====================================== */}

      {isOpen && (
        <div className="nass-ai-window">

          {/* HEADER */}

          <div className="nass-ai-header">

            <div className="header-orb">
              <div className="orb-glow" />
              <div className="orb-pulse" />

              <div className="orb-core">
                <img
                  src="/bot-avatar.jpg"
                  alt="Nass AI"
                />
              </div>
            </div>

            <div className="header-info">

              <div className="header-title">
                Nass AI
                <span className="verified-mark">✦</span>
              </div>

              <div className="header-subtitle">
                NASS-LASU INTELLIGENT SECRETARIAT
              </div>

              <div className="online-indicator">
                <span className="status-dot" />
                ONLINE · READY TO ASSIST
              </div>

            </div>

            <button
              className="close-chat"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>

          </div>

          {/* =================================
              MESSAGE AREA
          ================================== */}

          <div className="nass-ai-messages">

            {/* WELCOME SCREEN */}

            {messages.length === 1 && (
              <div className="welcome-screen">

                <div className="welcome-orb">
                  <div className="welcome-orb-inner">
                    <img
                      src="/bot-avatar.jpg"
                      alt="Nass AI"
                    />
                  </div>
                </div>

                <div className="welcome-tag">
                  YOUR INTELLIGENT SECRETARIAT ASSISTANT
                </div>

                <h2>
                  Welcome to <span>NASS AI</span>
                </h2>

                <p className="welcome-description">
                  Your digital parliamentary companion.
                  Explore the Constitution, Standing Orders,
                  Secretariat operations and everything
                  you need to know about NASS-LASU.
                </p>

                <div className="suggestion-heading">
                  QUICK QUESTIONS TO GET STARTED
                </div>

                <div className="suggestion-list">

                  {SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-button"
                      onClick={() => sendMessage(suggestion)}
                      disabled={loading}
                    >
                      <span>{suggestion}</span>
                      <span className="suggestion-arrow">→</span>
                    </button>
                  ))}

                </div>

              </div>
            )}

            {/* CHAT MESSAGES */}

            {messages.slice(1).map((msg, index) => (
              <div
                key={index}
                className={`message-row ${
                  msg.role === 'user' ? 'user-row' : 'ai-row'
                }`}
              >

                {msg.role === 'model' && (
                  <div className="message-avatar">
                    <img
                      src="/bot-avatar.jpg"
                      alt="Nass AI"
                    />
                  </div>
                )}

                <div
                  className={`message-bubble ${
                    msg.role === 'user'
                      ? 'user-bubble'
                      : 'ai-bubble'
                  }`}
                >

                  <div className="message-label">
                    {msg.role === 'user' ? 'YOU' : 'NASS AI'}
                  </div>

                  <div className="message-text">
                    {msg.parts[0].text}
                  </div>

                </div>

              </div>
            ))}

            {/* TYPING ANIMATION */}

            {loading && (
              <div className="message-row ai-row">

                <div className="message-avatar">
                  <img
                    src="/bot-avatar.jpg"
                    alt="Nass AI"
                  />
                </div>

                <div className="typing-bubble">

                  <span>GENERATING RESPONSE</span>

                  <div className="typing-dots">
                    <i />
                    <i />
                    <i />
                  </div>

                </div>

              </div>
            )}

          </div>

          {/* =================================
              INPUT FOOTER
          ================================== */}

          <div className="nass-ai-footer">

            <div className="input-container">

              <form onSubmit={handleSendMessage}>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Nass AI anything..."
                  disabled={loading}
                  aria-label="Type your message"
                />

                <button
                  type="submit"
                  className="send-button"
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                >
                  ➤
                </button>

              </form>

            </div>

            <div className="footer-caption">
              POWERED BY THE DIGITALIZED AND INNOVATIVE SECRETARIAT
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Chatbot;
