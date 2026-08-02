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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
