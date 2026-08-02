-- A non-superuser application role so Row Level Security is actually enforced at
-- runtime (superusers and table owners with BYPASSRLS skip RLS). Migrations/`db
-- push` run as the superuser/owner; the APP connects as this role. On Neon the
-- default role is already non-superuser, so this mostly matters for local parity.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'orchardapp') THEN
    CREATE ROLE orchardapp LOGIN PASSWORD 'orchardapp' NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO orchardapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO orchardapp;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO orchardapp;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO orchardapp;

-- Future tables (e.g. metric_fact partitions created on a schedule) inherit grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO orchardapp;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO orchardapp;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO orchardapp;
