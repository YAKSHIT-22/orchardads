'use client';

import { createEntity, validateDraft } from '@/lib/actions/entity';
import { Button, InsightBanner } from '@adsos/ui';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

type Violation = { field: string; because: string };

/**
 * Live combination-rule validation + real create for Campaign Studio. Validates
 * the campaign-level draft against TikTok's conditional rules on every change
 * (invalid combinations are blocked before submit), then creates through the
 * HIGH-risk action pipeline. No connected account -> a clear connect prompt.
 */
export function StudioSubmit({ campaignDraft }: { campaignDraft: Record<string, unknown> }) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [checking, setChecking] = useState(false);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();

  // Re-validate whenever the campaign draft changes (debounced).
  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    const id = setTimeout(async () => {
      const res = await validateDraft({ entityType: 'CAMPAIGN', draft: campaignDraft });
      if (cancelled) return;
      setViolations(res?.data?.violations ?? []);
      setChecking(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [campaignDraft]);

  const valid = violations.length === 0;

  function onCreate() {
    start(async () => {
      setResult(null);
      const res = await createEntity({ entityType: 'CAMPAIGN', draft: campaignDraft });
      const d = res?.data;
      if (res?.serverError) return setResult({ ok: false, message: res.serverError });
      if (d && 'violations' in d && d.violations?.length) {
        return setResult({ ok: false, message: d.violations[0]?.because ?? 'Blocked by validation.' });
      }
      if (d && 'ok' in d) {
        setResult({ ok: d.ok, message: d.ok ? 'Campaign created and recorded in the audit trail.' : (('error' in d && d.error) || 'Create failed.') as string });
        if (d.ok) router.refresh();
        return;
      }
      setResult({ ok: false, message: 'Could not create.' });
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {!valid && (
        <div className="flex flex-col gap-1.5">
          {violations.map((v) => (
            <InsightBanner key={v.field} tone="risk" icon={AlertTriangle}>
              <span className="font-medium">{v.field}:</span> {v.because}
            </InsightBanner>
          ))}
        </div>
      )}
      {valid && !result && (
        <InsightBanner tone="positive" icon={Check}>
          All field combinations are valid for this objective. This is a HIGH-risk action - it
          creates new spend and needs approval.
        </InsightBanner>
      )}
      {result && (
        <InsightBanner tone={result.ok ? 'positive' : 'risk'} icon={result.ok ? Check : AlertTriangle}>
          {result.message}
        </InsightBanner>
      )}
      <div className="flex items-center gap-2">
        <Button onClick={onCreate} disabled={!valid || pending || checking}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {pending ? 'Creating...' : 'Create campaign'}
        </Button>
        {checking && <span className="font-ui text-[11px] text-ink-faint">validating combination...</span>}
      </div>
    </div>
  );
}
