
import React, { useEffect, useState } from 'react';
import { useQuickTilesInView } from '../lib/useQuickTilesInView';

// What a visitor sees for each kind of problem
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

export function Chatbot() {
  const tilesVisible = useQuickTilesInView();

  const [showHint, setShowHint] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [{
        text: 'Hello! I am Nass AI, your NASS-LASU Secretariat Assistant. How can I assist you with the Constitution or Secretariat guidelines today?'
      }]
    }
  ]);

  // Show friendly hint once per visit
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', parts: [{ text: userText }] }
    ];

    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.text) {
        setMessages([
          ...newMessages,
          { role: 'model', parts: [{ text: data.text }] }
        ]);
      } else {
        const failure: any = new Error(
          data?.error || 'Failed to generate response'
        );
        failure.code = data?.code;
        throw failure;
      }
    } catch (error) {
      console.error('Chatbot Error:', error);

      const code = (error as any)?.code;

      const errorMessage =
        FRIENDLY[code] ||
        'Sorry, I could not answer just now. Please check your connection and try again in a moment.';

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

  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-6 md:right-6 z-50 pointer-events-none">

      {/* Floating Toggle Button */}
      {!isOpen && (
        <div
          className={`relative flex items-center justify-end pointer-events-none max-md:transition-opacity ${
            tilesVisible ? 'max-md:opacity-0' : ''
          }`}
        >
          {showHint && !tilesVisible && (
            <button
              onClick={openChat}
              className="pointer-events-auto absolute right-full mr-3 bottom-1 whitespace-nowrap rounded-2xl rounded-br-md border border-yellow-400/50 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xl cursor-pointer"
              style={{ animation: 'nassHintIn 0.35s ease-out' }}
            >
              Questions? Ask Nass AI
            </button>
          )}

          <button
            onClick={openChat}
            aria-label="Open Nass AI assistant"
            title="Ask Nass AI"
            className={`pointer-events-auto relative w-14 h-14 md:w-16 md:h-16 rounded-full shadow-[0_6px_22px_rgba(2,6,23,0.6)] transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
              tilesVisible ? 'max-md:pointer-events-none' : ''
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-2 border-yellow-400/70 animate-ping opacity-30"
            />

            <img
              src="/bot-avatar.jpg"
              alt="Nass AI"
              className="relative w-full h-full rounded-full object-cover drop-shadow-lg"
            />

            <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto w-80 md:w-96 h-[500px] max-h-[calc(100vh-9rem)] bg-slate-900 text-white border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl">

          {/* Header */}
          <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">

            <div className="flex items-center gap-2.5">
              <img
                src="/bot-avatar.jpg"
                alt="Nass AI"
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />

              <div>
                <h3 className="font-bold text-yellow-400 text-sm">
                  Nass AI Assistant
                </h3>

                <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Online · Secretariat Digital Hub
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-slate-400 hover:text-white text-xl font-bold px-2 py-1 rounded"
            >
              &times;
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3">

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl text-sm whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-yellow-300 border border-slate-700'
                  }`}
                >
                  {msg.parts[0].text}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex gap-1 items-center">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a constitutional question..."
              className="min-w-0 flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
