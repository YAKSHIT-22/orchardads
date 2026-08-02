# Optmyzr — Product & Pricing Reference

Competitive study of Optmyzr (optmyzr.com) to inform our multi-platform ad-optimization SaaS (Reddit/Spotify/Snap/Pinterest). Focus: marketing IA, pricing, onboarding.

**Researched:** 2026-07-28. Pricing page and figures read on this date. Optmyzr moved to a new pricing model in **June 2025**; Meta/LinkedIn spend starts counting toward billing **June 1, 2026**.

**Primary sources**
- Pricing: https://www.optmyzr.com/pricing/
- Homepage: https://www.optmyzr.com/
- AI/LLM info page (dense feature list): https://www.optmyzr.com/ai-info-page/
- Solutions: https://www.optmyzr.com/solutions/
- Billing/overage FAQ: https://help.optmyzr.com/en/articles/11503422-subscription-overages-and-billing-faqs
- Link your accounts: https://help.optmyzr.com/en/articles/3316915-link-your-accounts
- Onboarding checklist blog: https://www.optmyzr.com/blog/onboarding-checklist/
- Free trial guide: https://www.optmyzr.com/blog/optmyzr-free-trial-guide/
- 3rd-party price breakdown: https://www.groas.com/post/optmyzr-pricing-2025-complete-cost-breakdown-all-plans-explained

---

## 1. Multi-Platform Model

**Supported platforms (6):** Google Ads (Search, Shopping, Performance Max), Microsoft Advertising, Amazon Ads, Meta Ads (FB/IG), LinkedIn Ads, Yahoo! Japan Ads.

**How they unify — three product lines, not one flat dashboard:**
- **Optmyzr for Search** — Google + Microsoft, unified tools/reports/automation across both.
- **Optmyzr for Amazon** — Amazon Ads only; dedicated ACoS + inventory tools.
- **Optmyzr for Social** — Meta + LinkedIn together; cross-platform campaign controls and reporting.

So platforms are grouped by *kind of buying* (search vs. retail vs. social), each with its own tool set — not one identical toolbox stamped across every platform. Reporting/dashboards can still consolidate across all connected platforms.

**Account / MCC selection:**
- One Optmyzr login connects many ad accounts across platforms.
- **All Accounts Dashboard** is the top-level home: performance from every connected platform in one view. Users "star" priority accounts.
- **Google Ads:** you link a Google login → the whole **MCC (manager account)** is pulled in; all child accounts connect automatically; unwanted ones can be unlinked afterward.
- **Microsoft/Meta:** authorize the login, then *hand-pick* which accounts to add (more granular than Google's all-or-nothing MCC pull).
- **Portfolios** group accounts (by client, platform, or custom) for cross-account budgets, rules, and reporting. Individual-account views handle granular work.

---

## 2. Pricing

**Pricing axis = monthly ad spend** (primary), with a secondary **account-count cap** on the entry tier. Not per-seat, not per-platform, not per-feature-unlock in the classic sense (though lower tier does gate some tools).

**Three tiers** (annual prepaid = **30% off** vs monthly; 12-month commitment):

| Tier | Spend cap | Price (approx) | Accounts |
|---|---|---|---|
| **Essentials** | up to **$150K/mo** | from **~$209/mo** annual (~$300 monthly) | capped at **25 ad accounts**; +$5/account/mo beyond |
| **Premium** | up to **$500K/mo** | from **~$389/mo** | unlimited (fair-use) |
| **Enterprise** | **$500K+/mo** | custom (contact sales) | unlimited (fair-use) |

*Prices are entry points; the bill scales up through spend brackets ($25K, $50K, $75K, $150K, $250K, $350K, $500K, $500K+).*

**What each tier includes**
- **Essentials:** limited optimization/audit/insight tools, limited social, limited reporting/dashboards, limited budget monitoring, **no Shopping/PMax**. 1 Q&A onboarding session, 24h email support.
- **Premium:** *all* optimization/audit/insight tools, full social (Meta + LinkedIn), full multi-account reporting, **Shopping/PMax**, daily/weekly/monthly Rule Engine automations. 2×30-min onboarding, 6h support, 1h setup service.
- **Enterprise:** everything in Premium + custom integrations, custom API/direct integration, Okta SSO, dedicated account manager, monthly training, 3×1h onboarding, 4h support, 4h setup service.

**Spend caps & overages**
- Spend counted = Google + Microsoft + Amazon + Yahoo! Japan today; **Meta + LinkedIn added to billed spend June 1, 2026**.
- **15–20% buffer** baked into each cap for fluctuation.
- Overage billed per additional $1,000 with tiered rates (e.g. 150K plan: $1.60/1K up to $1M, then $1.00/1K).
- If overage exceeds the next plan's cost for **2 consecutive months → auto-upgrade** with 7-day notice.
- Meta and Google Analytics accounts **don't count toward account limits**.

**Trial / guarantee:** **14-day free trial, no credit card**. 30-day money-back guarantee for first-time subs.

---

## 3. Onboarding Flow

**High-level (marketed as "minutes, 100% secure"):** Sign up → connect an ad account → run an account audit for baseline health → start optimizing.

**Connect step, per platform:**
- **Google Ads:** pick the Google login with MCC access, authorize (~15 sec, one-time). Entire MCC + child accounts pulled in; unlink extras later. Needs **~30 days of historical data** to generate recommendations.
- **Microsoft Ads:** authorize → click the MS login → select specific accounts.
- **Meta:** authorize FB access → click FB login → link individual **Facebook Ads accounts** (not personal profiles). LinkedIn similar under Optmyzr for Social.

**First-value sequence (from free-trial guide):** they deliberately front-load *passive* value, then analysis, then action.
- **Days 1–2 (Visibility):** All Accounts Dashboard pulls all platforms into one view; star key accounts, set monthly budget targets, customize columns.
- **Days 3–5 (Diagnosis):** run **Optmyzr Express** (AI to-do list); set KPI alerts, budget-pacing alerts, anomaly detection.
- **Days 6–10 (Optimize):** Budget Dashboard, Spend Projection, PPC Investigator, Negative Keyword Finder.
- **Days 11–14 (Depth):** Rule Engine automations, PMax management, full account audit.

**First-month checklist (5-week ramp, from onboarding blog):**
- **Wk 0–1:** set alerts + monitoring automations → establish baseline.
- **Wk 2–3:** PPC Investigator analysis; Spend Projection; Optimize Budgets.
- **Wk 4–5:** network/location analysis, search-query optimization, hour-of-week bids, device/location bid adjustments, prebuilt "Account Workouts."

**Takeaway pattern:** monitor (safe) → analyze → optimize (risky). Value shown before any account changes are made.

---

## 4. Product Structure

Tools are organized under **5 use-case verbs** (this is their IA spine):

- **Monitor** — real-time performance tracking, alerts, KPI + budget monitoring, account dashboards.
- **Optimize** — one-click optimizations, bid/budget tools, bulk cross-account changes.
- **Automate** — **Rule Engine** (if/then strategy automation, pre-built + custom), Campaign Automator (feed-based campaign creation), scripts (no-code).
- **Report** — Quick-Fire Reporting templates, automated delivery, multi-platform consolidation, AI report writing.
- **Analyze** — **PPC Investigator** (cause/effect, N-grams, root-cause), account audits (0–100 health score), comparisons.

**Signature/named tools to mirror conceptually:**
- **Rule Engine** — the automation "brain"; if/then, scales where scripts don't. (Their most-praised feature in testimonials.)
- **Optmyzr Express** — AI daily optimization to-do list (great activation hook).
- **PPC Investigator** — diagnostic "why did performance change."
- **PPC Account Audit** — 0–100 health score vs best practices.
- **Account Blueprints** — reusable sets of PPC tasks for standardization.
- **Account Workouts** — prebuilt task bundles toward a specific goal.
- **Campaign Automator** — feed/inventory-based campaign generation.
- **Portfolio Dashboard / All Accounts Dashboard** — cross-account rollups.
- Bid tools: Conversion Grabber, First Page Bridger, Hour-of-Week adjustments; Keyword Lasso, Search Term N-Grams, Smart Product Labeler.

---

## 5. Marketing Site IA

**Top nav:** Products · Solutions · Resources · Company · Pricing · Log In · Start Trial.

**Homepage sections (in order):**
1. **Hero** — tagline ("Worry-free account management for the AI and automation era of PPC") + dual CTA (Start Trial / Book a Demo) + product screenshot.
2. **Value prop + proof stats** — headline plus quantified outcomes (e.g. 28% revenue, 56% productivity, $ saved).
3. **Feature grid (6–7 tiles)** — Real-Time Monitoring, User-Controlled Automation, AI for Paid Search, Bid & Budget Protections, Rapid Audits, One-Click Optimizations, Quick-Fire Reporting; each with Learn More.
4. **Social proof** — 40+ testimonials, 5-star ratings, agency logos.
5. **"Getting started takes minutes"** — 3-step onboarding + security reassurance.
6. **Repeated CTA blocks** (Start Trial / Book a Demo) throughout.
7. **Footer** — Products, Company, Use Cases, Resources, social.

**Solutions IA — sliced three ways:**
- **By use case:** Monitoring, Optimization, Automation, Reporting, Analysis.
- **By platform/product line:** Optmyzr for Search, for Amazon, for Social.
- **By role:** Agencies, In-house teams, Freelancers, Enterprise brands.

**Pricing page:** 3-tier cards, spend-bracket selector, monthly/annual toggle (Save 30%), feature comparison, trial + money-back reassurance, payment methods.

---

## TAKEAWAYS FOR US

**(a) Recommended pricing axis**
- **Primary = monthly ad spend brackets**, mirroring Optmyzr — it scales with customer value and is the industry-accepted mental model. Use annual-prepaid discount (they use 30%) to lock in cash.
- Add a **buffer (15–20%)** into each cap and **tiered per-$1K overage** rather than hard walls — reduces friction, encourages upgrade.
- Gate the **entry tier by account count** (Optmyzr: 25 accounts, +$5/account) to protect against agency abuse without adding a seat meter.
- Avoid per-seat pricing (agencies hate it) and avoid pure per-platform pricing — but *do* gate premium tools (our equivalent of Shopping/PMax) to the mid tier.
- Since we're Reddit/Spotify/Snap/Pinterest (all social/display, no "search"), we don't need Optmyzr's 3-product split. **One unified product, spend-based tiers, all 4 platforms in every tier** is a cleaner story and a differentiator vs Optmyzr. [unverified: our exact spend brackets]

**(b) Recommended onboarding steps per platform**
- Universal flow: **Sign up → OAuth-connect first platform → auto-pull all accounts → land on All-Accounts Dashboard → run an audit/"Express" to-do list for instant value → set alerts → then optimize.** Front-load passive value (dashboards + alerts) before any account changes.
- **Reddit Ads:** OAuth to Reddit Ads; pull business/ad accounts; hand-pick accounts (Meta-style selection, not Google MCC auto-pull).
- **Pinterest Ads:** OAuth to Pinterest Business; select ad account(s); note shopping/catalog feed support as a premium hook.
- **Snap Ads:** OAuth to Snapchat Ads Manager; select org → ad accounts.
- **Spotify Ads:** OAuth to Spotify Ad Manager; select account(s). [unverified: Spotify Ads API/OAuth availability — confirm before promising auto-connect]
- Copy Optmyzr's **first-14-day guided sequence** (visibility → diagnosis → optimize → automate) as an in-app checklist to drive activation.
- Require/handle a **historical-data minimum** gracefully (Optmyzr needs ~30 days) — show "collecting data" state instead of empty recommendations.

**(c) Marketing homepage section list (mirror this order)**
1. Hero: outcome-focused tagline + dual CTA (Start Free Trial / Book Demo) + product screenshot.
2. Quantified proof stats band.
3. Feature grid of 6 tiles built on the 5 verbs: **Monitor, Optimize, Automate, Report, Analyze** (+ an "AI" tile).
4. Platform strip: Reddit · Spotify · Snap · Pinterest logos ("all your channels, one dashboard").
5. Social proof / testimonials + logos.
6. "Get started in minutes" 3-step + security reassurance.
7. Repeated CTA blocks.
8. Footer: Products · Solutions (by use case / by role) · Resources · Company.

Plus a **Solutions section sliced 3 ways** (by use case, by platform, by role: Agency / In-house / Freelancer / Enterprise) and a **spend-bracket pricing page** with monthly/annual toggle + trial reassurance.

---

*Unverified items marked [unverified]. Exact displayed dollar figures on the pricing page render dynamically per spend bracket; the ~$209/~$389 entry points come from third-party breakdowns cross-checked against Optmyzr's tier structure (read 2026-07-28).*
