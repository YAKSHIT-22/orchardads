# ARCHITECTURE

**Stack:** Next.js 16 (App Router) on Vercel · Neon Postgres · Upstash Redis + QStash + Workflow · Prisma 6 · TypeScript strict

---

## 1. System shape

```
                        ┌──────────────────────────────┐
   Browser ────────────▶│  Next.js 16 App Router       │
                        │  RSC pages + server actions  │
                        └───────┬──────────────────────┘
                                │
      ┌─────────────────────────┼──────────────────────────┐
      ▼                         ▼                          ▼
┌───────────┐          ┌─────────────────┐        ┌──────────────────┐
│   Neon    │          │ Upstash Redis   │        │  Upstash QStash  │
│ Postgres  │          │ cache · locks · │        │  queue · cron ·  │
│           │          │ rate-limit state│        │  DLQ · retries   │
└───────────┘          └─────────────────┘        └────────┬─────────┘
      ▲                                                    │ HTTP POST
      │                                                    ▼
      │                                       ┌────────────────────────┐
      └───────────────────────────────────────│ /api/jobs/[task]       │
                                              │ /api/workflows/[name]  │
                                              └───────────┬────────────┘
                                                          │
                                              ┌───────────▼────────────┐
                                              │  Platform Adapters     │
                                              │  reddit · spotify ·    │
                                              │  snap · pinterest      │
                                              └────────────────────────┘
```

There is **one deployable**. Everything asynchronous is an HTTP endpoint that QStash calls.

---

## 2. The serverless redesign

### 2.1 What replaces what

| Research doc said | Use instead | Why |
|---|---|---|
| BullMQ workers | **QStash** queues + `/api/jobs/[task]` | No long-lived process on Vercel. QStash pushes over HTTP with retries and a DLQ. |
| Temporal | **Upstash Workflow** (`@upstash/workflow`) | Durable multi-step execution with `context.run`, `context.sleep`, `context.call`. Survives function timeouts by checkpointing each step. |
| ClickHouse | **Neon Postgres**, partitioned + pre-rolled | See §5.3. Revisit only when a single tenant exceeds ~50M metric rows. |
| `ioredis` | **`@upstash/redis`** (HTTP) | TCP clients leak connections across invocations and exhaust the pool. |
| Cron in-process | **Vercel Cron** → enqueue, or **QStash schedules** | Prefer QStash schedules: they carry retries and DLQ, Vercel Cron does not. |

### 2.2 Function duration budget

Fluid compute is on by default. Defaults and ceilings as of July 2026:

- **300s** default max duration, all plans
- **800s** ceiling, generally available on Pro/Enterprise
- **1800s** (30 min) ceiling, beta, Node.js/Python, Pro/Enterprise, set per-function via `maxDuration`

Design so that **no single invocation needs more than 60s**. Treat the higher ceilings as headroom, not as a plan. Any sync that could exceed 60s must be chunked and resumable — see §4.3.

```jsonc
// vercel.json
{
  "functions": {
    "app/api/jobs/**": { "maxDuration": 300 },
    "app/api/workflows/**": { "maxDuration": 300 },
    "app/api/ai/**": { "maxDuration": 800 }
  }
}
```

### 2.3 `waitUntil` — use sparingly

`waitUntil` from `@vercel/functions` continues work after the response is sent, but it is **fire-and-forget with no retry**. Permitted uses: analytics pings, cache warming, audit-log writes that are already durably recorded elsewhere. **Never** for a platform write, a sync, or anything a user would notice failing. Those go through QStash.

### 2.4 Concurrency hazard

Fluid compute runs multiple invocations in one instance. **Module-level mutable state is a cross-request data leak**, not just a race condition. Enforce with a lint rule: no mutable module-scope bindings in `apps/web` or any package touching request context. All per-request state goes through `AsyncLocalStorage` or explicit parameters.

---

## 3. Multi-tenancy

```
Organization  (billing boundary)
  └── Workspace  (data isolation boundary — an agency's client)
        ├── Member (role: OWNER | ADMIN | OPERATOR | ANALYST | VIEWER)
        ├── PlatformConnection (OAuth grant, 1 per platform per workspace)
        └── AdvertiserAccount (external ad account)
```

**Isolation rule:** every table with tenant data carries `workspaceId`. Every repository function takes a `WorkspaceContext` as its first argument, and there is no exported query that omits it. Enforce with:

1. Postgres Row Level Security on all tenant tables, session variable `app.workspace_id`.
2. A repository layer that is the only module permitted to import `PrismaClient`. Lint-ban the import everywhere else.

Belt and braces. RLS alone fails if a migration forgets a policy; the repository layer alone fails if someone bypasses it.

### 3.1 Roles

| Capability | OWNER | ADMIN | OPERATOR | ANALYST | VIEWER |
|---|---|---|---|---|---|
| Connect/disconnect platforms | ✓ | ✓ | | | |
| Approve high-risk actions | ✓ | ✓ | | | |
| Approve low-risk actions | ✓ | ✓ | ✓ | | |
| Propose actions | ✓ | ✓ | ✓ | ✓ | |
| Create/edit automation rules | ✓ | ✓ | ✓ | | |
| View reporting | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage billing | ✓ | | | | |

---

## 4. Sync engine

### 4.1 Three sync classes

| Class | Cadence | Mechanism |
|---|---|---|
| Configuration (campaigns, ad groups, ads, creatives, audiences) | 15–60 min | QStash schedule → fan-out per connection |
| Recent metrics (last 3 days, hourly grain where available) | 15–60 min | QStash schedule |
| Historical backfill (up to 90 days) | On connect, then daily | Upstash Workflow, chunked by date window |

### 4.2 Fan-out pattern

A schedule fires one **planner** invocation. The planner does no platform I/O — it reads which connections are due and batch-publishes one QStash message per connection. This keeps the scheduled function under a second and makes each unit independently retryable.

```ts
// app/api/cron/sync-config/route.ts
export async function GET(req: Request) {
  assertCronSecret(req);
  const due = await connections.findDueForConfigSync();     // one indexed query
  await qstash.batchJSON(
    due.map(c => ({
      url: `${APP_URL}/api/jobs/sync-config`,
      body: { connectionId: c.id, cursor: null },
      retries: 3,
      deduplicationId: `sync-config:${c.id}:${currentBucket()}`,
      // route by platform so one platform's backlog can't starve another
      queue: `sync-${c.platform}`,
    }))
  );
  return Response.json({ enqueued: due.length });
}
```

Use **QStash queues** (not bare publish) for ordered processing with bounded parallelism. One queue per platform, so a Reddit outage cannot exhaust throughput for Spotify.

### 4.3 Resumable chunking

Every job handler must be able to stop mid-work and reschedule itself:

```ts
const DEADLINE_MS = 45_000;  // well under maxDuration

export const POST = verifySignature(async (req) => {
  const { connectionId, cursor } = await req.json();
  const started = Date.now();
  let next = cursor;

  do {
    const page = await adapter.syncCampaigns({ connectionId, cursor: next });
    await repo.upsertCampaigns(ctx, page.rows);
    next = page.nextCursor;
  } while (next && Date.now() - started < DEADLINE_MS);

  if (next) {
    await qstash.publishJSON({
      url: `${APP_URL}/api/jobs/sync-config`,
      body: { connectionId, cursor: next },
      deduplicationId: `sync-config:${connectionId}:${next}`,
    });
  }
  return Response.json({ ok: true, resumed: Boolean(next) });
});
```

Every QStash consumer wraps in `verifySignature` from `@upstash/qstash/nextjs`. An unverified job endpoint is an unauthenticated write endpoint.

### 4.4 Sync observability

A sync that silently stops is worse than one that fails loudly. Every connection carries a `SyncState` row: `lastSuccessAt`, `lastAttemptAt`, `consecutiveFailures`, `lastError`, `stage`. Surface it in Account Center as a real status, and alert when `lastSuccessAt` falls outside 3× the expected cadence.

---

## 5. Data model

### 5.1 Normalized core

Entities as in the research doc: `Organization`, `Workspace`, `User`, `PlatformConnection`, `AdvertiserAccount`, `Campaign`, `AdGroupLike`, `Ad`, `Creative`, `Audience`, `Target`, `ConversionSource`, `MetricFact`, `Recommendation`, `AutomationRule`, `Action`, `ActionExecution`, `Experiment`, `Alert`, `Report`, `BudgetPlan`.

`AdGroupLike` maps to: Reddit Ad Group · Spotify Ad Set · Snap Ad Squad · Pinterest Ad Group.

Every synced entity stores:

```
id                 uuid, internal
workspaceId        uuid
platform           enum
externalId         text
normalizedStatus   enum   ACTIVE | PAUSED | ARCHIVED | PENDING_REVIEW | REJECTED | ENDED
rawStatus          text   platform's own string, never normalized away
normalizedObjective enum
rawObjective       text
currency           char(3)
timezone           text
extension          jsonb  platform-specific fields, schema-versioned
rawSnapshot        jsonb  nullable — governed by retentionPolicy
apiVersion         text
retentionPolicy    enum   PERSIST | ANALYTICS_ONLY | PROXY_ONLY
lastSyncedAt       timestamptz
```

`rawStatus` and `rawObjective` are mandatory. The moment you only keep the normalized value you lose the ability to explain to a user why their campaign is not delivering.

### 5.2 Currency and timezone

Store all money as **integer minor units** plus a currency code. Never floats. Platforms differ: Spotify uses micro-amounts (`bid_micro_amount`, `budget.micro_amount`), others use different scales. Normalize at the adapter boundary into `amountMinor: bigint` + `currency`.

Store all timestamps as `timestamptz` in UTC. Store the account's reporting timezone separately on `AdvertiserAccount` and convert only at render time — platforms attribute spend to *their* day boundary, and a naive conversion silently shifts a day's spend.

Cross-platform totals require FX. Do not silently sum mixed currencies. Either group by currency or convert with a dated rate stored on the row, and label it in the UI.

### 5.3 Metric facts without ClickHouse

```sql
CREATE TABLE metric_fact (
  workspace_id   uuid        NOT NULL,
  platform       text        NOT NULL,
  account_id     uuid        NOT NULL,
  entity_type    text        NOT NULL,   -- CAMPAIGN | AD_GROUP | AD | CREATIVE
  entity_id      uuid        NOT NULL,
  grain          text        NOT NULL,   -- HOUR | DAY
  bucket_at      timestamptz NOT NULL,
  breakdown_hash text        NOT NULL,   -- '' when no breakdown
  breakdown      jsonb,
  schema_version int         NOT NULL,
  impressions    bigint      NOT NULL DEFAULT 0,
  clicks         bigint      NOT NULL DEFAULT 0,
  spend_minor    bigint      NOT NULL DEFAULT 0,
  currency       char(3)     NOT NULL,
  conversions    bigint      NOT NULL DEFAULT 0,
  conv_value_minor bigint    NOT NULL DEFAULT 0,
  native         jsonb       NOT NULL DEFAULT '{}',  -- platform-only metrics
  PRIMARY KEY (workspace_id, platform, entity_id, grain, bucket_at, breakdown_hash, schema_version)
) PARTITION BY RANGE (bucket_at);
```

- **Monthly partitions.** Create three months ahead on a schedule; detach and archive beyond retention.
- **The primary key is the idempotency key.** Re-syncing the same window is a no-op `ON CONFLICT DO UPDATE`. This is what makes retries safe.
- **Pre-rolled aggregates.** Maintain `metric_rollup_daily` and `metric_rollup_7d` as materialized tables refreshed after each sync. Dashboards read rollups, never the fact table. This is the single most important performance decision in the app.
- **`native` jsonb** holds platform-only metrics so Pinterest's long metric list does not force 90 sparse columns.

Neon-specific: use the pooled `DATABASE_URL` for app queries and `DIRECT_URL` for migrations. Enable autoscaling; expect cold-start latency on scale-to-zero and set `min_cu` above zero once you have real users.

### 5.4 Retention policy — enforced, not documented

Pinterest's developer guidelines prohibit storing information accessed through its API **except campaign analytics for the connected account**. This is a code-level constraint:

```ts
export type RetentionPolicy = 'PERSIST' | 'ANALYTICS_ONLY' | 'PROXY_ONLY';

// packages/platform-pinterest/retention.ts
export const pinterestRetention = (e: EntityType): RetentionPolicy => {
  switch (e) {
    case 'METRIC_FACT':  return 'ANALYTICS_ONLY'; // permitted
    case 'CAMPAIGN':
    case 'AD_GROUP':
    case 'AD':           return 'PROXY_ONLY';     // ids + short TTL cache only
    case 'CREATIVE':
    case 'CATALOG_ITEM':
    case 'TREND':        return 'PROXY_ONLY';
    default:             return 'PROXY_ONLY';
  }
};
```

The repository layer **refuses** to persist `rawSnapshot` or derived text/embeddings for anything not `PERSIST`. For `PROXY_ONLY` entities the app stores the external ID plus a Redis cache entry with a short TTL (≤15 min) and re-fetches on demand.

Consequences to implement, not just note:
- Pinterest creatives are excluded from the vector store and the Creative Concept Graph.
- Pinterest Visual Intent Classifier, Pin Variant Factory and Catalog Gap Finder run on-demand and return results without persisting inputs.
- Reporting must display **multi-touch attribution alongside last-click** wherever Pinterest data appears. This is a Pinterest requirement for ads-management apps, not a feature choice.
- Platform fees must be shown separately from media spend.
- Pinterest data must not influence targeting on other platforms. The Budget Portfolio Optimizer may allocate budget across platforms; the Cross-Platform Creative Transfer must not carry Pinterest audience signal outward.

---

## 6. Rate-limit coordinator

Serverless instances are stateless, so limiter state lives in Upstash Redis. Use `@upstash/ratelimit` with a **separate limiter instance per bucket key**.

### 6.1 Verified limits

| Platform | Bucket | Limit |
|---|---|---|
| Spotify | client+user | 1,500 / 30s, 50 RPS sustained |
| Spotify | client, `POST /async_reports` | 30 / 30s, 1 RPS |
| Spotify | client, other reporting | 150 / 30s, 5 RPS |
| Snap | app | 20 req/s average |
| Snap | access token | 10 req/s average |
| Pinterest | universal, Trial | 1,000 / day / app |
| Pinterest | universal, Standard | 100 req/s / user / app |
| Pinterest | `ads_read` | 1,000 / min / user / app |
| Pinterest | `ads_write` | 400 / min / user / app |
| Pinterest | `ads_analytics` | 300 / min / user / app |
| Pinterest | advanced auction read / write | 50 / 25 per min |
| Pinterest | catalogs read/write | 100 / min |
| Pinterest | trends read | 60 / min |
| Reddit | policy-based | Read headers dynamically; one documented Business Manager policy is 100 / 60s |

### 6.2 Rules

1. **Pinterest categories are independent counters.** One global limiter will throttle you artificially. Key by `pinterest:{category}:{userId}:{appId}`.
2. **Spotify reporting caps take precedence** over the general client+user cap. Check both; the tighter one wins.
3. **Always reconcile from response headers** after every call. Spotify returns `X-RateLimit-Remaining` / `-Limit` / `-Reset`. Treat the header as truth and the local counter as an optimisation.
4. **On 429:** exponential backoff with full jitter, then reschedule through QStash rather than sleeping inside the function. Sleeping burns billed duration.
5. **Never hard-code one number per platform.** Limits live in a per-platform config module, loaded through the capability manifest, so a change is a config edit not a code hunt.

```ts
// packages/platform-core/rate-limit.ts
const limiters = new Map<string, Ratelimit>();

export function limiterFor(bucket: BucketKey): Ratelimit {
  const key = serialize(bucket);
  let l = limiters.get(key);
  if (!l) {
    const spec = rateLimitSpec(bucket);           // from platform config
    l = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(spec.tokens, spec.window),
      prefix: `rl:${key}`,
      analytics: true,
    });
    limiters.set(key, l);   // safe: immutable after construction, keyed by content
  }
  return l;
}
```

---

## 7. Action engine — the core of the product

Nothing writes to a platform except through this pipeline.

```
ProposedAction ──▶ Validation ──▶ Policy ──▶ Approval ──▶ Queue ──▶ Adapter ──▶ Platform
                       │             │           │
                    schema        guardrails   role +
                    + capability   + caps      risk band
```

### 7.1 The `Action` record

Every write retains all ten, per the research doc, and each is a real column:

```
id, workspaceId, kind, entityRef
proposedPayload   jsonb    what we intend to send
humanDiff         jsonb    structured before → after, rendered by the Action Ledger
validation        jsonb    schema + capability + guardrail results
estimatedImpact   jsonb    { metric, delta, confidence, basis }
riskBand          enum     SAFE | LOW | MEDIUM | HIGH
approvalPolicy    jsonb    which rule routed it, who may approve
idempotencyKey    text     unique
apiResponse       jsonb    raw platform response
previousState     jsonb    full prior entity snapshot
rollbackPlan      jsonb    null when not reversible — and the UI must say so
status            enum     PROPOSED | APPROVED | QUEUED | APPLYING | APPLIED | FAILED | ROLLED_BACK | DISMISSED
```

`previousState` is captured **inside the same execution** immediately before the write, not from the last sync. A snapshot from 40 minutes ago is not a rollback target.

### 7.2 Idempotency

```
idempotencyKey = sha256(
  workspaceId + platform + entityExternalId + actionKind +
  canonicalJson(proposedPayload) + proposalWindowBucket
)
```

Unique index on `(workspaceId, idempotencyKey)`. The execution handler:

1. `INSERT ... ON CONFLICT DO NOTHING` a claim row.
2. If no row was inserted, another invocation owns it — return the existing result.
3. Otherwise acquire a Redis lock on the entity, execute, record.

This is what makes QStash's automatic retries safe. Without it, a network timeout on a budget increase applies it twice.

### 7.3 Default guardrails

Configurable per workspace, with these defaults:

- Max daily budget change: ±25% per entity per 24h
- No automatic objective changes, ever
- No creative publishing without explicit approval
- No optimization action when tracking health is degraded (see §9)
- Minimum sample size before any pause/scale: 1,000 impressions **and** 7 days **and** ≥1 conversion for CPA-based actions
- Cooldown: 48h per entity per action kind
- Workspace kill switch that halts all queued actions immediately
- Spend cap: no single action may increase total workspace daily budget by more than a configured absolute amount

Guardrails are evaluated in the **policy engine**, not in the tool that proposed the action. A tool cannot opt out of them.

### 7.4 Risk banding

| Band | Examples | Approval |
|---|---|---|
| SAFE | Rename, add label, pause a zero-spend entity | Auto-apply if workspace opted in |
| LOW | Budget change ≤10%, pause a clearly failing ad | OPERATOR+ |
| MEDIUM | Budget change ≤25%, new ad group in existing campaign, bid strategy change | ADMIN+ |
| HIGH | Anything creating spend on a new entity, objective change, catalog/product-group changes, bulk >10 entities | ADMIN+ with explicit typed confirmation |

---

## 8. AI execution architecture

```
User / Scheduler → AI Orchestrator → internal read-only tools → ProposedAction[]
                                                                      ↓
                                          Policy + Validation → Approval → Queue → Adapter
```

**Hard rules:**

- The model receives **no credentials** and has **no write tools**. Its tool surface is read-only queries against the normalized store.
- The model's only output that reaches the platform is a `ProposedAction[]`, parsed with Zod. A parse failure is a rejected turn, not a repair attempt.
- **The model never computes arithmetic that matters.** Deltas, CPAs, pacing projections and impact estimates are computed in TypeScript and passed *into* the prompt. The model explains; it does not calculate.
- **The model never invents a metric.** Prompts pass an explicit evidence bundle, and the explanation must cite fields present in that bundle. Add an automated check that flags numbers in the output that do not appear in the input.

Provider abstraction in `packages/ai/` so the vendor is swappable. Long AI routes get `maxDuration: 800`; fluid compute pauses CPU billing during model I/O, so a slow model call is cheap in wall-clock terms.

---

## 9. Tracking health — a gate, not a widget

Optimization on broken conversion data is the fastest way to destroy a customer's account. Compute a per-account `TrackingHealth` score from:

- Presence and freshness of pixel/CAPI events
- Event volume anomaly vs trailing 14-day baseline
- Deduplication rate where the platform exposes it
- Platform-native diagnostics: **Snap** exposes event quality scores with structured recommendations and priority codes; **Spotify** exposes dataset diagnostics. Consume both rather than reimplementing the heuristics.
- **Reddit-specific:** from 13 July 2026 ad groups and CBO campaigns require `conversion_pixel_id`. Missing it is a hard failure, surfaced as a blocking issue.

`TrackingHealth` is an input to the policy engine. When it is `DEGRADED` or `BROKEN`, all conversion-optimizing actions are blocked and the Recommendation Inbox shows the tracking fix as the top item instead.

---

## 10. Token vault and security

### 10.1 Storage

Envelope encryption. A data key encrypts each refresh token with AES-256-GCM; the data key comes from `TOKEN_ENCRYPTION_KEY`. Store `{ciphertext, iv, authTag, keyVersion}`. Rotation works by decrypting with `TOKEN_ENCRYPTION_KEY_PREVIOUS` and re-encrypting with the current key on next use.

**Tokens never reach the browser.** No token, no refresh token, no client secret is ever included in an RSC payload, a server action return value, or an API response. Add a serialization guard that throws on any object containing a key matching `/token|secret|credential/i` crossing the server boundary.

### 10.2 Token lifecycle differs per platform

| Platform | Access token | Refresh token |
|---|---|---|
| Reddit | Short-lived | **Rotates** — persist the new one atomically or lock out the tenant |
| Spotify | 1 hour | Long-lived |
| Snap | Short-lived | **Does not expire, does not rotate** |
| Pinterest | Short-lived | Refresh on a 30–60 day cycle |

Reddit's rotation is the dangerous one. Refresh must happen under a Redis lock keyed on the connection, inside a transaction that writes the new refresh token before the old one is discarded. Two concurrent invocations refreshing the same Reddit connection will otherwise permanently break it.

### 10.3 Everything else

Strict tenant isolation (§3) · RBAC (§3.1) · approval policies (§7) · immutable append-only audit trail · signed asset URLs · webhook signature verification (`verifySignature` on all QStash endpoints) · CSRF via server actions' built-in origin check · CSP with nonces · export and deletion controls per workspace · PII minimization in conversion payloads · log redaction of tokens and email addresses · secret rotation runbook · dependency scanning in CI · SOC 2-ready control design.

---

## 11. Observability

- **Sentry** for errors and tracing, with `workspaceId` and `platform` as tags on every event.
- **Structured logs** to Vercel's log drain: one JSON line per job with `jobId`, `connectionId`, `platform`, `durationMs`, `apiCalls`, `rateLimitRemaining`, `outcome`.
- **Four dashboards that matter:** API error rate per platform · rate-limit headroom per bucket · sync freshness per connection · action success/failure/rollback rate.
- **Alerts:** any connection with `lastSuccessAt` older than 3× cadence · DLQ depth > 0 · action failure rate > 5% in an hour · any `HIGH` risk action applied.

QStash's own observability is thin — delivery logs and DLQ inspection, no tracing export. Compensate by logging job outcomes yourself with a correlation ID that matches the QStash message ID.

---

## 12. Adapter contract

```ts
// packages/platform-core/adapter.ts
export interface AdsPlatformAdapter {
  readonly platform: Platform;
  readonly apiVersion: string;

  getCapabilities(connectionId: string): Promise<CapabilityManifest>;
  getRetentionPolicy(entity: EntityType): RetentionPolicy;

  listAccounts(connectionId: string): Promise<ExternalAccount[]>;

  // All sync methods are cursor-based and resumable.
  syncCampaigns(q: SyncQuery): Promise<SyncPage<NormalizedCampaign>>;
  syncAdGroups(q: SyncQuery): Promise<SyncPage<NormalizedAdGroup>>;
  syncAds(q: SyncQuery): Promise<SyncPage<NormalizedAd>>;
  syncCreatives(q: SyncQuery): Promise<SyncPage<NormalizedCreative>>;
  syncAudiences(q: SyncQuery): Promise<SyncPage<NormalizedAudience>>;

  fetchReport(q: PlatformReportQuery): Promise<SyncPage<NormalizedMetricRow>>;

  validateAction(a: ProposedAction): Promise<ValidationResult>;
  previewAction(a: ProposedAction): Promise<ActionPreview>;
  executeAction(a: ApprovedAction): Promise<ActionResult>;
  captureState(ref: EntityRef): Promise<EntitySnapshot>;   // for rollback
  rollback(a: AppliedAction): Promise<ActionResult>;
}
```

`SyncPage<T>` is `{ rows: T[]; nextCursor: string | null; rateLimit: RateLimitSnapshot }`. Returning the rate-limit snapshot from every call is what lets the coordinator reconcile against headers without a second round trip.

### 12.1 Capability manifest

Every optional platform feature is a flag, resolved per connection and cached in Redis for 1 hour:

```ts
type CapabilityManifest = {
  platform: Platform;
  apiVersion: string;
  resolvedAt: string;
  features: {
    redditMax?: boolean;              // limited availability
    redditCbo?: boolean;
    redditCommunityPostPromotion?: boolean;
    redditLandingPageOptimization?: boolean;
    spotifyReservedBuying?: boolean;  // unconfirmed at API level
    spotifyCapi?: boolean;
    snapAdsGallery?: boolean;
    snapPublicProfile?: boolean;
    pinterestTrends?: boolean;
    pinterestCatalogs?: boolean;
    pinterestStandardAccess?: boolean;
  };
  limits: RateLimitSpec[];
};
```

**The UI reads the manifest, never assumes.** A feature the connection lacks renders as an explained empty state, not a broken button. Reddit exposes a Feature Access endpoint for this; for the others, probe once and cache.

---

## 13. Testing strategy

| Layer | Approach |
|---|---|
| Schema conformance | Generated Zod schemas validated against recorded platform responses. See `CAMPAIGN_FLOWS.md` §2. |
| Contract tests | Nightly job replays a recorded request corpus against each platform sandbox/live read endpoint and diffs the response shape. **A shape change fails CI.** This is the changelog-monitoring mechanism — not a human reading release notes. |
| Action engine | Property tests: for any generated `ProposedAction`, applying then rolling back returns the entity to `previousState`. |
| Idempotency | Fire the same job 20× concurrently; assert exactly one platform write. |
| Rate limiter | Simulate 429 storms; assert no invocation exceeds the bucket and all work eventually completes. |
| RLS | Integration test that a query without `workspaceId` returns zero rows rather than everything. |
| Retention | Test that persisting a Pinterest creative throws. |

Contract tests are the highest-value tests in this codebase. Platform drift is the top operational risk and it is the only risk that a test suite can detect before a customer does.

---

## 14. What ships in Phase 1

Reddit only. Config sync, metric sync, rollups, dashboard, six recommendation types, the action engine end to end with diff/approve/apply/rollback, Campaign Studio for Reddit, tracking doctor, Account Center. Everything in this document is built for four platforms but exercised by one — that is deliberate, because the second adapter is where a premature abstraction reveals itself, and it is much cheaper to find out in Phase 2 than in Phase 5.
