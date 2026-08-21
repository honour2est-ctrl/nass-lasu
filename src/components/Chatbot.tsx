import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, X, Loader2, MapPin } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

// PUT YOUR GEMINI API KEY HERE:
const GEMINI_API_KEY = "PASTE_YOUR_API_KEY_HERE"; 

type Message = { role: 'user' | 'model'; parts: { text: string }[]; groundingChunks?: any[] };

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'model',
    parts: [{ text: 'Hello! I am the Digital Secretariat Hub Assistant. How can I help you today?' }]
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'knowledgeBase'), (snap) => {
      if (!snap.empty) {
        const kbText = snap.docs.map(doc => {
          const data = doc.data();
          return `Title: ${data.title}\nContent:\n${data.content}`;
        }).join('\n\n');
        setKnowledgeBase(kbText);
      } else {
        setKnowledgeBase('');
      }
    }, (error) => {
      console.warn("Firestore listener warning (knowledgeBase):", error.message);
    });
    return () => unsub();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = { role: 'user', parts: [{ text: userText }] };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Format the conversation history for Gemini
      const chatHistory = messages.slice(1).map(m => ({
        role: m.role,
        parts: m.parts
      }));
      
      // 2. Add the new user message
      chatHistory.push({ role: 'user', parts: [{ text: userText }] });

      // 3. Make a direct call to the Google Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `You are the official NASS LASU Secretariat Assistant. You must answer questions based ONLY on this official knowledge base provided by the executive council:\n\n${knowledgeBase}` }]
          },
          contents: chatHistory
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate response');
      }

      // Extract the text from the AI's response
      const aiResponseText = data.candidates[0].content.parts[0].text;

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: aiResponseText }] }]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: 'Sorry, I encountered an error. Please make sure the API key is correct and try again.' }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-yellow-400 text-slate-900 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-110 transition-transform z-50 flex items-center justify-center font-bold"
      >
        <Bot size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col h-[500px] max-h-[80vh]">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center dark:bg-slate-800/50 bg-slate-200/50">
            <div className="flex items-center gap-2 text-yellow-400 font-semibold font-sans tracking-tight">
              <Bot size={20} />
              Secretariat Assistant
              <span className="text-[10px] bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-400/30">INTELLIGENT</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-yellow-400 text-slate-900'}`}>
                  {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                </div>
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap font-sans">{msg.parts[0].text}</p>
                  
                  {/* Maps Grounding Links */}
                  {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-white/10 pt-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Locations Mentioned:</span>
                      <div className="flex flex-col gap-2">
                        {msg.groundingChunks.filter((chunk: any) => chunk.web?.uri || chunk.web?.title).map((chunk: any, chunkIdx: number) => (
                          <a 
                            key={chunkIdx} 
                            href={chunk.web?.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 bg-slate-900/50 hover:bg-slate-900 p-2 rounded-lg border border-white/5 hover:border-yellow-400/30 transition-colors group"
                          >
                            <MapPin size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                            <span className="text-xs text-blue-300 group-hover:text-yellow-400 transition-colors line-clamp-2">
                              {chunk.web?.title || 'View on Google Maps'}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-white/5 rounded-tl-none flex items-center">
                  <Loader2 size={16} className="text-yellow-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 bg-slate-900/50">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about the secretariat..."
                className="flex-1 bg-slate-800 text-white placeholder:text-slate-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 border border-white/10"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-full bg-yellow-400 text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
