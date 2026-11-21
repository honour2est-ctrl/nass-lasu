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

// Models are tried in this order. If one is retired, busy or out of quota, the next one answers,
// so the chatbot keeps working without you doing anything. To use your own order, set GEMINI_MODEL in Vercel
// to a comma-separated list, for example: gemini-3.8-flash,gemini-3.6-flash
const MODELS = (process.env.GEMINI_MODEL || 'gemini-3.6-flash,gemini-3.8-flash,gemini-3.5-flash-lite')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
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
    return res.status(405).json({ error: 'Method not allowed', code: 'method' });
  }

  // Only your own website may call this endpoint (when ALLOWED_ORIGINS is set)
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const origin = String(req.headers?.origin || '').replace(/\/$/, '');
  if (allowed.length > 0 && !allowed.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden', code: 'origin' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'Chat is not configured yet.', code: 'not_configured' });
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many questions. Please wait a few minutes and try again.', code: 'rate_limited' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const raw = Array.isArray(body?.messages) ? body.messages : null;
  if (!raw) {
    return res.status(400).json({ error: 'Invalid request', code: 'bad_request' });
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
    return res.status(400).json({ error: 'Invalid request', code: 'bad_request' });
  }

  const budgetMs = Number(process.env.CHAT_BUDGET_MS) || 25000; // never wait forever for an answer
  const started = Date.now();
  let lastCode = 'unavailable';

  for (const model of MODELS) {
    const remaining = budgetMs - (Date.now() - started);
    if (remaining < 1500) { lastCode = 'timeout'; break; }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    try {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: turns.map((t: { role: string; text: string }) => ({ role: t.role, parts: [{ text: t.text }] })),
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            // generous, because "thinking" models spend part of this budget before they write the answer
            generationConfig: { maxOutputTokens: 2048 },
          }),
          signal: controller.signal,
        }
      );

      const data: any = await upstream.json().catch(() => null);
      if (!upstream.ok) {
        const message = String(data?.error?.message || '');
        console.error(`Gemini error [${model}]`, upstream.status, message.slice(0, 300));
        // A bad or blocked key will fail on every model, so stop straight away
        if (upstream.status === 401 || upstream.status === 403 || /api key/i.test(message)) { lastCode = 'key_problem'; break; }
        lastCode = upstream.status === 429 ? 'busy' : 'model_unavailable';
        continue; // retired, busy or out of quota: try the next model
      }

      const candidate = data?.candidates?.[0];
      const text = (candidate?.content?.parts || [])
        .map((p: any) => p?.text || '')
        .join('')
        .trim();
      if (text) return res.status(200).json({ text, model });

      if (data?.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY') {
        return res.status(422).json({ error: 'The assistant cannot help with that one.', code: 'blocked' });
      }
      console.error(`Gemini returned no text [${model}]`, candidate?.finishReason);
      lastCode = 'empty';
    } catch (err: any) {
      if (err?.name === 'AbortError') { console.error(`Gemini timed out [${model}]`); lastCode = 'timeout'; break; }
      console.error(`Chat request failed [${model}]`, String(err?.message || err));
      lastCode = 'unavailable';
    } finally {
      clearTimeout(timer);
    }
  }

  return res.status(502).json({ error: 'The assistant is unavailable right now.', code: lastCode });
}
