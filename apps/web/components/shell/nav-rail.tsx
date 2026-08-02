'use client';

import { cn } from '@adsos/ui';
import { Building2, History, LayoutGrid, ListChecks, Settings, Sparkles, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: LucideIcon };

const ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Morning Brief', icon: Sparkles },
  { href: '/inbox', label: 'Recommendation Inbox', icon: ListChecks },
  { href: '/tools', label: 'Tools', icon: LayoutGrid },
  { href: '/audit', label: 'Activity', icon: History },
  { href: '/accounts', label: 'Accounts', icon: Building2 },
];

/** 60px icon-only rail. Labels on hover. Horizontal space belongs to data (sec 6). */
export function NavRail() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="flex h-full w-[60px] shrink-0 flex-col items-center gap-1 border-r border-rule py-3"
      style={{ background: 'var(--console)' }}
    >
      <Link
        href="/dashboard"
        className="mb-2 flex h-10 w-10 items-center justify-center"
        aria-label="OrchardAds home"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-iris font-display text-sm text-white">
          O
        </span>
      </Link>
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors',
              active ? 'text-white' : 'text-white/55 hover:text-white',
            )}
            style={active ? { background: 'var(--console-alt)' } : undefined}
          >
            <Icon className="h-[18px] w-[18px]" />
            {active && (
              <span
                className="absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r"
                style={{ width: 3, background: 'var(--iris)' }}
                aria-hidden
              />
            )}
          </Link>
        );
      })}
      <div className="mt-auto">
        <Link
          href="/settings"
          title="Settings"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-md text-white/55 hover:text-white"
        >
          <Settings className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </nav>
  );
}
