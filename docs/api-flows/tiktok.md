# TikTok Marketing API (v1.3) — Authoritative Flow Reference

> Scope: TikTok API for Business / Marketing API, version **v1.3**.
> Base URL: `https://business-api.tiktok.com/open_api/v1.3`
> Portal docs: https://business-api.tiktok.com/portal/docs

## Confidence legend

| Tag | Meaning |
|-----|---------|
| **[V]** | Verified — sourced from official TikTok material (portal docs, official `tiktok/tiktok-business-api-sdk` field specs) reviewed for this reference. |
| **[P]** | Probable — corroborated by multiple reputable secondary sources (integration vendors, SDK mirrors) but not confirmed word-for-word against the official portal in this pass. Treat as reliable but verify enum spelling before hard-coding. |
| **[U]** | Unverified — inferred, historically true, or from a single/lower-quality source. Must be confirmed against the live portal before relying on it. |

> General rule: **verify every exact enum string against the live "Enumeration" page in the portal before shipping.** TikTok periodically renames enums (e.g. the legacy `APP_INSTALL`/`CONVERSIONS` objectives were superseded by `APP_PROMOTION`/`WEB_CONVERSIONS`).

---

## 1. Authentication & OAuth

### 1.1 Flow overview [V]

1. Register an app in the TikTok for Business developer portal to obtain **`app_id`** and **`secret`**. [V]
2. Redirect the advertiser to the **authorization URL** so they can grant your app access to their ad accounts. [V]
3. TikTok redirects back to your `redirect_uri` with an **`auth_code`** query parameter (and your `state` echoed back). [V]
4. Exchange `auth_code` server-to-server for a long-lived **access token** plus the list of authorized `advertiser_ids`. [V]
5. Send the access token on **every** subsequent request via the **`Access-Token`** request header. [V]

### 1.2 Authorize URL [V]

```
https://business-api.tiktok.com/portal/auth?app_id={APP_ID}&state={STATE}&redirect_uri={REDIRECT_URI}
```

| Param | Required | Notes |
|-------|----------|-------|
| `app_id` | yes | Your app's ID. [V] |
| `state` | recommended | Opaque CSRF/round-trip value; echoed back to your redirect. [V] |
| `redirect_uri` | yes | Must exactly match a redirect URI whitelisted in the app config. [V] |
| `rid` / scope params | context | Some app configs append `rid`/`scope`; the redirect target and scopes are set in the app dashboard, not always as query params. [U] |

**Redirect back** carries `auth_code` (some responses also include `code`) and your `state`:
```
{REDIRECT_URI}?auth_code={AUTH_CODE}&code={AUTH_CODE}&state={STATE}
```
The `auth_code` is short-lived and single-use. [P]

### 1.3 Token exchange [V]

`POST /open_api/v1.3/oauth2/access_token/` — body is **JSON** (`Content-Type: application/json`).

| Body field | Required | Notes |
|------------|----------|-------|
| `app_id` | yes | [V] |
| `secret` | yes | App secret. [V] |
| `auth_code` | yes | The code from the redirect. Note: field is `auth_code` (not `code`) for the Marketing API. [V] |

Response `data` typically contains:

| Field | Notes |
|-------|-------|
| `access_token` | Bearer credential, sent as `Access-Token` header (see below). [V] |
| `advertiser_ids` | Array of ad accounts this token can manage. [V] |
| `scope` | Granted permission scopes (array). [P] |
| `refresh_token` | Present for token types that support refresh. [P] |
| `expires_in` / `refresh_token_expires_in` | Lifetimes in seconds, when returned. [P] |

### 1.4 The `Access-Token` header — NOT `Bearer` [V]

Authenticated calls carry the token in a **custom header**, not the HTTP `Authorization: Bearer` scheme:

```
Access-Token: {access_token}
Content-Type: application/json
```

Using `Authorization: Bearer ...` will **not** authenticate against the Marketing API. [V]

### 1.5 Token lifetime & refresh [P/U]

- Historically, TikTok **Marketing API access tokens are long-lived / effectively non-expiring** for standard business apps (unlike the 24h creator/Login-Kit tokens). Many app configurations therefore never need a refresh cycle. **[P]**
- Where a refresh token is issued, refresh via `POST /open_api/v1.3/oauth2/refresh_token/` with `{app_id, secret, refresh_token, grant_type: "refresh_token"}`. **[P]**
- The 24h access-token / 1yr refresh-token figures seen in some SDK notes describe the **creator/Login-Kit** tokens, not necessarily the advertiser Marketing-API token. Confirm the exact lifetime for your app type in the portal. **[U]**
- Tokens are revoked if the advertiser removes access or the app is unauthorized. **[P]**

### 1.6 Sandbox vs production apps [P/U]

| Aspect | Production app | Sandbox |
|--------|----------------|---------|
| OAuth flow | Full advertiser authorization required. [V] | No OAuth round-trip; a sandbox access token is generated directly in the portal. [P] |
| Base URL | `https://business-api.tiktok.com/open_api/v1.3` [V] | Same base URL; requests are scoped to the sandbox `advertiser_id` + sandbox token. [P] |
| Credentials | Real `app_id`/`secret`, real `advertiser_ids`. [V] | Portal-issued sandbox advertiser + token. [P] |
| Spend/delivery | Real ads, real money. [V] | No real delivery, no billing; for structural/API validation only. [P] |

See §9 for sandbox details.

---

## 2. Entity hierarchy & core read endpoints

```
Business Center (bc_id)
  └─ Advertiser  (advertiser_id)   ← ad account, currency, timezone
       └─ Campaign (campaign_id)   ← objective, optional CBO budget
            └─ Ad Group (adgroup_id) ← targeting, budget, bid, schedule, optimization
                 └─ Ad (ad_id)      ← wraps a Creative (video/image + copy + CTA + identity)
```
[V]

| Purpose | Method + Path | Notes |
|---------|---------------|-------|
| List advertisers granted to app | `GET /open_api/v1.3/oauth2/advertiser/get/` | Params: `app_id`, `secret` (+ `Access-Token` header). Returns authorized ad accounts. [V] |
| Advertiser details | `GET /open_api/v1.3/advertiser/info/` | Params: `advertiser_ids` (array), `fields`. Returns currency, timezone, status, etc. [V] |
| List/read campaigns | `GET /open_api/v1.3/campaign/get/` | Params: `advertiser_id`, `filtering`, `fields`, `page`, `page_size`. [V] |
| List/read ad groups | `GET /open_api/v1.3/adgroup/get/` | Params: `advertiser_id`, `filtering`, `fields`, `page`, `page_size`. [V] |
| List/read ads | `GET /open_api/v1.3/ad/get/` | Params: `advertiser_id`, `filtering`, `fields`, `page`, `page_size`. [V] |

`filtering` is a JSON object (e.g. `{"campaign_ids": ["..."]}`, `{"primary_status": "STATUS_DELIVERY_OK"}`). List reads are paginated with `page` (default 1) / `page_size` and return a `page_info` block. [P]

---

## 3. Per-entity fields

### 3.1 Money model [V]

- **Budgets and bids are DECIMAL strings/numbers in the ad account's currency** — e.g. `"50.00"` means 50 units of `advertiser` currency. **They are NOT micro-units** (contrast Google/Meta). [V]
- The account currency comes from `advertiser/info/`. Format values with 2 decimal places. [P]
- Minimum budgets/bids vary by currency, objective and budget_mode; enforced server-side. [P]

### 3.2 Campaign — `POST /open_api/v1.3/campaign/create/` [V]

| Field | Req | Type | Notes |
|-------|-----|------|-------|
| `advertiser_id` | yes | string | [V] |
| `campaign_name` | yes | string | [V] |
| `objective_type` | yes | string (enum) | Immutable after creation (see §5). [V] |
| `budget_mode` | cond | string (enum) | Required at campaign level when CBO is on. [P] |
| `budget` | cond | number (decimal) | Required when `budget_mode` is `BUDGET_MODE_DAY`/`BUDGET_MODE_TOTAL`. [P] |
| `budget_optimize_on` | opt | boolean | Campaign Budget Optimization (CBO) toggle; default `false`. [V] |
| `optimization_goal` | cond | string (enum) | Required when CBO (`budget_optimize_on=true`) is enabled. [P] |
| `bid_type` | opt | string (enum) | Used with CBO. [V] |
| `roas_bid` | opt | number | ROAS target when applicable. [V] |
| `campaign_type` | opt | string | e.g. regular vs. iOS14 dedicated. [V] |
| `app_promotion_type` | opt | string | App campaign sub-type. [V] |
| `deep_bid_type` | opt | string | Deep-event bidding. [V] |
| `operation_status` | opt | string (enum) | Default `ENABLE`. [V] |
| `special_industries` | opt | string[] | Regulated-category declaration. [V] |
| `rf_campaign_type` | opt | string | Reach & Frequency campaigns. [V] |

### 3.3 Ad Group — `POST /open_api/v1.3/adgroup/create/` [V]

| Field | Req | Type | Notes |
|-------|-----|------|-------|
| `advertiser_id` | yes | string | [V] |
| `campaign_id` | yes | string | [V] |
| `adgroup_name` | yes | string | [V] |
| `promotion_type` | cond | string (enum) | The thing being advertised (website/app/etc.). [V] |
| `placement_type` | opt | string (enum) | Default `PLACEMENT_TYPE_NORMAL`. [V] |
| `placements` | cond | string[] | Required when `placement_type` = `PLACEMENT_TYPE_NORMAL`. [P] |
| `budget_mode` | yes | string (enum) | [V] |
| `budget` | cond | number (decimal) | Required unless `BUDGET_MODE_INFINITE` or CBO-managed. [P] |
| `schedule_type` | yes | string (enum) | `SCHEDULE_START_END` or `SCHEDULE_FROM_NOW`. [V] |
| `schedule_start_time` | yes | string | `YYYY-MM-DD HH:MM:SS` (account timezone). [V] |
| `schedule_end_time` | cond | string | Required when `schedule_type=SCHEDULE_START_END`. [P] |
| `optimization_goal` | yes | string (enum) | [V] |
| `billing_event` | yes | string (enum) | [V] |
| `bid_type` | opt | string (enum) | [V] |
| `bid_price` | cond | number (decimal) | Required for custom bid types (see §5). [P] |
| `conversion_bid_price` | cond | number (decimal) | For oCPM conversion optimization. [P] |
| `deep_bid_type` | opt | string (enum) | Deep-funnel event bidding. [V] |
| `pacing` | yes | string (enum) | Delivery speed. [V] |
| `pixel_id` | cond | string | Required for web-conversion optimization. [P] |
| `optimization_event` | cond | string | Conversion event to optimize for. [P] |
| `app_id` | cond | string | Required for app-promotion goals. [P] |
| `location_ids` | opt | string[] | Geo targeting. [V] |
| `age_groups` | opt | string[] | e.g. `AGE_13_17` … `AGE_55_100`. [P] |
| `gender` | opt | string (enum) | `GENDER_MALE`/`GENDER_FEMALE`/`GENDER_UNLIMITED`. [P] |
| `operation_status` | opt | string (enum) | Default `ENABLE`. [V] |

### 3.4 Ad — `POST /open_api/v1.3/ad/create/` [V]

| Field | Req | Type | Notes |
|-------|-----|------|-------|
| `advertiser_id` | yes | string | [V] |
| `adgroup_id` | yes | string | [V] |
| `creatives` | yes | object[] | Array of creative objects (`AdCreateCreatives`). [V] |

Each **creative** object (fields corroborated, treat spelling as [P] unless noted):

| Field | Req | Notes |
|-------|-----|-------|
| `ad_name` | yes | Creative/ad name. [P] |
| `ad_format` | yes | e.g. `SINGLE_VIDEO`, `SINGLE_IMAGE`, `CAROUSEL`, `COLLECTION`. [P] |
| `ad_text` | yes | Primary copy. [P] |
| `call_to_action` | cond | e.g. `SHOP_NOW`, `LEARN_MORE`, `SIGN_UP`, `DOWNLOAD`. [P] |
| `video_id` | cond | Required for video ads (from `/file/video/ad/upload/`). [P] |
| `image_ids` | cond | Cover image / image ads. [P] |
| `landing_page_url` | cond | Destination URL for web objectives. [P] |
| `identity_id` + `identity_type` | cond | Publishing identity. `identity_type` ∈ `CUSTOMIZED_USER`, `AUTH_CODE`, `TT_USER`. [V] |
| `display_name` | cond | Shown when using a customized identity. [P] |
| `operation_status` | opt | Default `ENABLE`. [P] |

### 3.5 Status fields (all levels) [V/P]

| Field | Values | Notes |
|-------|--------|-------|
| `operation_status` | `ENABLE`, `DISABLE`, `DELETE` | The **writable** status you set. [V] |
| `secondary_status` | e.g. `CAMPAIGN_STATUS_ENABLE`, `ADGROUP_STATUS_DELIVERY_OK`, `AD_STATUS_CAMPAIGN_DISABLE`, `..._AUDIT`, `..._REJECT`, `..._BALANCE_EXCEED` | **Read-only** detailed delivery/review state; enum is prefixed per level. [P] |
| `primary_status` (newer reads) | e.g. `STATUS_DELIVERY_OK`, `STATUS_DISABLE`, `STATUS_DELETE`, `STATUS_NOT_START` | Rolled-up read-only status used in newer `get` responses/filtering. [P] |

---

## 4. Enumerations

> Confirm exact spelling on the portal "Enumeration" page. Legacy names still appear in old code.

### objective_type (campaign) [P]
| Value | Meaning |
|-------|---------|
| `REACH` | Awareness / max reach. [P] |
| `TRAFFIC` | Send users to a destination. [P] |
| `VIDEO_VIEWS` | Video view optimization. [P] |
| `ENGAGEMENT` | Community interaction / followers. [P] |
| `APP_PROMOTION` | App installs + in-app events (replaces legacy `APP_INSTALL`). [P] |
| `WEB_CONVERSIONS` | Website conversions (replaces legacy `CONVERSIONS`). [P] |
| `LEAD_GENERATION` | Instant-form / external lead capture. [P] |
| `PRODUCT_SALES` | Catalog / shop sales. [P] |
| `RF_REACH` | Reach & Frequency (guaranteed) buying. [U] |
| `TOPVIEW` / `RF_*` variants | Reservation/RF products. [U] |

### optimization_goal (ad group) [P]
`CLICK`, `CONVERT`, `INSTALL`, `IN_APP_EVENT`, `REACH`, `VIDEO_VIEW` (a.k.a. `ENGAGED_VIEW`/`SIX_SECOND_VIEW` variants), `LEAD_GENERATION`, `FOLLOWERS`, `PROFILE_VIEWS`, `VALUE` (ROAS). [P] — exact set depends on `objective_type` (see §10).

### bid_type / bid_strategy (ad group) [P]
| Value | Meaning |
|-------|---------|
| `BID_TYPE_NO_BID` | Lowest-cost / no bid cap (system-optimized). [P] |
| `BID_TYPE_CUSTOM` | Manual bid cap — requires `bid_price`/`conversion_bid_price`. [P] |
| `BID_TYPE_MAX_CONVERSION` | Maximize conversions within budget. [U] |

Related: `deep_bid_type` (e.g. `VO_MIN_ROAS`, `DEEP_BID_MIN`) for deep-event bidding. [U]

### billing_event (ad group) [P]
`CPC`, `CPM`, `CPV` (cost per view), `OCPM` (optimized CPM — used for conversion/app goals). [P]

### budget_mode (campaign & ad group) [V]
`BUDGET_MODE_DAY` (daily), `BUDGET_MODE_TOTAL` (lifetime), `BUDGET_MODE_INFINITE` (no cap — for RF/CBO-managed cases). [V]

### pacing (ad group) [P]
`PACING_MODE_SMOOTH` (standard/even delivery), `PACING_MODE_FAST` (accelerated). [P]

### placement_type / placements [P]
- `placement_type`: `PLACEMENT_TYPE_AUTOMATIC`, `PLACEMENT_TYPE_NORMAL`. [P]
- `placements` (when NORMAL): `PLACEMENT_TIKTOK`, `PLACEMENT_PANGLE`, `PLACEMENT_GLOBAL_APP_BUNDLE`, `PLACEMENT_TOPBUZZ`/news-feed variants. [P]

### promotion_type (ad group) [P]
`WEBSITE`, `APP_ANDROID`, `APP_IOS`, `LEAD_GENERATION`, `PRODUCT_SALES`/catalog. [U] (exact set is objective-dependent).

### schedule_type (ad group) [V/P]
`SCHEDULE_START_END` (fixed window; needs end time), `SCHEDULE_FROM_NOW` (open-ended). [V]

### operation_status (all levels) [V]
`ENABLE`, `DISABLE`, `DELETE`. [V]

### data_level (reporting) [V]
`AUCTION_ADVERTISER`, `AUCTION_CAMPAIGN`, `AUCTION_ADGROUP`, `AUCTION_AD`. (Reservation buying uses `RESERVATION_*` equivalents.) [V]

---

## 5. Conditional rules (field X required when Y) — CRITICAL

> These are the constraints that cause most create/update failures. Confidence tagged individually; validate the highest-impact ones against the portal before relying on them.

### Budget
| Rule | Tag |
|------|-----|
| `budget` is **required** when `budget_mode` = `BUDGET_MODE_DAY` or `BUDGET_MODE_TOTAL`. | [P] |
| `budget` is **not** used with `BUDGET_MODE_INFINITE`. | [P] |
| When **CBO** is on (`budget_optimize_on=true`), budget lives at the **campaign** level and **only `BUDGET_MODE_DAY`** is supported. | [P] |
| When CBO is on, `optimization_goal` (and typically `bid_type`) must be set at the **campaign** level, and all child ad groups must share the same optimization goal. | [P] |
| For `RF_REACH` (Reach & Frequency), only `BUDGET_MODE_INFINITE` is supported. | [P] |
| Daily budget must meet a currency/objective-specific minimum (server-enforced). | [P] |

### Objective immutability
| Rule | Tag |
|------|-----|
| `objective_type` is **immutable after campaign creation** — to change it, create a new campaign. | [P] |
| `budget_mode` generally cannot be switched between DAY and TOTAL after creation for certain objectives. | [U] |

### Bid
| Rule | Tag |
|------|-----|
| `bid_price` (or `conversion_bid_price`) is **required** when `bid_type` = `BID_TYPE_CUSTOM`. | [P] |
| `bid_price` must be **omitted/ignored** when `bid_type` = `BID_TYPE_NO_BID`. | [P] |
| `conversion_bid_price` applies when `billing_event=OCPM` with a conversion `optimization_goal`. | [P] |
| `deep_bid_type` requires a valid deep in-app/conversion event configured. | [U] |

### Conversion / web goals
| Rule | Tag |
|------|-----|
| `optimization_goal=CONVERT` (web conversions) **requires** `pixel_id` **and** `optimization_event`. | [P] |
| `WEB_CONVERSIONS` objective requires a Pixel or Events API setup before the ad group can optimize for conversions. | [P] |
| `billing_event` must be `OCPM` for conversion optimization goals. | [P] |

### App-promotion goals
| Rule | Tag |
|------|-----|
| App objectives (`APP_PROMOTION`) **require** `app_id` on the ad group. | [P] |
| `optimization_goal=INSTALL` requires the app registered; `IN_APP_EVENT` additionally requires an `optimization_event` (the in-app event). | [P] |
| `promotion_type` must match the app platform (`APP_ANDROID` / `APP_IOS`). | [U] |

### Placement / targeting
| Rule | Tag |
|------|-----|
| `placements` is **required** when `placement_type=PLACEMENT_TYPE_NORMAL`; ignored when `PLACEMENT_TYPE_AUTOMATIC`. | [P] |
| `schedule_end_time` is **required** when `schedule_type=SCHEDULE_START_END`. | [P] |
| Some optimization goals are only valid with specific placements (e.g. Pangle restrictions). | [U] |

### Lead generation
| Rule | Tag |
|------|-----|
| `LEAD_GENERATION` optimizes on an oCPM basis and requires an instant-form (or external lead page) reference. | [P] |

---

## 6. Reporting — `GET /open_api/v1.3/report/integrated/get/` [V]

| Param | Req | Notes |
|-------|-----|-------|
| `advertiser_id` | yes* | Single account. (`advertiser_ids` for multi-account, or `bc_id`+`service_type` for BC-level.) [V] |
| `report_type` | yes | `BASIC`, `AUDIENCE`, `PLAYABLE_MATERIAL`, `CATALOG`, `BC` (Business Center). [P] |
| `data_level` | cond | `AUCTION_ADVERTISER` / `AUCTION_CAMPAIGN` / `AUCTION_ADGROUP` / `AUCTION_AD`. Required for `BASIC`/`AUDIENCE`. [V] |
| `dimensions` | yes | JSON array — an entity ID dimension + optional time dimension (see below). [V] |
| `metrics` | yes | JSON array of metric names. [V] |
| `start_date` / `end_date` | cond | `YYYY-MM-DD`. Required unless `query_lifetime=true`. [V] |
| `query_lifetime` | opt | Boolean; lifetime totals instead of a date range. [V] |
| `page` | opt | Default 1. [V] |
| `page_size` | opt | Default 10 (max commonly 1000). [V] |
| `filtering` | opt | Array of filter objects (by campaign_ids, statuses, etc.). [V] |
| `order_field` / `order_type` | opt | Sort. `order_type` ∈ `ASC`/`DESC`. [V] |
| `enable_total_metrics` | opt | Include an aggregate total row. [V] |
| `multi_adv_report_in_utc_time` | opt | UTC alignment for multi-account reports. [V] |
| `query_mode` | opt | e.g. regular vs. chunked. [P] |

### Common dimensions [P]
- Entity: `advertiser_id`, `campaign_id`, `adgroup_id`, `ad_id` (must match `data_level`).
- Time: `stat_time_day`, `stat_time_hour`.
- Audience (report_type=AUDIENCE): `age`, `gender`, `country_code`, `platform`, `language`, `ac` (network), `interest_category`, `placement`, `ad_position`.

### Common metrics [P]
- Basic: `impressions`, `clicks`, `spend`, `ctr`, `cpc`, `cpm`, `reach`, `frequency`, `cost_per_1000_reached`, `result`, `cost_per_result`.
- Video: `video_play_actions`, `video_watched_2s`, `video_watched_6s`, `video_views_p25/p50/p75/p100`, `average_video_play`, `video_watched_rate`.
- Engagement: `likes`, `comments`, `shares`, `follows`, `profile_visits`, `engagement_rate`.
- Conversion: `conversion`, `conversion_rate`, `cost_per_conversion`, `total_complete_payment`, `total_add_to_cart`, `total_registration`, `complete_payment_roas`.

### Pagination response [P]
Response `data` contains `list` (rows) and `page_info`:

| `page_info` field | Meaning |
|-------------------|---------|
| `page` | Current page. |
| `page_size` | Rows per page. |
| `total_number` | Total rows. |
| `total_page` | Total pages. |

Each row typically has `dimensions` (the grouping keys) and `metrics` (the values). [P]

### Async reporting [U]
A task-based/async report flow (`/report/task/create/` → `/report/task/check/`) exists for large pulls in addition to the synchronous `integrated/get`. Confirm availability/paths on the portal. [U]

---

## 7. Writes (status & update)

All write endpoints are `POST` with a **JSON** body; identify the account with `advertiser_id` and the entity by its id(s).

### Status updates [V]
| Endpoint | Body |
|----------|------|
| `POST /open_api/v1.3/campaign/status/update/` | `advertiser_id` (string), `campaign_ids` (string[]), `operation_status` (`ENABLE`/`DISABLE`/`DELETE`). [V] |
| `POST /open_api/v1.3/adgroup/status/update/` | `advertiser_id`, `adgroup_ids` (string[]), `operation_status`. [P] |
| `POST /open_api/v1.3/ad/status/update/` | `advertiser_id`, `ad_ids` (string[]), `operation_status`. [P] |

Notes: `DELETE` is (soft) delete. For Reach & Frequency campaigns, pass `ENABLE` or omit — do not pass `DISABLE`. [P]

### Field updates [V]
| Endpoint | Body shape |
|----------|-----------|
| `POST /open_api/v1.3/campaign/update/` | `advertiser_id` + `campaign_id` + mutable fields (e.g. `campaign_name`, `budget`, `budget_mode`). [P] |
| `POST /open_api/v1.3/adgroup/update/` | `advertiser_id` (req) + `adgroup_id` (req) + fields to change (`adgroup_name`, `budget`, `bid_price`, `schedule_type`, `schedule_start_time`, `schedule_end_time`, targeting, etc.). Send the full set of interdependent fields when changing bid/budget/optimization. [V] |
| `POST /open_api/v1.3/ad/update/` | `advertiser_id` + `adgroup_id` + `creatives` (with `ad_id` on each) + changed fields. [P] |

Immutable-after-create fields (e.g. campaign `objective_type`, ad group `optimization_goal`/`billing_event` in many cases) cannot be updated — recreate instead. [P]

---

## 8. Rate limits [U]

TikTok does not prominently publish a single fixed QPS number in the public portal; limits vary by app tier, endpoint, and account.

| Item | Value | Tag |
|------|-------|-----|
| Default per-app throttle | Commonly cited around **10 QPS** for standard apps | [U] |
| Advanced/allowlisted tier | Up to **~20 QPS** after approval | [U] |
| Granularity | Enforced per **app** and per **app+advertiser** combination | [P] |
| Reporting | Report endpoints have stricter/separate throttles; heavy pulls should paginate + back off | [P] |
| Over-limit behavior | Application-level error in the JSON `code`/`message` (HTTP is usually 200); back off and retry with jitter | [P] |

Action: read the live "Rate Limits" page (`/portal/docs/rate-limits/v1.3`) for authoritative numbers and request an increase via your TikTok rep if needed. [U]

---

## 9. Sandbox [P/U]

| Topic | Detail | Tag |
|-------|--------|-----|
| Creation | In the developer portal, create a **Sandbox** under your app; it provisions a **sandbox ad account (test `advertiser_id`)**. | [P] |
| Credentials | The sandbox issues its **own access token directly** — no advertiser OAuth authorization round-trip needed. | [P] |
| Base URL | Same production base `https://business-api.tiktok.com/open_api/v1.3` — you switch environments via the sandbox token + sandbox `advertiser_id`, not a different host. | [P] |
| Capabilities | Create/read/update campaigns, ad groups, ads; validate request shapes, enums and conditional rules end-to-end. | [P] |
| Limitations | **No real ad delivery, no billing/spend, no real audience.** Reporting returns little/no real performance data. Some objectives/features (e.g. certain conversion, catalog, or identity flows) are limited or unavailable. | [U] |
| Use | Wire up and validate your integration in sandbox, then repoint to a real authorized `advertiser_id` + production token. | [P] |

---

## 10. Combinations matrix — objective → optimization_goal → bid_type → required fields

> Directional mapping. Many cells are [P]/[U]; validate exact allowed sets against the portal's objective-specific ad-group docs. `OCPM` billing + conversion goals is the recurring pattern.

| objective_type | typical optimization_goal | billing_event | typical bid_type | Extra required fields | Tag |
|----------------|---------------------------|---------------|------------------|-----------------------|-----|
| `REACH` | `REACH` | `CPM` | `BID_TYPE_NO_BID` / `CUSTOM` | frequency/schedule; budget per mode | [P] |
| `TRAFFIC` | `CLICK` | `CPC` / `OCPM` | `NO_BID` / `CUSTOM` (`bid_price` if CUSTOM) | `landing_page_url`; budget per mode | [P] |
| `VIDEO_VIEWS` | `VIDEO_VIEW` (2s/6s variants) | `CPV` / `OCPM` | `NO_BID` / `CUSTOM` | video creative | [P] |
| `ENGAGEMENT` | `FOLLOWERS` / `PROFILE_VIEWS` | `OCPM` | `NO_BID` | identity/profile | [U] |
| `APP_PROMOTION` | `INSTALL` | `OCPM` | `NO_BID` / `CUSTOM` (`conversion_bid_price`) | `app_id`, `promotion_type=APP_*` | [P] |
| `APP_PROMOTION` | `IN_APP_EVENT` | `OCPM` | `CUSTOM` (`conversion_bid_price`) | `app_id`, `optimization_event`, deep-event config | [P] |
| `WEB_CONVERSIONS` | `CONVERT` | `OCPM` | `NO_BID` / `CUSTOM` (`conversion_bid_price`) | `pixel_id`, `optimization_event`, `landing_page_url` | [P] |
| `LEAD_GENERATION` | `LEAD_GENERATION` (`CONVERT`) | `OCPM` | `NO_BID` / `CUSTOM` | instant-form or external lead page | [P] |
| `PRODUCT_SALES` | `VALUE` / `CONVERT` | `OCPM` | `CUSTOM` (`roas_bid`/`conversion_bid_price`) | catalog / product source, pixel/event | [U] |
| `RF_REACH` | `REACH` | `CPM` | reservation | `BUDGET_MODE_INFINITE` only, `rf_campaign_type` | [P] |

**Cross-cutting requirements (all rows):** `advertiser_id`, `campaign_id`, `adgroup_name`, `budget_mode` + `budget` (per §5), `schedule_type` (+ start/end), `placement_type` (+ `placements` if NORMAL), `pacing`, `optimization_goal`, `billing_event`. [V/P]

---

## Source notes

- **Verified [V]** items: endpoint paths, request-field names, and required/optional flags cross-checked against the official `tiktok/tiktok-business-api-sdk` field specs (Campaign/Adgroup/Ad create + status-update + reporting bodies) and the portal base URL / OAuth flow. `data_level` and `identity_type` enum values confirmed from official SDK/reference material.
- **Probable [P]** items: enum string values (objective/optimization/billing/bid/pacing/placement), conditional rules, and reporting dimension/metric names corroborated across multiple integration-vendor references and SDK mirrors.
- **Unverified [U]** items: exact QPS numbers, sandbox feature limits, async reporting paths, and less-common objective/enum variants — confirm on the live portal.
- **Always** re-check the portal "Enumeration", "Rate Limits", and per-objective ad-group pages before hard-coding, as TikTok revises enums and constraints between minor doc updates.
