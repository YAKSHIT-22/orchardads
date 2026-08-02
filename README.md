# Emerging Ads Optimization OS — Build Spec

**Codename:** `adsos` · **Commercial launch name:** RedditPilot (Phase 1)
**Spec date:** 27 July 2026
**Target reader:** Claude Code, starting from an empty repo.

---

## Read these in order

| # | File | What it settles |
|---|---|---|
| 1 | `ARCHITECTURE.md` | Runtime model, serverless redesign, data model, adapter contract, rate limiting, action engine, security |
| 2 | `DESIGN_SYSTEM.md` | Tokens, typography, component inventory, UI patterns, copy rules |
| 3 | `CAMPAIGN_FLOWS.md` | Per-platform campaign creation flows, capability matrix, how "all combinations match the API docs" is *enforced* rather than hand-written |
| 4 | `BUILD_PLAN.md` | Sequenced, acceptance-tested task list — start here once 1–3 are understood |
| 5 | `prisma/schema.prisma` | Starter database schema |

---

## The one thing that changed from the research doc

The research doc specified **NestJS + BullMQ + Temporal + ClickHouse**. The deployment target is now **Vercel + Upstash + Neon**. Those are incompatible:

- BullMQ needs a long-lived worker process holding a Redis connection. Vercel has no long-lived processes.
- `ioredis` (used in OrchardAds) opens TCP connections and leaks them across serverless invocations. Use `@upstash/redis` (HTTP) instead.
- Temporal needs a worker fleet.
- ClickHouse is not in the stack.

`ARCHITECTURE.md` §2 replaces all four with Vercel-native equivalents. **Do not reintroduce them.**

---

## Non-negotiable engineering rules

1. **Never hand-write a platform enum.** Every objective, placement, CTA key, aspect ratio and bid strategy is generated from the platform's own schema or Postman collection into `packages/platform-*/generated/`. Hand-written enums drift silently and produce campaigns the API rejects at 3am. See `CAMPAIGN_FLOWS.md` §2.
2. **Every write is a `ProposedAction` first.** No code path calls a platform write endpoint directly. See `ARCHITECTURE.md` §7.
3. **The AI never holds credentials and never executes.** It emits structured proposals that deterministic code validates. See `ARCHITECTURE.md` §8.
4. **Retention policy is per-platform, enforced in code.** Pinterest prohibits storing anything beyond campaign analytics for the connected account. See `ARCHITECTURE.md` §5.4.
5. **Idempotency on every job.** QStash retries on failure; without idempotency keys a retried budget change applies twice.
6. **Capability-gate every feature.** Reddit Max, Spotify reserved buying and Pinterest Trends are all limited-availability. Query the capability manifest, never assume.

---

## Environment variables

```bash
# Database (Neon)
DATABASE_URL=                 # pooled, for app queries
DIRECT_URL=                   # direct, for migrations

# Cache + rate-limit state (Upstash Redis, HTTP)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Jobs (Upstash QStash)
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Token vault
TOKEN_ENCRYPTION_KEY=         # 32-byte base64; AES-256-GCM data key
TOKEN_ENCRYPTION_KEY_PREVIOUS= # for rotation

# Auth
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=

# Platform OAuth
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SNAP_CLIENT_ID=
SNAP_CLIENT_SECRET=
PINTEREST_CLIENT_ID=
PINTEREST_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=

# Observability
SENTRY_DSN=
```

---

## Pinned versions (verified 27 July 2026)

| Package | Version | Note |
|---|---|---|
| `next` | `16.2.11` | Active LTS. 15.5.x is Maintenance LTS, EOS 21 Oct 2026 — do not start on 15. |
| `react` / `react-dom` | `19.x` | Required by Next 16 |
| `typescript` | `5.x` | `strict: true`, `noUncheckedIndexedAccess: true` |
| `prisma` / `@prisma/client` | `6.x` | Driver adapter for Neon serverless |
| `@neondatabase/serverless` | latest | HTTP/WebSocket driver |
| `@upstash/redis` | latest | **HTTP client — not `ioredis`** |
| `@upstash/ratelimit` | latest | Distributed limiter |
| `@upstash/qstash` | latest | Queue, cron, DLQ |
| `@upstash/workflow` | latest | Durable multi-step orchestration |
| `zod` | `4.x` | All boundary validation |
| `@tanstack/react-query` | `5.x` | Server state |
| `@tanstack/react-table` | `8.x` | Dense tables |
| `next-safe-action` | latest | Typed server actions with Zod |
| `shadcn/ui` | CLI latest | Radix primitives, owned source |
| `recharts` | `2.x` | Charts |
| `@vercel/functions` | latest | `waitUntil` |
| `@sentry/nextjs` | latest | Errors + tracing |

Confirm each with `npm show <pkg> version` before installing; patch numbers move weekly.

---

## Repo shape

```
adsos/
├── apps/web/                     # Next.js 16 App Router — the only deployable
│   ├── app/
│   │   ├── (marketing)/
│   │   ├── (app)/                # authenticated shell
│   │   └── api/
│   │       ├── jobs/[task]/      # QStash consumers
│   │       ├── workflows/[name]/ # Upstash Workflow endpoints
│   │       ├── cron/[schedule]/  # Vercel Cron entrypoints
│   │       └── oauth/[platform]/
│   └── components/
├── packages/
│   ├── core/                     # domain types, normalized model, result types
│   ├── db/                       # Prisma schema + client + repositories
│   ├── platform-core/            # AdsPlatformAdapter contract, capability manifest
│   ├── platform-reddit/
│   ├── platform-spotify/
│   ├── platform-snap/
│   ├── platform-pinterest/
│   ├── metrics/                  # rollups, idempotency, aggregation
│   ├── recommendations/          # rule + anomaly + pacing engines
│   ├── automation/               # rule evaluation, cooldowns, caps
│   ├── policy-engine/            # validation, guardrails, approval routing
│   ├── ai/                       # provider abstraction, tool defs, prompts
│   └── ui/                       # design system components
├── docs/                         # these spec files
└── turbo.json
```

Single Vercel project. `apps/web` is the only deployable; packages are workspace libraries compiled by Turbopack.

---

## Definition of done for Phase 1

A user can:

1. Sign up, create a workspace, connect a Reddit ad account via OAuth.
2. See a first sync complete with a visible progress state, not a spinner that never resolves.
3. Open a dashboard showing spend, CPA, CTR, CVR and pacing for the last 30 days.
4. See a Recommendation Inbox with at least six live recommendation types, each with evidence, a confidence band, an estimated impact and a risk band.
5. Preview any recommendation as a before/after diff.
6. Apply it, and see the resulting platform response, the previous state, and a rollback option in the audit trail.
7. Build a Reddit campaign end to end in Campaign Studio where every field combination is validated against the generated schema *before* submission, and invalid combinations are impossible to submit.
