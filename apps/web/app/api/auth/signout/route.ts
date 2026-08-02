import { clearSession } from '@/lib/session';

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.orchardads.in';

/** Sign out and return to the sign-in page. */
export async function GET() {
  await clearSession();
  return Response.redirect(`${APP}/signin`);
}
