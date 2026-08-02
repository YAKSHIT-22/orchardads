# Pinterest Ads API (v5) — Backend Reference

> Confidence markers: **[V]** verified against the official v5 OpenAPI spec / docs · **[P]** partially verified / inferred from spec text · **[U]** unverified.
>
> **Primary sources**
> - OpenAPI spec (authoritative): `github.com/pinterest/api-description` — **latest tag `v5.28.0`, released 2026-07-15** (verified). Raw: `https://raw.githubusercontent.com/pinterest/api-description/v5.28.0/v5/openapi.yaml`
> - Rate limits: `https://developers.pinterest.com/docs/reference/rate-limits/`
> - Access tiers: `https://developers.pinterest.com/docs/key-concepts/access-tiers/`
> - Developer guidelines (compliance): `https://policy.pinterest.com/en/developer-guidelines`
> - Ads use case: `https://developers.pinterest.com/usecase/ads/`

All schema/enum/endpoint facts below are extracted from spec **v5.28.0** unless noted.

---

## 1. Auth

### Base URL
| Item | Value | Conf |
|------|-------|------|
| Base URL | `https://api.pinterest.com/v5` | [V] |
| Authorization URL | `https://www.pinterest.com/oauth/` | [V] |
| Token URL (issue + refresh) | `https://api.pinterest.com/v5/oauth/token` | [V] |

### OAuth 2.0 flow
- Grant type: **Authorization Code** (`pinterest_oauth2` security scheme). [V]
- Standard exchange: redirect user to the authorization URL with `client_id`, `redirect_uri`, `response_type=code`, and space-delimited `scope`; exchange the returned `code` at the token URL for an `access_token` + `refresh_token`. [V for endpoints; P for parameter mechanics]
- **Token refresh cycle**: access tokens are short-lived; obtain a new access token by POSTing to the token URL with `grant_type=refresh_token` and the stored `refresh_token`. The refresh token itself is long-lived. Exact TTLs are not in the spec — treat access token ~ hours, refresh token ~ long-lived (rotate on expiry). [P]
- A separate **`conversion_token`** bearer scheme applies **only** to `POST /ad_accounts/{ad_account_id}/events` (conversion events); that token is generated in Ads Manager, not via OAuth. [V]

### Scopes (OAuth) — full list from spec [V]
| Scope | Grants |
|-------|--------|
| `ads:read` | See all advertising data (ads, ad groups, campaigns, etc.) |
| `ads:write` | Create, update, delete ads / ad groups / campaigns |
| `catalogs:read` | See catalogs data |
| `catalogs:write` | Create, update, delete catalogs data |
| `billing:read` | See billing data / profile |
| `billing:write` | Create, update, delete billing data |
| `pins:read` / `pins:write` (+ `pins:read_secret` / `pins:write_secret`) | Read / write Pins (needed to promote a Pin as an ad) |
| `boards:read` / `boards:write` (+ `*_secret` variants) | Read / write Boards |
| `user_accounts:read` / `user_accounts:write` | Read / update user account + followers |

> For a pure ads-management integration the working set is typically: `ads:read`, `ads:write`, plus `catalogs:read`/`catalogs:write` for shopping and `pins:read` to reference promotable Pins. [P]

### Access Tiers — Trial vs Standard [V from access-tiers doc]
| | Trial (Sandbox) | Standard |
|---|---|---|
| Content visibility | All Pins/Boards created are **Sandbox entities visible only to their creator** | Created content is publicly visible |
| Rate limiting model | **Per day, per app** (coarse) | **Per minute, per user, per app** (granular; see §7) |
| Request ceiling | Doc states "calls per day/per app"; commonly cited as **~1000 requests/day** | 100 req/s universal + per-category limits |
| Upgrade requirement | Valid privacy policy + clear app description | **Demo video** showing the app completing an action via the API, proving correct **OAuth flow** and **no sensitive-data storage** |

> Common Standard-tier denials: demo video does not show the authentication flow, no live Pinterest integration shown, or credentials are collected instead of using OAuth tokens. [V]
> Note: the exact "1000 req/day" trial figure is [P] — the official doc says "calls per day/per app" without publishing the number; treat 1000/day as the widely-cited working value.

---

## 2. Entity Hierarchy

```
Ad Account (ad_account_id)
  └─ Campaign            /ad_accounts/{ad_account_id}/campaigns
       └─ Ad Group       /ad_accounts/{ad_account_id}/ad_groups   (campaign_id)
            └─ Ad (Pin)  /ad_accounts/{ad_account_id}/ads         (ad_group_id, pin_id)

Cross-cutting (ad-account scoped):
  • Keywords   /ad_accounts/{ad_account_id}/keywords     (targeting; parent = campaign or ad group)
  • Audiences  /ad_accounts/{ad_account_id}/audiences
  • Bulk       /ad_accounts/{ad_account_id}/bulk/upsert | /bulk/download | /bulk/{id}

Catalog side (merchant scoped, not under ad_account):
  • Catalogs        /catalogs, /catalogs/feeds, /catalogs/items
  • Product Groups  /catalogs/product_groups  ← referenced by SHOPPING/CATALOG_SALES ads
```
All IDs are numeric strings. An Ad promotes an existing **Pin** (`pin_id`), it does not create Pin creative itself. [V]

---

## 3. Per-Entity CRUD

Money note: **all monetary fields are integers in micro-currency of the ad account's currency** — i.e. value × 1,000,000. Example: `5000000` = 5.00 units; `bid: 200000` = 0.20 units. Applies to `budget_in_micro_currency`, `bid_in_micro_currency`, `daily_spend_cap`, `lifetime_spend_cap`, keyword `bid`, etc. [V]

### 3.1 Campaign
| Operation | Method + Endpoint | Conf |
|-----------|-------------------|------|
| List | `GET /ad_accounts/{ad_account_id}/campaigns` | [V] |
| Get | `GET /ad_accounts/{ad_account_id}/campaigns/{campaign_id}` | [V] |
| Create (array) | `POST /ad_accounts/{ad_account_id}/campaigns` | [V] |
| Update (array) | `PATCH /ad_accounts/{ad_account_id}/campaigns` | [V] |

**Create — required:** `ad_account_id`, `name`, `objective_type`. [V]
**Optional:** `status` (default `ACTIVE`), `daily_spend_cap` **or** `lifetime_spend_cap` (mutually exclusive — cannot set both), `start_time`/`end_time` (unix seconds; CBO only), `order_line_id`, `tracking_urls`, `is_flexible_daily_budgets`, `default_ad_group_budget_in_micro_currency`, `is_automated_campaign`. [V]

### 3.2 Ad Group
| Operation | Method + Endpoint | Conf |
|-----------|-------------------|------|
| List | `GET /ad_accounts/{ad_account_id}/ad_groups` | [V] |
| Get | `GET /ad_accounts/{ad_account_id}/ad_groups/{ad_group_id}` | [V] |
| Create (array) | `POST /ad_accounts/{ad_account_id}/ad_groups` | [V] |
| Update (array) | `PATCH /ad_accounts/{ad_account_id}/ad_groups` | [V] |

**Create — required:** `campaign_id`, `name`, `billable_event`. [V]
**Conditionally required (see §5):** `budget_in_micro_currency`, `bid_in_micro_currency`, `optimization_goal_metadata`, `end_time`. [V]
**Optional:** `status`, `budget_type` (default `DAILY`), `start_time`, `targeting_spec`, `auto_targeting_enabled` (default true; "expanded targeting"), `placement_group` (default `ALL`), `pacing_delivery_type` (default `STANDARD`), `bid_strategy_type`, `lifetime_frequency_cap`, `tracking_urls`. [V]

### 3.3 Ad
| Operation | Method + Endpoint | Conf |
|-----------|-------------------|------|
| List | `GET /ad_accounts/{ad_account_id}/ads` | [V] |
| Get | `GET /ad_accounts/{ad_account_id}/ads/{ad_id}` | [V] |
| Create (array) | `POST /ad_accounts/{ad_account_id}/ads` | [V] |
| Update (array) | `PATCH /ad_accounts/{ad_account_id}/ads` | [V] |

**Create — required:** `ad_group_id`, `pin_id`, `creative_type`. [V]
**Optional:** `name` (≤255 chars), `status`, `destination_url`, `click_tracking_url`, `tracking_urls`, carousel fields (`carousel_destination_urls`, `carousel_android_deep_links`, `carousel_ios_deep_links`). `android_deep_link`/`ios_deep_link` are **not currently available** (using them errors). [V]

### 3.4 Keywords (targeting)
| Operation | Method + Endpoint | Conf |
|-----------|-------------------|------|
| Get | `GET /ad_accounts/{ad_account_id}/keywords` | [V] |
| Create | `POST /ad_accounts/{ad_account_id}/keywords` | [V] |
| Update | `PATCH /ad_accounts/{ad_account_id}/keywords` | [V] |
| Metrics | `GET /ad_accounts/{ad_account_id}/keywords/metrics` | [V] |

**Create body — required:** `parent_id` (advertiser / campaign / ad group; pattern `^((AG)|C)?\d+$`) and `keywords[]`. **Each keyword — required:** `value` (≤120 chars) + `match_type`. Optional per keyword: `bid` (micro-currency; inherits from parent ad group if null). [V]

### 3.5 Audiences
| Operation | Method + Endpoint | Conf |
|-----------|-------------------|------|
| List / Get | `GET /ad_accounts/{ad_account_id}/audiences` · `.../audiences/{audience_id}` | [V] |
| Create | `POST /ad_accounts/{ad_account_id}/audiences` (custom: `.../audiences/custom`) | [V] |
| Update | `PATCH /ad_accounts/{ad_account_id}/audiences/{audience_id}` | [V] |

**Create — required:** `audience_type`. [V]

### 3.6 Catalogs / Product Groups
| Operation | Method + Endpoint | Conf |
|-----------|-------------------|------|
| Product groups list / create | `GET` / `POST /catalogs/product_groups` | [V] |
| Product group get / update / delete | `GET`/`PATCH`/`DELETE /catalogs/product_groups/{product_group_id}` | [V] |
| Product group counts | `GET /catalogs/product_groups/{product_group_id}/product_counts` | [V] |
| Catalogs / feeds / items | `GET/POST /catalogs`, `/catalogs/feeds`, `/catalogs/items`, `/catalogs/items/batch` | [V] |
| Product groups under an ad account (analytics/list) | `GET /ad_accounts/{ad_account_id}/product_groups/analytics`, `.../product_groups/catalogs` | [V] |

Product-group create requires `catalog_type`, `name`, and filter criteria. [P]

### 3.7 Bulk endpoints
| Operation | Method + Endpoint | Notes | Conf |
|-----------|-------------------|-------|------|
| Bulk upsert | `POST /ad_accounts/{ad_account_id}/bulk/upsert` | Create/update campaigns, ad groups, ads, keywords, product groups in one async request | [V] |
| Bulk download | `POST /ad_accounts/{ad_account_id}/bulk/download` | Request export of entities by `entity_types` | [V] |
| Bulk status | `GET /ad_accounts/{ad_account_id}/bulk/{bulk_request_id}` | Poll async job result | [V] |

---

## 4. Enums (from v5.28.0 spec)

### objective_type [V]
`AWARENESS`, `CONSIDERATION`, `WEB_CONVERSION`, `CATALOG_SALES`, `VIDEO_COMPLETION`, `SALES`, `APP_INSTALL`, `CTV_CONSIDERATION` (BETA).
Deprecated: `WEB_SESSIONS`, `VIDEO_VIEW` (use `VIDEO_COMPLETION`). [V]

### status / EntityStatus [V]
`ACTIVE`, `PAUSED`, `ARCHIVED`, `DRAFT`, `DELETED_DRAFT`. (Default on campaign create: `ACTIVE`.)

### bid_strategy_type [V]
`AUTOMATIC_BID`, `MAX_BID`, `TARGET_AVG`, `null`.

### billable_event (ActionType) [V]
`CLICKTHROUGH`, `IMPRESSION`, `VIDEO_V_50_MRC`.

### budget_type [V]
`DAILY`, `LIFETIME`, `CBO_ADGROUP`.

### creative_type [V]
`REGULAR`, `VIDEO`, `SHOPPING`, `CAROUSEL`, `MAX_VIDEO`, `SHOP_THE_PIN` (deprecated → `COLLECTION`), `COLLECTION`, `IDEA`, `SHOWCASE`, `QUIZ`, `COLLAGE`.

### placement_group (PlacementGroupType) [V]
`ALL` (default), `SEARCH`, `BROWSE`, `OTHER`.

### Targeting types (keys of `targeting_spec`) [V]
`AGE_BUCKET`, `GENDER`, `LOCALE`, `LOCATION`, `GEO`, `INTEREST`, `APPTYPE`, `AUDIENCE_EXCLUDE`, `SHOPPING_RETARGETING`, `TARGETING_STRATEGY`.
Example: `{"APPTYPE":["iphone"], "GENDER":["male"], "LOCALE":["en-US"], "LOCATION":["501"], "AGE_BUCKET":["25-34"]}`.

### Keyword match_type (MatchType) [V]
`BROAD`, `PHRASE`, `EXACT`, `EXACT_NEGATIVE`, `PHRASE_NEGATIVE`.

### audience_type (AudienceType) [V]
`CUSTOMER_LIST`, `VISITOR`, `ENGAGEMENT`, `ACTALIKE`, `PERSONA`.

### pacing_delivery_type [V]
`STANDARD` (default), `ACCELERATED` [P — second value inferred].

---

## 5. Conditional Rules (required-when)

| Rule | Detail | Conf |
|------|--------|------|
| Campaign budget XOR | `daily_spend_cap` and `lifetime_spend_cap` cannot both be set | [V] |
| CBO campaign budget | If `objective_type` ∈ CBO set, budget must be set at **campaign** level (`daily_spend_cap`/`lifetime_spend_cap` required); ad groups then use `budget_type = CBO_ADGROUP`. CBO limited to ≤70 ad groups. | [V] spec text; [P] exact CBO objective set — spec v5.12 listed `AWARENESS, CONSIDERATION, WEB_CONVERSION, CATALOG_SALES` as CBO objectives |
| Non-CBO ad-group budget | `budget_in_micro_currency` is **REQUIRED** for non-CBO campaigns | [V] |
| Ad-group bid required-when | `bid_in_micro_currency` **REQUIRED** for objective/billable_event combos: `AWARENESS/IMPRESSION`, `CONSIDERATION/CLICKTHROUGH`, `CATALOG_SALES/CLICKTHROUGH`, `VIDEO_VIEW/VIDEO_V_50_MRC` | [V] |
| Conversion optimization | `optimization_goal_metadata` **REQUIRED** when campaign `objective_type = WEB_CONVERSION` | [V] |
| LIFETIME budget | `end_time` **REQUIRED** when `budget_type = LIFETIME` | [V] |
| Frequency cap | `lifetime_frequency_cap` **REQUIRES** `end_time`; only valid for CPM (IMPRESSION billable_event) ad groups | [V] |
| Objective updates | Only **draft** campaigns may change `objective_type`; only draft ad groups may change `billable_event`/`budget_type` | [V] |
| Shopping / catalog | `SHOPPING` / `COLLECTION` `creative_type` and `CATALOG_SALES` / `SALES` objectives require a connected **catalog** and its **product_groups**; the product group is the promoted unit and must exist (`/catalogs/product_groups`) before the ad references it | [P] |

---

## 6. CRITICAL Compliance Constraints (Developer Guidelines) — verbatim [V]

These are contractual and directly shape data-model and UI code. Quoted from `policy.pinterest.com/en/developer-guidelines`.

**(a) Storage restriction — the load-bearing one:**
> "Except for campaign analytics information accessed about your account, you may not store any information accessed through any Pinterest Materials including the API."

Implication: do **not** persist campaign/ad-group/ad/audience/catalog/keyword objects, tokens-derived data, or any API response — **except campaign analytics for the connected account**. Everything else must be fetched live and held transiently.

**(b) Multi-touch attribution alongside last-click:**
> "If you report last-click attribution metrics, next to them with equal prominence you must show multi-touch metrics that divide attribution equally among each attributed service."

**(c) Platform fees shown separately from media spend:**
> "Clearly and separately show the fees you charge for Pinterest advertising and the fees that Pinterest charges (both the absolute amount and by billing metrics, like CPM or CPC), and don't combine your fees with ours."

**(d) No off-platform targeting with Pinterest data:**
> "Using information from Pinterest to target people with advertising outside of Pinterest, whether directly or bundled with third-party data." — (listed as prohibited conduct)

**(e) No selling / sharing API data:**
> "Don't share or sell information from our API with a third party, including another advertising service."

---

## 7. Rate Limits (Standard access) [V from rate-limits doc]

Each category is an **independent counter** — separate quota pools, tracked per **user, per app**. Categories do not draw from a shared bucket.

| Category | Limit | Window |
|----------|-------|--------|
| Universal (all requests) | **100 req/s** | per second, per user, per app |
| `ads_read` | **1,000** | per minute |
| `ads_write` | **400** | per minute |
| `ads_analytics` | **300** | per minute |
| `advanced_auction_read` | **50** | per minute |
| `advanced_auction_write` | **25** | per minute |
| `catalogs_read` | **100** | per minute |
| `catalogs_write` | **100** | per minute |
| `trends_read` | **60** | per minute |

**Trial access** is limited coarsely at **calls per day, per app** (commonly cited ~1000/day — figure is [P]; the doc states the model, not the number).

Monitor via response headers: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`. [V]

---

## 8. Combinations Matrix — objective → bid strategy / targeting / required fields

Rows below combine spec `objective_type` descriptions with the ad-group conditional rules in §5. Bid-strategy allowances beyond the spec enum are [P]/[U] (the spec enumerates strategies but does not publish a per-objective allow-table).

| objective_type | Budget model | Typical billable_event | Bid required? | Allowed bid_strategy_type | Extra required fields | Conf |
|----------------|--------------|------------------------|---------------|---------------------------|-----------------------|------|
| `AWARENESS` | CBO (campaign-level) | `IMPRESSION` (CPM) | Yes (AWARENESS/IMPRESSION) | `AUTOMATIC_BID`, `MAX_BID` [P] | campaign budget | [V]/[P] |
| `CONSIDERATION` | CBO | `CLICKTHROUGH` (CPC) | Yes (CONSIDERATION/CLICKTHROUGH) | `AUTOMATIC_BID`, `MAX_BID` [P] | campaign budget | [V]/[P] |
| `VIDEO_COMPLETION` | Ad-group [P] | `VIDEO_V_50_MRC` | [P] | `AUTOMATIC_BID`, `MAX_BID` [P] | video creative | [P] |
| `WEB_CONVERSION` | Ad-group / CBO [P] | `CLICKTHROUGH` | [P] | `AUTOMATIC_BID`, `TARGET_AVG` [P] | **`optimization_goal_metadata` (conversion tag)** | [V] for opt-goal req |
| `CATALOG_SALES` | CBO | `CLICKTHROUGH` | Yes (CATALOG_SALES/CLICKTHROUGH) | `AUTOMATIC_BID`, `MAX_BID` [P] | connected **catalog + product_groups**, `SHOPPING`/`COLLECTION` creative | [V]/[P] |
| `SALES` | [P] | `CLICKTHROUGH` [P] | [P] | [P] | conversion tracking + likely catalog | [P] |
| `APP_INSTALL` | [P] | `CLICKTHROUGH` [P] | [P] | [P] | app deep-link config | [U] |
| `CTV_CONSIDERATION` (BETA) | [P] | video [P] | [P] | [P] | CTV video creative | [U] |

Targeting (`targeting_spec`) is objective-agnostic in the schema — any objective can specify `AGE_BUCKET`, `GENDER`, `LOCATION`, `INTEREST`, `AUDIENCE_EXCLUDE`, etc. Keyword targeting (`match_type`) attaches to search-eligible ad groups (`placement_group` including `SEARCH`); `SHOPPING_RETARGETING` targeting pairs with catalog objectives. [P]

---

### Verification summary
- Endpoints, required fields, and all enums in §3–§5: **[V]** — read directly from OpenAPI **v5.28.0** (latest, 2026-07-15).
- Rate limits (§7) and compliance quotes (§6): **[V]** — official docs, verbatim.
- Per-objective bid-strategy allow-table (§8) and CBO objective set: **[P]/[U]** — not published as a table by Pinterest; validate against a live sandbox ad account before relying on it.
