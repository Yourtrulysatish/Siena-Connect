/**
 * /api/send-welcome   POST
 * Sends a welcome email via Resend after a user completes their profile.
 * Body: { email, firstName, university, nationality }
 */
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { email, firstName, university, nationality } = req.body || {};
  if (!email || !firstName) return res.status(400).json({ error: 'Missing email or firstName' });

  if (!process.env.RESEND_API_KEY) {
    // Resend not configured — skip silently so it doesn't break signup
    return res.json({ ok: true, skipped: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF6EF;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:560px;margin:2rem auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(26,18,8,.08)">

    <!-- Header -->
    <div style="background:#C4623A;padding:2rem 2.5rem">
      <div style="font-family:Georgia,serif;font-size:1.5rem;color:#F5EFE4;font-weight:400">Siena Connect</div>
      <div style="font-size:.8rem;color:rgba(245,239,228,.7);margin-top:.25rem">The home for international students in Siena</div>
    </div>

    <!-- Body -->
    <div style="padding:2.5rem">
      <h1 style="font-family:Georgia,serif;font-size:1.9rem;font-weight:400;color:#1A1208;margin:0 0 .5rem">
        Welcome, ${firstName}! 🌟
      </h1>
      <p style="color:#7A6A52;font-size:.95rem;line-height:1.75;margin:0 0 1.5rem">
        You've joined thousands of international students who used Siena Connect to settle in Italy faster.
        ${university ? `We've got your guide set up for <strong style="color:#1A1208">${university}</strong>.` : ''}
      </p>

      <!-- Steps card -->
      <div style="background:#FAF6EF;border-radius:14px;padding:1.5rem;margin-bottom:1.5rem">
        <div style="font-size:.8rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#C4623A;margin-bottom:1rem">Your first 4 steps</div>
        ${[
          ['🔢', 'Get your Codice Fiscale', 'Day 1 — Agenzia delle Entrate, free, on the spot'],
          ['🏠', 'Check the Housing Board', 'Rooms posted by students, no agency fees'],
          ['💬', 'Join the WhatsApp group', 'Connect with students arriving the same time as you'],
          ['📋', 'Open your 30-day checklist', 'Personalised tasks in the right order for your situation'],
        ].map(([icon, title, sub]) => `
        <div style="display:flex;gap:.9rem;padding:.7rem 0;border-bottom:1px solid rgba(196,98,58,.08)">
          <span style="font-size:1.3rem;flex-shrink:0">${icon}</span>
          <div>
            <div style="font-size:.88rem;font-weight:500;color:#1A1208">${title}</div>
            <div style="font-size:.77rem;color:#7A6A52;margin-top:.15rem">${sub}</div>
          </div>
        </div>`).join('')}
      </div>

      <a href="https://siena-connect.vercel.app"
         style="display:inline-block;background:#C4623A;color:#F5EFE4;padding:.85rem 2rem;border-radius:100px;text-decoration:none;font-size:.9rem;font-weight:500">
        Open your guide →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#1A1208;padding:1.5rem 2.5rem;text-align:center">
      <p style="font-size:.72rem;color:#8A7A66;margin:0">
        © 2026 Siena Connect · Built by three international students · Siena, Italy<br>
        <a href="https://siena-connect.vercel.app" style="color:#C4623A;text-decoration:none">siena-connect.vercel.app</a>
        &nbsp;·&nbsp;
        <a href="mailto:hello@sienaconnect.com" style="color:#8A7A66;text-decoration:none">hello@sienaconnect.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  // Use verified custom domain if set, otherwise fall back to Resend's shared sender
  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Siena Connect <onboarding@resend.dev>';

  try {
    await resend.emails.send({
      from:    fromAddress,
      to:      email,
      subject: `Welcome to Siena Connect, ${firstName}! 🌟`,
      html,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[send-welcome] Resend error:', err.message);
    // Don't fail the signup flow — email is non-critical
    res.json({ ok: false, error: err.message });
  }
}
