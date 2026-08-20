import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

// Ensure required environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;

// Create GenAI client
const ai = geminiApiKey ? new GoogleGenAI({ 
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Handle Chat with Gemini API
  app.post("/api/chat", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
      }

      const { messages, knowledgeContext } = req.body;
      
      const systemInstruction = `You are a helpful assistant for NASS LASU (Nigerian Association of Science Students, Lagos State University). 
You help students with navigating the Digital Secretariat Hub, understanding associations, finding PDFs, or providing information about the SSRC. 
Maintain a helpful, academic, yet approachable tone appropriate for university students. When asked about locations or places, provide accurate location info using Google Maps data.
${knowledgeContext ? `\nHere is additional knowledge base information you should use to answer user questions:\n${knowledgeContext}` : ''}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: messages,
        config: {
          systemInstruction,
          tools: [{ googleMaps: {} }],
        }
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      res.json({ text: response.text, groundingChunks });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
