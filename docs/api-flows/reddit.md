# Reddit Ads API v3 — Backend Reference

> **Sourcing note.** The official docs host (`ads-api.reddit.com/docs/v3`) and the
> JS-rendered Reddit Ads Help Center (`business.reddithelp.com`) were **not reachable**
> from this environment (host blocked / CSS-only shell returned). Every claim below is
> therefore corroborated from **multiple independent secondary sources** (integration
> vendor docs: dltHub, Stitchflow, Domo, Fivetran, Supermetrics, Dataddo; the official
> Postman collection listing) plus the caller-supplied dated facts. Confidence is graded
> per claim:
>
> - **[V]** — verified: agreed by 2+ independent sources and/or a stated authoritative fact.
> - **[P]** — partial: single secondary source or plausible-but-incomplete.
> - **[U]** — unverified: inferred from convention / could not confirm value.
>
> Re-verify anything **[P]/[U]** against the live docs (`Settings → API Access` in Reddit
> Ads Manager, or the official Postman collection) before shipping. No field-level schema
> could be read directly from Reddit.

---

## 1. Auth

| Item | Value | Conf |
|---|---|---|
| Base URL (Ads API) | `https://ads-api.reddit.com/api/v3` | [V] |
| Authorization endpoint | `https://www.reddit.com/api/v1/authorize` | [V] |
| Token endpoint | `https://www.reddit.com/api/v1/access_token` | [V] |
| Auth scheme | OAuth 2.0 Bearer token in `Authorization: Bearer <token>` header | [V] |
| Grant types | `authorization_code` (3-legged), `refresh_token`; `client_credentials` also referenced | [P] |
| Access-token TTL | ~3600 s (1 hour) | [P] |
| Client auth at token endpoint | HTTP Basic with `client_id:client_secret` (standard Reddit OAuth) | [P] |

**Key distinction [V]:** authentication runs through Reddit's *core* OAuth infrastructure
(`www.reddit.com/api/v1/...`), **not** the `ads-api.reddit.com` host. You mint tokens on
the core host and call the Ads API host with them.

### Scopes [V]

| Scope | Grants |
|---|---|
| `ads:read` | GET operations — accounts, campaigns, ad groups, ads, reporting, user associations. |
| `ads:manage` | POST / PATCH / DELETE — create & mutate entities, manage account users. |

### Token lifecycle — refresh-token ROTATION [P] (call-out)

**Reddit ROTATES refresh tokens.** When you exchange a refresh token via the
`refresh_token` grant, the response can return a **new refresh token** that supersedes the
one you sent; the old one is invalidated. Integrations **must persist the refresh token
returned on every refresh**, not just the one obtained at initial authorization. Treating
the original refresh token as static will break the connection after the first rotation.
Request offline/permanent access (`duration=permanent` on the authorize call) to obtain a
refresh token at all. [P — rotation is documented Reddit core-OAuth behavior; confirm exact
rotation trigger against live docs.]

Flow summary:
1. Redirect ad-account owner to `authorize` with `client_id`, `response_type=code`,
   `state`, `redirect_uri`, `duration=permanent`, `scope=ads:read ads:manage`.
2. Exchange `code` at `access_token` → `{ access_token, refresh_token, expires_in, scope }`.
3. On 401 / near expiry, POST `grant_type=refresh_token` → **store the (possibly new)
   `refresh_token`** and the fresh `access_token`.

---

## 2. Entity hierarchy

```
Ad Account ── Campaign ── Ad Group ── Ad ── (references) Creative
```

| Tier | Resource name (path segment) | Notes | Conf |
|---|---|---|---|
| Ad Account | `ad_accounts` | Top container; most calls are nested under `/accounts/{account_id}` or `/ad_accounts/{id}`. | [V] |
| Campaign | `campaigns` | Holds objective + (optionally) budget when CBO. | [V] |
| Ad Group | `ad_groups` | Holds targeting, bid/goal, schedule, budget (when ABO). | [V] |
| Ad | `ads` | Links an ad group to a creative + click URL / CTA. | [V] |
| Creative | `creatives` | Reusable media/post object referenced by ads. | [V] |
| (supporting) | `saved_audiences`, `pixels`, `funding_instruments`, `reports` | Audiences, conversion pixels, billing sources, reporting. | [V] |

Canonical account-scoped base for the tree: `.../api/v3/accounts/{account_id}/...` (a
sibling `ad_accounts` collection also exists at the top level). [P — exact nesting/segment
casing not confirmed field-by-field.]

---

## 3. Per-entity CRUD

> Paths below use the resource names verified from the dltHub source. The **HTTP-method →
> operation** mapping is the standard REST convention this API follows (GET list/read, POST
> create, PATCH update, DELETE delete) — confirmed for the `users` sub-resource by
> Stitchflow, assumed uniform elsewhere **[P]**. **Body field lists could not be read from
> the official schema and are [P]/[U].**

### Money / scale [U]

Currency amounts (budgets, bids) are expressed in the account currency's **minor units**
(e.g. cents) — value likely in **micro-currency (millionths) or minor units**; the exact
scale (`1e-2` vs `1e-6`) **could not be verified**. **Confirm before sending any budget/bid
value.** Account currency and timezone are properties of the ad account; default timezone is
UTC. [P for currency/timezone; U for the multiplier.]

### Campaign

| Op | Method + Path | Conf |
|---|---|---|
| Create | `POST /api/v3/accounts/{account_id}/campaigns` | [P] |
| Read | `GET /api/v3/accounts/{account_id}/campaigns/{campaign_id}` | [P] |
| List | `GET /api/v3/accounts/{account_id}/campaigns` | [V] |
| Update | `PATCH /api/v3/accounts/{account_id}/campaigns/{campaign_id}` | [P] |
| Delete | `DELETE /api/v3/accounts/{account_id}/campaigns/{campaign_id}` | [P] |

- **Required (create):** `name`, `objective`, `configured_status` (or defaults to paused). [P]
- **Optional:** `spend_cap` / lifetime cap, `funding_instrument_id`, CBO fields
  (`budget`/`daily_budget` + `budget_optimization` flag), `conversion_pixel_id` (see §5). [P]

### Ad Group

| Op | Method + Path | Conf |
|---|---|---|
| Create | `POST /api/v3/accounts/{account_id}/ad_groups` | [P] |
| Read | `GET /api/v3/accounts/{account_id}/ad_groups/{ad_group_id}` | [P] |
| List | `GET /api/v3/accounts/{account_id}/ad_groups` | [V] |
| Update | `PATCH /api/v3/accounts/{account_id}/ad_groups/{ad_group_id}` | [P] |
| Delete | `DELETE /api/v3/accounts/{account_id}/ad_groups/{ad_group_id}` | [P] |

- **Required (create):** `campaign_id`, `name`, `bid_strategy`/`bid_type`, `goal_type`
  + goal value, budget (when ABO), `start_time`, targeting. [P]
- **Conditionally required:** `bid_value` (manual strategies), `conversion_pixel_id`
  (from 13 Jul 2026 — see §5). [P]
- **Optional:** `end_time`, `placements`, frequency cap, targeting refinements
  (subreddits, interests, geo, device, OS). [P]

### Ad

| Op | Method + Path | Conf |
|---|---|---|
| Create | `POST /api/v3/accounts/{account_id}/ads` | [P] |
| Read | `GET /api/v3/accounts/{account_id}/ads/{ad_id}` | [P] |
| List | `GET /api/v3/accounts/{account_id}/ads` | [V] |
| Update | `PATCH /api/v3/accounts/{account_id}/ads/{ad_id}` | [P] |
| Delete | `DELETE /api/v3/accounts/{account_id}/ads/{ad_id}` | [P] |

- **Required (create):** `ad_group_id`, `creative_id` (or inline `post_id`), `name`. [P]
- **Optional:** `click_url` / `destination_url`, `call_to_action`, `event_trackers`
  (3rd-party pixels), preview settings. [P]

### Creative

| Op | Method + Path | Conf |
|---|---|---|
| Create | `POST /api/v3/accounts/{account_id}/creatives` | [P] |
| Read | `GET /api/v3/accounts/{account_id}/creatives/{creative_id}` | [P] |
| List | `GET /api/v3/accounts/{account_id}/creatives` | [V] |
| Update | `PATCH /api/v3/accounts/{account_id}/creatives/{creative_id}` | [P] |
| Delete | `DELETE /api/v3/accounts/{account_id}/creatives/{creative_id}` | [P] |

- **Required (create):** `type` (image/video/carousel/text), media reference
  (`asset_id`/`media_url`), `headline`/`title`. [P]
- **Optional:** `thumbnail`, `destination_url`, `call_to_action`, `subreddit`
  (posting community), brand/username. [P]
- Media is typically uploaded first (asset/upload endpoint) then referenced by id. [U]

Pagination: cursor-based via `after`, page size ≤ 100. [P]

---

## 4. Enums

> Values marked **[U]** are inferred from Reddit's ad-platform surface and vendor field
> lists, not read from the API schema.

### Objective [P/U]

| Value (likely API enum) | Marketing name | Conf |
|---|---|---|
| `BRAND_AWARENESS` / `REACH` | Awareness / Reach | [U] |
| `TRAFFIC` / `CLICKS` | Traffic | [U] |
| `VIDEO_VIEWABLE_IMPRESSIONS` / `VIDEO_VIEWS` | Video views | [U] |
| `APP_INSTALLS` | App installs | [U] |
| `CONVERSIONS` | Conversions | [P — value string "CONVERSIONS" seen in Ad Library API] |
| `LEAD_GENERATION` | Lead generation | [U] |
| `CATALOG_SALES` / dynamic product ads | Catalog / DPA | [U] |

### Status [P]

Reddit exposes **two** status fields on entities:
- `configured_status` — the value you set: `ACTIVE` / `PAUSED` (and `ARCHIVED`/`DELETED`). [P]
- `effective_status` — computed rollup incl. `PENDING`, `APPROVED`, `REJECTED`,
  `COMPLETED`, `ACTIVE`, `PAUSED`. [P]

### Placement [P/U]

| Value | Meaning | Conf |
|---|---|---|
| `FEED` | Home/main feed | [P] |
| `CONVERSATION` / `POST_COMMENTS` | Conversation (comments) placement | [P] |
| `COMMUNITY` | Community/subreddit surfaces | [U] |
| `ALL` | All eligible placements | [U] |

### Bid strategy / goal [P/U]

| `bid_strategy` value | Meaning | Conf |
|---|---|---|
| `MAXIMIZE_VOLUME` / `LOWEST_COST` | Auto / lowest cost | [P] |
| `BID_CAP` / `MANUAL` | Manual max bid (e.g. CPC cap) | [P] |
| `COST_CAP` / `TARGET_COST` | Cost-cap / target CPA | [U] |

| `goal_type` value | Meaning | Conf |
|---|---|---|
| `SPEND` (daily/lifetime budget) | Budget goal | [U] |
| `IMPRESSIONS` / `CLICKS` / `CONVERSIONS` | Optimization goal | [U] |
| `bid_type`: `CPC` / `CPM` / `CPV` / `CPA` | Billing/bid event | [P] |

### CTA (`call_to_action`) [P/U]

~13 options exist [P]. Likely set (mark unconfirmed): `SHOP_NOW`, `SIGN_UP`, `DOWNLOAD`,
`INSTALL`, `LEARN_MORE`, `GET_STARTED`, `SUBSCRIBE`, `CONTACT_US`, `APPLY_NOW`,
`GET_A_QUOTE`, `PLAY_NOW`, `VIEW_MORE`, `SEE_MENU`. [U — exact enum strings not verified.]

---

## 5. Conditional rules

| Rule | Detail | Conf |
|---|---|---|
| **`conversion_pixel_id` required — from 13 Jul 2026** | Schema change: **`conversion_pixel_id` becomes mandatory on all Ad Groups and on CBO (Campaign Budget Optimization) campaigns.** Integrations that create ad groups or CBO campaigns must supply it or creation fails. | **[V]** |
| **Onsite Lead Generation forms sunset — from 21 Sep 2026** | **Onsite (native) Lead Gen forms are no longer supported.** Lead-gen campaigns must use **Reddit Pixel or CAPI (Conversions API)** for tracking. Existing onsite lead data should be exported before the cutoff. | **[V]** |
| Objective = `CONVERSIONS` ⇒ pixel required | A conversion pixel / event must be attached to optimize for conversions. | [P] |
| Objective = `LEAD_GENERATION` ⇒ (post-21 Sep 2026) Pixel/CAPI required | Onsite form no longer valid; must wire Pixel/CAPI. | [V] (derived from the dated rule) |
| Manual `bid_strategy` ⇒ `bid_value` required | Auto/lowest-cost strategies omit it. | [P] |
| CBO campaign ⇒ budget lives on campaign, not ad group | ABO campaign ⇒ budget on ad group. Mutually exclusive. | [P] |
| App-install objective ⇒ app/store fields required | Mobile app id + store required. | [U] |

---

## 6. Reporting

| Item | Value | Conf |
|---|---|---|
| Endpoint | `POST /api/v3/accounts/{account_id}/reports` | [P] |
| Style | Report-request body (POST) rather than GET query; async job pattern likely for large ranges. | [P] |
| Data freshness / delay | Data accurate up to **~3 hours ago** (e.g. a 6 PM pull returns through ~3 PM). | [P] |
| Default timezone | UTC (account timezone applies to grain buckets). | [P] |

**Request body (typical fields) [P/U]:** `starts_at`/`ends_at` (or relative window),
`time_zone_id`, `breakdowns` (grouping dimensions), `fields`/`metrics`, `filters`, `group_by`.

**Grains [P]:** `DAY` (daily) and `HOUR` (hourly) are both supported; hourly windows are
capped to shorter date ranges than daily. Exact max span per grain **[U]** — confirm limits
(a common pattern is hourly ≤ a few days, daily ≤ ~ a year per request).

**Metrics [P]** (from vendor field lists): `impressions`, `reach`, `clicks`, `spend`
(account currency + USD), `ecpm`, `cpc`, `ctr`, `ecpa`; conversion metrics split
click-through vs view-through for `purchase`, `add_to_cart`, `add_to_wishlist`, `lead`,
`sign_up`, `search`, `view_content`, `page_visit`; `conversion_value`, avg value, cart size;
video metrics (views/quartiles) **[U]**.

**Breakdowns / dimensions [P]:** `campaign_id`/`name`, `ad_group_id`/`name`, `ad_id`/`name`,
`account`, `date`, `community`/`subreddit`, `country`, `device`/`os`, `gender`, `interest`,
`placement`. Ad status (`effective_status`, `configured_status`), click URL, `post_id`/URL,
event trackers also returned.

---

## 7. Rate limits

| Item | Value | Conf |
|---|---|---|
| Model | **Policy-based / per-OAuth-token**; exact thresholds not publicly fixed. | [V] |
| Practical baseline | ~**1 request / second** cited by connector vendors. | [P] |
| Over-limit response | HTTP **429**. | [V] |
| Headers to read dynamically | `X-RateLimit-Remaining`, `X-RateLimit-Reset`. | [P] |
| `Retry-After` | **Not reliably provided** — do not depend on it. | [P] |
| Recommended client | Read the `X-RateLimit-*` headers on every response and throttle from them; on 429 back off exponentially with jitter. | [V] (best-practice) |

**Do not hardcode a QPS.** Reddit tunes limits by policy; drive concurrency from the
returned `X-RateLimit-*` headers rather than a fixed constant.

---

## 8. Scope boundary — Ads API vs Data API

**Reading post/comment *content* is NOT part of the Ads API.** The Ads API
(`ads-api.reddit.com`) manages campaigns/ad groups/ads/creatives and returns *advertising*
metrics and ad-referenced `post_id`s — it does **not** serve arbitrary post/comment bodies,
subreddit listings, search, or user content. [V]

Anything that needs actual Reddit content (post/comment text, subreddit browsing,
full-text search, historical archives, firehose) is the **separate Reddit Data API**
(`oauth.reddit.com`), which is **commercially gated and metered**: [V]

- Commercial tier ≈ **$12,000/month for up to 50M calls**, overage ≈ **$0.24 / 1,000
  requests**. [V]
- Requires a use-case review (typically ~2–4 weeks), approval not guaranteed; content
  restrictions apply (NSFW, historical limits). [V]
- Free/non-commercial tier ≈ 100 QPM with OAuth, ~10 QPM without. [P]

**Flag:** any feature like "show the ad's underlying post text/comments", "monitor
brand mentions", "pull subreddit content for targeting research", or "sentiment on the
promoted thread" crosses into the **Data API** and needs that separate, paid, gated
access — budget and approval lead time accordingly.

---

## 9. Combinations matrix

> Objective → allowed placements / bid strategies / extra required fields.
> **[P/U]** — structural pattern from Reddit's ad surface; validate live before relying on it.

| Objective | Placements (allowed) | Bid strategy | Bill event (`bid_type`) | Extra required fields | Conf |
|---|---|---|---|---|---|
| Awareness / Reach | Feed, Conversation | Auto / lowest-cost | CPM | — | [U] |
| Traffic / Clicks | Feed, Conversation | Auto, Manual (bid cap) | CPC | `click_url` | [P] |
| Video views | Feed, Conversation | Auto, Manual | CPV / CPM | video creative | [U] |
| App installs | Feed, Conversation | Auto, Manual | CPC / CPI | app id + store, MMP tracking | [U] |
| Conversions | Feed, Conversation | Auto, Manual, Cost-cap | CPC / CPM / oCPM | **`conversion_pixel_id`** + optimization event (§5) | [P] |
| Lead generation | Feed, Conversation | Auto, Manual | CPC / CPM | **Pixel/CAPI from 21 Sep 2026** (onsite form removed); pre-cutoff: lead form | [V] for the dated constraint |
| Catalog / DPA | Feed, Conversation | Auto, Manual | CPC / CPM | product catalog + pixel | [U] |

**Cross-cutting (all objectives):** from **13 Jul 2026**, ad groups and CBO campaigns
require **`conversion_pixel_id`** regardless of objective. [V]

---

### Open items to confirm against live docs
1. Money multiplier (micro vs minor units) — **[U]**, blocking for any budget/bid write.
2. Exact enum strings for objective / bid_strategy / goal_type / placement / CTA — **[U/P]**.
3. Exact create-body required-field sets per entity — **[P]**.
4. Reporting request schema, per-grain date-range caps, async job semantics — **[P/U]**.
5. HTTP method mapping for create/update/delete on each resource (assumed REST) — **[P]**.
