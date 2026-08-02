# Spotify Ads API v3 — Backend Reference

> **Confidence legend**
> `[V]` Verified directly against the official v3.0 reference/quick-start pages (fetched 2026-07-27).
> `[P]` Plausible — derived from official pages via summarization or from Spotify community/engineering sources; cross-check before shipping.
> `[U]` Unverified — asserted by internal spec but **not** confirmed against the live docs, or contradicted by them. Do not treat as fact.
>
> **Sources fetched:** `developer.spotify.com/documentation/ads-api/reference/v3.0/{info, createCampaign, createAdSet, createAd, createAsset, estimateBid, estimateAudience, getInterestTargets, getAdCategories}`, `.../quick-start`, `.../guides`. The top-level `ads-api`, `guides`, and `quick-start` landing pages are JS-heavy and repeatedly returned `504`; content below came from the reference sub-pages plus web search.
>
> ⚠️ **Field-name drift vs. internal spec.** Several names in the internal brief differ from what the live v3.0 reference actually returns. Where they conflict, the **live doc value is authoritative** and the brief's value is flagged. Key drifts: `WEB_TRAFFIC` → actually **`WEBSITE_VISITS`** `[V]`; ad-set `start_date` → actually **`start_time`** `[V]`; `canvas_asset_id` "audio-only" → actually **IMAGE or VIDEO, 9:16** `[V]`; `objective` is **deprecated on the campaign** and defaults to `EVEN_IMPRESSION_DELIVERY` `[V]`.

---

## 1. Authentication

| Item | Value | Conf |
|------|-------|------|
| Auth scheme | OAuth 2.0 authorization-code flow; `Authorization: Bearer <token>` | `[V]` |
| App registration | Create an app in the Spotify Developer Dashboard to get `client_id` + `client_secret`; configure a redirect URI | `[V]` |
| Authorize URL | `https://accounts.spotify.com/authorize?client_id=<ID>&response_type=code&redirect_uri=<URI>` | `[V]` |
| Auth `code` lifetime | ~10 minutes | `[P]` |
| Token exchange | `POST https://accounts.spotify.com/api/token` with `Basic base64(<client_id>:<client_secret>)` | `[V]` |
| Access token lifetime | **1 hour** (bearer) | `[V]` |
| Refresh token | Long-lived; used to mint new access tokens without re-consent | `[V]` |
| **Terms acceptance** | You **must accept the Ads API Terms against your client ID** at `https://adsmanager.spotify.com/api-terms`. "Requests to Ads API will fail if you have not completed this step." | `[V]` |
| Allowlist propagation | Allowlisting can take **up to ~1 hour** after accepting Terms | `[V]` |
| **>25-user quota extension** | Onboarding **more than 25 users** requires a quota-extension request via the Developer Dashboard; a Spotify team reviews and responds **within ~6 weeks** | `[P]` |
| Extended mode benefits | Higher rate limits + no cap on connected users, once reviewed/approved | `[P]` |

### Base URLs `[V]`

| Environment | Base URL |
|-------------|----------|
| Production | `https://api-partner.spotify.com/ads/v3/` |
| Sandbox | `https://api-partner.spotify.com/ads-sandbox/v3/` |

---

## 2. Entity Hierarchy `[V]`

```
Business
  └─ Ad Account            (ad_account_id, UUID — path root for most calls)
       └─ Campaign         (campaign_id, UUID)
            └─ Ad Set       (ad_set_id, UUID; references campaign_id)
                 └─ Ad      (ad_id, UUID; references ad_set_id)
                      └─ Asset  (asset_id, UUID; AUDIO / VIDEO / IMAGE)
```

- Assets are created **under the ad account** (`/ad_accounts/{ad_account_id}/assets`) and referenced by `asset_id` from Ads — they are not nested beneath a specific ad. `[V]`
- Every entity returns `id`, `status`, `created_at`, `updated_at`. `[V]`
- Draft variants exist for campaigns/ad sets/ads (create/update as drafts before publishing). `[P]`
- Major resource groups exposed by the API: Ad Accounts & Members, Campaigns, Ad Sets, Ads, Assets, Audiences/Custom Audiences, Business Management, CAPI (Conversions API) & Measurement, Reporting, Targeting (Artists/Genres/Geo/Interests/Languages/Playlists/Podcasts), Pricing & Estimates. `[V]`

---

## 3. Per-Entity CRUD

All paths are relative to the base URL. `{ad_account_id}` is a UUID path parameter. Money is always **micro-amounts** (integer = nominal × 10⁶). `[V]`

### 3.1 Campaign

| Op | Method + Path | Conf |
|----|---------------|------|
| Create | `POST /ad_accounts/{ad_account_id}/campaigns` | `[V]` |
| Read | `GET /ad_accounts/{ad_account_id}/campaigns/{campaign_id}` | `[P]` |
| Update | `PUT/PATCH /ad_accounts/{ad_account_id}/campaigns/{campaign_id}` | `[P]` |
| List | `GET /ad_accounts/{ad_account_id}/campaigns` | `[P]` |

**Create body** `[V]`

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| `name` | string | **Yes** | 2–200 chars, pattern `^\S.*\S$` |
| `purchase_order` | string | No | 2–45 chars; **immutable after create** `[U]` |
| `objective` | enum | No | **Deprecated at campaign level**; default `EVEN_IMPRESSION_DELIVERY`. Objective effectively lives at the ad-set/delivery layer now |
| `ad_product` | enum | No | Default `UNSET`; values `UNSET, UNKNOWN, CONTENT, FPMNG` |
| `delivery_goal_group` | enum | No | `UNSET, AWARENESS, WEBSITE_TRAFFIC, APP_PROMOTION, ENGAGEMENT_ON_SPOTIFY, LEAD_GEN` |

### 3.2 Ad Set

| Op | Method + Path | Conf |
|----|---------------|------|
| Create | `POST /ad_accounts/{ad_account_id}/ad_sets` | `[V]` |
| Read | `GET /ad_accounts/{ad_account_id}/ad_sets/{ad_set_id}` | `[P]` |
| Update | `PUT/PATCH /ad_accounts/{ad_account_id}/ad_sets/{ad_set_id}` | `[P]` |
| List | `GET /ad_accounts/{ad_account_id}/ad_sets` | `[P]` |

**Create body** `[V]`

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| `name` | string | **Yes** | 2–200 chars |
| `campaign_id` | UUID | **Yes** | Parent campaign |
| `start_time` | ISO-8601 UTC | **Yes** | ⚠️ named `start_time` (not `start_date`); must be a **future** time |
| `budget` | object | **Yes** | `{ micro_amount:int64, type: DAILY|LIFETIME }` — micro-amount = nominal × 10⁶ |
| `targets` | object | **Yes** | See §6; `placements` inside is required |
| `bid_strategy` | enum | **Yes** | `MAX_BID, AUTOBID, COST_PER_RESULT, UNSET` |
| `asset_format` | enum | **Yes** | `AUDIO, VIDEO, IMAGE, CATALOG` |
| `end_time` | ISO-8601 | No | |
| `bid_micro_amount` | int64 | No | Bid per 1000 impressions × 10⁶ |
| `base_rate_micro_amount` | int64 | No | |
| `pacing` | enum | No | `PACING_EVEN, PACING_ASAP` — **immutable after create** `[P]` |
| `frequency_caps` | array (≤3) | No | `{frequency_unit, frequency_period, max_impressions}` |
| `video_delivery_formats` | array | No | `IN_STREAM, OPT_IN` |
| `delivery` | enum | No | `ON, OFF` |
| `delivery_goal` | enum | No | `IMPRESSIONS, REACH, VIDEO_VIEWS, CLICKS, PAGE_VIEWS, APP_INSTALLS, STREAMS, LEADS` |
| `mobile_app_id` | UUID | Cond. | Required for app-install delivery (see §5) |
| `dataset_id` | UUID | No | Measurement dataset (pixel / MMP) |
| `slot_positions` | array | No | `PRE_ROLL, MID_ROLL, POST_ROLL` |
| `cost_modifiers` | array | No | |
| `category` | string | No | Ad-set category id |
| `promotion` | object | No | Artist/podcast promotion |

### 3.3 Ad

| Op | Method + Path | Conf |
|----|---------------|------|
| Create | `POST /ad_accounts/{ad_account_id}/ads` | `[V]` |
| Read | `GET /ad_accounts/{ad_account_id}/ads/{ad_id}` | `[P]` |
| Update | `PUT/PATCH /ad_accounts/{ad_account_id}/ads/{ad_id}` | `[P]` |
| List | `GET /ad_accounts/{ad_account_id}/ads` | `[P]` |

**Create body** `[V]`

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| `name` | string | **Yes** | 2–200 chars |
| `advertiser_name` | string | **Yes** | 2–25 chars |
| `tagline` | string | **Yes** | 2–40 chars |
| `ad_set_id` | UUID | **Yes** | Parent ad set |
| `assets` | object | **Yes** | Holds `asset_id` (AUDIO/VIDEO/IMAGE), `logo_asset_id` (IMAGE), `companion_asset_id` (IMAGE) |
| `call_to_action` | object | **Yes** | `{ key, language, ... }` — see CTA enums in §4 |
| `canvas_asset_id` | UUID | No | ⚠️ Live doc: **IMAGE or VIDEO asset, 9:16** (internal "audio-only" claim is **wrong** `[U]`) |
| `start_time` / `end_time` | ISO-8601 | No | Ad-level schedule |
| `third_party_tracking` | array (≤11) | No | Tracking partners |
| `dv_client_code` | string | No | DoubleVerify |
| `catalog` | object | No | Carousel/catalog items |
| `delivery` | enum | No | Default `ON` |
| `click_url` | string | Cond. | Landing URL (required for click/traffic objectives) `[P]` |

### 3.4 Asset

| Op | Method + Path | Conf |
|----|---------------|------|
| Create (metadata) | `POST /ad_accounts/{ad_account_id}/assets` | `[V]` |
| Read | `GET /ad_accounts/{ad_account_id}/assets/{asset_id}` | `[P]` |
| List | `GET /ad_accounts/{ad_account_id}/assets` | `[P]` |

**Create body** `[V]`

| Field | Type | Req | Notes |
|-------|------|-----|-------|
| `asset_type` | enum | **Yes** | `AUDIO, IMAGE, VIDEO` |
| `name` | string | **Yes** | 2–120 chars |
| `asset_subtype` | enum | Cond. | Required for `AUDIO`: `BACKGROUND_MUSIC, USER_UPLOADED_AUDIO` |

Asset status lifecycle: `WAITING_UPLOAD → PROCESSING → READY` (or `ERROR`). `[V]`
Image formats `JPEG`/`PNG`; video returns thumbnail + audio-detection flag; audio returns duration (ms) after processing. `[V]`

**`aspect_ratio` enum (string)** `[V]`: `HORIZONTAL_16_9`, `HORIZONTAL_1_91_1`, `HORIZONTAL_1_2_1`, `SQUARE`, `VERTICAL_9_16`. Aspect ratio is a **string enum, not a numeric ratio.**

#### Chunked upload (large files) `[V]`

Use the 3-step chunked flow for large assets (internal spec threshold **≈ 25 MB** `[U]` — not confirmed on the live page):

1. `POST /ad_accounts/{ad_account_id}/assets/{asset_id}/upload/start` — `startUploadChunkedAsset`
2. `PUT /ad_accounts/{ad_account_id}/assets/{asset_id}/upload/transfer` — `transferChunkedAsset` (per chunk)
3. `POST /ad_accounts/{ad_account_id}/assets/{asset_id}/upload/complete` — `completeUploadChunkedAsset`

A single-file `uploadAsset` path also exists for small assets. `[P]`

---

## 4. Enums

> Values below are what the **live v3.0 reference** returns. Where the internal brief's names differ, the live value wins and the brief value is flagged `[U]`.

| Enum | Values | Conf |
|------|--------|------|
| `objective` | `UNSET, REACH, EVEN_IMPRESSION_DELIVERY, CLICKS, VIDEO_VIEWS, PODCAST_STREAMS, APP_INSTALLS, WEBSITE_VISITS` | `[V]` |
| ⚠️ objective drift | Brief's `WEB_TRAFFIC` = live **`WEBSITE_VISITS`**; brief's `APP_INSTALLS` matches. Objective is **deprecated at campaign level** | `[V]` |
| `placements` (in `targets`) | `MUSIC, PODCAST` | `[V]` |
| `placements` (reserved podcast / CONTENT) | `PODCAST_DAI, PODCAST_SAI` | `[P]` |
| `bid_strategy` | `MAX_BID, AUTOBID, COST_PER_RESULT, UNSET` (brief listed only MAX_BID/COST_PER_RESULT) | `[V]` |
| `pacing` | `PACING_EVEN, PACING_ASAP` — immutable after create | `[V]` pacing / `[P]` immutability |
| `asset_format` | `AUDIO, VIDEO, IMAGE, CATALOG` (brief omitted CATALOG) | `[V]` |
| `asset_type` | `AUDIO, IMAGE, VIDEO` | `[V]` |
| `asset_subtype` (AUDIO) | `BACKGROUND_MUSIC, USER_UPLOADED_AUDIO` | `[V]` |
| `aspect_ratio` | `HORIZONTAL_16_9, HORIZONTAL_1_91_1, HORIZONTAL_1_2_1, SQUARE, VERTICAL_9_16` | `[V]` |
| `video_delivery_formats` | `IN_STREAM, OPT_IN` | `[V]` |
| `budget.type` | `DAILY, LIFETIME` | `[V]` |
| `delivery` | `ON, OFF` | `[V]` |
| `delivery_goal` | `IMPRESSIONS, REACH, VIDEO_VIEWS, CLICKS, PAGE_VIEWS, APP_INSTALLS, STREAMS, LEADS` | `[V]` |
| `delivery_goal_group` | `UNSET, AWARENESS, WEBSITE_TRAFFIC, APP_PROMOTION, ENGAGEMENT_ON_SPOTIFY, LEAD_GEN` | `[V]` |
| `ad_product` | `UNSET, UNKNOWN, CONTENT, FPMNG` | `[V]` |
| `slot_positions` | `PRE_ROLL, MID_ROLL, POST_ROLL` | `[V]` |
| `genders` (targets) | `MALE, FEMALE, NON_BINARY` | `[V]` |
| `platforms` (targets) | `ANDROID, DESKTOP, IOS` | `[V]` |
| CTA `key` | `APPLY_NOW, BOOK_NOW, BUY_NOW, BUY_TICKETS, CLICK_NOW, DOWNLOAD, FIND_STORES, GET_COUPON, GET_INFO, LEARN_MORE, LISTEN_NOW, MORE_INFO, ORDER_NOW, PRE_SAVE, SAVE_NOW, SHARE, SHOP_NOW, SIGN_UP, VISIT_PROFILE, VISIT_SITE, WATCH_NOW` | `[V]` |
| CTA `language` | `ENGLISH, SPANISH, FRENCH, GERMAN, ITALIAN, PORTUGUESE, DUTCH, SWEDISH, DANISH, NORWEGIAN, FINNISH, POLISH, CZECH, HUNGARIAN, ROMANIAN, BULGARIAN, CROATIAN, GREEK, TURKISH, RUSSIAN, UKRAINIAN, SLOVAK, ARABIC, HEBREW, THAI, VIETNAMESE, INDONESIAN, CHINESE, JAPANESE, KOREAN` (+ regional variants) | `[V]` |
| MMP app-install source | `APPSFLYER_APP_INSTALLS, KOCHAVA_APP_INSTALLS, SKAD_APP_INSTALLS` | `[P]` |
| `sensitive_topic` exclusions | Managed via `sensitive_topic_exclusions` (per-topic or global filter) + `GET /targets/sensitive-topics` (`getSensitiveTopicTargets`); explicit option keys not confirmed | `[U]` |

---

## 5. Conditional / Business Rules

| Rule | Detail | Conf |
|------|--------|------|
| App-install objective | `APP_INSTALLS` requires a `mobile_app_id` plus an MMP integration — **Kochava** (`KOCHAVA_APP_INSTALLS`) or **AppsFlyer** (`APPSFLYER_APP_INSTALLS`); `SKAD_APP_INSTALLS` also supported. Configure via measurement-dataset endpoints before delivery | `[P]` |
| Web-traffic objective | `WEBSITE_VISITS` (brief's "WEB_TRAFFIC") requires a **Spotify Pixel** / connected data source; set up via measurement-dataset endpoints | `[P]` |
| Clicks + bid strategy | Internal spec: `CLICKS` allows `COST_PER_RESULT`, otherwise forbidden. **Not confirmed** on live docs (`bid_strategy` list itself is verified) | `[U]` |
| Video views delivery | Internal spec: `VIDEO_VIEWS` locks `video_delivery_formats = OPT_IN`. Live guide only states video-view metrics apply to **opt-in video ads**; the hard lock is inferred | `[P]` |
| Podcast placement | Internal spec: `PODCAST` cannot be selected alone. Live guide shows reserved-podcast (CONTENT) requires `placements:[PODCAST_DAI, PODCAST_SAI]` + ≥1 `podcast_show_category_ids` | `[P]` (rule) / `[V]` (reserved-podcast reqs) |
| Minimum budget | Internal spec: **min lifetime budget ≈ $250**. Live guide only says budget/date-range must be large enough for a "High" delivery-likelihood forecast; exact $250 floor **not confirmed** | `[U]` |
| Start time | Ad-set `start_time` must be in the **future** (internal: ≥ 1h ahead — the exact 1-hour margin is not stated) | `[P]` (future) / `[U]` (1h) |
| Immutable after create | Internal spec: `pacing`, `objective`, `purchase_order` immutable. Live docs do not enumerate immutables; `ad_product` appears fixed once set | `[U]` |
| `canvas_asset_id` | ⚠️ Live doc says **IMAGE or VIDEO, 9:16** — the internal "audio-only" claim is **contradicted** | `[V]` (contradiction) |

---

## 6. Targeting — `targets` object

Passed on Ad Set create and on `estimateBid` / `estimateAudience`. `placements` is **required**. `[V]`

| Field | Type | Notes | Conf |
|-------|------|-------|------|
| `placements` | array | **Required.** `MUSIC, PODCAST` | `[V]` |
| `age_ranges` | array | `{min, max}` ints, 13–99 | `[V]` |
| `genders` | array | `MALE, FEMALE, NON_BINARY` | `[V]` |
| `platforms` | array | `ANDROID, DESKTOP, IOS` | `[V]` |
| `language` | string | 2-char code | `[V]` |
| `geo_targets` | object | `country_code`, `city_ids`, `dma_ids`, `region_ids`, `postal_code_ids` — **all IDs are STRINGS, not ints** | `[V]` (fields) / `[P]` (string type) |
| `interest_ids` | array | Interest IDs (see `GET /targets/interests`) | `[V]` |
| `artist_ids` | array | | `[V]` |
| `genre_ids` | array | | `[V]` |
| `playlist_ids` | array | | `[V]` |
| `podcast_episode_topic_ids` | array | | `[V]` |
| `sensitive_topic_exclusions` | object | Per-topic or global exclusion filters | `[V]` |
| `audience_ids` | array | Custom audiences | `[V]` |
| `audience_ids_exclusions` | array | | `[V]` |
| `user_day_parts` | array | Day/hour dayparting objects | `[V]` |

**Targeting lookup endpoints** `[V]`

| Endpoint | Method + Path | Returns |
|----------|---------------|---------|
| Interests | `GET /targets/interests` (`ids[]`, `q`) | `interests_with_subtargets[] { id(string), name, subtargets[]{id,name} }` |
| Ad categories | `GET /ad_categories` (`q`) | `[]{ id (e.g. "ADV_1_8"), parent_category, name }` |
| Sensitive topics | `GET /targets/sensitive-topics` (`getSensitiveTopicTargets`) | topic list for exclusions |

---

## 7. Estimation Endpoints

| Endpoint | Method + Path | Key fields | Conf |
|----------|---------------|------------|------|
| Estimate bid | `POST /estimates/bid` | Req: `asset_format, objective, bid_strategy, currency (ISO 4217), frequency_caps, targets`. Opt: `video_delivery_formats, category`. Returns `bid_estimate_min/max` (**micro**), `cost_model` (`CPM`/`CPCL`), `currency` | `[V]` |
| Estimate audience | `POST /estimates/audience` | Req: `ad_account_id, start_date, asset_format, objective, bid_strategy, bid_micro_amount, budget{micro_amount,type,currency}, targets`. Returns `audience_forecast[]` (`estimated_reach_min/max`, `estimated_impressions_min/max`, `estimated_frequency_min/max`, `estimated_cpm_min/max`, `forecast_type`), `bid_suggestion`, `likely_to_deliver_budget` (bool) | `[V]` |

Note `estimateAudience` uses `start_date` while ad-set create uses `start_time`. `[V]`

---

## 8. Reporting + Rate Limits

Rate limits are **per calling app, per user (client_id + user_id key)**. `[P]`

| Scope | Limit | Conf |
|-------|-------|------|
| Client ID + User ID key (general) | **1500 requests / 30 s** (≈ 50 rps) | `[V]` (1500/30s) / `[P]` (50 rps math) |
| Reporting endpoints | **150 requests / 30 s** (takes precedence over the general cap on these paths) | `[V]` |
| Async reports (`async_reports`) | Internal spec: **30 / 30 s** — **not confirmed** on live docs | `[U]` |

**Response headers** `[V]`: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` (seconds until reset). On `429`, back off until reset.

Reporting supports **async report** generation plus synchronous reporting/analytics pulls; exact report-type catalog not enumerated here. `[P]`

---

## 9. Not Available via API `[P]`

| Capability | Status |
|------------|--------|
| User / member management (adding users, roles) | UI-only (Ads Manager) |
| Billing / payment methods | UI-only — no API; use a deep-link into Ads Manager |

The API surface covers campaign structure, assets, targeting, estimates, measurement (CAPI/pixel/MMP), audiences, and reporting — but **not** account onboarding, seat management, or payments.

---

## 10. Combinations Matrix (objective → allowed config)

> Objective is **deprecated at the campaign level** and effectively expressed through ad-set `asset_format` + `delivery_goal` + `targets.placements` + measurement setup. The table maps the intended objective to the constraints that actually enforce it. Rows blend `[V]` enum facts with `[P]/[U]` rule inferences — treat the "Required extras" column as `[P]` unless noted.

| Objective (intent) | Placements | Bid strategy | Asset format | Required extras |
|--------------------|-----------|--------------|--------------|-----------------|
| `REACH` / `EVEN_IMPRESSION_DELIVERY` | MUSIC, PODCAST | MAX_BID, AUTOBID | AUDIO, VIDEO, IMAGE | budget + targets + future `start_time` |
| `CLICKS` | MUSIC, PODCAST | MAX_BID, AUTOBID, (COST_PER_RESULT `[U]`) | AUDIO, VIDEO, IMAGE | `click_url` on Ad `[P]` |
| `VIDEO_VIEWS` | MUSIC (in-stream) | MAX_BID, AUTOBID | VIDEO | `video_delivery_formats` → OPT_IN `[P]` |
| `PODCAST_STREAMS` | PODCAST (not alone `[P]`; reserved → PODCAST_DAI/SAI) | MAX_BID, AUTOBID | AUDIO | `podcast_show_category_ids` for reserved `[V]` |
| `APP_INSTALLS` | MUSIC, PODCAST | COST_PER_RESULT, AUTOBID | AUDIO, VIDEO, IMAGE | `mobile_app_id` + MMP (Kochava/AppsFlyer/SKAd) |
| `WEBSITE_VISITS` (brief "WEB_TRAFFIC") | MUSIC, PODCAST | COST_PER_RESULT, AUTOBID | AUDIO, VIDEO, IMAGE | Spotify Pixel / measurement dataset |

---

## 11. Version Note

| Item | Detail | Conf |
|------|--------|------|
| Current version | **v3.0**, path segment `/ads/v3/` | `[V]` |
| Release | v3 released **~Jan 2025** (per internal spec) | `[P]` |
| Prior version | v2.0 reference pages still published (e.g. `.../reference/v2.0/createCampaign`) | `[V]` |
| Sunset cadence | Internal spec: **~annual** major-version sunset; **flag v4 risk** — plan for a v4 migration window and a "Breaking vs. Non-Breaking Changes" policy the API publishes | `[P]` (policy exists `[V]`) |
| Stability signal | A public outage was reported for the Ads API v3 in Aug 2025 (community) — build in ret/backoff and status monitoring | `[P]` |

---

### Appendix — Fetch caveats
- Live reference sub-pages were parsed by an automated summarizer; **exact required/optional flags and nested shapes should be re-confirmed against the OpenAPI/reference before code-gen.**
- The `ads-api`, `guides`, and `quick-start` landing pages returned `504` on direct fetch; rate-limit numbers and the >25-user/6-week figures came partly from web search of official + community sources and are marked `[P]`.
