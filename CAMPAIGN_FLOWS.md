# CAMPAIGN FLOWS

How Campaign Studio guarantees that every field combination it can produce is one the platform will accept.

---

## 1. The problem, stated precisely

"Match the API docs so all combinations work" cannot be achieved by a developer reading documentation and writing a form. There are hundreds of conditional rules across four platforms — `mobile_app_id` is required only when the objective is `APP_INSTALLS`; `video_delivery_formats` is forced to `OPT_IN` for video-views campaigns; `PODCAST` placement cannot be selected alone; Reddit ad groups require `conversion_pixel_id` from 13 July 2026. Hand-written validation drifts from the platform within weeks and fails at submission time, in front of a customer, with an opaque 400.

**The design goal is therefore: make invalid combinations unrepresentable, and derive the rules from the platform rather than from a person.**

Three mechanisms, in order of reliability:

1. **Generate** the base schema from the platform's own artifact (§2).
2. **Encode** conditional rules as a declarative rule set, not scattered `if` statements (§3).
3. **Verify** continuously with contract tests and a dry-run against the platform's own validation (§4).

---

## 2. Schema generation — never hand-write an enum

### Sources per platform

| Platform | Artifact | Method |
|---|---|---|
| Spotify | Public reference for `v3.0` (`createCampaign`, `createAdSet`, `createAd`, `createAsset`, `estimateBid`, `estimateAudience`) | Scrape the reference into an OpenAPI-shaped JSON, then codegen |
| Reddit | **Official Postman collections** — one for Ads API v3, one for v2 (Conversions API) | Parse the collection; it carries request bodies and enum examples |
| Snap | Marketing API reference | Scrape to JSON, codegen |
| Pinterest | v5 API reference (each endpoint documents its rate-limit category too — capture it) | Scrape to JSON, codegen |

### Pipeline

```
scripts/schema-sync/<platform>.ts
   ↓  fetch artifact, normalize
packages/platform-<p>/generated/schema.json      ← committed, diffable
   ↓  codegen
packages/platform-<p>/generated/zod.ts           ← Zod schemas
packages/platform-<p>/generated/enums.ts         ← const objects + types
packages/platform-<p>/generated/capabilities.ts  ← field → required-when map
```

**`schema.json` is committed.** Its diff in a pull request *is* the changelog. When Reddit adds an objective enum, the diff shows it and CI fails the contract test until someone handles it. This replaces "monitor the changelog" as a manual chore — which nobody does reliably — with a mechanism.

Run `schema-sync` nightly in CI. A non-empty diff opens a PR automatically.

### Rule

> No file outside `generated/` may contain a platform enum literal. Enforce with an ESLint rule that flags string literals matching known enum patterns in non-generated platform code.

---

## 3. Conditional rules as data

Generated schemas capture *types*. They do not capture *"this field is required only when that field has this value."* Those go in a declarative rule set per platform, evaluated by one shared engine.

```ts
// packages/platform-core/rules.ts
export type FieldRule =
  | { kind: 'requiredWhen';   field: string; when: Predicate; because: string }
  | { kind: 'forbiddenWhen';  field: string; when: Predicate; because: string }
  | { kind: 'allowedValues';  field: string; when: Predicate; values: string[]; because: string }
  | { kind: 'defaultsTo';     field: string; when: Predicate; value: unknown }
  | { kind: 'immutableAfterCreate'; field: string; because: string }
  | { kind: 'range';          field: string; when?: Predicate; min?: number; max?: number; because: string }
  | { kind: 'crossField';     fields: string[]; assert: (v: Draft) => boolean; because: string };
```

**`because` is mandatory on every rule.** It is rendered verbatim in `CombinationWarning` and in the `FieldGroup` "why is this required" affordance. A validation message that says "invalid" teaches the user nothing; one that says *"Spotify requires a mobile app because the campaign objective is App installs"* teaches them the platform.

The engine returns, for any partial draft:

```ts
type DraftEvaluation = {
  valid: boolean;
  requiredNow: FieldPath[];       // must fill before advancing
  forbiddenNow: FieldPath[];      // hide or disable
  narrowedOptions: Record<FieldPath, string[]>;  // filter select options live
  violations: { field: FieldPath; because: string }[];
  immutable: FieldPath[];         // lock in edit mode
};
```

### How this makes invalid states unrepresentable

The stepper re-evaluates on **every** change and uses `narrowedOptions` to filter the select options themselves. If the objective is Video views, the `video_delivery_formats` control does not offer `IN_STREAM` — it is not disabled with an error, it is simply absent, with a one-line note explaining why. The user cannot construct the invalid combination in the first place.

`forbiddenNow` fields are removed from the DOM, not hidden with CSS, so keyboard and screen-reader users get the same reality.

---

## 4. Three-stage validation

| Stage | When | What |
|---|---|---|
| **Local** | On every keystroke/change | Generated Zod schema + rule engine. Zero network. |
| **Adapter dry-run** | On entering the Review step | `adapter.validateAction()` — full payload assembled and checked against schema + capability manifest + policy guardrails |
| **Platform estimate** | On entering the Review step | Where the platform offers a non-mutating validator, call it. Spotify's `estimateAudience` / `estimateBid` will reject invalid targeting combinations without creating anything — use them as a free conformance check and show the audience size as a bonus. |

Only after all three pass does the Submit control enable. Submission itself goes through the **Action engine** (`ARCHITECTURE.md` §7) as a `HIGH` risk action — campaign creation always creates new spend.

---

## 5. Spotify — worked flow

Spotify's public reference is the most complete of the four, so it is specified concretely here as the reference implementation. **Every field below must still be confirmed against `generated/schema.json`; this is the shape, not the source of truth.**

Hierarchy: **Business → Ad Account → Campaign → Ad Set → Ad → Asset**
Partner base URL: `https://api-partner.spotify.com/ads/v3/`

### Step 1 — Campaign

| Field | Notes |
|---|---|
| `name` | 2–120 chars |
| `objective` | Known values include `CLICKS`, `VIDEO_VIEWS`, `PODCAST_STREAMS`, `WEB_TRAFFIC`, `APP_INSTALLS`, plus reach/impression goals. **Immutable after create.** |
| `purchase_order` | Optional, appears on invoices, **immutable** |

> ⚠️ The v3 guide's example body uses `delivery_goal_group` (e.g. `AWARENESS`) while the release notes describe `objective`. Reconcile against `generated/schema.json` before implementing — do not guess.

Cascading consequences to encode as rules:

- `objective = APP_INSTALLS` → `adSet.mobile_app_id` **required**; advertiser must have an MMP integration (Kochava or AppsFlyer are the accepted partners).
- `objective = WEB_TRAFFIC` → Spotify Pixel required on the account.
- `objective = CLICKS` → `bid_strategy` may be `COST_PER_RESULT`, where `bid_micro_amount` behaves as a target CPC. For every other objective, `COST_PER_RESULT` is **forbidden**.
- `objective = VIDEO_VIEWS` → `video_delivery_formats` locked to `OPT_IN`.
- `objective = CLICKS` + video ad set → `video_delivery_formats` locked to `IN_STREAM`.

### Step 2 — Ad Set

| Field | Constraint |
|---|---|
| `name` | 2–120 chars |
| `asset_format` | `AUDIO` \| `VIDEO` \| `IMAGE` |
| `placements` | **Required.** `MUSIC` \| `PODCAST`. **`PODCAST` cannot be selected alone** and is market-dependent. (v3 replaced `exclude_placements` — include, don't exclude.) |
| `budget` | `{ type: DAILY \| LIFETIME, micro_amount }`. Minimum lifetime budget ≈ $250. Validate minimum bid too. |
| `bid_strategy` | `MAX_BID` \| `COST_PER_RESULT` (conditional, above) |
| `bid_micro_amount` | Required |
| `pacing` | `PACING_ASAP` \| `PACING_EVEN`. **Immutable after create** — lock in edit mode. |
| `start_date_time` | ≥ 1 hour in the future |
| `end_date_time` | Max duration 365 days; may be shortened on update (v2+ relaxed this) |
| `frequency_caps` | Optional. Defaults to max: 5/day, 35/week, 50/month |
| `mobile_app_id` | Required iff `APP_INSTALLS` |
| `dataset_id` | Optional, wires up conversion measurement |
| `video_delivery_formats` | `IN_STREAM` \| `OPT_IN`, constrained by objective (above) |
| `ad_category` | From `GET /ad_categories`; some categories carry restrictions |
| `targets` | See below |

`targets` object:

```
geo_targets: { country_code, regions[], dmas[], cities[], postal_codes[] }   // all IDs are strings
genders[]            // renamed from gender_names
platforms[]          // defaults to ["ANDROID","DESKTOP","IOS"] if omitted
age min/max          // max 99
language[]
interest_ids[]       // from getInterestTargets → interests_with_subtargets
artist / genre / playlist ids
podcast_episode_topic_ids[]
sensitive_topic_exclusions: { filter_option: STANDARD | PARTIAL | LIMITED | RESTRICTED }
audience_ids[] , audience_ids_exclusions[]
```

Encode: postal-code lookup accepts up to 1,000 IDs per request. Geo target IDs are **strings**, not integers — a v2→v3 breaking change that silently coerces wrong if typed as numbers.

Historical constraint to verify: v1.4 allowed only one country per ad set. Confirm whether v3 still enforces it before building the geo picker as multi-country.

### Step 3 — Ad

| Field | Constraint |
|---|---|
| `assets.asset_id` | Required — the audio/video/image asset |
| `assets.companion_asset_id` | Required companion image |
| `assets.logo_asset_id` | Optional |
| `assets.canvas_asset_id` | Optional; **audio ad sets only**, forbidden when `asset_format = VIDEO` |
| `advertiser_name` | Required (renamed from `brand_name`) |
| `tagline` | Max 140 chars |
| `call_to_action` | `{ key, clickthrough_url, language }`. `key` values include `LEARN_MORE`, `ORDER_NOW`, `WATCH_NOW` — take the full list from generated enums. Languages include English, Danish, Dutch, Finnish, Norwegian, Swedish, Japanese and others. |
| `third_party_tracking` | `{ measurement_partner: DCM \| IAS \| UNSET, url }` |
| `delivery` | `ON` \| `OFF` |

### Step 4 — Assets

- `asset_type`: `AUDIO` \| `VIDEO` \| `IMAGE`
- `aspect_ratio` is a **string enum**: `HORIZONTAL_16_9`, `HORIZONTAL_1_91_1`, `SQUARE`, `VERTICAL_9_16` (was a double in v2 — another silent-coercion trap)
- `asset_subtype` required for some types; check generated schema
- **Uploads ≥25 MB must use the chunked flow**: `startUploadChunkedAsset` → `transferChunkedAsset` (repeat) → `completeUploadChunkedAsset`. Audio and video will routinely exceed 25 MB, so implement chunked upload in Phase 2, not as a later fix. On Vercel, chunk the transfer through an Upstash Workflow so a large upload survives function duration limits.

### Not available via API — must deep-link to Ads Manager

Managing users, and managing billing/payment. Account Center renders these as outbound links with an explanation, never as broken forms.

---

## 6. Reddit — flow skeleton (Phase 1)

Generate the concrete schema from the official Postman collection before implementing. Confirmed constraints to encode now:

- **From 13 July 2026: `conversion_pixel_id` is required on ad groups and CBO campaigns.** This is a hard blocker in `LaunchQA` and a first-class Tracking Doctor issue. Any draft without it cannot advance past the settings step.
- **From 21 September 2026: onsite Lead Generation forms are sunset.** Lead generation campaigns require Reddit Pixel or CAPI. Campaign Studio must not offer onsite lead forms for start dates on or after that date, and the Objective Migration Agent should detect existing lead-gen campaigns and produce a migration plan. Reddit deletes onsite lead data after 90 days, so the migration flow should prompt an export first.
- **Reddit Max** is limited-availability — gate behind `capabilities.features.redditMax`.
- **New objective enums and `use_catalog` for SALES objectives** are reported for 21 September 2026 but unverified. Do not implement against guessed names; wait for the schema diff.

Hierarchy: **Ad Account → Campaign → Ad Group → Ad**. Reddit-specific targeting includes communities (subreddits), interests, geo and audiences — the Community Fit Advisor consumes the same target lists the builder uses.

**Scope check:** any feature reading post or comment content belongs to the Reddit **Data API**, which is separately gated, priced (~$0.24 / 1,000 calls), and prohibits model training on Reddit content. Campaign Studio must not depend on it.

---

## 7. Snap and Pinterest — flow skeletons

**Snap** (Phase 3). Hierarchy: **Organization → Ad Account → Campaign → Ad Squad → Ad → Creative.** Note the terminology: *Ad Squad*, mapped to `AdGroupLike`. OAuth scopes are separate per capability — `snapchat-marketing-api`, `snapchat-offline-conversions-api`, `snapchat-profile-api` — so the connection flow must request only what the workspace's enabled features need, and the capability manifest is derived from granted scopes.

**Pinterest** (Phase 4). Hierarchy: **Ad Account → Campaign → Ad Group → Ad (Pin).** Additional flow stages for keyword targeting, catalogs and product groups. Two constraints that shape the builder:

1. **Trial access creates sandbox entities visible only to their creator.** Testing under Trial does not reflect production. Label the environment prominently in the UI when `capabilities.features.pinterestStandardAccess === false`.
2. **The storage restriction applies during campaign creation too.** Draft state may hold Pinterest data in memory and in a short-TTL cache, but a half-finished Pinterest campaign draft must not persist fetched Pin, catalog or trend data to Postgres. Drafts store user-entered values and external IDs only.

---

## 8. Edit mode and immutability

Editing an existing entity is a different flow from creating one:

1. `adapter.captureState()` fetches the live entity — never trust the last sync for an edit baseline.
2. The rule engine returns `immutable[]`; those controls render locked with the `because` text as a tooltip. Spotify's `pacing`, `objective` and `purchase_order` are examples.
3. Only changed fields go into `proposedPayload`. Spotify uses PATCH semantics for partial updates; sending a full object risks clobbering fields changed in the UI since the last sync.
4. The Action Ledger diff is computed against the freshly captured state, and unchanged fields render as `—`.

---

## 9. Acceptance criteria

Campaign Studio is done for a platform when:

- [ ] `generated/schema.json` exists, is committed, and is regenerated nightly in CI.
- [ ] No platform enum literal appears outside `generated/`.
- [ ] Every conditional rule carries a user-facing `because` string.
- [ ] A property test generates 10,000 random valid drafts; **100%** pass adapter dry-run.
- [ ] A property test generates known-invalid drafts; **100%** are blocked locally, before any network call.
- [ ] Every immutable field is locked in edit mode with an explanation.
- [ ] `PayloadPreview` shows the exact JSON that will be sent.
- [ ] Submission routes through the Action engine as a `HIGH` risk action with a captured `previousState`.
- [ ] A schema diff in CI fails the build until explicitly acknowledged.
