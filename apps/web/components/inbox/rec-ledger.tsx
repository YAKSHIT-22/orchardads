'use client';

import { applyRecommendation } from '@/lib/actions/apply';
import type { LedgerRec } from '@/lib/data/ledger';
import { ActionLedger } from '@adsos/ui';
import Link from 'next/link';
import { useState, useTransition } from 'react';

/** Client wrapper: renders the presentational ledger and routes Apply through the
 *  real Action engine (policy -> execute -> audit). Advisory recs (e.g. tracking
 *  fixes) are not one-click applies - they link to the tool that resolves them. */
export function RecLedger(rec: LedgerRec & { density?: 'line' | 'card' | 'frozen' }) {
  const { applyInput, id, kind, tool, urgency, advisory, advisoryHref, density, ...ledger } = rec;
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<{ done: boolean; message?: string; ok?: boolean }>({ done: false });
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  function onApply() {
    startTransition(async () => {
      const res = await applyRecommendation(applyInput);
      const data = res?.data;
      if (res?.serverError) return setState({ done: true, ok: false, message: res.serverError });
      if (data && 'violations' in data && data.violations?.length) {
        return setState({ done: true, ok: false, message: data.violations[0]?.message });
      }
      if (data && 'ok' in data) {
        return setState({
          done: true,
          ok: data.ok,
          message: data.ok ? 'Applied. Recorded in the audit trail.' : data.error ?? 'Apply failed.',
        });
      }
      setState({ done: true, ok: false, message: 'Could not apply.' });
    });
  }

  // Advisory: render read-only with a route to the fixing tool, never a fake Apply.
  if (advisory) {
    return (
      <div className="flex flex-col gap-2">
        <ActionLedger {...ledger} density={density} onDismiss={() => setDismissed(true)} />
        {advisoryHref && (
          <Link
            href={advisoryHref}
            className="self-end font-ui text-[12px] text-iris hover:underline"
          >
            Fix in Tracking Doctor
          </Link>
        )}
      </div>
    );
  }

  return (
    <ActionLedger
      {...ledger}
      density={state.done && state.ok ? 'frozen' : density}
      apiResponse={state.message ?? ledger.apiResponse}
      onApply={pending || (state.done && state.ok) ? undefined : onApply}
      onDismiss={() => setDismissed(true)}
    />
  );
}
