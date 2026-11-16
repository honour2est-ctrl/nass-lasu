
import React, { useState } from 'react';
import './Chatbot.css';

// Keep your existing Gemini model configuration
const GEMINI_MODEL = 'gemini-3.6-flash';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      parts: [{
        text: 'Hello! I am Nass AI, your NASS-LASU Secretariat Assistant. How can I assist you with the Constitution or Secretariat guidelines today?'
      }]
    }
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

    const newMessages = [
      ...messages,
      { role: 'user', parts: [{ text: userText }] }
    ];

    setMessages(newMessages);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
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
        const aiResponseText =
          data.candidates[0].content.parts[0].text;

        setMessages([
          ...newMessages,
          { role: 'model', parts: [{ text: aiResponseText }] }
        ]);
      } else {
        throw new Error(
          data.error?.message || 'Failed to generate response'
        );
      }
    } catch (error) {
      console.error('Chatbot Error:', error);

      setMessages([
        ...newMessages,
        {
          role: 'model',
          parts: [{
            text: 'Sorry, I encountered an error. Please check your connection or configuration.'
          }]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'What is the NASS-LASU Constitution?',
    'What are the duties of the General Secretary?',
    'Explain the SSRC Standing Orders',
    'How are association funds shared?'
  ];

  return (
    <div className="nass-ai-root">

      {/* Floating AI Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="nass-ai-launcher"
          title="Open Nass AI Secretariat Assistant"
          aria-label="Open Nass AI"
        >
          <span className="launcher-ring" />

          <span className="launcher-avatar">
            <img src="/bot-avatar.jpg" alt="Nass AI" />
          </span>

          <span className="launcher-label">NASS AI</span>
          <span className="launcher-status">
            <span className="status-dot" />
            ONLINE
          </span>
        </button>
      )}

      {/* Main Chat Interface */}
      {isOpen && (
        <div className="nass-ai-window">

          {/* Animated Header */}
          <header className="nass-ai-header">

            <div className="header-orb">
              <div className="orb-glow" />
              <div className="orb-core">
                <img src="/bot-avatar.jpg" alt="Nass AI" />
              </div>
              <span className="orb-pulse" />
            </div>

            <div className="header-info">
              <div className="header-title">
                NASS AI
                <span className="verified-mark">✦</span>
              </div>

              <div className="header-subtitle">
                SECRETARIAT INTELLIGENCE SYSTEM
              </div>

              <div className="online-indicator">
                <span className="status-dot" />
                SYSTEM ONLINE
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="close-chat"
              aria-label="Close chatbot"
            >
              ×
            </button>
          </header>

          {/* Chat Messages */}
          <div className="nass-ai-messages">

            {/* Welcome Screen */}
            {messages.length === 1 && (
              <div className="welcome-screen">

                <div className="welcome-orb">
                  <div className="welcome-orb-inner">
                    <img src="/bot-avatar.jpg" alt="NASS AI" />
                  </div>
                </div>

                <div className="welcome-tag">
                  INTELLIGENCE AT YOUR SERVICE
                </div>

                <h2>
                  Welcome to <span>NASS AI</span>
                </h2>

                <p className="welcome-description">
                  Your intelligent digital companion for the
                  NASS-LASU Constitution, parliamentary affairs
                  and Secretariat operations.
                </p>

                <div className="suggestion-heading">
                  EXPLORE WHAT I CAN DO
                </div>

                <div className="suggestion-list">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(suggestion)}
                      className="suggestion-button"
                    >
                      <span>{suggestion}</span>
                      <span className="suggestion-arrow">↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-row ${
                  msg.role === 'user' ? 'user-row' : 'ai-row'
                }`}
              >
                {msg.role === 'model' && (
                  <div className="message-avatar">
                    <img src="/bot-avatar.jpg" alt="AI" />
                  </div>
                )}

                <div
                  className={`message-bubble ${
                    msg.role === 'user' ? 'user-bubble' : 'ai-bubble'
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

            {/* Animated Typing Indicator */}
            {loading && (
              <div className="message-row ai-row">
                <div className="message-avatar">
                  <img src="/bot-avatar.jpg" alt="AI" />
                </div>

                <div className="message-bubble ai-bubble typing-bubble">
                  <span>PROCESSING RESPONSE</span>
                  <div className="typing-dots">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="nass-ai-footer">
            <div className="input-container">
              <form onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask NASS AI anything..."
                  disabled={loading}
                  aria-label="Message NASS AI"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="send-button"
                  aria-label="Send message"
                >
                  <span>➤</span>
                </button>
              </form>
            </div>

            <div className="footer-caption">
              POWERED BY AI · NASS-LASU DIGITAL SECRETARIAT
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
