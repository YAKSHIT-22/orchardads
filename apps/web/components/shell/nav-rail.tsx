'use client';

import { Logo } from '@/components/brand/logo';
import { toolsByCategory } from '@/lib/tools-registry';
import { cn } from '@adsos/ui';
import {
  Building2,
  ChevronDown,
  History,
  ListChecks,
  type LucideIcon,
  Settings,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type NavItem = { href: string; label: string; icon: LucideIcon };

const TOP_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Sparkles },
  { href: '/inbox', label: 'Recommendation Inbox', icon: ListChecks },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/audit', label: 'Activity', icon: History },
  { href: '/accounts', label: 'Accounts', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLink({ href, label, icon: Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] font-ui text-[13px] font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-primary'
          : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/**
 * Full left sidebar, ported from handyAds's shell (structure + spacing),
 * re-skinned to our tokens. Unlike handyAds's 144px icon rail + fly-out
 * panel, everything lives in one scrollable column so every tool is a
 * single click away and the URL structure stays obvious. Tool categories
 * are collapsible disclosures - the category holding the active route
 * starts open, everything else starts closed, so the long tool catalog
 * doesn't force a wall of scrolling on first load.
 */
export function NavRail() {
  const pathname = usePathname();
  const groups = toolsByCategory();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const [openCategories, setOpenCategories] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const g of groups) {
      const href = (t: (typeof g.tools)[number]) => t.href ?? `/tools/${t.slug}`;
      if (g.tools.some((t) => isActive(href(t)))) initial.add(g.category);
    }
    return initial;
  });

  function toggleCategory(category: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <aside
      aria-label="Primary"
      className="flex h-full w-60 shrink-0 flex-col border-r"
      style={{ background: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <Logo href="/dashboard" width={124} className="h-7 w-auto" />
      </div>

      {/* Scrollable so the full tool catalog fits without pushing Settings offscreen. */}
      <nav className="scrollbar-hidden flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-3 pb-4">
        <div className="flex flex-col gap-0.5">
          {TOP_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="px-2.5 pb-1 text-label text-sidebar-foreground/45">Tools</span>
          {groups.map((g) => {
            const open = openCategories.has(g.category);
            const panelId = `nav-group-${g.category.toLowerCase().replace(/\s+/g, '-')}`;
            return (
              <div key={g.category} className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => toggleCategory(g.category)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="flex items-center justify-between rounded-md px-2.5 py-1.5 font-ui text-[12px] font-semibold text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                >
                  <span>{g.category}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 transition-transform',
                      open ? 'rotate-0' : '-rotate-90',
                    )}
                  />
                </button>
                {open && (
                  <div id={panelId} className="flex flex-col gap-0.5 pl-2">
                    {g.tools.map((tool) => {
                      const href = tool.href ?? `/tools/${tool.slug}`;
                      return (
                        <NavLink
                          key={tool.slug}
                          href={href}
                          label={tool.name}
                          icon={tool.icon}
                          active={isActive(href)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="mt-auto flex flex-col gap-0.5 border-t pt-3"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          {BOTTOM_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
