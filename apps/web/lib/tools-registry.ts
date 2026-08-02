import type { Platform } from '@adsos/core';
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Blocks,
  Boxes,
  BrainCircuit,
  Building2,
  CalendarClock,
  Clock,
  ClipboardCheck,
  Coins,
  Crosshair,
  FlaskConical,
  Flame,
  Gauge,
  GitCompareArrows,
  Layers,
  LineChart,
  ListChecks,
  MessagesSquare,
  Radar,
  Recycle,
  RefreshCw,
  Scale,
  ScanSearch,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserSearch,
  Users,
  Video,
  Wallet,
  Waypoints,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type ToolCategory =
  | 'Overview'
  | 'Diagnostics'
  | 'Optimization'
  | 'Creative'
  | 'Creators'
  | 'Audience'
  | 'Measurement'
  | 'Reporting'
  | 'Intelligence'
  | 'Commerce'
  | 'Management';

export type ToolStatus = 'live' | 'soon' | 'gated';

export type ToolDef = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  platforms: Platform[] | 'ALL';
  phase: 1 | 2 | 3 | 4 | 5;
  status: ToolStatus;
  icon: LucideIcon;
  href?: string;
  /** TikTok API scopes this tool needs (for capability gating + provenance). */
  scopes?: string[];
  /** Combination tool: spans multiple scopes to deliver an outcome (TIKTOK-TOOLS.md). */
  combination?: boolean;
  capabilityFlag?: string;
  origin?: 'research' | 'handyAds' | 'reacher';
};

const T: Platform[] = ['TIKTOK'];

export const TOOLS: ToolDef[] = [
  // Overview / home
  { slug: 'morning-brief', name: 'Morning Brief', description: 'Everything ranked by urgency and opportunity - the day starts here.', category: 'Overview', platforms: T, phase: 1, status: 'live', icon: Sparkles, href: '/dashboard', scopes: ['Reporting'], origin: 'research' },
  { slug: 'inbox', name: 'Recommendation Inbox', description: 'Every opportunity as an Action Ledger: evidence, impact, risk, one-click apply.', category: 'Overview', platforms: T, phase: 1, status: 'live', icon: ListChecks, href: '/inbox', scopes: ['Ads Management', 'Reporting'], origin: 'research' },
  { slug: 'ask', name: 'Ask (NL Analyst)', description: 'Ask performance questions in plain language; every answer shows its query.', category: 'Overview', platforms: T, phase: 1, status: 'soon', icon: BrainCircuit, scopes: ['Reporting'], origin: 'reacher' },
  { slug: 'outcome-tracker', name: 'Outcome Tracker', description: 'Recommendation pipeline: detected -> proposed -> approved -> applied -> observed -> evaluated.', category: 'Overview', platforms: T, phase: 1, status: 'soon', icon: GitCompareArrows, origin: 'reacher' },
  { slug: 'agency-command', name: 'Agency Command Center', description: 'Every client account ranked by urgency; failed automation, tracking failures, white-label reports.', category: 'Overview', platforms: T, phase: 2, status: 'soon', icon: Building2, scopes: ['Ad Account Management'], origin: 'handyAds' },

  // Diagnostics
  { slug: 'delivery-doctor', name: 'Delivery Doctor', description: 'Why an ad group under-delivers (learning phase, bid, audience) - TikTok diagnosis plus a proposed fix.', category: 'Diagnostics', platforms: T, phase: 1, status: 'soon', icon: ScanSearch, scopes: ['Ad Diagnosis', 'Business Recommendation', 'Reporting', 'Ads Management'], combination: true, origin: 'research' },
  { slug: 'health-score', name: 'Account Health Score', description: 'A single composite score from spend, delivery, tracking and structure signals.', category: 'Diagnostics', platforms: T, phase: 1, status: 'soon', icon: Activity, scopes: ['Reporting'], origin: 'handyAds' },
  { slug: 'budget-pacing', name: 'Budget Pacing', description: 'Spend-to-date vs ideal pace with projected end-of-period.', category: 'Diagnostics', platforms: T, phase: 1, status: 'soon', icon: Gauge, scopes: ['Reporting'], origin: 'handyAds' },
  { slug: 'anomaly-investigator', name: 'Anomaly Investigator', description: 'Spend / CPA / CTR / CVR anomalies vs a trailing baseline, with the drill-down.', category: 'Diagnostics', platforms: T, phase: 1, status: 'soon', icon: AlertTriangle, scopes: ['Reporting'], origin: 'handyAds' },
  { slug: 'performance-change', name: 'Performance Change', description: 'What moved period-over-period, and which entity drove it.', category: 'Diagnostics', platforms: T, phase: 1, status: 'soon', icon: LineChart, scopes: ['Reporting'], origin: 'handyAds' },
  { slug: 'change-history', name: 'Change History', description: 'Correlate configuration changes with the performance shifts that followed.', category: 'Diagnostics', platforms: T, phase: 1, status: 'soon', icon: CalendarClock, origin: 'handyAds' },

  // Optimization
  { slug: 'waste-finder', name: 'Waste Finder', description: 'Surface spend with no return: dead ad groups, zero-conversion targets, wasted impressions.', category: 'Optimization', platforms: T, phase: 1, status: 'live', icon: Recycle, scopes: ['Reporting', 'Ads Management'], origin: 'handyAds' },
  { slug: 'underfunded-winner', name: 'Underfunded Winner', description: 'Budget-capped ad groups with strong CPA that could scale.', category: 'Optimization', platforms: T, phase: 1, status: 'live', icon: TrendingUp, scopes: ['Reporting', 'Ads Management'], origin: 'research' },
  { slug: 'overspending-loser', name: 'Overspending Loser', description: 'High spend, weak return - candidates to trim or pause.', category: 'Optimization', platforms: T, phase: 1, status: 'live', icon: TrendingDown, scopes: ['Reporting', 'Ads Management'], origin: 'research' },
  { slug: 'budget-reallocator', name: 'Budget Reallocator', description: 'Move budget from losers to winners inside the guardrails.', category: 'Optimization', platforms: T, phase: 1, status: 'soon', icon: Wallet, scopes: ['Ads Management', 'Reporting'], origin: 'research' },
  { slug: 'automation-rules', name: 'Automated Rules', description: 'Thresholds, cooldowns and caps that propose actions - or push native TikTok automated rules.', category: 'Optimization', platforms: T, phase: 1, status: 'soon', icon: RefreshCw, scopes: ['Automated Rules', 'Ads Management'], origin: 'handyAds' },
  { slug: 'bid-optimizer', name: 'Bid Optimizer', description: 'Right-size bids per ad group from CPA vs target, within the guardrails.', category: 'Optimization', platforms: T, phase: 1, status: 'soon', icon: Crosshair, scopes: ['Ads Management', 'Reporting'], origin: 'handyAds' },
  { slug: 'dayparting', name: 'Dayparting Optimizer', description: 'Find the hours and weekdays that convert, and schedule delivery to match.', category: 'Optimization', platforms: T, phase: 2, status: 'soon', icon: Clock, scopes: ['Reporting', 'Automated Rules', 'Ads Management'], combination: true, origin: 'handyAds' },
  { slug: 'consolidation', name: 'Consolidation', description: 'Merge fragmented low-volume ad groups so the learning phase completes.', category: 'Optimization', platforms: T, phase: 2, status: 'soon', icon: Boxes, scopes: ['Ads Management'], origin: 'research' },

  // Creative
  { slug: 'creative-fatigue', name: 'Creative Fatigue', description: 'Detect declining creatives before they drag the account down.', category: 'Creative', platforms: T, phase: 1, status: 'live', icon: RefreshCw, scopes: ['Reporting', 'Creative Management'], origin: 'research' },
  { slug: 'creative-agent', name: 'Creative Intelligence Agent', description: 'Analyze top-performing videos and auto-draft creative briefs.', category: 'Creative', platforms: T, phase: 2, status: 'soon', icon: Sparkles, scopes: ['Creative Management', 'Reporting'], origin: 'reacher' },
  { slug: 'creative-refresh', name: 'Creative Refresh Engine', description: 'Detect fatigue, source fresh creator/organic content, and launch tested variants before decay.', category: 'Creative', platforms: T, phase: 2, status: 'soon', icon: Layers, scopes: ['Creative Management', 'TikTok Creator Marketplace', 'Ads Management'], combination: true, origin: 'research' },
  { slug: 'spark-ads', name: 'Spark Ads Manager', description: 'Promote a creator or organic post as a Spark Ad and track it end to end.', category: 'Creative', platforms: T, phase: 3, status: 'soon', icon: Video, scopes: ['Creative Management', 'TikTok Creator', 'Ads Management'], origin: 'research' },
  { slug: 'hook-analyzer', name: 'Hook Analyzer', description: 'First-3-second retention and hook strength across your video creatives.', category: 'Creative', platforms: T, phase: 2, status: 'soon', icon: Flame, scopes: ['Creative Management', 'Reporting'], origin: 'reacher' },

  // Creators
  { slug: 'creator-to-spark', name: 'Creator-to-Spark Loop', description: 'Discover a fitting creator, promote their post as a Spark Ad, track performance, manage comments - one flow.', category: 'Creators', platforms: T, phase: 3, status: 'soon', icon: Waypoints, scopes: ['TikTok Creator Marketplace', 'TikTok Creator', 'Creative Management', 'Ads Management', 'Reporting', 'Ad Comments'], combination: true, origin: 'reacher' },
  { slug: 'creator-discovery', name: 'Creator Discovery', description: 'Find creators by content, audience and performance via the TikTok Creator Marketplace.', category: 'Creators', platforms: T, phase: 3, status: 'soon', icon: UserSearch, scopes: ['TikTok Creator Marketplace'], origin: 'reacher' },
  { slug: 'creator-crm', name: 'Creator CRM', description: 'Track creator status, briefs, and results across all your collaborations.', category: 'Creators', platforms: T, phase: 3, status: 'soon', icon: Users, scopes: ['TikTok Creator Marketplace'], origin: 'reacher' },
  { slug: 'comment-manager', name: 'Comment Manager', description: 'Moderate and respond to ad comments to protect brand and lift engagement.', category: 'Creators', platforms: T, phase: 2, status: 'soon', icon: MessagesSquare, scopes: ['Ad Comments'], origin: 'reacher' },
  { slug: 'creator-outreach', name: 'Creator Outreach', description: 'Message and brief creators at scale, track responses through the pipeline.', category: 'Creators', platforms: T, phase: 3, status: 'soon', icon: Send, scopes: ['TikTok Creator Marketplace', 'TikTok Creator'], origin: 'reacher' },

  // Audience
  { slug: 'audience-lab', name: 'Audience Lab', description: 'Build and expand custom + lookalike audiences, plan reach/frequency, wire catalogs.', category: 'Audience', platforms: T, phase: 2, status: 'soon', icon: Target, scopes: ['Audience Management', 'Reach & Frequency', 'DPA Catalog Management'], combination: true, origin: 'research' },
  { slug: 'catalog-manager', name: 'Catalog Manager', description: 'Manage product feeds and product groups for shopping and DPA ads.', category: 'Audience', platforms: T, phase: 3, status: 'soon', icon: ShoppingBag, scopes: ['DPA Catalog Management'], origin: 'research' },
  { slug: 'reach-frequency', name: 'Reach & Frequency Planner', description: 'Plan reach and frequency for awareness campaigns before you launch.', category: 'Audience', platforms: T, phase: 3, status: 'soon', icon: Radar, scopes: ['Reach & Frequency'], origin: 'research' },

  // Measurement
  { slug: 'tracking-doctor', name: 'Tracking Doctor', description: 'TikTok Pixel / Events API health and missing-conversion-source detection.', category: 'Measurement', platforms: T, phase: 1, status: 'live', icon: ShieldCheck, scopes: ['Pixel Management', 'Measurement'], origin: 'research' },
  { slug: 'conversion-command', name: 'Conversion Command', description: 'Audit the whole tracking stack - pixel, custom conversions, offline and CRM events - and fix gaps.', category: 'Measurement', platforms: T, phase: 2, status: 'soon', icon: Waypoints, scopes: ['Pixel Management', 'Custom Conversion Management', 'Offline Events Management', 'CRM Event Management', 'Measurement'], combination: true, origin: 'research' },
  { slug: 'offline-events', name: 'Offline & CRM Events', description: 'Upload offline conversions and CRM events to close the measurement loop.', category: 'Measurement', platforms: T, phase: 3, status: 'soon', icon: Blocks, scopes: ['Offline Events Management', 'CRM Event Management'], origin: 'research' },
  { slug: 'attribution', name: 'Attribution & Lift', description: 'Compare attribution windows and estimate incremental lift beyond last-click.', category: 'Measurement', platforms: T, phase: 3, status: 'soon', icon: Waypoints, scopes: ['Measurement', 'Reporting'], origin: 'research' },

  // Reporting
  { slug: 'profitability', name: 'Profitability / P&L', description: 'True ROAS using real billed spend and product margins - not just platform spend.', category: 'Reporting', platforms: T, phase: 2, status: 'soon', icon: Coins, scopes: ['Reporting', 'Payment Portfolio', 'DPA Catalog Management'], combination: true, origin: 'reacher' },
  { slug: 'custom-reports', name: 'Custom Reports', description: 'Build and schedule reports across any dimension and metric.', category: 'Reporting', platforms: T, phase: 2, status: 'soon', icon: LineChart, scopes: ['Reporting'], origin: 'handyAds' },
  { slug: 'benchmarking', name: 'Benchmarking', description: 'Benchmark a client account over time and against partner insights.', category: 'Reporting', platforms: T, phase: 2, status: 'soon', icon: Scale, scopes: ['Partner Insights', 'Reporting'], origin: 'research' },

  // Intelligence
  { slug: 'business-recommendation', name: 'TikTok Recommendations, Validated', description: "Surface TikTok's own suggestions, then validate each against your data before you apply.", category: 'Intelligence', platforms: T, phase: 2, status: 'soon', icon: Sparkles, scopes: ['Business Recommendation', 'Reporting'], origin: 'research' },
  { slug: 'competitive-intel', name: 'Competitive Intelligence', description: 'Benchmark top performers and research creatives - research only, no data resale.', category: 'Intelligence', platforms: T, phase: 3, status: 'soon', icon: Radar, scopes: ['Partner Insights'], origin: 'reacher' },
  { slug: 'api-mcp', name: 'API + MCP', description: 'Connect your normalized data to external AI/BI tools. Scale beyond the console.', category: 'Intelligence', platforms: T, phase: 5, status: 'soon', icon: Blocks, origin: 'reacher' },

  // Commerce
  { slug: 'shop-manager', name: 'Shop & Commerce', description: 'Manage onsite commerce store surfaces tied to your campaigns.', category: 'Commerce', platforms: T, phase: 4, status: 'soon', icon: ShoppingBag, scopes: ['Onsite Commerce Store'], origin: 'research' },
  { slug: 'gmv-max', name: 'GMV Max Optimizer', description: 'Optimize product-sales campaigns for gross merchandise value, not just conversions.', category: 'Commerce', platforms: T, phase: 4, status: 'soon', icon: Zap, scopes: ['Onsite Commerce Store', 'DPA Catalog Management', 'Reporting', 'Ads Management'], combination: true, origin: 'reacher' },
  { slug: 'brand-safety', name: 'Brand Safety', description: 'Apply inventory filters and keep delivery on safe surfaces.', category: 'Commerce', platforms: T, phase: 3, status: 'soon', icon: ShieldAlert, scopes: ['Brand Safety'], origin: 'research' },

  // Management
  { slug: 'campaign-studio', name: 'Campaign Studio', description: 'Build a campaign where invalid field combinations are impossible to submit.', category: 'Management', platforms: T, phase: 1, status: 'soon', icon: FlaskConical, scopes: ['Ads Management'], origin: 'handyAds' },
  { slug: 'bulk-editor', name: 'Bulk Editor', description: 'Budget/status edits across many entities with an aggregate impact + risk preview.', category: 'Management', platforms: T, phase: 1, status: 'soon', icon: ListChecks, scopes: ['Ads Management'], origin: 'handyAds' },
  { slug: 'targeting-explorer', name: 'Targeting Explorer', description: 'Explore interests, behaviors, geos and audiences the builder can use.', category: 'Management', platforms: T, phase: 2, status: 'soon', icon: Target, scopes: ['Audience Management'], origin: 'handyAds' },
  { slug: 'launch-qa', name: 'Launch QA', description: 'Pre-submit checklist: tracking, budget, targeting, creative, naming.', category: 'Management', platforms: T, phase: 1, status: 'soon', icon: ClipboardCheck, scopes: ['Ads Management', 'Pixel Management'], origin: 'handyAds' },
  { slug: 'smart-plus', name: 'Smart+ Comparator', description: 'Compare TikTok Smart+ automated campaigns against manual structures.', category: 'Management', platforms: T, phase: 3, status: 'gated', icon: BadgeDollarSign, capabilityFlag: 'tiktokSmartPlus', scopes: ['Ads Management'], origin: 'research' },
];

export const CATEGORY_ORDER: ToolCategory[] = [
  'Overview',
  'Diagnostics',
  'Optimization',
  'Creative',
  'Creators',
  'Audience',
  'Measurement',
  'Reporting',
  'Intelligence',
  'Commerce',
  'Management',
];

export function toolBySlug(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolsByCategory(): { category: ToolCategory; tools: ToolDef[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    tools: TOOLS.filter((t) => t.category === category),
  })).filter((g) => g.tools.length > 0);
}

export function toolsForPhase(maxPhase: number): ToolDef[] {
  return TOOLS.filter((t) => t.phase <= maxPhase);
}
