import { type ToolDef, toolsByCategory } from '@/lib/tools-registry';
import { Badge, ToolHeader } from '@adsos/ui';
import { LayoutGrid } from 'lucide-react';
import Link from 'next/link';

function ToolCard({ tool }: { tool: ToolDef }) {
  const Icon = tool.icon;
  return (
    <Link
      href={tool.href ?? `/tools/${tool.slug}`}
      className="group flex flex-col gap-2 rounded-md border border-rule bg-paper p-3 shadow-xs transition-all hover:border-rule-strong hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-iris-wash text-iris">
          <Icon className="h-4 w-4" />
        </div>
        {tool.combination && <Badge variant="iris">combo</Badge>}
      </div>
      <span className="font-ui text-[13px] font-semibold text-ink">{tool.name}</span>
      <p className="font-ui text-[12px] leading-4 text-ink-muted">{tool.description}</p>
    </Link>
  );
}

export default function ToolsPage() {
  const groups = toolsByCategory();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-6 sm:px-10">
      <ToolHeader
        icon={LayoutGrid}
        title="Tools"
        description="A tool suite over one normalized store. Registry-driven, so the catalog scales without touching layout."
      />
      {groups.map((g) => (
        <section key={g.category} className="flex flex-col gap-3">
          <h2 className="text-label text-ink-muted">{g.category}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.tools.map((t) => (
              <ToolCard key={t.slug} tool={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
