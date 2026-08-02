import 'server-only';
import nodemailer from 'nodemailer';

/**
 * SMTP mailer (nodemailer), mirrors the handyAds pattern. Configure SMTP_HOST /
 * SMTP_PORT / SMTP_USER / SMTP_PASS. When SMTP is not configured the send is a
 * safe no-op (logged), so contact still succeeds in local dev without a mail box.
 */
const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const FROM = (label: string) => `"${label}" <${process.env.SMTP_USER}>`;
const CONTACT_TO = process.env.CONTACT_TO ?? 'support@orchardads.in';

export async function sendContactEmail(input: { name: string; email: string; message: string }): Promise<void> {
  if (!transporter) {
    console.info('[contact:no-smtp]', { name: input.name, email: input.email });
    return;
  }
  const html = `
    <div style="font-family:sans-serif;font-size:14px;color:#1c1d33">
      <h2 style="margin:0 0 12px">New contact enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
    </div>`;
  await transporter.sendMail({
    from: FROM('OrchardAds'),
    to: CONTACT_TO,
    replyTo: input.email,
    subject: `OrchardAds enquiry from ${input.name}`,
    text: `${input.name} <${input.email}>\n\n${input.message}`,
    html,
  });
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.orchardads.in';

function shell(title: string, body: string): string {
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#17181f">
    <div style="font-size:18px;font-weight:700;margin-bottom:16px">OrchardAds</div>
    <h2 style="font-size:16px;margin:0 0 12px">${title}</h2>
    ${body}
    <p style="font-size:12px;color:#8a8f98;margin-top:24px">OrchardAds - TikTok Ads Optimization OS</p>
  </div>`;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  if (!transporter) {
    console.info('[otp:no-smtp]', { to, code });
    return;
  }
  await transporter.sendMail({
    from: FROM('OrchardAds'),
    to,
    subject: 'Your OrchardAds verification code',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: shell(
      'Verify your email',
      `<p style="font-size:14px">Enter this code to verify your email. It expires in 10 minutes.</p>
       <div style="font-size:30px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</div>`,
    ),
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  if (!transporter) {
    console.info('[reset:no-smtp]', { to, url });
    return;
  }
  await transporter.sendMail({
    from: FROM('OrchardAds'),
    to,
    subject: 'Reset your OrchardAds password',
    text: `Reset your password (expires in 1 hour): ${url}`,
    html: shell(
      'Reset your password',
      `<p style="font-size:14px">Click below to set a new password. The link expires in 1 hour.</p>
       <a href="${url}" style="display:inline-block;margin-top:12px;background:#1f9aa8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px">Reset password</a>`,
    ),
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
