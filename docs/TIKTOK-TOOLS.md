# TikTok Tool Suite - scope map + combination tools

OrchardAds on TikTok is not just an ad optimizer. TikTok's API spans **ads +
creators + measurement + commerce**, so the product is a **TikTok performance +
creator OS**. This maps each API scope to tools, and - crucially - designs
multi-scope "combination" tools that do what no single API does. Reference:
Reacher (TikTok-Shop creator tool) for the creator/CRM/agent patterns.

## Scope -> capability

| TikTok scope | Powers |
|---|---|
| Ad Account Management | account center, structure |
| Ads Management | campaigns/ad groups/ads read+write (pause, budget, bid, create) |
| Reporting | metrics, KPIs, P&L inputs |
| Automated Rules | native TikTok rules (create/manage via API) |
| Ad Diagnosis | why an ad under-delivers (learning phase, bid, audience) |
| Business Recommendation | TikTok's own suggestions |
| Pixel / Measurement / Offline / CTX / Custom Conversion / CRM Events | the whole conversion-tracking stack |
| Creative Management | creative assets, Spark Ads |
| TikTok Creator Marketplace (TCM) / TikTok Creator | creator discovery + partnerships |
| Ad Comments / Mentions | engagement + moderation |
| Audience Management / DPA Catalog / Reach & Frequency | targeting, product feeds, planning |
| Payment Portfolio | real spend/billing -> true P&L |
| Partner Insights / Brand Safety | benchmarking, inventory safety |
| Onsite Commerce Store / Minis | shop surfaces |
| Business Verification / App / TikTok Accounts | ops |

## The combination tools (the differentiator)

Each spans multiple scopes to deliver an outcome, not just an endpoint:

1. **Delivery Rescue** = Ad Diagnosis + Business Recommendation + Reporting + Ads Management + Automated Rules.
   Detect under-delivering ad groups, explain *why* (TikTok diagnosis), propose the fix, and one-click apply or turn into a native automated rule.
2. **Creator-to-Spark Loop** = TCM (discover creators) + TikTok Creator + Creative Management (Spark Ads) + Ads Management + Reporting + Ad Comments.
   Find a fitting creator, promote their post as a Spark Ad, track its performance, and manage the comments - one flow, four scopes. This is the Reacher wedge, native to TikTok Ads.
3. **Conversion Command** = Pixel + Custom Conversion + Offline Events + CRM Events + CTX + Measurement.
   Audit the entire tracking stack, find dropped/duplicated events, and fix or wire missing conversions. Gates all conversion-optimizing actions (tracking must be healthy).
4. **Profit Autopilot** = Reporting + Payment Portfolio + DPA Catalog + Ads Management.
   True ROAS/P&L using real billed spend and product margins (not just platform spend), then reallocate budget to actual profit - Reacher's P&L, done right.
5. **Creative Refresh Engine** = Creative Management + creative-fatigue + TCM + Ads Management.
   Detect fatigue, source fresh creator/organic content, and launch tested variants before performance decays.
6. **Audience Lab** = Audience Management + Reach & Frequency + DPA Catalog.
   Build/expand custom + lookalike audiences, plan reach/frequency, and wire catalogs for shopping.

## Tool categories (drives the UI + registry)

Diagnostics - Optimization - Creative - Creators - Audience - Measurement -
Reporting - Intelligence - Commerce - Management.

Every tool declares the TikTok scope(s) it needs, so a tool the connection lacks
renders an explained empty state (CapabilityGate), never a broken control.
