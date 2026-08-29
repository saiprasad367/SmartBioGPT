const nodemailer = require('nodemailer');
const logger = require('../logger');

const MAIL_ENABLED = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL || 'http://localhost:8080';
const MAIL_FROM = process.env.MAIL_FROM || 'Smart Bio GPT <no-reply@smartbiogpt.ai>';
const REPLY_TO = process.env.MAIL_REPLY_TO || process.env.SMTP_USER || undefined;
const SIGNATURE_NAME = process.env.MAIL_SIGNATURE_NAME || 'Saiprasad';
const SIGNATURE_TITLE = process.env.MAIL_SIGNATURE_TITLE || 'Creator, Smart Bio GPT';

let transporter = null;
if (MAIL_ENABLED) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true = 465/SMTPS, false = 587/STARTTLS
        requireTLS: process.env.SMTP_SECURE !== 'true',
        auth: {
            // Gmail app passwords are displayed with spaces for readability - strip them.
            user: process.env.SMTP_USER,
            pass: String(process.env.SMTP_PASS).replace(/\s+/g, ''),
        },
        pool: true,
        maxConnections: 2,
    });
    transporter.verify().then(
        () => logger.info({ host: process.env.SMTP_HOST }, 'SMTP transport ready'),
        (err) => logger.warn({ err: err.message }, 'SMTP transport verification failed')
    );
} else {
    logger.warn('Mail disabled (SMTP_* not configured) - welcome emails will be skipped.');
}

// ---- Apple-style palette -------------------------------------------------
const INK = '#1d1d1f'; // primary text
const SUBTLE = '#6e6e73'; // secondary text
const FAINT = '#86868b'; // footer text
const HAIRLINE = '#d2d2d7'; // borders
const CANVAS = '#f5f5f7'; // page background
const ACCENT = '#0071e3'; // Apple blue (buttons / links only)
const FONT =
    "-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display','Helvetica Neue',Helvetica,Arial,sans-serif";

function esc(s) {
    return String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
}

/**
 * Premium, Apple-style welcome email. Generous whitespace, one accent colour,
 * hairline rules, SF Pro type. The signature is set in a script face with a
 * graceful fallback to italic where the client blocks web/system script fonts.
 */
function welcomeTemplate(name) {
    const safeName = esc(String(name || 'there').replace(/[<>]/g, '').trim() || 'there');
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Welcome to Smart Bio GPT</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
  <style>
    .sbg-sign{font-family:'Dancing Script','Snell Roundhand','Segoe Script','Brush Script MT',cursive !important;font-style:normal !important;}
    a{color:${ACCENT};text-decoration:none;}
    @media (max-width:620px){
      .sbg-card{width:100% !important;border-radius:0 !important;border-left:0 !important;border-right:0 !important;}
      .sbg-pad{padding:36px 24px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${CANVAS};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-family:${FONT};color:${INK}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">
    Your Smart Bio GPT account is ready. Explore proteins and genes grounded in UniProt, PDB, AlphaFold, ChEMBL and STRING.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" class="sbg-card"
             style="width:560px;max-width:560px;background:#ffffff;border:1px solid ${HAIRLINE};border-radius:18px;overflow:hidden">

        <!-- wordmark -->
        <tr><td align="center" style="padding:26px 40px 22px;border-bottom:1px solid ${HAIRLINE}">
          <span style="font-size:15px;font-weight:600;letter-spacing:-0.01em;color:${INK}">Smart Bio GPT</span>
        </td></tr>

        <!-- body -->
        <tr><td class="sbg-pad" style="padding:48px 48px 40px">

          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;color:${INK}">
            Welcome, ${safeName}.
          </h1>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:${SUBTLE}">
            Your account is ready. Smart Bio GPT is a calm, conversational way to explore
            proteins and genes &mdash; every answer grounded in UniProt, RCSB&nbsp;PDB,
            AlphaFold, ChEMBL and STRING.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 34px">
            <tr><td style="padding:16px 0;border-top:1px solid ${HAIRLINE};font-size:15px;line-height:1.5;color:${INK}">
              <span style="color:${SUBTLE}">Search</span> &nbsp;any gene or protein for a normalized research dossier
            </td></tr>
            <tr><td style="padding:16px 0;border-top:1px solid ${HAIRLINE};font-size:15px;line-height:1.5;color:${INK}">
              <span style="color:${SUBTLE}">Ask</span> &nbsp;follow-up questions with the protein held in context
            </td></tr>
            <tr><td style="padding:16px 0;border-top:1px solid ${HAIRLINE};border-bottom:1px solid ${HAIRLINE};font-size:15px;line-height:1.5;color:${INK}">
              <span style="color:${SUBTLE}">Inspect</span> &nbsp;the 3D structure and save proteins to favorites
            </td></tr>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 30px">
            <tr><td align="center" bgcolor="${ACCENT}" style="border-radius:980px">
              <a href="${APP_PUBLIC_URL}/dashboard"
                 style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:400;color:#ffffff;letter-spacing:-0.01em">
                Open Smart Bio GPT
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;line-height:1.6;color:${FAINT};text-align:center">
            Try <span style="color:${SUBTLE}">TP53</span> or <span style="color:${SUBTLE}">BRCA1</span>, then ask what pathways it belongs to.
          </p>

          <!-- signature -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:40px 0 0">
            <tr><td style="padding:0 0 2px;font-size:14px;color:${SUBTLE}">Warmly,</td></tr>
            <tr><td class="sbg-sign"
                    style="font-family:'Snell Roundhand','Segoe Script','Brush Script MT',cursive;font-size:30px;line-height:1.1;color:${INK};padding:4px 0 8px">
              ${esc(SIGNATURE_NAME)}
            </td></tr>
            <tr><td style="font-size:13px;color:${FAINT}">
              ${esc(SIGNATURE_NAME)} &nbsp;&middot;&nbsp; ${esc(SIGNATURE_TITLE)}
            </td></tr>
          </table>

        </td></tr>

        <!-- footer -->
        <tr><td align="center" style="padding:24px 40px 30px;border-top:1px solid ${HAIRLINE};font-size:12px;line-height:1.6;color:${FAINT}">
          Sent to you because an account was created with this email address.<br>
          &copy; ${year} Smart Bio GPT
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function welcomeText(name) {
    const safeName = String(name || 'there').replace(/[<>]/g, '').trim() || 'there';
    return [
        `Welcome, ${safeName}.`,
        '',
        'Your Smart Bio GPT account is ready - a calm, conversational way to explore',
        'proteins and genes, with every answer grounded in UniProt, RCSB PDB,',
        'AlphaFold, ChEMBL and STRING.',
        '',
        '  -  Search any gene or protein for a normalized research dossier',
        '  -  Ask follow-up questions with the protein held in context',
        '  -  Inspect the 3D structure and save proteins to favorites',
        '',
        `Open Smart Bio GPT: ${APP_PUBLIC_URL}/dashboard`,
        '',
        'Try TP53 or BRCA1, then ask what pathways it belongs to.',
        '',
        'Warmly,',
        SIGNATURE_NAME,
        `${SIGNATURE_NAME} - ${SIGNATURE_TITLE}`,
        '',
        'Sent to you because an account was created with this email address.',
    ].join('\n');
}

/**
 * Send the welcome email to the address that just registered. `email` is the
 * end user's own address (whatever they signed up with) - never a fixed inbox.
 */
async function sendWelcomeEmail(email, name) {
    if (!transporter) return { sent: false, skipped: true, reason: 'mail_disabled' };
    try {
        const info = await transporter.sendMail({
            from: MAIL_FROM, // e.g. "Smart Bio GPT <chindamsaiprasad@gmail.com>"
            to: email, // the newly registered user
            replyTo: REPLY_TO,
            subject: 'Welcome to Smart Bio GPT',
            text: welcomeText(name),
            html: welcomeTemplate(name),
        });
        logger.info({ messageId: info.messageId, to: email }, 'welcome email sent');
        return { sent: true, messageId: info.messageId };
    } catch (err) {
        logger.error({ err: err.message, to: email }, 'failed to send welcome email');
        return { sent: false, error: err.message };
    }
}

module.exports = { sendWelcomeEmail, welcomeTemplate, welcomeText, MAIL_ENABLED };
