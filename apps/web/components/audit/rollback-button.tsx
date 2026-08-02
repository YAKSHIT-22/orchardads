'use client';

import { rollbackAction } from '@/lib/actions/rollback';
import { Button } from '@adsos/ui';
import { Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

/** Disabled-with-reason when not reversible (DESIGN_SYSTEM sec 7). */
export function RollbackButton({ actionId, reversible }: { actionId: string; reversible: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  if (!reversible) {
    return (
      <span className="font-ui text-[11px] text-ink-faint" title="No captured previous state to restore">
        not reversible
      </span>
    );
  }

  function run() {
    start(async () => {
      const res = await rollbackAction({ actionId });
      const d = res?.data;
      if (res?.serverError) return setMsg(res.serverError);
      if (d?.ok) {
        router.refresh();
        return;
      }
      setMsg(d?.error ?? 'Rollback failed.');
    });
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="font-ui text-[11px] text-risk">{msg}</span>}
      <Button variant="ghost" size="sm" onClick={run} disabled={pending}>
        <Undo2 className="h-3.5 w-3.5" />
        {pending ? 'Rolling back...' : 'Roll back'}
      </Button>
    </div>
  );
}
