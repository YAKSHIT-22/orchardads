import { NavRail } from '@/components/shell/nav-rail';
import { TopBar } from '@/components/shell/top-bar';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-paper-sunk">{children}</main>
      </div>
    </div>
  );
}
