'use client';

import { connectWithToken } from '@/lib/actions/connect-token';
import { Button } from '@adsos/ui';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const field =
  'h-[38px] rounded-md border border-rule bg-paper px-3 font-ui text-sm text-ink outline-none focus:border-iris';

/** Sandbox / manual token connect - skips OAuth entirely. */
export function TokenConnect() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const f = new FormData(e.currentTarget);
    start(async () => {
      const res = await connectWithToken({
        accessToken: String(f.get('accessToken') ?? ''),
        advertiserId: String(f.get('advertiserId') ?? ''),
        advertiserName: String(f.get('advertiserName') ?? '') || undefined,
        currency: String(f.get('currency') ?? '') || undefined,
      });
      if (res?.serverError || res?.validationErrors) return setErr('Check the token and advertiser id.');
      if (res?.data?.ok) {
        router.push('/onboarding?connected=tiktok');
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="font-ui text-[12px] text-iris hover:underline">
        Have a sandbox access token? Connect it directly
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-md border border-rule bg-paper-sunk p-4">
      <span className="text-label text-ink-muted">Sandbox token connect</span>
      <p className="font-ui text-[11px] text-ink-faint">
        From the TikTok for Business developer portal: your app - Sandbox - copy the Access Token and the
        sandbox Advertiser ID. No OAuth, https, or public URLs needed.
      </p>
      <input name="accessToken" required placeholder="Access token" className={field} />
      <div className="grid grid-cols-2 gap-2">
        <input name="advertiserId" required placeholder="Advertiser ID" className={field} />
        <input name="currency" placeholder="Currency (e.g. USD)" className={field} />
      </div>
      <input name="advertiserName" placeholder="Advertiser name (optional)" className={field} />
      {err && <span className="font-ui text-[12px] text-risk">{err}</span>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Connecting...' : 'Connect sandbox'}
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="font-ui text-[12px] text-ink-faint hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
