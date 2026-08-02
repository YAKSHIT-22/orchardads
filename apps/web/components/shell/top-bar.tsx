import { ChevronDown, Search } from 'lucide-react';

/** 56px command bar. Cmd-K is the primary navigation past week one (sec 6). */
export function TopBar() {
  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-rule px-4"
      style={{ background: 'var(--console)' }}
    >
      <button
        type="button"
        className="flex h-8 w-full max-w-md items-center gap-2 rounded-md px-3 text-left text-white/55 hover:text-white/80"
        style={{ background: 'var(--console-alt)' }}
      >
        <Search className="h-4 w-4" />
        <span className="font-ui text-[13px]">Jump to account, campaign, or run a tool</span>
        <kbd className="ml-auto font-data text-[11px] text-white/40">Cmd K</kbd>
      </button>
      <button
        type="button"
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-white/80 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-iris font-data text-[11px] text-white">
          W
        </span>
        <span className="font-ui text-[13px]">Workspace</span>
        <ChevronDown className="h-3.5 w-3.5 text-white/40" />
      </button>
    </header>
  );
}
