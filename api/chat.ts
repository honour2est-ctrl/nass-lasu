// ============================================================================
// api/chat.ts  -  Vercel serverless function for the Nass AI chatbot
// ----------------------------------------------------------------------------
// The Gemini key lives ONLY here, as the Vercel environment variable
// GEMINI_API_KEY. The browser never sees it. Optional settings:
//   GEMINI_MODEL     e.g. gemini-3.8-flash (change without touching code)
//   ALLOWED_ORIGINS  comma-separated site addresses allowed to call this,
//                    e.g. https://yoursite.com,https://www.yoursite.com
// ============================================================================

const SYSTEM_INSTRUCTION =
    "You are the official NASS-LASU Secretariat Assistant, an intelligent digital representative for the Nigerian Association of Science Students, Lagos State University Chapter. " +
    "Use the official knowledge base extracted from the NASS-LASU Constitution (2023 As Amended) and SSRC Standing Orders: " +
    "1. Association Name: Nigerian Association of Science Students - Lagos State University Chapter (NASS-LASU). Motto: 'Toward Scientific Advancement'. " +
    "2. Membership: All duly matriculated full-time undergraduate students of the Faculty of Science who pay their association dues. " +
    "3. Executive Council (SSEC): Comprises President, Vice President, General Secretary, Welfare Director, PRO, Social Director, Financial Secretary, Treasurer, Sport Director, and Assistant General Secretary. Executives must have a CGPA >= 3.00. " +
    "4. Legislative Council (SSRC): 5 members per department. Functionaries include Speaker, Deputy Speaker, Clerk, Chief Whip, Under Secretary, and Sergeant-at-Arms. " +
    "5. Finances & Sharing Formula: Central Account sharing formula is SSEC (64%), SSRC (35%), and Auditor General (1%).";

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const MAX_MESSAGES = 12;     // only the most recent turns are sent to Gemini
const MAX_CHARS = 1000;      // per message
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30; // per visitor, best-effort (resets if the server restarts)

const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory small
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only your own website may call this endpoint (when ALLOWED_ORIGINS is set)
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const origin = String(req.headers?.origin || '').replace(/\/$/, '');
  if (allowed.length > 0 && !allowed.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'Chat is not configured yet.' });
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many questions. Please wait a few minutes and try again.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const raw = Array.isArray(body?.messages) ? body.messages : null;
  if (!raw) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const turns = raw
    .slice(-MAX_MESSAGES)
    .map((m: any) => ({
      role: m?.role === 'model' ? 'model' : 'user',
      text: String(m?.parts?.[0]?.text ?? m?.text ?? '').slice(0, MAX_CHARS),
    }))
    .filter((m: { text: string }) => m.text.trim().length > 0);

  // Gemini expects the conversation to start with the visitor, not the greeting
  while (turns.length > 0 && turns[0].role === 'model') turns.shift();

  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: turns.map((t: { role: string; text: string }) => ({ role: t.role, parts: [{ text: t.text }] })),
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          generationConfig: { maxOutputTokens: 1024 },
        }),
      }
    );

    const data: any = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      console.error('Gemini error', upstream.status, data?.error?.message);
      return res.status(502).json({ error: 'The assistant is unavailable right now.' });
    }

    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p: any) => p?.text || '')
      .join('')
      .trim();
    if (!text) {
      return res.status(502).json({ error: 'The assistant could not answer that. Please rephrase.' });
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error('Chat function failed', err);
    return res.status(502).json({ error: 'The assistant is unavailable right now.' });
  }
}
