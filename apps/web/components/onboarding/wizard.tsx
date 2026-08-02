'use client';

import { Logo } from '@/components/brand/logo';
import { listPlatformAccounts, saveSelectedAccounts } from '@/lib/actions/onboarding';
import { ONBOARDING_LIST, type PlatformOnboarding } from '@/lib/onboarding';
import { TokenConnect } from './token-connect';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  platformLabel,
} from '@adsos/ui';
import { ArrowRight, BellRing, Check, ChevronLeft, Database, ListChecks, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Account = { externalId: string; name: string; currency: string; timezone: string };
type Stage = 'choose' | 'connect' | 'accounts' | 'ramp';
const STEPS = ['Connect', 'Select accounts', 'First value'];

function title(p: PlatformOnboarding) {
  return platformLabel(p.platform);
}

function Progress({ active }: { active: number }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-data text-[11px] font-medium transition-colors',
                i < active
                  ? 'bg-applied text-white'
                  : i === active
                    ? 'bg-iris text-white'
                    : 'bg-paper-sunk text-ink-faint',
              )}
            >
              {i < active ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden font-ui text-[12px] font-medium sm:inline',
                i === active ? 'text-ink' : 'text-ink-faint',
              )}
            >
              {s}
            </span>
          </div>
          {i < STEPS.length - 1 && <span className="h-px w-8 bg-rule sm:w-12" />}
        </li>
      ))}
    </ol>
  );
}

function Shell({ active, children }: { active: number; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <Logo width={128} className="h-7 w-auto" />
        <Link href="/dashboard" className="font-ui text-[12px] text-ink-faint hover:text-ink">
          Skip for now
        </Link>
      </div>
      {active >= 0 && <Progress active={active} />}
      {children}
    </div>
  );
}

export function OnboardingWizard({
  initialConnected,
  initialError = null,
}: {
  initialConnected: string | null;
  initialError?: string | null;
}) {
  const resumed = initialConnected
    ? ONBOARDING_LIST.find((p) => p.platform.toLowerCase() === initialConnected.toLowerCase()) ?? null
    : null;

  const [stage, setStage] = useState<Stage>(resumed ? 'accounts' : 'choose');
  const [selected, setSelected] = useState<PlatformOnboarding | null>(resumed);

  const pick = (p: PlatformOnboarding) => { setSelected(p); setStage('connect'); };
  if (stage === 'choose' || !selected) return <ChoosePlatform onPick={pick} error={initialError} />;

  if (stage === 'connect') {
    return <ConnectStep platform={selected} onBack={() => setStage('choose')} />;
  }
  if (stage === 'accounts') {
    return <SelectAccounts platform={selected} onDone={() => setStage('ramp')} />;
  }
  return <RampStep platform={selected} onAnother={() => { setSelected(null); setStage('choose'); }} />;
}

/* Step 0: choose */
function ChoosePlatform({ onPick, error }: { onPick: (p: PlatformOnboarding) => void; error?: string | null }) {
  return (
    <Shell active={-1}>
      <section className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-display text-[28px] text-ink">Connect your first platform</h1>
          <p className="max-w-md font-ui text-[14px] leading-6 text-ink-muted">
            Connect your TikTok For Business account to start optimizing. A sandbox app lets you
            build and test the full flow without waiting on approval.
          </p>
        </div>
        {error && (
          <div className="rounded-md border border-risk/40 bg-risk-wash px-4 py-3 text-center font-ui text-[12px] text-risk">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ONBOARDING_LIST.map((p) => (
            <button type="button" key={p.platform} onClick={() => onPick(p)} className="text-left">
              <Card platform={p.platform} interactive className="h-full cursor-pointer">
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-ui text-sm font-semibold text-ink">{title(p)}</span>
                    <span className={cn('rounded-sm px-1.5 py-0.5 text-label', p.connectable ? 'bg-applied-wash text-applied' : 'bg-paper-sunk text-ink-faint')}>
                      {p.connectable ? 'live' : `phase ${p.phase}`}
                    </span>
                  </div>
                  <p className="font-ui text-[12px] text-ink-muted">{p.tagline}</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </section>
    </Shell>
  );
}

/* Step 1: connect */
function ConnectStep({ platform, onBack }: { platform: PlatformOnboarding; onBack: () => void }) {
  const [requested, setRequested] = useState(false);
  const [sending, setSending] = useState(false);

  async function requestEarlyAccess() {
    setSending(true);
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Early access', email: 'early@adsos.app', message: `Early access request: ${platform.platform}` }),
    }).catch(() => {});
    setSending(false);
    setRequested(true);
  }

  return (
    <Shell active={0}>
      <section className="flex flex-col gap-5">
        <button type="button" onClick={onBack} className="flex w-fit items-center gap-1 font-ui text-[12px] text-ink-muted hover:text-ink">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
        <Card platform={platform.platform}>
          <CardHeader className="gap-2 p-6 pb-0">
            <CardTitle className="font-display text-[22px] font-normal text-ink">
              Connect {title(platform)}
            </CardTitle>
            <CardDescription className="text-[13px] leading-5">{platform.access}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-6">
            <div className="flex flex-col gap-2 rounded-md border border-rule bg-paper-sunk p-4">
              <span className="text-label text-ink-muted">Before you connect</span>
              <ul className="flex flex-col gap-1.5">
                {platform.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2 font-ui text-[12px] text-ink">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-applied" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {platform.connectable && platform.connectHref ? (
              <a href={platform.connectHref}>
                <Button size="lg" className="w-full">
                  Authorize {title(platform)} <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            ) : requested ? (
              <div className="flex flex-col items-center gap-2 rounded-md border border-applied/40 bg-applied-wash px-4 py-6 text-center">
                <Check className="h-5 w-5 text-applied" />
                <p className="font-ui text-[13px] text-applied">
                  You are on the {title(platform)} early-access list. We will email you the moment it opens.
                </p>
                <Link href="/dashboard" className="font-ui text-[12px] text-iris hover:underline">
                  Explore the workspace meanwhile
                </Link>
              </div>
            ) : (
              <Button size="lg" className="w-full" onClick={requestEarlyAccess} disabled={sending}>
                {sending ? 'Requesting...' : `Request ${title(platform)} early access`}
              </Button>
            )}
            <p className="text-center font-ui text-[11px] text-ink-faint">
              We request the minimum scopes needed and never store your login. Tokens are encrypted at rest.
            </p>

            <div className="flex justify-center border-t border-rule pt-4">
              <TokenConnect />
            </div>
          </CardContent>
        </Card>
      </section>
    </Shell>
  );
}

/* Step 2: select accounts (post-OAuth) */
function SelectAccounts({ platform, onDone }: { platform: PlatformOnboarding; onDone: () => void }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPlatformAccounts({ platform: platform.platform }).then((res) => {
      if (cancelled) return;
      const list = res?.data?.accounts ?? [];
      setAccounts(list);
      setPicked(new Set(list.map((a) => a.externalId)));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [platform.platform]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onContinue() {
    setSaving(true);
    const chosen = accounts.filter((a) => picked.has(a.externalId));
    if (chosen.length > 0) {
      await saveSelectedAccounts({ platform: platform.platform, accounts: chosen });
    }
    setSaving(false);
    onDone();
  }

  return (
    <Shell active={1}>
      <section className="flex flex-col gap-5">
        <Card platform={platform.platform}>
          <CardHeader className="gap-2 p-6 pb-0">
            <CardTitle className="font-display text-[22px] font-normal text-ink">
              Choose {title(platform)} accounts to manage
            </CardTitle>
            <CardDescription className="text-[13px] leading-5">
              Hand-pick the ad accounts you want in this workspace. You can add or remove them later.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-6">
            {loading ? (
              <div className="flex items-center gap-2 rounded-md border border-rule bg-paper-sunk px-4 py-6 font-ui text-[13px] text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex flex-col gap-2 rounded-md border border-rule bg-paper-sunk px-4 py-6">
                <div className="flex items-center gap-2 font-ui text-[13px] text-ink">
                  <Database className="h-4 w-4 text-iris" /> Accounts are being pulled
                </div>
                <p className="font-ui text-[12px] text-ink-muted">
                  We are fetching your ad accounts from {title(platform)}. This can take a moment on a fresh
                  connection - continue and they will appear on the Accounts page as the first sync lands.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {accounts.map((a) => (
                  <li key={a.externalId}>
                    <button
                      type="button"
                      onClick={() => toggle(a.externalId)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors',
                        picked.has(a.externalId) ? 'border-iris bg-iris-wash' : 'border-rule bg-paper hover:border-rule-strong',
                      )}
                    >
                      <div className="flex flex-col">
                        <span className="font-ui text-[13px] font-medium text-ink">{a.name}</span>
                        <span className="font-data text-[10px] text-ink-faint">{a.externalId} {'\u00B7'} {a.currency}</span>
                      </div>
                      <span className={cn('flex h-4 w-4 items-center justify-center rounded-sm border', picked.has(a.externalId) ? 'border-iris bg-iris text-white' : 'border-rule')}>
                        {picked.has(a.externalId) && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Button size="lg" className="w-full" onClick={onContinue} disabled={saving}>
              {saving ? 'Saving...' : 'Continue'} <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </Shell>
  );
}

/* Step 3: first-value ramp (Optmyzr front-loads passive value) */
function RampStep({ platform, onAnother }: { platform: PlatformOnboarding; onAnother: () => void }) {
  const RAMP = [
    [Database, 'Syncing 30 days of data', 'Running now. Recommendations appear once there is enough history - you will see a "collecting data" state, never a blank screen.'],
    [ListChecks, 'Review your first recommendations', 'The Morning Brief ranks what needs attention, with evidence and a one-click safe apply.'],
    [BellRing, 'Set an alert', 'Get told when pacing drifts or tracking breaks - before it costs you.'],
    [Users, 'Invite a teammate', 'Add approvers and analysts with role-based permissions.'],
  ] as const;

  return (
    <Shell active={2}>
      <section className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-applied-wash text-applied">
            <Check className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[24px] text-ink">{title(platform)} is connected</h1>
            <p className="font-ui text-[13px] text-ink-muted">Here is how to get value in the first few minutes.</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-2 p-4">
            <ul className="flex flex-col gap-2">
              {RAMP.map(([Icon, h, b], i) => (
                <li key={h} className="flex gap-3 rounded-md p-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-iris-wash text-iris">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-ui text-[13px] font-semibold text-ink">
                      {i + 1}. {h}
                    </span>
                    <p className="font-ui text-[12px] leading-4 text-ink-muted">{b}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-2">
          <Link href="/dashboard" className="w-full">
            <Button size="lg" className="w-full">
              Go to the Morning Brief <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <button type="button" onClick={onAnother} className="font-ui text-[12px] text-iris hover:underline">
            Connect another platform
          </button>
        </div>
      </section>
    </Shell>
  );
}
