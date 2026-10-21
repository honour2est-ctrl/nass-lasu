// ============================================================================
// api/emergency.ts  -  Vercel serverless function: instant emergency alerts
// ----------------------------------------------------------------------------
// Called by the website after a student sends an emergency alert. It forwards
// the details to the admins by EMAIL (Resend) and/or TELEGRAM. Set up at least
// one channel in Vercel -> Settings -> Environment Variables:
//
//   EMAIL (Resend):
//     RESEND_API_KEY     your key from resend.com
//     ALERT_EMAIL_TO     who receives alerts, comma-separated
//     ALERT_EMAIL_FROM   optional, default "NASS LASU Alerts <onboarding@resend.dev>"
//
//   TELEGRAM (instant phone notification for a whole group):
//     TELEGRAM_BOT_TOKEN   from @BotFather
//     TELEGRAM_CHAT_ID     the group/chat that should receive alerts
//
//   BOTH:
//     ALLOWED_ORIGINS    your site addresses (same setting the chatbot uses)
// ============================================================================

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 5;          // alerts per visitor per 10 minutes
const MAX_PER_HOUR = 40;       // alerts per hour, everyone combined (best-effort)

const ipHits = new Map<string, number[]>();
let hourly: number[] = [];

const clean = (value: unknown, max: number): string =>
  String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function tooManyFrom(ip: string): boolean {
  const now = Date.now();
  const recent = (ipHits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  ipHits.set(ip, recent);
  if (ipHits.size > 5000) ipHits.clear();
  return recent.length > MAX_PER_IP;
}

function tooManyOverall(): boolean {
  const now = Date.now();
  hourly = hourly.filter((t) => now - t < 60 * 60 * 1000);
  hourly.push(now);
  return hourly.length > MAX_PER_HOUR;
}

interface Report {
  studentName: string;
  department: string;
  matricNo: string;
  phone: string;
  location: string;
  emergencyType: string;
  urgency: string;
  description: string;
  reportId: string;
  when: string;
}

async function sendEmail(report: Report, siteUrl: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = (process.env.ALERT_EMAIL_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!key || to.length === 0) throw new Error('email not configured');

  const from = process.env.ALERT_EMAIL_FROM || 'NASS LASU Alerts <onboarding@resend.dev>';
  const subject = `EMERGENCY ALERT (${report.urgency}): ${report.emergencyType} at ${report.location}`;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 12px;color:#64748b;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 12px;font-weight:600">${escapeHtml(value) || '-'}</td></tr>`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;border:2px solid #dc2626;border-radius:12px;overflow:hidden">
      <div style="background:#dc2626;color:#fff;padding:14px 18px;font-size:18px;font-weight:700">NASS LASU EMERGENCY ALERT</div>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${row('Type', report.emergencyType)}
        ${row('Urgency', report.urgency)}
        ${row('Location', report.location)}
        ${row('Details', report.description)}
        ${row('Phone', report.phone)}
        ${row('Name', report.studentName)}
        ${row('Department', report.department)}
        ${row('Matric No.', report.matricNo)}
        ${row('Received', report.when)}
        ${row('Report ID', report.reportId || 'not saved (see details above)')}
      </table>
      <div style="padding:14px 18px;font-size:13px;color:#475569">
        Call the student on <b>${escapeHtml(report.phone)}</b> now.
        ${siteUrl ? `Full record: Admin Panel on <a href="${escapeHtml(siteUrl)}">${escapeHtml(siteUrl)}</a> (Emergency Reports tab).` : ''}
      </div>
    </div>`;

  const text = [
    'NASS LASU EMERGENCY ALERT',
    `Type: ${report.emergencyType}`, `Urgency: ${report.urgency}`, `Location: ${report.location}`,
    `Details: ${report.description}`, `Phone: ${report.phone}`, `Name: ${report.studentName || '-'}`,
    `Department: ${report.department || '-'}`, `Matric: ${report.matricNo || '-'}`,
    `Received: ${report.when}`, `Report ID: ${report.reportId || 'not saved'}`,
  ].join('\n');

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`resend ${resp.status} ${body.slice(0, 200)}`);
  }
}

async function sendTelegram(report: Report): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('telegram not configured');

  const text = [
    '🚨 NASS LASU EMERGENCY ALERT',
    `Type: ${report.emergencyType} (${report.urgency})`,
    `Location: ${report.location}`,
    `Details: ${report.description}`,
    `Phone: ${report.phone}`,
    `Name: ${report.studentName || '-'}`,
    `Department: ${report.department || '-'}`,
    `Matric: ${report.matricNo || '-'}`,
    `Received: ${report.when}`,
    `Report ID: ${report.reportId || 'not saved'}`,
  ].join('\n');

  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`telegram ${resp.status} ${body.slice(0, 200)}`);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only your own website may call this (when ALLOWED_ORIGINS is set)
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const origin = String(req.headers?.origin || '').replace(/\/$/, '');
  if (allowed.length > 0 && !allowed.includes(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (tooManyFrom(ip) || tooManyOverall()) {
    return res.status(429).json({ error: 'Too many alerts. Please call the hotline numbers directly.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const report: Report = {
    studentName: clean(body.studentName, 200),
    department: clean(body.department, 200),
    matricNo: clean(body.matricNo, 50),
    phone: clean(body.phone, 30),
    location: clean(body.location, 300),
    emergencyType: clean(body.emergencyType, 100) || 'Emergency',
    urgency: clean(body.urgency, 50) || 'High',
    description: clean(body.description, 2000),
    reportId: clean(body.reportId, 60),
    when: new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' }) + ' (Lagos time)',
  };

  if (!report.phone || !report.location || !report.description) {
    return res.status(400).json({ error: 'Phone, location and details are required' });
  }

  const emailOn = !!(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO);
  const telegramOn = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  if (!emailOn && !telegramOn) {
    console.error('Emergency alerts: no channel configured (set Resend and/or Telegram variables)');
    return res.status(500).json({ error: 'Alerts are not configured yet.' });
  }

  const siteUrl = allowed[0] || '';
  const jobs: Promise<void>[] = [];
  if (emailOn) jobs.push(sendEmail(report, siteUrl));
  if (telegramOn) jobs.push(sendTelegram(report));

  const results = await Promise.allSettled(jobs);
  results.forEach((r) => {
    if (r.status === 'rejected') console.error('Emergency alert channel failed:', String(r.reason?.message || r.reason));
  });

  const delivered = results.filter((r) => r.status === 'fulfilled').length;
  if (delivered === 0) {
    return res.status(502).json({ error: 'Could not deliver the alert.' });
  }
  return res.status(200).json({ ok: true, delivered });
}
