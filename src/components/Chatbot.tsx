import React, { useEffect, useState } from 'react';
import { useQuickTilesInView } from '../lib/useQuickTilesInView';
import { ChatbotAvatar, ChatStyles, TypingDots } from './ChatbotAvatar';

// What a visitor sees for each kind of problem (codes come from api/chat.ts)
const FRIENDLY: Record<string, string> = {
  rate_limited: "You've asked a lot of questions in a short time. Please wait a few minutes and try again.",
  blocked: "I can't help with that one. Please try rephrasing your question.",
  timeout: 'That took too long to answer. Please try again.',
  busy: 'The assistant is very busy right now. Please try again in a minute.',
};

export function Chatbot() {
  const tilesVisible = useQuickTilesInView(); // on phones the launcher steps aside while the quick tiles are on screen

  // A friendly nudge, shown once per visit a few seconds after the page opens
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = !!sessionStorage.getItem('nass_chat_hint'); } catch { /* private mode: fine */ }
    if (seen) return;
    const show = setTimeout(() => setShowHint(true), 6000);
    const hide = setTimeout(() => {
      setShowHint(false);
      try { sessionStorage.setItem('nass_chat_hint', '1'); } catch { /* private mode: fine */ }
    }, 15000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const openChat = () => {
    setShowHint(false);
    try { sessionStorage.setItem('nass_chat_hint', '1'); } catch { /* private mode: fine */ }
    setIsOpen(true);
  };
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: 'Hello! I am Nass AI, your NASS-LASU Secretariat Assistant. How can I assist you with the Constitution or Secretariat guidelines today?' }] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    const newMessages = [...messages, { role: 'user', parts: [{ text: userText }] }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // The AI key now lives on the server (api/chat.ts), never in the browser.
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.text) {
        setMessages([...newMessages, { role: 'model', parts: [{ text: data.text }] }]);
      } else {
        const failure: any = new Error(data?.error || 'Failed to generate response');
        failure.code = data?.code;
        throw failure;
      }
    } catch (error) {
      console.error('Chatbot Error:', error);
      setMessages([
        ...newMessages,
        { role: 'model', parts: [{ text: (FRIENDLY[(error as any)?.code] || 'Sorry, I could not answer just now. Please check your connection and try again in a moment.') + ((error as any)?.code && !FRIENDLY[(error as any).code] ? ` (ref: ${(error as any).code})` : '') }] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-6 md:right-6 z-50 pointer-events-none">
      <ChatStyles />
      {/* Floating Toggle Button with Custom Robot Avatar */}
      {!isOpen && (
        <div
          className={`relative flex items-center justify-end pointer-events-none max-md:transition-opacity ${tilesVisible ? 'max-md:opacity-0' : ''}`}
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
            className={`pointer-events-auto relative w-14 h-14 md:w-16 md:h-16 rounded-full shadow-[0_6px_22px_rgba(2,6,23,0.6)] transition-transform hover:scale-105 active:scale-95 cursor-pointer ${tilesVisible ? 'max-md:pointer-events-none' : ''}`}
          >
            <span
              aria-hidden="true"
              className="nass-anim absolute inset-0 rounded-full border-2 border-yellow-400/70"
              style={{ animation: 'nassPulse 3.2s ease-out infinite', animationPlayState: tilesVisible ? 'paused' : 'running' }}
            />
            <ChatbotAvatar className="relative w-full h-full drop-shadow-lg" animated paused={tilesVisible} />
            <span aria-hidden="true" className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto w-80 md:w-96 h-[500px] max-h-[calc(100vh-9rem)] bg-slate-900 text-white border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-2.5">
              <ChatbotAvatar className="w-9 h-9 shrink-0" ring={false} />
              <div>
                <h3 className="font-bold text-yellow-400 text-sm">Nass AI Assistant</h3>
                <p className="flex items-center gap-1.5 text-[10px] text-slate-400"><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />Online · Secretariat Digital Hub</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xl font-bold px-2 py-1 rounded"
            >
              &times;
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto space-y-3 p-3">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-yellow-300 border border-slate-700'}`}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {loading && <TypingDots />}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a constitutional question..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            />
            <button type="submit" className="bg-yellow-400 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
