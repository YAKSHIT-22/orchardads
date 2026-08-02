'use client';

import { syncPlatform } from '@/lib/actions/sync';
import type { Platform } from '@adsos/core';
import { Button } from '@adsos/ui';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export function SyncButton({
  platform,
  variant = 'secondary',
}: {
  platform: Platform;
  variant?: 'primary' | 'secondary';
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function run() {
    start(async () => {
      setMsg(null);
      const res = await syncPlatform({ platform });
      const d = res?.data;
      if (res?.serverError) return setMsg(res.serverError);
      if (d && 'ok' in d && d.ok) {
        setMsg(`Synced ${d.campaigns} campaigns, ${d.adGroups} ad groups, ${d.facts} day-rows.`);
        router.refresh();
        return;
      }
      setMsg((d && 'error' in d && d.error) || 'Sync failed.');
    });
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="font-ui text-[11px] text-ink-muted">{msg}</span>}
      <Button variant={variant} size="sm" onClick={run} disabled={pending}>
        <RefreshCw className={pending ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
        {pending ? 'Syncing...' : 'Sync now'}
      </Button>
    </div>
  );
}
