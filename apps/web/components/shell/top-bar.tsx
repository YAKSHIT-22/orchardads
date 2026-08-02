'use client';

import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@adsos/ui';
import { Building2, ChevronDown, LogOut, Search, Settings } from 'lucide-react';
import Link from 'next/link';

/**
 * 56px command bar, ported from handyAds's tools layout header - an account
 * selector on the left, a user menu on the right. Re-skinned to a light
 * header (handyAds's dark rail is gone; the sidebar now carries navigation).
 */
export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-rule bg-paper px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {/* Account selector placeholder - wired up once the account model lands. */}
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md border border-rule bg-paper px-3 font-ui text-[13px] text-ink transition-colors hover:border-rule-strong hover:bg-paper-sunk"
        >
          <Building2 className="h-3.5 w-3.5 text-ink-faint" />
          <span className="max-w-[18ch] truncate">Select account</span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-faint" />
        </button>
        <div className="hidden items-center gap-2 rounded-md border border-rule bg-paper-sunk px-3 py-1.5 text-ink-faint md:flex">
          <Search className="h-3.5 w-3.5" />
          <span className="font-ui text-[13px]">Jump to account, campaign, or run a tool</span>
          <kbd className="ml-6 font-data text-[11px] text-ink-faint">Cmd K</kbd>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-paper-sunk"
            aria-label="Account menu"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-iris-wash font-ui text-[12px] font-semibold text-iris">
                OA
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-3.5 w-3.5 text-ink-faint" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild variant="destructive">
            <Link href="/api/auth/signout">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
