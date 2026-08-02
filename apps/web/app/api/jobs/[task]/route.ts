export const dynamic = 'force-dynamic';

/**
 * QStash job consumer. Every async unit is an HTTP endpoint QStash calls with a
 * verified signature (ARCHITECTURE.md sec 4.3) - an unverified job endpoint is an
 * unauthenticated write endpoint. The verifier is constructed per-request so the
 * signing keys are read at runtime, not at build time.
 *
 * Tasks: sync-config | sync-metrics | analyze | apply-action.
 */
async function handler(req: Request) {
  const task = new URL(req.url).pathname.split('/').pop();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  switch (task) {
    case 'sync-config':
    case 'sync-metrics':
    case 'analyze':
      return Response.json({ ok: true, task, connectionId: body.connectionId ?? null });
    case 'apply-action':
      return Response.json({ ok: true, task, actionId: body.actionId ?? null });
    default:
      return Response.json({ ok: false, error: `Unknown task: ${task}` }, { status: 400 });
  }
}

export async function POST(req: Request) {
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY) {
    return Response.json({ error: 'QStash is not configured.' }, { status: 503 });
  }
  const { verifySignatureAppRouter } = await import('@upstash/qstash/nextjs');
  const verified = verifySignatureAppRouter(handler);
  return verified(req as never);
}
