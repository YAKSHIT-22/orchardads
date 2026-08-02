# Snapchat Marketing API — Backend Reference

> Scope: programmatic management of Snap ad campaigns, ad squads, ads, creatives,
> audiences, targeting, reporting, and server-side conversions.
>
> **Confidence legend:** `[V]` verified against official docs (developers.snap.com,
> fetched 2026-07-27) · `[P]` partially verified / paraphrased from official docs ·
> `[U]` unverified, treat as a hint and confirm before relying on it.
>
> **Base URL (all Ads API resources):** `https://adsapi.snapchat.com` `[V]`
> **API version prefix:** `/v1` `[V]`
> **OAuth host:** `https://accounts.snapchat.com` `[V]`

---

## 1. Authentication

### 1.1 Model `[V]`

OAuth 2.0 authorization-code flow, administered through **Snap Business Manager**
(Business Details section). The developer must be an **Organization Admin** and must
accept the Snap Developer Terms and Snap Business Tools Terms before an OAuth app can
be created.

Every API request carries the token in the header:

```
Authorization: Bearer <access_token>
```

### 1.2 Scopes `[V]`

Passed as a **space-separated** list on the authorize call. Three scopes exist:

| Scope | Grants | Used by |
|---|---|---|
| `snapchat-marketing-api` | Read/write to the Ads / Marketing APIs | Campaigns, ad squads, ads, creatives, audiences, targeting, reporting |
| `snapchat-offline-conversions-api` | Read/write to the Conversions APIs | CAPI event ingestion, offline/store conversions |
| `snapchat-profile-api` | Read Public Profile APIs | Public Profile / profile metrics |

### 1.3 OAuth endpoints `[V]`

| Step | Method | Endpoint |
|---|---|---|
| Authorize (user consent) | `GET` | `https://accounts.snapchat.com/login/oauth2/authorize` |
| Token exchange / refresh | `POST` | `https://accounts.snapchat.com/login/oauth2/access_token` |

Authorize params: `client_id`, `redirect_uri`, `response_type=code`, `scope`.

### 1.4 Token lifecycle `[V]`

| Token | Lifetime | Behavior |
|---|---|---|
| Access token | **3600 s (60 min)** `[V]` | Expired token → `401 Unauthorized` with header `WWW-Authenticate: Bearer error="invalid_token", error_description="The access token expired"`. |
| Refresh token | **Does NOT expire** `[V]` | **Does NOT rotate** — the same refresh token is reused indefinitely to mint new access tokens. Store it securely and long-term; there is no re-consent cadence unless the user revokes access. |

> **Call-out:** Snapchat refresh tokens are long-lived and stable. Do **not** build
> rotation/expiry handling around them — persist one refresh token per authorized
> ad account and reuse it. (Note: the token-exchange response may echo a
> `refresh_token` field; treat the stored refresh token as durable regardless. `[P]`)

### 1.5 Conversions API static token `[V]`

The Conversions API additionally supports a **static long-lived token** generated
from Ads Manager → Business Details → OAuth Apps. This token **does not expire and
needs no refresh**, and is the recommended credential for high-throughput CAPI
ingestion (see §8).

---

## 2. Entity Hierarchy `[V]`

```
Organization
  └─ Ad Account            (adaccounts)
       └─ Campaign         (campaigns)
            └─ Ad Squad     (adsquads)   ← the "ad group" equivalent
                 └─ Ad      (ads)
                      └─ Creative (creatives)   [Creatives are account-scoped, referenced by Ads]
```

| Tier | Resource name (path segment) | Parent | Notes |
|---|---|---|---|
| Organization | `organizations` | — | Top-level business entity |
| Ad Account | `adaccounts` | Organization | Owns budget, currency, timezone |
| Campaign | `campaigns` | Ad Account | Holds objective + budget/pacing |
| **Ad Squad** | `adsquads` | Campaign | **= ad group**: targeting, bid, optimization, budget, placement |
| Ad | `ads` | Ad Squad | Binds a creative to a squad |
| Creative | `creatives` | Ad Account (referenced by Ad) | Reusable across ads |

---

## 3. Per-Entity CRUD

Money fields are **micro-currency**: `1.00 local unit = 1,000,000 micro`. `[V]`
So a field named `*_micro` is the local currency amount × 1,000,000.

### 3.1 Campaign `[V]`

| Op | Method | Endpoint |
|---|---|---|
| Create | `POST` | `/v1/adaccounts/{ad_account_id}/campaigns` |
| Read (one) | `GET` | `/v1/campaigns/{campaign_id}` |
| List (by account) | `GET` | `/v1/adaccounts/{ad_account_id}/campaigns` |
| Read (batch by id) | `POST` | `/v1/{ad_account_id}/get_campaigns_by_ids` |
| Update (full) | `PUT` | `/v1/adaccounts/{ad_account_id}/campaigns` |
| Update (partial) | `PATCH` | `/v1/adaccounts/{ad_account_id}/campaigns/{campaign_id}` |
| Delete | `DELETE` | `/v1/campaigns/{campaign_id}` |

**Fields**

| Field | Req? | Notes |
|---|---|---|
| `name` | R | max 375 chars |
| `ad_account_id` | R | parent |
| `status` | R | `ACTIVE` / `PAUSED` |
| `start_time` | R | ISO 8601 |
| `buy_model` | R | purchasing model `[P]` |
| `pacing_level` | R | where budget pacing is controlled `[P]` |
| `end_time` | O | ISO 8601 |
| `daily_budget_micro` | O | micro-currency |
| `lifetime_spend_cap_micro` | O | micro-currency |
| `objective_v2_properties` | O | V2 objective config |
| `mobile_app_properties` | O | app-promotion campaigns |
| `measurement_spec` | O | measurement config |

### 3.2 Ad Squad (ad group) `[V]`

| Op | Method | Endpoint |
|---|---|---|
| Create | `POST` | `/v1/campaigns/{campaign_id}/adsquads` |
| Read (one) | `GET` | `/v1/adsquads/{ad_squad_id}` |
| List (by campaign) | `GET` | `/v1/campaigns/{campaign_id}/adsquads` `[P]` |
| Update (full) | `PUT` | `/v1/campaigns/{campaign_id}/adsquads` |
| Delete | `DELETE` | `/v1/adsquads/{ad_squad_id}` `[P]` |

**Fields**

| Field | Req? | Notes |
|---|---|---|
| `campaign_id` | R | parent |
| `name` | R | max 375 chars |
| `type` | R | `SNAP_ADS` / `LENS` / `FILTER` |
| `targeting` | R | targeting spec (§6) |
| `placement_v2` | R | placement config (§4) |
| `billing_event` | R | `IMPRESSION` (only option) |
| `optimization_goal` | R | see §4 / §9 |
| `bid_strategy` | R | see §4 / §9 |
| `bid_micro` | Conditional | required for bid strategies other than `AUTO_BID` |
| `daily_budget_micro` | Conditional | one of daily/lifetime budget required; min **5,000,000** micro |
| `lifetime_budget_micro` | Conditional | alternative to daily budget |
| `status` | O | defaults `ACTIVE` |
| `start_time` / `end_time` | O | ISO 8601 |
| `event_sources` | Conditional | Snap App ID required for app re-engage goals & app-based DPA |
| `cap_and_exclusion_config` | O | frequency capping |

### 3.3 Ad `[V]`

| Op | Method | Endpoint |
|---|---|---|
| Create | `POST` | `/v1/adsquads/{ad_squad_id}/ads` |
| Read (one) | `GET` | `/v1/ads/{ad_id}` |
| Read (batch by id) | `POST` | `/v1/{ad_account_id}/get_ads_by_ids` |
| List (by squad) | `GET` | `/v1/adsquads/{ad_squad_id}/ads` |
| List (by campaign) | `GET` | `/v1/campaigns/{campaign_id}/ads` |
| List (by account) | `GET` | `/v1/adaccounts/{ad_account_id}/ads` |
| Update (full) | `PUT` | `/v1/adsquads/{ad_squad_id}/ads` |
| Update (partial) | `PATCH` | `/v1/adsquads/{ad_squad_id}/ads/{ad_id}` |
| Delete | `DELETE` | `/v1/ads/{ad_id}` |

**Fields**

| Field | Req? | Notes |
|---|---|---|
| `ad_squad_id` | R | parent |
| `creative_id` | R | references a creative |
| `name` | R | max 375 chars |
| `status` | R | `ACTIVE` / `PAUSED` |
| `type` | R | ad type enum (§4) |
| `paying_advertiser_name` | O | |
| `third_party_on_swipe_tracking_urls` | O | |
| `third_party_paid_impression_tracking_urls` | O | |
| `start_time` / `end_time` | O | ISO 8601 |
| `review_status` | read-only | `PENDING` / `APPROVED` / `REJECTED` |

> **Rate-limit note (verified):** there is a per-second cap on creating ads that
> reuse the **same `creative_id`** consecutively. On `429` while reusing one creative
> id, switch to **bulk requests**. `[V]`

### 3.4 Creative `[V]`

| Op | Method | Endpoint |
|---|---|---|
| Create | `POST` | `/v1/adaccounts/{ad_account_id}/creatives` |
| Read (one) | `GET` | `/v1/adaccounts/{ad_account_id}/creatives/{creative_id}` |
| List | `GET` | `/v1/adaccounts/{ad_account_id}/creatives` |
| Update (full) | `PUT` | `/v1/adaccounts/{ad_account_id}/creatives` |
| Update (partial) | `PATCH` | `/v1/adaccounts/{ad_account_id}/creatives/{creative_id}` |

**Base fields (all types)**

| Field | Req? | Notes |
|---|---|---|
| `ad_account_id` | R | parent |
| `name` | R | max 375 chars |
| `type` | R | creative type enum (§4) |
| `headline` | R | max 34 chars |
| `top_snap_media_id` | R | media UUID (the main Snap) |
| `brand_name` | O | max 32 chars |
| `shareable` | O | boolean, default `true` |
| `call_to_action` | O | varies by type |
| `top_snap_crop_position` | O | `OPTIMIZED` (default) / `MIDDLE` / `TOP` / `BOTTOM` |
| `profile_properties` | Conditional | `profile_id`; needed for most types `[P]` |

**Type-conditional required property blocks** (see §5).

### 3.5 Audience / Segment `[V]`

Snapchat audiences are called **Segments**.

| Op | Method | Endpoint |
|---|---|---|
| Create | `POST` | `/v1/adaccounts/{ad_account_id}/segments` |
| Read (one) | `GET` | `/v1/segments/{segment_id}` `[P]` |
| List (by account) | `GET` | `/v1/adaccounts/{ad_account_id}/segments` `[P]` |
| Update | `PUT` | `/v1/adaccounts/{ad_account_id}/segments` `[P]` |
| Delete | `DELETE` | `/v1/segments/{segment_id}` `[P]` |
| Add users | `POST` | `/v1/segments/{segment_id}/users` |
| Remove users | `DELETE` | `/v1/segments/{segment_id}/users` `[P]` |

**Create fields**

| Field | Req? | Notes |
|---|---|---|
| `name` | R | max 375 chars |
| `ad_account_id` | R | parent |
| `source_type` | R | see §4 |
| `retention_in_days` | R | default `9999` (lifetime); e.g. 180 for first-party, up to 99 examples for pixel |
| `description` | O | |

**Add-users payload:** identifiers must be **normalized + SHA-256 hashed**. Schema
types: `EMAIL_SHA256`, `PHONE_SHA256`, `MOBILE_AD_ID_SHA256`. Max **100,000**
identifiers per request. `[V]`

Segments are referenced in targeting via `segments[].segment_id` with
`operation: INCLUDE|EXCLUDE` (§6).

---

## 4. Enums

### Campaign objective `[V]` (classic)
`BRAND_AWARENESS`, `APP_INSTALL`, `APP_CONVERSION`, `WEB_CONVERSION`,
`CATALOG_SALES`, `ENGAGEMENT`, `VIDEO_VIEW`, `LEAD_GENERATION`,
`PROMOTE_STORIES`, `PROMOTE_PLACES`.

### Campaign objective V2 `[V]`
`AWARENESS_AND_ENGAGEMENT`, `TRAFFIC`, `APP_PROMOTION`, `SALES`, `LEADS`.

### Ad Squad `optimization_goal` `[V]`
`IMPRESSIONS`, `SWIPES`, `APP_INSTALLS`, `VIDEO_VIEWS`, `VIDEO_VIEWS_15_SEC`,
`USES`, `STORY_OPENS`, `PIXEL_PAGE_VIEW`, `PIXEL_ADD_TO_CART`, `PIXEL_PURCHASE`,
`PIXEL_SIGNUP`, `LANDING_PAGE_VIEW`, `LEAD_FORM_SUBMISSIONS`, `APP_ADD_TO_CART`,
`APP_PURCHASE`, `APP_SIGNUP`, `APP_REENGAGE_OPEN`, `APP_REENGAGE_PURCHASE`.

### `bid_strategy` `[V]`
| Value | Meaning |
|---|---|
| `AUTO_BID` | System sets bid; `bid_micro` must be omitted |
| `LOWEST_COST_WITH_MAX_BID` | Bid at/below `bid_micro` cap (requires `bid_micro`) |
| `TARGET_COST` | Maximize volume at a target cost (requires `bid_micro`) |
| `MIN_ROAS` | **Deprecated 2025-02-10** — return-on-ad-spend target |

### `status` (Campaign / Ad Squad / Ad) `[V]`
`ACTIVE`, `PAUSED`. (Ad also has read-only `review_status`: `PENDING`/`APPROVED`/`REJECTED`.)

### Ad Squad `type` `[V]`
`SNAP_ADS`, `LENS`, `FILTER`.

### `billing_event` `[V]`
`IMPRESSION` (only current value).

### Placement — `placement_v2` `[V]`
- `config`: `AUTOMATIC` | `CUSTOM`
- `platforms`: `["SNAPCHAT"]`
- `snapchat_positions`: `INTERSTITIAL_USER`, `INTERSTITIAL_CONTENT`,
  `INTERSTITIAL_SPOTLIGHT`, `INSTREAM`, `PUBLIC_STORIES_INSTREAM`, `CHAT_FEED`,
  `FEED`, `CAMERA`
- `inclusion` / `exclusion`: `content_types` lists `[P]`

### Ad `type` `[V]`
`SNAP_AD`, `APP_INSTALL`, `REMOTE_WEBPAGE`, `DEEP_LINK`, `STORY`, `AD_TO_LENS`,
`AD_TO_CALL`, `AD_TO_MESSAGE`, `FILTER`, `LENS`, `LENS_WEB_VIEW`,
`LENS_APP_INSTALL`, `LENS_DEEP_LINK`, `COLLECTION`, `LEAD_GENERATION`, `REMINDER`.

### Creative `type` `[V]`
`SNAP_AD`, `APP_INSTALL`, `WEB_VIEW`, `DEEP_LINK`, `AD_TO_LENS`, `AD_TO_CALL`,
`AD_TO_MESSAGE`, `PREVIEW`, `COMPOSITE`, `LENS`, `LENS_WEB_VIEW`,
`LENS_APP_INSTALL`, `LENS_DEEP_LINK`, `COLLECTION`, `LEAD_GENERATION`, `REMINDER`.

### Segment `source_type` `[V]`
`FIRST_PARTY`, `MOBILE`, `PIXEL`, `LOOKALIKE`, `ENGAGEMENT` (read-only — cannot be
set at creation).

---

## 5. Conditional Rules (required-when)

| # | Condition | Requirement | Conf |
|---|---|---|---|
| 1 | `bid_strategy` ≠ `AUTO_BID` | `bid_micro` required | `[V]` |
| 2 | `bid_strategy` = `AUTO_BID` | `bid_micro` must be omitted | `[P]` |
| 3 | `optimization_goal` ∈ {`APP_REENGAGE_OPEN`, `APP_REENGAGE_PURCHASE`}, or app-based Dynamic Product Ads | `event_sources` with **Snap App ID** required | `[V]` |
| 4 | SKAdNetwork enrolled squad | `MIN_ROAS` and `TARGET_COST` **not allowed**; `APP_REENGAGE_*` goals unavailable | `[V]` |
| 5 | Ad squad uses `cap_and_exclusion_config` (auction) | No multi-format delivery — all ads in squad must share identical `type` | `[V]` |
| 6 | Creative `type` = `APP_INSTALL` | `app_install_properties` (`app_name`, `ios_app_id`, `android_app_url`, `icon_media_id`) | `[V]` |
| 7 | Creative `type` = `WEB_VIEW` | `web_view_properties.url` | `[V]` |
| 8 | Creative `type` = `DEEP_LINK` | `deep_link_properties` (`deep_link_uri`, `app_name`, `icon_media_id`) | `[V]` |
| 9 | Creative `type` = `AD_TO_LENS` | `ad_to_lens_properties.lens_media_id` | `[V]` |
| 10 | Creative `type` = `AD_TO_CALL` / `AD_TO_MESSAGE` | `phone_number_id` | `[V]` |
| 11 | Creative `type` = `COMPOSITE` | `composite_properties.creative_ids[]` | `[V]` |
| 12 | Creative `type` = `PREVIEW` | `preview_properties` (`preview_media_id`, `preview_headline`) | `[V]` |
| 13 | Creative `type` = `LEAD_GENERATION` | `lead_generation_form_id` | `[V]` |
| 14 | Creative `type` = `REMINDER` | `reminder_properties.event_details_id` | `[V]` |
| 15 | Segment `source_type` = `LOOKALIKE` | seed segment reference required (lookalike modeling spec) | `[P]` |
| 16 | Ad squad create | exactly one of `daily_budget_micro` / `lifetime_budget_micro` | `[V]` |
| 17 | Stats `granularity` = `DAY`/`HOUR` | `start_time` and `end_time` required | `[V]` |

---

## 6. Targeting Spec `[V]`

The `targeting` object on an Ad Squad. Each block is an array; most entries accept
`operation: "INCLUDE" | "EXCLUDE"`.

### 6.1 `geos[]`
| Field | Notes |
|---|---|
| `country_code` | ISO alpha-2, lowercase |
| `region_id` | region/state ids |
| `metro` | metro / DMA id |
| `postal_code` | postal / zip codes |
| `operation` | INCLUDE / EXCLUDE |

### 6.2 `demographics[]`
| Field | Notes |
|---|---|
| `min_age` | int, 13–35 range |
| `max_age` | int, up to 55 (`35+` upper via age group) |
| `age_groups` | e.g. `18-20`, `21-24`, `25-34`, `35+` |
| `gender` | `MALE` / `FEMALE` / `OTHER` |
| `languages` | language ids, e.g. `en`, `es` |
| `advanced_demographics` | DLXD category ids |

### 6.3 `interests[]`
| Field | Category system |
|---|---|
| `scls` | Snap Lifestyle Categories |
| `dlxc` | Oracle Datalogix Content |
| `dlxs` | Oracle Datalogix Shoppers (**deprecated 2024-09-27**) |
| `nln` | Nielsen categories |
| `plc` | Placed visitation segments |
| `vac` | Snap visitation segments |
| `shp` | First-party shopper segments |
| `operation` | INCLUDE / EXCLUDE |

### 6.4 `segments[]` (custom audiences)
| Field | Notes |
|---|---|
| `segment_id` | array of segment ids |
| `operation` | INCLUDE / EXCLUDE |

### 6.5 `devices[]`
| Field | Notes |
|---|---|
| `os_type` | `iOS` / `ANDROID` / `WEB` |
| `os_version_min` / `os_version_max` | version bounds |
| `connection_type` | `WIFI` / `CELL` |
| `carrier` | carrier id (country-validated) |
| `marketing_name` | device model id |

### 6.6 Squad-level flags
`regulated_content` (bool), `app_install_states` (`INSTALLED`/`NOT_INSTALLED`/`ALL`),
`auto_expansion_options` (interest / custom-audience expansion toggles).

---

## 7. Reporting / Stats `[V]`

### 7.1 Endpoints (all `GET … /stats`)
| Level | Endpoint |
|---|---|
| Ad Account | `/v1/adaccounts/{ad_account_id}/stats` |
| Campaign | `/v1/campaigns/{campaign_id}/stats` |
| Ad Squad | `/v1/adsquads/{adsquad_id}/stats` |
| Ad | `/v1/ads/{ad_id}/stats` |
| Creative | `/v1/creatives/{creative_id}/stats` |
| Media | `/v1/media/{media_id}/stats` |

### 7.2 Query params
| Param | Values / Notes |
|---|---|
| `granularity` | `TOTAL` / `DAY` / `HOUR` / `LIFETIME` (required) |
| `start_time` / `end_time` | ISO 8601; required for `DAY`/`HOUR` |
| `fields` | comma-separated metrics; defaults to `impressions,spend` |
| `breakdown` | `ad` / `adsquad` / `campaign` (child rollup) |
| `report_dimension` | `GEO` / `DEMO` / `INTEREST` / `DEVICE` |
| `swipe_up_attribution_window` | `1_DAY` / `7_DAY` / `28_DAY` (default 28) |
| `view_attribution_window` | `none` / `1_HOUR` / `3_HOUR` / `6_HOUR` / `1_DAY` (default) / `7_DAY` / `28_DAY` |
| `action_report_time` | `conversion` (default) / `impression` |
| `conversion_source_types` | `web` / `app` / `offline` / `total` |
| `async` + `async_format` | `true`; `csv` / `excel` for large async reports |
| `omit_empty` | `true` / `false` (default false) |
| `limit` | max **200** per page |

### 7.3 Metrics (partial list) `[V]`
- **Delivery:** `impressions`, `swipes`, `spend`, `uniques`, `frequency`
- **Video:** `video_views`, `video_views_5s`, `video_views_15s`, `quartile_1/2/3`,
  `view_completion`, `screen_time_millis`
- **App:** `total_installs`, `ios_installs`, `android_installs`
- **Conversions:** `conversion_purchases`, `conversion_sign_ups`,
  `conversion_page_views`, `custom_event_1`–`custom_event_5` (+ `_value` variants)
- **Story:** `story_opens`, `story_completes`
- **Attachment:** `attachment_uniques`, `attachment_video_views`,
  `attachment_view_completion`
- **Lens/Filter:** `shares`, `saves`, `paid_impressions`, `earned_impressions`

> Data refreshes ~every 15 min; metrics finalize ~48 h after day-end in the ad
> account timezone. Conversion value metrics are in local **microcents**. `[P]`

---

## 8. Rate Limits

### 8.1 Ads API `[V]`
| Level | Limit | Behavior |
|---|---|---|
| Per **App** | avg **20 requests/second** overall | — |
| Per **access token** | avg **10 requests/second** | — |
| Exceeded | `HTTP 429 Too Many Requests` | Reduce send rate. Docs do not document explicit `Retry-After`/backoff headers — use client-side exponential backoff. `[P]` |
| Same-creative ad create | per-second cap on consecutive creates reusing one `creative_id` | On 429, switch to **bulk requests** `[V]` |

### 8.2 Conversions API (CAPI) `[V]` / `[P]`
Higher allowance than the standard Ads API when using long-lived static tokens:

| Aspect | Value | Conf |
|---|---|---|
| Endpoint | v3 CAPI endpoint | `[P]` |
| Standard token | 10 req/s applies | `[V]` |
| Long-lived token | recommended up to ~**1000 QPS**, max ~**2000 QPS** | `[P]` |
| Batch size | up to **2,000 events per batch request** | `[V]` |
| Effective throughput | batching × QPS → very high event volume | `[P]` |

### 8.3 Segment user upload `[V]`
Max **100,000** hashed identifiers per `POST /segments/{id}/users` request.

---

## 9. Combinations Matrix (objective → optimization_goal → bid_strategy → required)

Bid-strategy applicability follows §5. `AUTO_BID` omits `bid_micro`; all other
strategies require `bid_micro`. `MIN_ROAS` is deprecated (post 2025-02-10) — do not
use for new squads. Alignment below is inferred from objective/goal semantics; mark
`[P]` where not spelled out field-by-field in docs.

| Campaign objective | Typical `optimization_goal` | Allowed `bid_strategy` | Extra required fields | Conf |
|---|---|---|---|---|
| `BRAND_AWARENESS` / `AWARENESS_AND_ENGAGEMENT` | `IMPRESSIONS` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID`, `TARGET_COST` | budget (§16) | `[P]` |
| `VIDEO_VIEW` | `VIDEO_VIEWS`, `VIDEO_VIEWS_15_SEC` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID` | budget | `[P]` |
| `ENGAGEMENT` | `SWIPES`, `STORY_OPENS`, `USES` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID`, `TARGET_COST` | budget | `[P]` |
| `TRAFFIC` | `SWIPES`, `LANDING_PAGE_VIEW` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID` | budget | `[P]` |
| `APP_INSTALL` / `APP_PROMOTION` | `APP_INSTALLS` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID`, `TARGET_COST` | `event_sources` (Snap App ID), creative `APP_INSTALL` props | `[V]`/`[P]` |
| `APP_CONVERSION` / `APP_PROMOTION` | `APP_PURCHASE`, `APP_SIGNUP`, `APP_ADD_TO_CART`, `APP_REENGAGE_OPEN`, `APP_REENGAGE_PURCHASE` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID` (no `TARGET_COST`/`MIN_ROAS` if SKAN) | `event_sources` Snap App ID (required for re-engage) | `[V]` |
| `WEB_CONVERSION` / `SALES` | `PIXEL_PURCHASE`, `PIXEL_SIGNUP`, `PIXEL_ADD_TO_CART`, `PIXEL_PAGE_VIEW` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID`, `TARGET_COST` | pixel id / conversion event | `[P]` |
| `CATALOG_SALES` (DPA) | `PIXEL_PURCHASE` / `APP_PURCHASE` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID` | product catalog; `event_sources` for app-based DPA | `[V]`/`[P]` |
| `LEAD_GENERATION` / `LEADS` | `LEAD_FORM_SUBMISSIONS` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID` | creative `LEAD_GENERATION` + `lead_generation_form_id` | `[V]`/`[P]` |
| `PROMOTE_PLACES` / `PROMOTE_STORIES` | `IMPRESSIONS`, `STORY_OPENS` | `AUTO_BID`, `LOWEST_COST_WITH_MAX_BID` | budget | `[P]` |

> SKAdNetwork constraint (verified): when a squad is SKAN-enrolled, `MIN_ROAS` and
> `TARGET_COST` are disallowed and `APP_REENGAGE_*` goals are unavailable. `[V]`

---

## Sources
- https://developers.snap.com/marketing-api/Ads-API/authentication
- https://developers.snap.com/marketing-api/Ads-API/campaigns
- https://developers.snap.com/marketing-api/Ads-API/ad-squads
- https://developers.snap.com/marketing-api/Ads-API/ads
- https://developers.snap.com/marketing-api/Ads-API/creatives
- https://developers.snap.com/marketing-api/Ads-API/targeting
- https://developers.snap.com/marketing-api/Ads-API/measurement
- https://developers.snap.com/marketing-api/Ads-API/audience-creation/customer-lists
- https://developers.snap.com/api/marketing-api/Ads-API/rate-limits
- https://developers.snap.com/api/marketing-api/Conversions-API/GetStarted
