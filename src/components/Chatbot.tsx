import React, { useState } from 'react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: 'Hello! I am the Digital Secretariat Hub Assistant. How can I help you today?' }] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const systemInstruction = 
    "You are the official NASS-LASU Secretariat Assistant, an intelligent digital representative for the Nigerian Association of Science Students, Lagos State University Chapter. " +
    "Use the official knowledge base extracted from the NASS-LASU Constitution (2023 As Amended) and SSRC Standing Orders: " +
    "1. Association Name: Nigerian Association of Science Students - Lagos State University Chapter (NASS-LASU). Motto: 'Toward Scientific Advancement'. " +
    "2. Membership: All duly matriculated full-time undergraduate students of the Faculty of Science who pay their association dues. " +
    "3. Executive Council (SSEC): Comprises President, Vice President, General Secretary, Welfare Director, PRO, Social Director, Financial Secretary, Treasurer, Sport Director, and Assistant General Secretary. Executives must have a CGPA >= 3.00. " +
    "4. Legislative Council (SSRC): 5 members per department. Functionaries include Speaker, Deputy Speaker, Clerk, Chief Whip, Under Secretary, and Sergeant-at-Arms. " +
    "5. Finances & Sharing Formula: Central Account sharing formula is SSEC (64%), SSRC (35%), and Auditor General (1%).";

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
    <div className="flex flex-col h-full bg-slate-900 text-white p-4 rounded-lg shadow-xl">
      <div className="flex-1 overflow-y-auto space-y-4 p-2">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-yellow-400'}`}>
              {msg.parts[0].text}
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-400 italic">Secretariat Assistant is typing...</div>}
      </div>
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the constitution, sittings, or offices..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-white font-semibold hover:bg-blue-500 transition-colors">
          Send
        </button>
      </form>
    </div>
  );
}
