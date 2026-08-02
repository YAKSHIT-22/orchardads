# BUILD PLAN

Sequenced tasks. Each has an acceptance test. Do not start a task until its predecessors pass.

**Working rule for Claude Code:** after each numbered task, run `pnpm typecheck && pnpm test && pnpm lint` and stop if anything fails. Do not batch tasks.

---

## Milestone 0 — Foundation (tasks 1–8)

### 1. Repo and toolchain
Turborepo + pnpm workspace. `apps/web` (Next.js 16.2.11, App Router, TypeScript strict, `noUncheckedIndexedAccess`), packages per `README.md`. Biome or ESLint + Prettier. Vitest. `vercel.json` with the `maxDuration` map from `ARCHITECTURE.md` §2.2.

**Accept:** `pnpm build` succeeds; a placeholder page deploys to Vercel.

### 2. Lint rules that enforce the architecture
Three custom rules, because these are the failures that are invisible until production:
- No mutable module-scope bindings in request-path code (`ARCHITECTURE.md` §2.4).
- Only `packages/db/repositories/**` may import `PrismaClient`.
- No platform enum literals outside `generated/` (`CAMPAIGN_FLOWS.md` §2).

**Accept:** each rule has a failing fixture that the linter catches.

### 3. Database — Neon + Prisma
Prisma 6 with the Neon serverless driver adapter. Pooled `DATABASE_URL` for queries, `DIRECT_URL` for migrations. Implement the schema in `prisma/schema.prisma` (starter provided).

**Accept:** migrate deploy succeeds against a Neon branch; a smoke query runs from a deployed function.

### 4. Row Level Security
RLS policies on every tenant table keyed on `current_setting('app.workspace_id')`. Repository layer sets it per transaction.

**Accept:** integration test — a query executed without the session variable returns **zero** rows, not all rows.

### 5. Metric fact table and partitioning
`metric_fact` per `ARCHITECTURE.md` §5.3, range-partitioned monthly, with the composite PK as idempotency key. A scheduled job creates partitions three months ahead. `metric_rollup_daily` and `metric_rollup_7d` tables plus refresh functions.

**Accept:** inserting the same fact row twice yields one row; a dashboard query hits only the rollup table (verify with `EXPLAIN`).

### 6. Redis and rate limiter
`@upstash/redis` (HTTP — **not** `ioredis`). `@upstash/ratelimit` with per-bucket limiter construction per `ARCHITECTURE.md` §6.

**Accept:** a test drives 200 concurrent calls against a 50/30s bucket and never exceeds it; header reconciliation overrides the local counter when they disagree.

### 7. QStash job harness
`/api/jobs/[task]` with `verifySignature`. A `defineJob()` helper providing: signature verification, idempotency claim, Redis entity lock, deadline-aware chunking, structured logging, DLQ-friendly error shaping. Queues named per platform.

**Accept:** a deliberately failing job lands in the DLQ with a readable payload; a chunked job resumes and completes; the same job fired 20× concurrently produces exactly one effect.

### 8. Auth and tenancy
Sign-up, sign-in, organizations, workspaces, members, roles per `ARCHITECTURE.md` §3.1. Server actions via `next-safe-action` with a Zod schema and a role assertion on every action.

**Accept:** a VIEWER cannot invoke an approve action; the attempt is logged.

---

## Milestone 1 — Design system (tasks 9–12)

### 9. Tokens and fonts
`globals.css` with the full token set from `DESIGN_SYSTEM.md` §2. Fonts via `next/font/google`: Bricolage Grotesque, Public Sans, IBM Plex Mono. Tailwind theme extension mapping tokens to utilities. Dark mode.

**Accept:** a token gallery page renders every token; automated contrast check passes for all text/background pairs in both modes.

### 10. Primitives
shadcn/ui init, then restyle every primitive to the tokens. 3–8px radii, 38px control height.

**Accept:** no default shadcn colour or radius survives; visual review against §2.

### 11. The Action Ledger
`ActionLedger`, `DiffRow`, `RiskBadge`, `ImpactEstimate` per `DESIGN_SYSTEM.md` §4. Three density modes.

**Accept:** renders identically in inbox, approval sheet and audit trail from the same props; unchanged fields show `—`; irreversible actions state so in the risk line; passes a colourblind simulation review — the diff is fully readable in greyscale.

### 12. Data components
`DataTable` (TanStack, virtualized, pinned first column, saved views, CSV export), `MetricStat`, `TimeSeriesChart`, `PacingGauge`, `AttributionToggle`, `FeeBreakdown`.

**Accept:** `DataTable` renders 5,000 rows at 60fps; every numeric cell uses `font-data` with tabular figures.

---

## Milestone 2 — Reddit adapter (tasks 13–19)

### 13. Schema generation pipeline
`scripts/schema-sync/reddit.ts` parsing the official Postman collection into `packages/platform-reddit/generated/schema.json`, then codegen to Zod, enums and a required-when map. Nightly CI job that opens a PR on diff.

**Accept:** `schema.json` is committed; regenerating produces no diff; a simulated upstream change fails CI.

### 14. OAuth and token vault
Reddit OAuth with envelope-encrypted token storage. **Refresh under a Redis lock inside a transaction** — Reddit rotates refresh tokens and a concurrent refresh permanently breaks the connection (`ARCHITECTURE.md` §10.2).

**Accept:** a test firing 10 concurrent refreshes for one connection leaves it working; a serialization guard throws if a token would cross the server boundary.

### 15. Adapter — reads
`listAccounts`, `syncCampaigns`, `syncAdGroups`, `syncAds`, `syncCreatives`, cursor-based, returning `SyncPage` with a rate-limit snapshot. `getCapabilities` using Reddit's Feature Access endpoint.

**Accept:** a full sync of a real account completes; every invocation stays under 60s; a mid-sync interruption resumes from cursor.

### 16. Reporting sync
`fetchReport` writing to `metric_fact` with the composite idempotency key. Daily grain first, hourly where available. 90-day backfill via Upstash Workflow chunked by date window.

**Accept:** re-running a window changes no row counts; rollups refresh after each sync; `SyncState` reflects reality.

### 17. Account Center
Connection cards, sync status, capability list, tracking health, deep-links for API-unavailable operations.

**Accept:** a stale connection is visibly stale with `lastSuccessAt`; a missing capability renders an explained empty state, not a broken control.

### 18. Dashboard
Spend, CPA, ROAS, CTR, CVR over selectable ranges. Pacing. Breakdowns by geo, placement and audience. All reads hit rollups.

**Accept:** p95 dashboard load under 800ms on a 40-campaign account.

### 19. Tracking Doctor
`TrackingHealth` per `ARCHITECTURE.md` §9. Reddit-specific: detect ad groups and CBO campaigns missing `conversion_pixel_id` (required from 13 July 2026) and flag as blocking.

**Accept:** an account with a broken pixel shows `BROKEN`; the policy engine refuses conversion-optimizing actions while it does.

---

## Milestone 3 — Action engine (tasks 20–24)

### 20. Policy engine
Guardrails from `ARCHITECTURE.md` §7.3, risk banding §7.4, approval routing by role. Guardrails evaluate centrally; a proposing tool cannot bypass them.

**Accept:** a 40% budget increase is blocked by the 25% cap; a conversion action is blocked when tracking is degraded; the kill switch halts everything queued.

### 21. Action lifecycle
Full `Action` record with all ten retained artifacts. `previousState` captured **inside the execution**, immediately before the write. Idempotency key per §7.2.

**Accept:** property test — apply then rollback restores `previousState` exactly, for every action kind.

### 22. Recommendation Inbox
Six recommendation types for Reddit: waste finder · budget reallocator · underfunded winner · overspending loser · creative fatigue · pacing drift. Each produces evidence, confidence, impact with a stated `basis`, and a risk band.

**Accept:** every recommendation renders as an `ActionLedger` with no field blank; every number in the evidence traces to a metric-store query.

### 23. Approval and apply
`ApprovalSheet`, typed confirmation for HIGH, bulk action bar with aggregate impact and risk, rollback with a disabled-and-explained state when not reversible.

**Accept:** applying shows the real platform response; the audit trail is append-only and immutable; a failed apply surfaces the platform's own error message, not a generic one.

### 24. Automation rules
Rule engine with thresholds, cooldowns, caps and approval requirements. Rules propose; they never bypass the policy engine.

**Accept:** a rule firing twice within its cooldown produces one action; a rule cannot escalate its own risk band.

---

## Milestone 4 — Campaign Studio, Reddit (tasks 25–28)

### 25. Rule engine for conditional constraints
`packages/platform-core/rules.ts` per `CAMPAIGN_FLOWS.md` §3, with `because` mandatory on every rule. Reddit rule set encoded, including the two dated changes.

**Accept:** every rule renders a user-facing explanation; no rule lacks `because`.

### 26. FlowStepper and live narrowing
Objective → settings → targeting → creative → review. `narrowedOptions` filters select options live; `forbiddenNow` fields are removed from the DOM, not CSS-hidden.

**Accept:** it is impossible to construct an invalid combination through the UI; keyboard-only users see the same option set as mouse users.

### 27. Three-stage validation
Local → adapter dry-run → platform validator where available. Submit enables only when all pass. `PayloadPreview` and `LaunchQA`.

**Accept:** 10,000 generated valid drafts all pass dry-run; generated invalid drafts are all blocked locally with zero network calls.

### 28. Edit mode
`captureState` baseline, immutable fields locked with explanations, PATCH semantics sending only changed fields.

**Accept:** editing does not clobber fields changed elsewhere since the last sync.

---

## Milestone 5 — AI layer (tasks 29–31)

### 29. Provider abstraction and read-only tools
`packages/ai/` with a swappable provider. Tool surface is read-only queries against the normalized store. No credentials, no write tools.

**Accept:** a test asserts the tool registry exposes zero mutating tools.

### 30. Explanation layer
The model explains a pre-computed evidence bundle. All arithmetic in TypeScript. Output parsed with Zod; parse failure rejects the turn.

**Accept:** an automated check flags any number in model output that is absent from the input bundle; the check runs in CI against a fixture set.

### 31. Natural-language analyst
Answers performance questions from normalized data, always returning the underlying query and row count alongside the answer.

**Accept:** every answer is traceable to a query the user can inspect.

---

## Milestone 6 — Launch readiness (tasks 32–36)

### 32. Contract tests
Nightly replay of a recorded request corpus against Reddit; response-shape diff fails CI. This is the changelog-monitoring mechanism.

### 33. Observability
Sentry with `workspaceId`/`platform` tags. Structured job logs. The four dashboards and four alerts from `ARCHITECTURE.md` §11.

### 34. Billing
Stripe. Tiers per the research doc, with the Solo tier scoped to launched platforms only. **Before finalising prices, complete the unit-economics model** — Agency Pro at $499 for 100 accounts is $4.99/account against per-account AI and storage cost.

### 35. Onboarding
Connect → first sync with visible progress → first recommendation. The first sync is the highest-churn moment in the product; it must never look like a hung spinner.

### 36. Security review
Token boundary guard · RLS coverage across all tenant tables · CSP with nonces · log redaction · export and deletion per workspace · dependency scan in CI.

---

## Parallel track — access applications (do on day one)

All free, all with multi-week lead times, all blocking later phases:

1. **Reddit** — apply to the ads ecosystem partner program; get campaign-management API access confirmed **in writing**. Contact `adsapi-partner-support@reddit.com`. Access is officially "open to all developers" but reported as allow-listed in practice; this is the single largest schedule risk in the plan.
2. **Spotify** — create the app selecting "Ads API", accept the Ads API Terms against the client ID (~1h to allowlist), and **file the quota extension request for >25 users immediately** (up to 6 weeks review). Without it the product cannot exceed 25 tenants.
3. **Pinterest** — start Trial, then submit the Standard access demo video. Reviews run weeks with a real rejection rate; common causes are not showing the OAuth flow, vague app descriptions, and inaccessible privacy policies.
4. **Snap** — no application needed. This is why Snap is the contingency for Phase 1 if Reddit approval stalls.

---

## Things that will go wrong, and the mitigation already in the plan

| Failure | Mitigation | Task |
|---|---|---|
| Reddit refresh token rotation breaks a tenant permanently | Locked, transactional refresh | 14 |
| A retried QStash job double-applies a budget change | Idempotency claim + entity lock | 7, 21 |
| Fluid compute concurrency leaks state across tenants | Lint rule + `AsyncLocalStorage` | 2 |
| Platform adds an enum; campaigns fail at 3am | Committed `schema.json` + nightly diff + contract tests | 13, 32 |
| Dashboard degrades as data grows | Rollups, partitioning, `EXPLAIN` assertions | 5, 18 |
| Pinterest storage rule discovered at Phase 4 | Retention policy enforced in the repository from task 3 | 3 |
| Spotify v3 sunset mid-build | Version isolated in adapter; subscribe to release notes | 15 |
| An AI hallucination becomes a spend change | Read-only tools; no arithmetic; Zod-parsed proposals; policy engine | 29, 30, 20 |

---

## Start here

```
Task 1 → Task 2 → Task 3
```

and file the four access applications in parallel today.
