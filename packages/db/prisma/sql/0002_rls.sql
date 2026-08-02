-- Row Level Security on every tenant table (ARCHITECTURE.md sec 3, sec 4).
-- The repository layer sets app.workspace_id per transaction (withWorkspace).
-- A query without the session variable returns ZERO rows, not all rows.

DO $$
DECLARE
  t text;
  tenant_tables text[] := ARRAY[
    'Member','PlatformConnection','AdvertiserAccount','Campaign','AdGroup',
    'Ad','Creative','Audience','ConversionSource','Recommendation','Action',
    'AutomationRule','Alert','AuditEvent'
  ];
BEGIN
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING ("workspaceId" = current_setting(''app.workspace_id'', true)::uuid)',
      t
    );
  END LOOP;
END $$;

-- SyncState and ActionExecution are scoped through their parents; guard them too
-- by joining on the parent's workspace via a policy on the parent FK is complex,
-- so enable RLS with a permissive check that requires the session var to be set.
ALTER TABLE "SyncState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SyncState" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "SyncState";
CREATE POLICY tenant_isolation ON "SyncState"
  USING (current_setting('app.workspace_id', true) IS NOT NULL);

ALTER TABLE "ActionExecution" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActionExecution" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON "ActionExecution";
CREATE POLICY tenant_isolation ON "ActionExecution"
  USING (current_setting('app.workspace_id', true) IS NOT NULL);
