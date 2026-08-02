'use client';

import { Button, cn } from '@adsos/ui';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Tier = {
  name: string;
  monthly: number | null; // null = custom
  accounts: string;
  blurb: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

// Simple, account-based pricing for TikTok Ads. One flat fee per account tier,
// never a percentage skim of your spend. Annual billing saves ~30%.
const TIERS: Tier[] = [
  {
    name: 'Free',
    monthly: 0,
    accounts: '1 TikTok ad account',
    blurb: 'Audit one account and watch the engine work.',
    features: ['Recommendation Inbox (read)', 'Tracking Doctor', 'Diagnostics + reporting', 'Community support'],
    cta: 'Start free',
    href: '/onboarding',
  },
  {
    name: 'Pro',
    monthly: 50,
    accounts: '10 TikTok ad accounts',
    blurb: 'For an in-house team running TikTok performance.',
    features: ['Everything in Free', 'One-click apply + rollback', 'Automation rules', 'AI analyst (Ask)', 'Creator discovery + Spark Ads', 'Email support'],
    cta: 'Start free trial',
    href: '/onboarding',
    featured: true,
  },
  {
    name: 'Pro Max',
    monthly: 100,
    accounts: '50 TikTok ad accounts',
    blurb: 'For agencies managing many clients.',
    features: ['Everything in Pro', 'Teams + roles + approvals', 'White-label reports', 'All-accounts dashboard', 'API + MCP access', 'Priority support'],
    cta: 'Start free trial',
    href: '/onboarding',
  },
  {
    name: 'Enterprise',
    monthly: null,
    accounts: 'Unlimited accounts',
    blurb: 'SSO, SLA and warehouse exports.',
    features: ['Everything in Pro Max', 'SSO / SAML', 'SLA', 'Warehouse exports', 'Dedicated support'],
    cta: 'Talk to us',
    href: '/contact',
  },
];

function price(t: Tier, annual: boolean): string {
  if (t.monthly === null) return 'Custom';
  const perMo = annual ? Math.round(t.monthly * 0.7) : t.monthly;
  return `$${perMo}`;
}

export function PricingTable() {
  const [annual, setAnnual] = useState(true);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-3">
        <span className="font-ui text-[12px] text-ink-muted">Billing</span>
        <div className="flex items-center rounded-md border border-rule bg-paper p-0.5">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn('rounded-sm px-3 py-1 font-ui text-[12px]', !annual ? 'bg-iris text-white' : 'text-ink-muted')}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn('rounded-sm px-3 py-1 font-ui text-[12px]', annual ? 'bg-iris text-white' : 'text-ink-muted')}
          >
            Annual
          </button>
        </div>
        <span className="rounded-sm bg-applied-wash px-1.5 py-0.5 text-label text-applied">Save 30%</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={cn(
              'flex flex-col gap-4 rounded-lg border bg-paper p-5',
              t.featured ? 'border-iris ring-1 ring-iris' : 'border-rule',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-ui text-sm font-semibold text-ink">{t.name}</span>
              {t.featured && <span className="rounded-sm bg-iris-wash px-1.5 py-0.5 text-label text-iris">Popular</span>}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-data text-[28px] leading-none text-ink">{price(t, annual)}</span>
              {t.monthly !== null && <span className="font-ui text-[12px] text-ink-faint">/mo</span>}
            </div>
            <span className="font-data text-[11px] text-ink-faint">{t.accounts}</span>
            <p className="font-ui text-[12px] leading-4 text-ink-muted">{t.blurb}</p>
            <ul className="flex flex-1 flex-col gap-1.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 font-ui text-[12px] text-ink">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-applied" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={t.href}>
              <Button variant={t.featured ? 'primary' : 'secondary'} className="w-full">
                {t.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
      <p className="text-center font-ui text-[12px] text-ink-faint">
        14-day free trial, no card required. Start free on one account, upgrade any time. No
        percentage of your ad spend, ever.
      </p>
    </div>
  );
}
