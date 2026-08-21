import React, { useState } from 'react';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: 'Hello! I am your NASS-LASU Secretariat Assistant. How can I assist you with the Constitution or Secretariat guidelines today?' }] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const systemInstruction = 
    "You are the official NASS-LASU Secretariat Assistant, an intelligent digital representative for the Nigerian Association of Science Students, Lagos State University Chapter[cite: 1]. " +
    "Use the official knowledge base extracted from the NASS-LASU Constitution (2023 As Amended)[cite: 1] and SSRC Standing Orders[cite: 2]: " +
    "1. Association Name: Nigerian Association of Science Students - Lagos State University Chapter (NASS-LASU). Motto: 'Toward Scientific Advancement'[cite: 1]. " +
    "2. Membership: All duly matriculated full-time undergraduate students of the Faculty of Science who pay their association dues[cite: 1]. " +
    "3. Executive Council (SSEC): Comprises President, Vice President, General Secretary, Welfare Director, PRO, Social Director, Financial Secretary, Treasurer, Sport Director, and Assistant General Secretary[cite: 1]. Executives must have a CGPA >= 3.00[cite: 1]. " +
    "4. Legislative Council (SSRC): 5 members per department[cite: 1]. Functionaries include Speaker, Deputy Speaker, Clerk, Chief Whip, Under Secretary, and Sergeant-at-Arms[cite: 1, 2]. " +
    "5. Finances & Sharing Formula: Central Account sharing formula is SSEC (64%), SSRC (35%), and Auditor General (1%)[cite: 1].";

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    const newMessages = [...messages, { role: 'user', parts: [{ text: userText }] }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: newMessages,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }),
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        const aiResponseText = data.candidates[0].content.parts[0].text;
        setMessages([...newMessages, { role: 'model', parts: [{ text: aiResponseText }] }]);
      } else {
        throw new Error(data.error?.message || 'Failed to generate response');
      }
    } catch (error) {
      console.error('Chatbot Error:', error);
      setMessages([
        ...newMessages,
        { role: 'model', parts: [{ text: 'Sorry, I encountered an error. Please check your connection or configuration.' }] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-yellow-400 text-slate-900 p-4 rounded-full shadow-2xl hover:bg-yellow-300 transition-all flex items-center justify-center font-bold text-lg border-2 border-slate-900"
          title="Open Secretariat Assistant"
        >
          💬 NASS AI
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-80 md:w-96 h-[500px] bg-slate-900 text-white border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
            <div>
              <h3 className="font-bold text-yellow-400">NASS-LASU Assistant</h3>
              <p className="text-xs text-slate-400">Secretariat Digital Hub</p>
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
            {loading && <div className="text-slate-400 text-xs italic p-1">Secretariat Assistant is typing...</div>}
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
