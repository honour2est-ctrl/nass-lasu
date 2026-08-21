import React, { useState } from 'react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: 'Hello! I am the Digital Secretariat Hub Assistant. How can I help you today?' }] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Constitutional Knowledge Base & System Instruction
  const systemInstruction = `
You are the official NASS-LASU Secretariat Assistant, an intelligent digital representative for the Nigerian Association of Science Students, Lagos State University Chapter. 

Use the following official knowledge base extracted from the NASS-LASU Constitution (2023 As Amended) and SSRC Standing Orders to answer user inquiries accurately:

--- 1. GENERAL IDENTITY & SYMBOLS ---
- Association Name: Nigerian Association of Science Students - Lagos State University Chapter (NASS-LASU).
- Motto: "Toward Scientific Advancement."
- Logo Symbolism: Two concentric circles represent unity; the "Y" shape stands for solidarity, equity, justice, and scientific advancement; Conical flask represents Chemical sciences, Microscope represents Biological sciences, and Computer represents Physical sciences.
- Secretariat: Located within the Faculty and managed by the General Secretary in conjunction with the Assistant General Secretary.

--- 2. MEMBERSHIP & RIGHTS ---
- Membership: All duly matriculated full-time undergraduate students of the Faculty of Science who pay their association dues.
- Forfeiture of Membership: Graduating, joining a secret cult, or facing suspension/expulsion from the university.
- Member Rights: Access to facilities, right to vote and be voted for (excluding part-time/sandwich students), and receipt of association packages.

--- 3. EXECUTIVE COUNCIL (SSEC) OFFICERS ---
- Comprises: President, Vice President, General Secretary, Welfare Director, Public Relations Officer (PRO), Social Director, Financial Secretary, Treasurer, Sport Director, and Assistant General Secretary.
- Academic Requirement: Executives must maintain a CGPA of not less than 3.00.
- Financial Custodianship: The Financial Secretary handles records and receipts; the Treasurer keeps checkbooks, handles deposits within 48 hours, and maintains an imprest of not more than ₦3,000.

--- 4. LEGISLATIVE COUNCIL (SSRC) & PROCEDURES ---
- Composition: Five (5) honorable members from each department.
- Functionaries: Speaker, Deputy Speaker, Clerk, Chief Whip, Under Secretary, and Sergeant-at-Arms.
- Sittings: Convened at least once a month by the Speaker, upon request by the President, or by a simple majority.
- The Mace: Symbol of parliamentary authority. Lies horizontally during normal sittings; stands upright during a Committee of the Whole House or when an observer is speaking.
- Address Protocol: Members are addressed as "Honourable", and the House is addressed as "Rt. Hon Speaker, Deputy Speaker, all protocols duly observed."

--- 5. FINANCES & SHARING FORMULA ---
- Accounts: Central Account, SSEC Account, and SSRC Account.
- Revenue Sharing Formula from Central Account: NASS-LASU SSEC (64%), NASS-LASU SSRC (35%), and Auditor General (1%).

--- 6. BILL PASSAGE PROCESS ---
1. First Reading: Bill presented by a member and read at the next business sitting.
2. Committee Review: Sent to the House Committee on Standing Orders and Bills for up to 5 working days.
3. Second Reading & Debate: Bill is read again, debated, and amendments are received.
4. Third Reading & Passage: Read a third time with no further amendments, then passed via a Simple Majority vote.
5. Assent: Forwarded to the President for assent within 5 working days, or vetoed by the House via a simple majority.

Answer all questions professionally, upholding parliamentary decorum and referencing these constitutional guidelines.
`;

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
    <div className="flex flex-col h-full bg-slate-900 text-white p-4 rounded-lg">
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
        <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-white font-semibold hover:bg-blue-500">
          Send
        </button>
      </form>
    </div>
  );
}
