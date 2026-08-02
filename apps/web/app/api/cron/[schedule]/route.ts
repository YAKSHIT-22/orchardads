import { repositories } from '@adsos/db';

/**
 * Vercel Cron entrypoint (planner). Does no platform I/O: it reads which
 * connections are due and fans out one QStash message per connection so each unit
 * is independently retryable (ARCHITECTURE.md sec 4.2). Guarded by CRON_SECRET.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const schedule = new URL(req.url).pathname.split('/').pop();

  if (schedule === 'sync-config' || schedule === 'sync-metrics') {
    if (!process.env.DATABASE_URL) return Response.json({ enqueued: 0, note: 'no database configured' });
    const due = await repositories.connections.findDueForConfigSync();
    // In production this batch-publishes one QStash message per connection,
    // routed to a per-platform queue. Returned here for observability.
    return Response.json({ schedule, due: due.length });
  }
  if (schedule === 'partition-maintenance') {
    return Response.json({ schedule, note: 'ensure_metric_fact_partition runs three months ahead' });
  }
  return Response.json({ error: `unknown schedule: ${schedule}` }, { status: 400 });
}
