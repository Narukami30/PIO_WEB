const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (process.env.EMAIL_HOST) {
    _transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      family: 4
    });
  } else {
    // Dev fallback: print OTP to console if no SMTP configured
    _transporter = {
      sendMail: async (opts) => {
        console.log('\n========================================');
        console.log('[MAILER DEV] No EMAIL_HOST configured');
        console.log(`  To:   ${opts.to}`);
        console.log(`  Code: ${opts.text.match(/\d{6}/)?.[0] || 'see body'}`);
        console.log('========================================\n');
        return { messageId: 'dev-fallback' };
      }
    };
  }
  return _transporter;
}

async function sendOtpEmail(toEmail, firstName, otpCode) {
  const appName = process.env.APP_NAME || 'LGU Naujan PIS';
  const from = process.env.EMAIL_FROM || `"${appName}" <no-reply@naujan.gov.ph>`;
  await getTransporter().sendMail({
    from,
    to: toEmail,
    subject: `Your Login Verification Code — ${appName}`,
    text: `Hello ${firstName},\n\nYour one-time login verification code is:\n\n  ${otpCode}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not attempt to log in, contact the system administrator immediately.\n\n— ${appName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:2rem;border:1px solid #e5e7eb;border-radius:8px;background:#fff;">
      <h2 style="color:#1a2332;margin-top:0;">Login Verification</h2>
      <p style="color:#555;">Hello <strong>${firstName}</strong>,</p>
      <p style="color:#555;">Enter this code to complete your login:</p>
      <div style="text-align:center;margin:2rem 0;">
        <span style="display:inline-block;font-size:2.5rem;font-weight:800;letter-spacing:0.5rem;color:#0f4c75;background:#f0f6ff;padding:1rem 2rem;border-radius:8px;">${otpCode}</span>
      </div>
      <p style="color:#888;font-size:0.85rem;"><strong>Expires in 10 minutes.</strong> Do not share this code.</p>
      <p style="color:#c00;font-size:0.85rem;">If you did not attempt to log in, contact the system administrator immediately.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;">
      <p style="color:#aaa;font-size:0.75rem;text-align:center;">${appName}</p>
    </div>`
  });
}

async function sendResetEmail(toEmail, firstName, resetUrl) {
  const appName = process.env.APP_NAME || 'LGU Naujan PIS';
  const from = process.env.EMAIL_FROM || `"${appName}" <no-reply@naujan.gov.ph>`;
  await getTransporter().sendMail({
    from,
    to: toEmail,
    subject: `Password Reset — ${appName}`,
    text: `Hello ${firstName},\n\nYou (or someone) requested a password reset.\n\nClick the link below within 30 minutes:\n\n  ${resetUrl}\n\nIf you did not request this, ignore this email.\n\n— ${appName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:2rem;border:1px solid #e5e7eb;border-radius:8px;background:#fff;">
      <h2 style="color:#1a2332;margin-top:0;">Password Reset</h2>
      <p style="color:#555;">Hello <strong>${firstName}</strong>,</p>
      <p style="color:#555;">Click the button below to reset your password:</p>
      <div style="text-align:center;margin:2rem 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#0f4c75;color:#fff;font-weight:700;padding:0.85rem 2.5rem;border-radius:8px;text-decoration:none;font-size:1rem;">Reset Password</a>
      </div>
      <p style="color:#888;font-size:0.85rem;">This link expires in <strong>30 minutes</strong>.</p>
      <p style="color:#888;font-size:0.85rem;">If you did not request this, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;">
      <p style="color:#aaa;font-size:0.75rem;text-align:center;">${appName}</p>
    </div>`
  });
}

module.exports = { sendOtpEmail, sendResetEmail };
