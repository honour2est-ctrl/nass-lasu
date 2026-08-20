import type { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: { headers: { 'User-Agent': 'netlify-function' } },
    })
  : null;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!ai) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Gemini API key is not configured on the server.' }),
    };
  }

  try {
    const { messages, knowledgeContext } = JSON.parse(event.body || '{}');

    const systemInstruction = `You are a helpful assistant for NASS LASU (Nigerian Association of Science Students, Lagos State University).
You help students with navigating the Digital Secretariat Hub, understanding associations, finding PDFs, or providing information about the SSRC.
Maintain a helpful, academic, yet approachable tone appropriate for university students. When asked about locations or places, provide accurate location info using Google Maps data.
${knowledgeContext ? `\nHere is additional knowledge base information you should use to answer user questions:\n${knowledgeContext}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: messages,
      config: {
        systemInstruction,
        tools: [{ googleMaps: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ text: response.text, groundingChunks }),
    };
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to generate response.' }),
    };
  }
};
