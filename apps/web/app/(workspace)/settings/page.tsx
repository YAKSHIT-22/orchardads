import { EmptyState, ToolHeader } from '@adsos/ui';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-6 py-6">
      <ToolHeader
        icon={Settings}
        title="Settings"
        description="Workspace, members, roles, guardrails, and billing."
      />
      <EmptyState
        icon={Settings}
        title="Settings arrive with auth and tenancy"
        message="Roles, guardrail overrides and the workspace kill switch land in Milestone 0 task 8. Billing follows in Milestone 6."
      />
    </div>
  );
}
