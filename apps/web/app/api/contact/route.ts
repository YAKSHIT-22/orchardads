import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
});

/** Contact form intake. Validated server-side; wire to email/CRM in production. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Please fill in every field with a valid email.' }, { status: 400 });
  }
  // Production: forward to email (nodemailer) or a CRM/Slack webhook.
  console.info('[contact]', { name: parsed.data.name, email: parsed.data.email });
  return Response.json({ ok: true });
}
