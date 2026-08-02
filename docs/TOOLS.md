# TOOLS CATALOG

The product is a **tool suite over a normalized cross-platform store**. Tools are
data-driven: the registry (`apps/web/lib/tools-registry.ts`) is the single source
of truth. Adding a tool = one registry entry + one analysis function in
`packages/recommendations` or `packages/metrics`. NavRail, the Tools index, search
(command bar) and per-tool pages all render from the registry, so the catalog
scales without touching layout code.

Sources merged here:
- **BUILD_PLAN / research doc** — the core optimization OS tools.
- **handyAds** (sibling Apple Ads app) — shipped, proven tool + flow patterns.
- **Reacher (reacherapp.com)** — transferable ideas from a TikTok-Shop affiliate
  tool: a natural-language data Agent, P&L / true-profitability reporting,
  competitive/social intelligence, an auto creative-brief agent, CRM-style
  pipeline tracking, and an API + MCP surface for customer integrations.

Every tool carries: `category`, `platforms[]`, `phase`, `status`
(`live | soon | gated`), and (where relevant) a `capabilityFlag` so
limited-availability features render as explained empty states, never broken
controls.

---

## Categories

| Category | What it answers |
|---|---|
| **Diagnostics** | "What is wrong / what changed?" |
| **Optimization** | "What should change next, and what's the impact?" |
| **Creative** | "What creative is working, and what to make next?" |
| **Measurement** | "Is my conversion tracking trustworthy?" |
| **Management** | "Build / edit / bulk-operate campaigns safely." |
| **Reporting** | "Show me performance, profitability, attribution." |
| **Intelligence** | "Benchmark, research competitors, ask questions." |
| **Cross-platform** | "Decisions that span platforms." |

---

## Cross-platform (Phase 5 unless noted)

| Tool | Origin | Notes |
|---|---|---|
| Morning Brief | research + handyAds Suggestions/Dashboard | Ranked action ledgers by urgency; the home screen. Phase 1. |
| Recommendation Inbox | research | Six live Reddit rec types in Phase 1; every rec is an Action Ledger. |
| Recommendation Outcome Tracker | research + Reacher CRM | Pipeline: detected -> proposed -> approved -> applied -> observed -> evaluated. |
| Natural-Language Analyst ("Ask") | research + Reacher Agent | Answers over normalized store; always returns the query + row count. |
| Profitability / P&L | Reacher P&L + Pinterest fee rule | Media spend, platform fee (separated), conversions, net — never one blended figure. |
| Competitive Intelligence Board | Reacher social-intel + Snap Ads Gallery | Benchmark top performers; research-only, no data resale. |
| Creative Intelligence Agent | Reacher creative agent | Analyzes top-performing creatives -> auto creative briefs. Excludes Pinterest assets (retention). |
| Budget Portfolio Optimizer | research | Allocate budget across platforms; Pinterest signal must not drive off-platform targeting. |
| Cross-Platform Creative Transfer | research | One concept -> platform-native variants. |
| Cross-Platform Fatigue Map | research | Tracks concepts, not asset IDs. |
| Unified Tracking Doctor | research | Consumes Snap event-quality + Spotify dataset diagnostics natively. |
| Cross-Platform Change History | research + handyAds | Correlate config changes with performance shifts. |
| Account Health Benchmarking | research | A client's own accounts over time. |
| Agency Command Center | research + handyAds shared-dashboards | Clients ranked by urgency; white-label reporting; shareable read-only dashboards. |
| API + MCP surface | Reacher API/MCP | Let customers connect their normalized data to external AI/BI. Scalability play. |
| Autopilot Levels | research + handyAds autopilot | insight -> one-click -> low-risk auto -> approved daily plan -> bounded autonomy. |

## Reddit (Phase 1)

Management: multi-account dashboard, campaign/ad-group/ad builder + editor, bulk
budget/status editor, cross-account duplication, templates, saved-audience
manager, targeting explorer, CBO wizard (gated), feature-access inspector,
objective-migration assistant, launch QA, suspension monitor.

Diagnostics (handyAds analogs in parens): account/campaign health score, CPA/ROAS
trends, budget pacing (BudgetPacingCard), projected spend (ProjectedSpendCard),
spend/conversion/CTR/CVR anomalies (PpcInvestigator), performance change
(PerformanceChangeCard), asset-level performance, geo/placement/audience analysis
(TopPlacements), agency exception dashboard.

Optimization (handyAds optimize suite analogs): waste finder (negative-finder),
budget reallocator (budget-pacing/bid-optimizer), underfunded-winner detector,
overspending-loser detector, performance decay (weekday/day-parting), consolidation,
low-volume detector, automated pause/scale rules, opportunity scoring, keyword/
n-gram-style analysis where Reddit exposes it.

Creative: fatigue detector, headline/asset analysis, community-post promotion
finder, Reddit-native tone critic, hook generator, creative test matrix, refresh
calendar, landing-page/message-mismatch.

Measurement: Pixel/CAPI health, missing `conversion_pixel_id` detector (blocking
from 13 Jul 2026), event-drop alerts, conversion lag, UTM/tracking auditor.

Reddit AI: Community Fit Advisor, Reddit-Native Tone Critic, Community Post
Promotion Finder, **Objective Migration Agent** (21 Sep 2026 lead-gen sunset -
highest near-term value), Reddit Max Comparator (gated), Context Sensitivity Guard,
Conversation-to-Creative Brief (Data-API scope check required).

## Spotify (Phase 2), Snap (Phase 3), Pinterest (Phase 4)

Per research doc catalogs; each registered with its `phase` and `capabilityFlag`.
Pinterest tools that assume persisted visual data (Visual Intent Classifier, Pin
Variant Factory, Catalog Gap Finder) are **on-demand only** (retention rule).

---

## Scalability contract

1. **Registry-driven UI** — nav, index, search, routing all read the registry.
2. **Analysis is separate from presentation** — mirrors handyAds `optimize/ui.tsx`
   (presentation-only) vs analysis logic. Tools compute in `packages/*`, render in
   `packages/ui` + app pages.
3. **Everything a recommendation produces is an Action Ledger** and flows through
   the one Action engine (ARCHITECTURE.md sec 7) — no tool writes to a platform directly.
4. **Capability-gated** — a tool the connection can't do renders an explained empty
   state via `CapabilityGate`.
5. **Per-platform retention** enforced in the repository, not per-tool.
