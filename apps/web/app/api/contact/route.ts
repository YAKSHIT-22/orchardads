import { rateLimit } from '@/lib/rate-limit';
import { sendContactEmail } from '@/lib/mailer';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return xff ? (xff.split(',')[0]?.trim() ?? 'unknown') : req.headers.get('x-real-ip') ?? 'unknown';
}

/** Contact form intake: validated, rate-limited, delivered over SMTP. */
export async function POST(req: Request) {
  // Abuse guard: 5 submissions / 10 min / IP (no-op when Redis absent).
  const ok = await rateLimit(`contact:${clientIp(req)}`, 5, 600);
  if (!ok) return Response.json({ error: 'Too many messages. Please try again shortly.' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Please fill in every field with a valid email.' }, { status: 400 });
  }
  try {
    await sendContactEmail(parsed.data);
  } catch {
    return Response.json({ error: 'Could not send right now. Email us at support@orchardads.in.' }, { status: 502 });
  }
  return Response.json({ ok: true });
}
