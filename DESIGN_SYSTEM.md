# DESIGN SYSTEM

**Product:** an ad-operations console. **Audience:** media buyers and agency operators who live in this screen for hours. **The single job of the interface:** make it obvious what changed, what should change next, why, and what happens if you approve it.

---

## 1. The constraint that drives everything

Four platform brands are already in the room: Reddit orange, Spotify green, Snap yellow, Pinterest red. Any brand palette built from those hues will collide with platform identity and make the interface unreadable — a green "success" badge next to a Spotify rail is ambiguous.

**So: the chrome is achromatic, and saturated colour is rationed to exactly two jobs — platform identity and risk state.** Nothing else in the product gets to be colourful. This is the whole visual thesis, and it is why the product looks like an instrument rather than a dashboard template.

The brand accent is **iris** (~275°), chosen because it sits at maximum hue distance from all four platform brands. It is not decoration; it marks the one thing the user is meant to act on next.

---

## 2. Tokens

Written as CSS custom properties in `globals.css`, oklch throughout, consumed via Tailwind theme extension and shadcn/ui conventions.

```css
:root {
  /* ── Ground ─────────────────────────────────────────── */
  --console:      oklch(0.18 0.018 265);   /* app chrome, nav rail, command bar */
  --console-alt:  oklch(0.24 0.020 265);   /* raised chrome, active nav */
  --paper:        oklch(0.985 0.003 265);  /* content surface */
  --paper-sunk:   oklch(0.965 0.004 265);  /* table stripes, wells, code */

  /* ── Neutrals ───────────────────────────────────────── */
  --ink:          oklch(0.22 0.012 265);   /* primary text */
  --ink-muted:    oklch(0.48 0.010 265);   /* secondary text */
  --ink-faint:    oklch(0.64 0.008 265);   /* tertiary, placeholders */
  --rule:         oklch(0.90 0.005 265);   /* hairlines, table borders */
  --rule-strong:  oklch(0.82 0.006 265);

  /* ── Brand: iris. Used only for "the next action". ──── */
  --iris:         oklch(0.55 0.19 275);
  --iris-hover:   oklch(0.49 0.20 275);
  --iris-wash:    oklch(0.955 0.028 275);
  --iris-edge:    oklch(0.86 0.07 275);

  /* ── State. Deliberately desaturated so platform ─────
       rails stay the most saturated thing on screen.   */
  --applied:      oklch(0.52 0.11 155);    /* action succeeded */
  --applied-wash: oklch(0.955 0.028 155);
  --attention:    oklch(0.70 0.12 75);     /* needs review, pacing drift */
  --attention-wash: oklch(0.965 0.035 75);
  --risk:         oklch(0.55 0.16 30);     /* destructive, high risk, failed */
  --risk-wash:    oklch(0.960 0.030 30);

  /* ── Platform identity. ONLY in 3px rails and chips. ── */
  --p-reddit:     oklch(0.63 0.22 35);
  --p-spotify:    oklch(0.74 0.21 145);
  --p-snap:       oklch(0.87 0.19 100);
  --p-pinterest:  oklch(0.52 0.20 20);

  /* ── Diff semantics (the signature component) ───────── */
  --diff-from-bg: oklch(0.965 0.020 30);
  --diff-from-fg: oklch(0.45 0.13 30);
  --diff-to-bg:   oklch(0.960 0.024 155);
  --diff-to-fg:   oklch(0.42 0.11 155);

  /* ── Geometry ───────────────────────────────────────── */
  --r-sm: 3px;  --r-md: 5px;  --r-lg: 8px;
  --rail: 3px;                              /* platform identity rail width */
  --row-h: 38px;                            /* dense table row */
  --row-h-comfy: 46px;
}

.dark {
  --paper:       oklch(0.19 0.014 265);
  --paper-sunk:  oklch(0.23 0.014 265);
  --ink:         oklch(0.95 0.004 265);
  --ink-muted:   oklch(0.72 0.008 265);
  --ink-faint:   oklch(0.56 0.008 265);
  --rule:        oklch(0.32 0.010 265);
  --rule-strong: oklch(0.40 0.012 265);
  --iris:        oklch(0.68 0.17 275);
  --iris-wash:   oklch(0.27 0.045 275);
  /* state washes darken proportionally — keep the same hue, drop L to ~0.26 */
}
```

**Radii are small on purpose.** 3–8px, not 12–16px. Rounded corners cost horizontal rhythm in dense tables and read as consumer-app softness in a tool where people are spending money.

---

## 3. Typography

Three faces, three jobs. Loaded via `next/font/google` with `display: 'swap'` and subset to latin.

| Role | Face | Where |
|---|---|---|
| Display | **Bricolage Grotesque** (variable) | Page titles, the Morning Brief headline, empty-state headlines. Nowhere else. |
| UI / body | **Public Sans** | Everything: labels, buttons, prose, table headers. Real tabular figures, excellent at 12–14px. |
| Data | **IBM Plex Mono** | Every number that represents money, a rate, an ID, a diff value, or a timestamp. |

Bricolage is used with restraint — roughly six places in the whole product. Its job is to make the top of a page feel authored rather than generated. If it starts appearing in table headers, that's drift; pull it back.

**The mono rule is not stylistic.** Media buyers scan columns of currency and percentages vertically. Proportional digits break column alignment and cost real scanning speed. Any `<td>` containing a number uses `font-data` with `font-variant-numeric: tabular-nums`.

```css
.font-display { font-family: var(--font-bricolage); font-weight: 600; letter-spacing: -0.02em; }
.font-ui      { font-family: var(--font-public-sans); }
.font-data    { font-family: var(--font-plex-mono); font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
```

### Scale

| Token | Size / line | Face | Use |
|---|---|---|---|
| `display-lg` | 32/36 | Bricolage 600 | Page title |
| `display-sm` | 22/28 | Bricolage 600 | Section headline, modal title |
| `body` | 14/21 | Public Sans 400 | Default |
| `body-sm` | 13/19 | Public Sans 400 | Table cells, secondary |
| `label` | 11/14, +0.06em, uppercase | Public Sans 600 | Field labels, table headers, eyebrows |
| `data-lg` | 20/24 | Plex Mono 500 | Headline metrics |
| `data` | 13/18 | Plex Mono 400 | Table numbers, diffs |
| `data-sm` | 11/16 | Plex Mono 400 | IDs, timestamps, deltas |

---

## 4. The signature component — the Action Ledger

This is the one element the product is remembered by, and it embodies the safety thesis: **you always see exactly what will change before it changes.**

The same component renders in three places, unchanged:

1. In the Recommendation Inbox, collapsed to one line.
2. In the approval sheet, expanded with impact and risk.
3. In the audit trail, frozen with the platform's actual response.

```
┌─────────────────────────────────────────────────────────────────┐
│▌ REDDIT · AD GROUP · "US / Homelab / Conversions"               │  ← 3px platform rail
│                                                                 │
│  daily_budget      1 200.00 USD  →  1 500.00 USD      +25.0%   │  ← mono, from/to washes
│  bid_strategy      MANUAL        →  MANUAL              —      │
│                                                                 │
│  ── evidence ────────────────────────────────────────────────   │
│  CPA 14.20 USD over 21 d, 68 conv · budget-capped 19 of 21 d    │
│  Hourly delivery flat-lines at 14:00 UTC on capped days         │
│                                                                 │
│  ── estimate ────────────────────────────────────────────────   │
│  +12 to +19 conversions / week   confidence MEDIUM              │
│  basis: trailing 21 d CVR held constant                         │
│                                                                 │
│  risk LOW · reversible · cooldown 48 h                          │
│                                     [ Dismiss ]  [ Apply ▸ ]    │
└─────────────────────────────────────────────────────────────────┘
```

Rules:

- **From/to on one line, mono, aligned.** Never two paragraphs of prose describing a change.
- **Unchanged fields render as `—`.** Showing what is *not* changing is as important as showing what is; it is how a user builds trust that the tool is not touching things silently.
- **Evidence is data, not narration.** Every line is a fact retrieved from the metric store. If the AI wrote a sentence, it goes under evidence, attributed, and it may not contain a number absent from the bundle.
- **`basis:` is mandatory on every estimate.** An impact estimate without a stated assumption is a guess wearing a suit.
- **Irreversible actions say so, in the risk line, in `--risk`.** Never hide it behind a confirm dialog.

---

## 5. Platform identity treatment

Platform colour appears in exactly two forms and nowhere else:

**Rail** — a 3px left border on any card, row group, or panel scoped to one platform.
**Chip** — an 18px pill with the platform mark and label, used in cross-platform lists.

```tsx
<article className="border-l-[3px] border-l-[var(--p-reddit)] bg-[var(--paper)] …">
```

Explicitly forbidden: platform-coloured buttons, platform-coloured backgrounds, platform-coloured text, platform-tinted charts. A chart series representing Reddit spend uses the neutral series ramp with the platform named in the legend. The moment platform colour leaks into charts, a four-platform report becomes unreadable.

---

## 6. Layout

```
┌────┬──────────────────────────────────────────────────────────┐
│    │  ⌘K command bar                             [workspace ▾]│  56px, --console
│ n  ├──────────────────────────────────────────────────────────┤
│ a  │                                                          │
│ v  │   Morning Brief                              display-lg  │
│    │   ───────────────────────────────────────────            │
│ 60 │   ┌─ urgency lane ─────────┐  ┌─ context ──────┐         │
│ px │   │ ranked action ledgers  │  │ pacing, health │         │
│    │   │ (the primary column)   │  │ tracking, sync │         │
│    │   └────────────────────────┘  └────────────────┘         │
│    │            720px max                  320px              │
└────┴──────────────────────────────────────────────────────────┘
```

- **Nav rail is 60px, icon-only, `--console`.** Labels on hover. Horizontal space belongs to data.
- **Content is a two-column asymmetric split**, not a card grid. A card grid implies every tile is equally important; the whole point of this product is that one thing is more urgent than the others.
- **The primary column is capped at 720px.** Action Ledgers are read line by line; wider lines lose the eye.
- **Full-bleed only for tables.** Data tables use the full viewport width and scroll horizontally with a frozen first column.
- **⌘K is the primary navigation** for anyone past week one: jump to account, jump to campaign, run a recommendation, apply a saved filter.

---

## 7. Component inventory

Built on shadcn/ui (Radix primitives, source owned in `packages/ui`). Each entry is a component to build, not a component to find.

### Primitives (extend shadcn defaults)
`Button` (variants: primary=iris, secondary, ghost, destructive=risk) · `Input` · `Select` · `Combobox` · `Checkbox` · `RadioGroup` · `Switch` · `Slider` · `Textarea` · `Label` · `Tooltip` · `Popover` · `Dialog` · `Sheet` · `Tabs` · `Toast` · `Skeleton` · `Separator`

### Data
- **`MetricStat`** — label, `data-lg` value, delta with direction, sparkline. The delta is coloured by *desirability*, not by sign: falling CPA is `--applied`.
- **`DataTable`** — TanStack Table. Column pinning, virtualized rows, per-column sort/filter, saved views, CSV export. 38px rows.
- **`TimeSeriesChart`** — Recharts. Neutral series ramp. Annotation layer for change events (see `ChangeMarker`).
- **`BreakdownBar`** — horizontal share bar for geo/placement/audience splits.
- **`PacingGauge`** — spend-to-date vs ideal pace, with projected end-of-period.
- **`AttributionToggle`** — last-click ↔ multi-touch. **Rendered non-dismissibly on every Pinterest report** (platform requirement), available elsewhere.
- **`FeeBreakdown`** — media spend and platform fee shown as separate lines, never summed into one figure.

### Action system
- **`ActionLedger`** — §4. Three density modes: `line` · `card` · `frozen`.
- **`DiffRow`** — one field's from → to. The atom of the ledger.
- **`RiskBadge`** — SAFE / LOW / MEDIUM / HIGH.
- **`ImpactEstimate`** — range, confidence band, mandatory `basis` line.
- **`ApprovalSheet`** — side sheet; typed confirmation for HIGH risk.
- **`RollbackButton`** — disabled with an explanation when `rollbackPlan` is null.
- **`BulkActionBar`** — appears on row selection; shows aggregate impact and aggregate risk before any bulk apply.

### Campaign Studio
- **`FlowStepper`** — objective → settings → targeting → creative → review. Steps lock forward until valid.
- **`CapabilityGate`** — wraps any feature behind a manifest flag. Renders an explained empty state, never a broken control.
- **`FieldGroup`** — label, control, inline validation, help text, and a **"why is this required"** affordance that quotes the platform constraint.
- **`CombinationWarning`** — inline, appears the moment a selected combination becomes invalid, naming the conflicting field. See `CAMPAIGN_FLOWS.md` §3.
- **`LaunchQA`** — pre-submit checklist: tracking, budget, targeting, creative, naming.
- **`PayloadPreview`** — the exact JSON that will be sent, collapsed by default. Power users trust a product that shows its work.

### Platform / status
- **`PlatformRail`** · **`PlatformChip`** · **`SyncStatus`** (fresh / syncing / stale / failed, with `lastSuccessAt`) · **`TrackingHealthBadge`** · **`ConnectionCard`** · **`CapabilityList`**

### Shell
- **`CommandBar`** (⌘K) · **`NavRail`** · **`WorkspaceSwitcher`** · **`AgencyClientList`** (ranked by urgency, never alphabetical) · **`EmptyState`** · **`ErrorState`**

---

## 8. Density and motion

**Density:** default to compact. 38px rows, 8px grid, 12px gutters inside cards. Offer a comfortable mode at 46px in user preferences; do not make it the default because the primary user has 40 campaigns on screen.

**Motion:** three uses only.

1. Sheet and dialog entry — 160ms, `cubic-bezier(0.2, 0, 0, 1)`.
2. Row state change on apply — the Action Ledger's `to` value flashes `--applied-wash` for 400ms then settles. This is the only celebratory moment in the product and it earns its place because it confirms money moved.
3. Skeleton → content crossfade, 120ms.

No scroll-triggered reveals. No parallax. No animated numbers counting up — a media buyer reading a spend figure needs it correct immediately, not performed.

`@media (prefers-reduced-motion: reduce)` disables all three, keeping only opacity changes.

---

## 9. Copy rules

- **Name things by what the user controls.** "Conversion tracking," not "pixel/CAPI ingestion." "Budget change," not "mutation."
- **Active voice, and the verb survives the whole flow.** The button says *Apply*; the toast says *Applied*; the audit row says *Applied*. Never *Submit* → *Success*.
- **Errors state what happened and what to do.** Not "Something went wrong." → "Reddit rejected this budget change: daily budget must be at least 5.00 USD. Raise the amount and apply again."
- **Errors do not apologise** and are never vague.
- **Empty states are instructions.** Not "No recommendations." → "No recommendations yet. The first analysis runs once 7 days of data has synced — about 3 days away for this account."
- **Sentence case everywhere** except the `label` token, which is uppercase by design.
- **Never claim certainty the data doesn't support.** "Estimated +12 to +19 conversions/week" not "Will add 15 conversions."
- **Every number in the UI is traceable.** If a user clicks a figure, they can see the rows behind it.

---

## 10. Accessibility floor

Not a phase — a build condition.

- Contrast ≥ 4.5:1 for text, ≥ 3:1 for UI boundaries. The desaturated state colours were chosen to pass on `--paper`; re-check any new one.
- **Colour is never the only signal.** Risk bands carry a text label. Diff rows carry `→` and a sign, not just a wash colour. A red/green-colourblind user must be able to read the Action Ledger perfectly.
- Visible keyboard focus on every interactive element, `--iris` 2px offset ring.
- Full keyboard path through Campaign Studio and the approval sheet.
- Tables use real `<table>` semantics with `<caption>` and `scope`.
- Live regions announce sync completion and action results.
- Reduced motion respected (§8).
