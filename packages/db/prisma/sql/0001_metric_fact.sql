-- metric_fact: high-volume facts without ClickHouse (ARCHITECTURE.md sec 5.3).
-- Range-partitioned monthly. The primary key IS the idempotency key, so
-- re-syncing a window is a no-op via ON CONFLICT DO UPDATE.

CREATE TABLE IF NOT EXISTS metric_fact (
  workspace_id     uuid        NOT NULL,
  platform         text        NOT NULL,
  account_id       uuid        NOT NULL,
  entity_type      text        NOT NULL,   -- CAMPAIGN | AD_GROUP | AD | CREATIVE
  entity_id        uuid        NOT NULL,
  grain            text        NOT NULL,   -- HOUR | DAY
  bucket_at        timestamptz NOT NULL,
  breakdown_hash   text        NOT NULL DEFAULT '',
  breakdown        jsonb,
  schema_version   int         NOT NULL DEFAULT 1,
  impressions      bigint      NOT NULL DEFAULT 0,
  clicks           bigint      NOT NULL DEFAULT 0,
  spend_minor      bigint      NOT NULL DEFAULT 0,
  currency         char(3)     NOT NULL,
  conversions      bigint      NOT NULL DEFAULT 0,
  conv_value_minor bigint      NOT NULL DEFAULT 0,
  native           jsonb       NOT NULL DEFAULT '{}',
  PRIMARY KEY (workspace_id, platform, entity_id, grain, bucket_at, breakdown_hash, schema_version)
) PARTITION BY RANGE (bucket_at);

CREATE INDEX IF NOT EXISTS metric_fact_ws_account_bucket
  ON metric_fact (workspace_id, account_id, bucket_at);

-- Pre-rolled daily aggregate. Dashboards read this, never the fact table.
CREATE TABLE IF NOT EXISTS metric_rollup_daily (
  workspace_id     uuid        NOT NULL,
  platform         text        NOT NULL,
  account_id       uuid        NOT NULL,
  entity_type      text        NOT NULL,
  entity_id        uuid        NOT NULL,
  day              date        NOT NULL,
  impressions      bigint      NOT NULL DEFAULT 0,
  clicks           bigint      NOT NULL DEFAULT 0,
  spend_minor      bigint      NOT NULL DEFAULT 0,
  currency         char(3)     NOT NULL,
  conversions      bigint      NOT NULL DEFAULT 0,
  conv_value_minor bigint      NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, platform, entity_id, day)
);

-- Create a monthly partition on demand (idempotent).
CREATE OR REPLACE FUNCTION ensure_metric_fact_partition(p_month date)
RETURNS void AS $$
DECLARE
  start_date date := date_trunc('month', p_month);
  end_date   date := (date_trunc('month', p_month) + interval '1 month');
  part_name  text := format('metric_fact_%s', to_char(start_date, 'YYYYMM'));
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF metric_fact FOR VALUES FROM (%L) TO (%L)',
    part_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;

-- Refresh the daily rollup for one account/day window.
CREATE OR REPLACE FUNCTION refresh_metric_rollup_daily(p_workspace uuid, p_account uuid, p_since date)
RETURNS void AS $$
BEGIN
  INSERT INTO metric_rollup_daily AS r
    (workspace_id, platform, account_id, entity_type, entity_id, day,
     impressions, clicks, spend_minor, currency, conversions, conv_value_minor)
  SELECT workspace_id, platform, account_id, entity_type, entity_id,
         (bucket_at AT TIME ZONE 'UTC')::date AS day,
         sum(impressions), sum(clicks), sum(spend_minor), max(currency),
         sum(conversions), sum(conv_value_minor)
  FROM metric_fact
  WHERE workspace_id = p_workspace AND account_id = p_account
    AND grain = 'DAY' AND bucket_at >= p_since
  GROUP BY workspace_id, platform, account_id, entity_type, entity_id, day
  ON CONFLICT (workspace_id, platform, entity_id, day) DO UPDATE SET
    impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks,
    spend_minor = EXCLUDED.spend_minor, conversions = EXCLUDED.conversions,
    conv_value_minor = EXCLUDED.conv_value_minor, currency = EXCLUDED.currency;
END;
$$ LANGUAGE plpgsql;

-- Bootstrap current + next 3 months.
SELECT ensure_metric_fact_partition((date_trunc('month', now()) + (n || ' month')::interval)::date)
FROM generate_series(0, 3) AS n;
