const nodemailer = require('nodemailer');
const logger = require('../logger');

const MAIL_ENABLED = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL || 'http://localhost:8080';
const MAIL_FROM = process.env.MAIL_FROM || 'Smart Bio GPT <no-reply@smartbiogpt.ai>';

let transporter = null;
if (MAIL_ENABLED) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    transporter.verify().then(
        () => logger.info('SMTP transport ready'),
        (err) => logger.warn({ err: err.message }, 'SMTP transport verification failed')
    );
} else {
    logger.warn('Mail disabled (SMTP_* not configured) - welcome emails will be skipped.');
}

function welcomeTemplate(name) {
    const safeName = String(name || 'Researcher').replace(/[<>]/g, '');
    return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden">
        <tr><td style="background:#111;padding:36px 40px">
          <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em">Smart Bio GPT</span>
        </td></tr>
        <tr><td style="padding:40px">
          <h1 style="margin:0 0 12px;font-size:22px">Welcome, ${safeName}.</h1>
          <p style="margin:0 0 16px;line-height:1.6;color:#3f3f46">
            Your account is ready. Smart Bio GPT gives you a conversational way to explore
            proteins and genes — grounded in UniProt, RCSB PDB, AlphaFold, ChEMBL and STRING.
          </p>
          <ul style="margin:0 0 24px;padding-left:20px;line-height:1.8;color:#3f3f46">
            <li>Search any gene or protein for a normalized research dossier</li>
            <li>Ask follow-up questions with the protein held in context</li>
            <li>Inspect the 3D structure and save proteins to favorites</li>
          </ul>
          <a href="${APP_PUBLIC_URL}/dashboard"
             style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">
            Open the dashboard
          </a>
        </td></tr>
        <tr><td style="padding:20px 40px;background:#fafafa;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:12px">
          © ${new Date().getFullYear()} Smart Bio GPT
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendWelcomeEmail(email, name) {
    if (!transporter) return { sent: false, skipped: true, reason: 'mail_disabled' };
    try {
        const info = await transporter.sendMail({
            from: MAIL_FROM,
            to: email,
            subject: 'Welcome to Smart Bio GPT',
            html: welcomeTemplate(name),
        });
        logger.info({ messageId: info.messageId, to: email }, 'welcome email sent');
        return { sent: true, messageId: info.messageId };
    } catch (err) {
        logger.error({ err: err.message, to: email }, 'failed to send welcome email');
        return { sent: false, error: err.message };
    }
}

module.exports = { sendWelcomeEmail, MAIL_ENABLED };
