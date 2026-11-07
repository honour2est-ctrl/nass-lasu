import React, { useState } from 'react';
import { useQuickTilesInView } from '../lib/useQuickTilesInView';

export function Chatbot() {
  const tilesVisible = useQuickTilesInView(); // on phones the launcher steps aside while the quick tiles are on screen
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
        throw new Error(data?.error || 'Failed to generate response');
      }
    } catch (error) {
      console.error('Chatbot Error:', error);
      setMessages([
        ...newMessages,
        { role: 'model', parts: [{ text: 'Sorry, I could not answer just now. Please check your connection and try again in a moment.' }] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-6 md:right-6 z-50 pointer-events-none">
      {/* Floating Toggle Button with Custom Robot Avatar */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`pointer-events-auto bg-yellow-400 text-slate-900 p-2.5 rounded-2xl shadow-2xl hover:bg-yellow-300 transition-all flex flex-col items-center justify-center font-bold text-xs border-2 border-slate-900 group max-md:transition-opacity ${tilesVisible ? 'max-md:opacity-0 max-md:pointer-events-none' : ''}`}
          title="Open Nass AI Secretariat Assistant"
        >
          <img 
            src="/bot-avatar.jpg" 
            alt="Nass AI" 
            className="w-9 h-9 rounded-full object-cover mb-1 border border-slate-900 shadow-inner" 
          />
          <span className="tracking-wide font-extrabold text-[11px]">Nass AI</span>
        </button>
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
                className="w-7 h-7 rounded-full object-cover border border-yellow-400" 
              />
              <div>
                <h3 className="font-bold text-yellow-400 text-sm">Nass AI Assistant</h3>
                <p className="text-[10px] text-slate-400">Secretariat Digital Hub</p>
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
            {loading && <div className="text-slate-400 text-xs italic p-1">Nass AI is typing...</div>}
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
