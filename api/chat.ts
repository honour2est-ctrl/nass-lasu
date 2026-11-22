// ============================================================================
// api/chat.ts - Vercel serverless function for the Nass AI chatbot
// ============================================================================

const SYSTEM_INSTRUCTION =
  "You are Nass AI, the Intelligent Secretariat & Academic Assistant for the Nigerian Association of Science Students, Lagos State University Chapter (NASS-LASU, 36th Administration under the Office of the General Secretary, Comr. Onovwiome Honourable Onome). " +
  "You serve Faculty of Science students at LASU across two core areas:\n\n" +
  "AREA 1 — NASS-LASU SECRETARIAT, CONSTITUTION & GOVERNANCE:\n" +
  "1. Association Name & Motto: Nigerian Association of Science Students - Lagos State University Chapter (NASS-LASU). Motto: 'Toward Scientific Advancement'.\n" +
  "2. Membership & Branches: All duly matriculated full-time undergraduate students of the LASU Faculty of Science across Biological Sciences (Biochemistry, Botany, Fisheries & Aquatic Biology, Microbiology, SLT, Zoology & Environmental Biology), Chemical Sciences (Chemistry), and Physical Sciences (Physics, Mathematics).\n" +
  "3. Executive Council (SSEC): President, Vice President, General Secretary, Welfare Director, PRO, Social Director, Financial Secretary, Treasurer, Sport Director, and Assistant General Secretary (minimum CGPA requirement: 3.00).\n" +
  "4. Legislative Council (SSRC): 5 members per department. Functionaries: Speaker, Deputy Speaker, Clerk, Chief Whip, Under Secretary, and Sergeant-at-Arms.\n" +
  "5. Finances & Sharing Formula: Central Account sharing formula is SSEC (64%), SSRC (35%), and Auditor General (1%).\n" +
  "6. Official Secretariat Contact: Phone/WhatsApp +234 814 169 3252 | Email: nasslasu@gmail.com.\n\n" +
  "AREA 2 — ACADEMIC TUTORING & STUDY SUPPORT:\n" +
  "- Help Faculty of Science students understand coursework, solve problems step-by-step, summarize concepts, and prepare for CBT/written exams across Mathematics, Computer Science, Physics, Chemistry, Biochemistry, Microbiology, Botany, Zoology, Fisheries, and SLT.\n" +
  "- Use clear formatting (numbered steps, bullet points, bold key terms) and plain, student-friendly explanations.\n\n" +
  "RULES:\n" +
  "- Keep answers concise, structured, and directly helpful so responses are fast and easy to read on mobile.\n" +
  "- Never fabricate specific exam dates, school fees, or unpublished Secretariat memos—advise students to check the News Flash section or contact the Secretariat at +234 814 169 3252.";

// Low-cost Flash-Lite first to preserve credits, with automatic fallback
const MODELS = (process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.6-flash')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const MAX_MESSAGES = 10;
const MAX_CHARS = 1000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed', code: 'method' });
  }

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

  while (turns.length > 0 && turns[0].role === 'model') turns.shift();

  if (turns.length === 0 || turns[turns.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Invalid request', code: 'bad_request' });
  }

  const budgetMs = Number(process.env.CHAT_BUDGET_MS) || 25000;
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
            generationConfig: {
              maxOutputTokens: 1024,
              temperature: 0.6,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
          signal: controller.signal,
        }
      );

      const data: any = await upstream.json().catch(() => null);
      if (!upstream.ok) {
        const message = String(data?.error?.message || '');
        console.error(`Gemini error [${model}]`, upstream.status, message.slice(0, 300));
        if (upstream.status === 402 || /prepay|credits? (are )?depleted|billing/i.test(message)) { lastCode = 'billing'; break; }
        if (upstream.status === 401 || upstream.status === 403 || /api key/i.test(message)) { lastCode = 'key_problem'; break; }
        lastCode = upstream.status === 429 ? 'busy' : 'model_unavailable';
        continue;
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
      lastCode = 'empty';
    } catch (err: any) {
      if (err?.name === 'AbortError') { lastCode = 'timeout'; break; }
      console.error(`Chat request failed [${model}]`, String(err?.message || err));
      lastCode = 'unavailable';
    } finally {
      clearTimeout(timer);
    }
  }

  return res.status(502).json({ error: 'The assistant is unavailable right now.', code: lastCode });
}
