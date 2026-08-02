'use client';

import * as React from 'react';
import {
  Button,
  Card,
  DataGrid,
  EmptyRow,
  InsightBanner,
  StatGrid,
  StatTile,
  TH,
  THead,
  ToolSection,
  TR,
  Segmented,
  SearchInput,
  SelectField,
  ContextLine,
  Checkbox,
  BulkActionBar,
} from '@adsos/ui';
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Coins,
  EyeOff,
  Handshake,
  Key,
  Megaphone,
  MessageSquareReply,
  MessagesSquare,
  Radar,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  UserSearch,
  Users,
  Video,
  Waypoints,
} from 'lucide-react';
import type { ToolViewMap, ToolViewProps } from './_registry';

/* -- creator-to-spark (flagship combination) -- */

const SPARK_LOOP_STAGES = [
  { key: 'discover', label: 'Discover creator', icon: UserSearch, sub: 'TCM search matched to your niche' },
  { key: 'promote', label: 'Promote Spark Ad', icon: Video, sub: 'Authorize, then run their post as a paid ad' },
  { key: 'track', label: 'Track performance', icon: BarChart3, sub: 'CTR, spend and conversions vs. organic' },
  { key: 'comments', label: 'Manage comments', icon: MessagesSquare, sub: 'Moderate and reply on the live ad' },
] as const;

function CreatorToSparkView({ tool }: ToolViewProps) {
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        The flagship combination flow: find a fitting creator, promote their post as a Spark Ad, track it
        against organic, and manage the comments - one flow across TCM, TikTok Creator, Creative Management,
        Ads Management, Reporting and Ad Comments.
      </ContextLine>

      <StatGrid>
        <StatTile icon={UserSearch} label="Creators in pipeline" value="-" sub="across all stages" />
        <StatTile icon={Video} label="Spark Ads live" value="-" sub="promoted from creator posts" tone="iris" />
        <StatTile icon={BarChart3} label="Avg CTR" value="-" sub="Spark Ads vs. account avg" />
        <StatTile icon={MessagesSquare} label="Comments needing review" value="-" sub="flagged on live ads" tone="attention" />
      </StatGrid>

      <ToolSection title="The loop" sub="Each stage hands off to the next - nothing here requires leaving the flow">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SPARK_LOOP_STAGES.map((s, i) => (
            <Card key={s.key} className="relative flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-iris-wash text-iris">
                  <s.icon className="h-4 w-4" />
                </span>
                <span className="font-data text-[11px] text-ink-faint">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <span className="font-ui text-[13px] font-semibold text-ink">{s.label}</span>
              <span className="font-ui text-[11px] leading-4 text-ink-faint">{s.sub}</span>
              {i < SPARK_LOOP_STAGES.length - 1 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink-faint lg:block" />
              )}
            </Card>
          ))}
        </div>
      </ToolSection>

      <ToolSection title="Pipeline" sub="Every creator currently moving through the loop">
        <DataGrid>
          <THead>
            <TR>
              <TH>Creator</TH>
              <TH>Post</TH>
              <TH>Stage</TH>
              <TH>Spark Ad status</TH>
              <TH numeric>CTR</TH>
              <TH numeric>Comments flagged</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={6}>
              No creators in the loop yet. Discover a creator below to start a Creator-to-Spark run.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={Waypoints} tone="info">
        Creator-to-Spark Loop is the wedge combination tool: discovery, Spark Ad promotion, performance
        tracking and comment moderation as one flow, native to TikTok Ads instead of bolted on.
      </InsightBanner>
    </div>
  );
}

/* -- creator-discovery -- */

function CreatorDiscoveryView({ tool }: ToolViewProps) {
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Search the Creator Marketplace by niche, audience size, GMV and engagement to find creators who fit
        the brief - not just the biggest follower count.
      </ContextLine>

      <StatGrid>
        <StatTile icon={UserSearch} label="Creators matched" value="-" sub="for the current filters" />
        <StatTile icon={Users} label="Avg followers" value="-" sub="across matches" />
        <StatTile icon={Sparkles} label="Avg engagement rate" value="-" sub="across matches" tone="iris" />
        <StatTile icon={Coins} label="Avg GMV (30d)" value="-" sub="TikTok Shop, where available" />
      </StatGrid>

      <ToolSection
        title="Filters"
        sub="Narrow the Creator Marketplace before you search"
      >
        <div className="flex flex-wrap items-end gap-3">
          <SelectField label="Niche" options={['Any niche', 'Beauty', 'Fashion', 'Home', 'Tech', 'Fitness', 'Food']} />
          <SelectField label="Followers" options={['Any size', '10K-50K', '50K-250K', '250K-1M', '1M+']} />
          <SelectField label="GMV (30d)" options={['Any GMV', '$1K-$10K', '$10K-$50K', '$50K+']} />
          <SelectField label="Engagement rate" options={['Any rate', '2%+', '5%+', '10%+']} />
          <SearchInput placeholder="Search creator or handle" />
        </div>
      </ToolSection>

      <ToolSection title="Results" sub="Ranked by fit to the filters above">
        <DataGrid>
          <THead>
            <TR>
              <TH>Creator</TH>
              <TH>Niche</TH>
              <TH numeric>Followers</TH>
              <TH numeric>Avg views</TH>
              <TH numeric>Engagement rate</TH>
              <TH numeric>GMV (30d)</TH>
              <TH>Rate card</TH>
              <TH>Action</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={8}>
              No creators to show yet. Connect a TikTok Creator Marketplace scope and set a filter above to
              search the creator database.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={UserSearch} tone="info">
        Creator Discovery searches the Creator Marketplace on the fields that predict fit - niche,
        engagement rate and GMV, not just follower count - then hands a match straight into Creator CRM or
        the Creator-to-Spark loop.
      </InsightBanner>
    </div>
  );
}

/* -- creator-crm -- */

const CRM_STAGES = ['Sourced', 'Contacted', 'Negotiating', 'Active', 'Completed'] as const;

function CreatorCrmView({ tool }: ToolViewProps) {
  const [stage, setStage] = React.useState<(typeof CRM_STAGES)[number]>('Sourced');
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Every creator relationship in one pipeline - brief, last contact and next step - so nothing sourced
        from Creator Discovery goes cold.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Users} label="Total creators" value="-" sub="in the pipeline" />
        <StatTile icon={Handshake} label="Active collaborations" value="-" sub="in progress" tone="iris" />
        <StatTile icon={MessagesSquare} label="Avg response time" value="-" sub="creator to first reply" />
        <StatTile icon={Sparkles} label="Completed campaigns" value="-" sub="all time" tone="positive" />
      </StatGrid>

      <ToolSection
        title={stage}
        sub="Move a creator forward as the relationship progresses"
        action={<Segmented options={CRM_STAGES} value={stage} onChange={setStage} />}
      >
        <DataGrid>
          <THead>
            <TR>
              <TH>Creator</TH>
              <TH>Stage</TH>
              <TH>Brief</TH>
              <TH>Last contact</TH>
              <TH>Owner</TH>
              <TH>Next step</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={6}>
              No creators at this stage yet. Source a creator from Creator Discovery to start a pipeline
              entry.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={Handshake} tone="info">
        Creator CRM tracks every relationship from first contact to completed campaign, so status, briefs
        and next steps live in one board instead of a spreadsheet.
      </InsightBanner>
    </div>
  );
}

/* -- comment-manager -- */

const COMMENT_TABS = ['All', 'Flagged', 'Needs reply', 'Hidden'] as const;

function CommentManagerView({ tool }: ToolViewProps) {
  const [tab, setTab] = React.useState<(typeof COMMENT_TABS)[number]>('All');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Comments across every live ad, ranked so brand-risk and unanswered questions surface first.
      </ContextLine>

      <StatGrid>
        <StatTile icon={MessagesSquare} label="Comments (24h)" value="-" sub="across live ads" />
        <StatTile icon={ShieldAlert} label="Flagged" value="-" sub="brand-safety risk" tone="risk" />
        <StatTile icon={Megaphone} label="Needs reply" value="-" sub="unanswered questions" tone="attention" />
        <StatTile icon={ShieldAlert} label="Hidden" value="-" sub="removed from public view" />
      </StatGrid>

      <ToolSection
        title="Queue"
        sub="Sorted by risk, then recency"
        action={
          <div className="flex items-center gap-2">
            <Segmented options={COMMENT_TABS} value={tab} onChange={setTab} />
            <SearchInput placeholder="Search comment or author" />
          </div>
        }
      >
        <DataGrid>
          <THead>
            <TR>
              <TH className="w-8">
                <Checkbox checked={false} onCheckedChange={() => {}} disabled aria-label="Select all" />
              </TH>
              <TH>Comment</TH>
              <TH>Ad</TH>
              <TH>Author</TH>
              <TH>Sentiment</TH>
              <TH>Flag reason</TH>
              <TH>Posted</TH>
              <TH>Action</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={8}>
              No comments yet. Once an ad using Ad Comments scope goes live, comments needing moderation or
              reply appear here.
            </EmptyRow>
          </tbody>
        </DataGrid>
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          className="mt-3"
          actions={
            <>
              <Button variant="secondary" size="sm" disabled={selected.size === 0} className="gap-1.5">
                <EyeOff className="h-3.5 w-3.5" />
                Hide
              </Button>
              <Button variant="primary" size="sm" disabled={selected.size === 0} className="gap-1.5">
                <MessageSquareReply className="h-3.5 w-3.5" />
                Mark replied
              </Button>
            </>
          }
        />
      </ToolSection>

      <InsightBanner icon={MessagesSquare} tone="info">
        Comment Manager moderates and prioritizes comments across every live ad - flagged for brand safety
        first, unanswered questions second - so engagement stays healthy without watching every ad group.
      </InsightBanner>
    </div>
  );
}

/* -- business-recommendation -- */

function BusinessRecommendationView({ tool }: ToolViewProps) {
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        TikTok's own Business Recommendations, checked against your account data before you apply - not
        every suggestion holds up once validated.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Sparkles} label="Suggestions from TikTok" value="-" sub="open right now" />
        <StatTile icon={Sparkles} label="Validated" value="-" sub="hold up against your data" tone="positive" />
        <StatTile icon={ShieldAlert} label="Rejected" value="-" sub="don't match your account" tone="risk" />
        <StatTile icon={Coins} label="Est. impact" value="-" sub="of validated suggestions" tone="iris" />
      </StatGrid>

      <ToolSection title="Recommendations" sub="TikTok's rationale next to our validation">
        <DataGrid>
          <THead>
            <TR>
              <TH>Recommendation</TH>
              <TH>Entity</TH>
              <TH>TikTok's rationale</TH>
              <TH>Our validation</TH>
              <TH numeric>Est. impact</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={6}>
              No recommendations yet. Connect a TikTok Ads account with Business Recommendation access to
              see and validate TikTok's suggestions.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={Sparkles} tone="info">
        TikTok surfaces suggestions from its own models; this tool re-checks each one against your account's
        actual performance before it reaches the Recommendation Inbox, so an apply here is never a blind
        trust of the platform.
      </InsightBanner>
    </div>
  );
}

/* -- competitive-intel -- */

const INTEL_TABS = ['Performance benchmarks', 'Creative research'] as const;

function CompetitiveIntelView({ tool }: ToolViewProps) {
  const [tab, setTab] = React.useState<(typeof INTEL_TABS)[number]>('Performance benchmarks');
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Benchmark your account against category peers and research top creative themes - aggregate research
        only, never resold or attributed to a competitor account.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Radar} label="Benchmarks tracked" value="-" sub="metrics vs. category" />
        <StatTile icon={BarChart3} label="Category avg CTR" value="-" sub="your vertical" />
        <StatTile icon={Coins} label="Category avg CPA" value="-" sub="your vertical" />
        <StatTile icon={Sparkles} label="Top creative theme" value="-" sub="trending in category" tone="iris" />
      </StatGrid>

      <ToolSection
        title={tab}
        action={<Segmented options={INTEL_TABS} value={tab} onChange={setTab} />}
      >
        <DataGrid>
          <THead>
            <TR>
              <TH>Metric</TH>
              <TH numeric>Your account</TH>
              <TH numeric>Category median</TH>
              <TH numeric>Percentile</TH>
              <TH>Trend</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={5}>
              No benchmark data yet. Connect a TikTok Ads account with Partner Insights access to compare
              your performance against category peers.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={Radar} tone="info">
        Competitive Intelligence is research only: aggregate category benchmarks and public creative trends,
        never a named competitor's private data.
      </InsightBanner>
    </div>
  );
}

/* -- api-mcp -- */

function ApiMcpView({ tool }: ToolViewProps) {
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Connect your normalized TikTok data to external AI and BI tools - API keys for direct access, MCP
        for agent-native tools.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Key} label="API keys active" value="-" sub="scoped credentials" />
        <StatTile icon={Blocks} label="MCP connections" value="-" sub="agent clients linked" tone="iris" />
        <StatTile icon={BarChart3} label="Requests (30d)" value="-" sub="across all keys" />
        <StatTile icon={ShieldAlert} label="Rate limit" value="-" sub="requests / minute" />
      </StatGrid>

      <ToolSection
        title="Connections"
        sub="API keys and MCP clients with access to this workspace"
        action={
          <Button size="sm">
            <Key className="h-3.5 w-3.5" />
            Generate key
          </Button>
        }
      >
        <DataGrid>
          <THead>
            <TR>
              <TH>Connection</TH>
              <TH>Type</TH>
              <TH>Scope</TH>
              <TH>Created</TH>
              <TH>Last used</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={6}>
              No connections yet. Generate an API key or connect an MCP client to query this workspace's
              normalized TikTok data from external tools.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={Blocks} tone="info">
        API + MCP exposes the same normalized data model the console uses, so an external BI tool or an
        agent client reads the same numbers you see here - nothing re-derived.
      </InsightBanner>
    </div>
  );
}

/* -- shop-manager -- */

const SHOP_TABS = ['All', 'Live', 'Out of stock'] as const;

function ShopManagerView({ tool }: ToolViewProps) {
  const [tab, setTab] = React.useState<(typeof SHOP_TABS)[number]>('All');
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Onsite commerce store surfaces tied to your ad campaigns - product status, inventory and which ad
        groups drive traffic to each listing.
      </ContextLine>

      <StatGrid>
        <StatTile icon={ShoppingBag} label="Products live" value="-" sub="on the store surface" />
        <StatTile icon={Store} label="Store status" value="-" sub="onsite commerce" tone="iris" />
        <StatTile icon={Coins} label="GMV (30d)" value="-" sub="attributed to ads" />
        <StatTile icon={Blocks} label="Orders (30d)" value="-" sub="from ad-linked products" />
      </StatGrid>

      <ToolSection
        title="Products"
        action={
          <div className="flex items-center gap-2">
            <Segmented options={SHOP_TABS} value={tab} onChange={setTab} />
            <SearchInput placeholder="Search product" />
          </div>
        }
      >
        <DataGrid>
          <THead>
            <TR>
              <TH>Product</TH>
              <TH numeric>Price</TH>
              <TH numeric>Inventory</TH>
              <TH>Ad-linked campaigns</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={5}>
              No store connected yet. Connect an Onsite Commerce Store to manage products tied to your
              campaigns here.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={ShoppingBag} tone="info">
        Shop &amp; Commerce keeps the products your ads drive traffic to in view - inventory, price and
        which campaigns depend on each listing staying in stock.
      </InsightBanner>
    </div>
  );
}

/* -- brand-safety -- */

function BrandSafetyView({ tool }: ToolViewProps) {
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Inventory filters that keep delivery on brand-safe surfaces - applied at the account, campaign or ad
        group level.
      </ContextLine>

      <StatGrid>
        <StatTile icon={ShieldAlert} label="Filters active" value="-" sub="applied across the account" />
        <StatTile icon={Blocks} label="Blocked categories" value="-" sub="inventory excluded" tone="risk" />
        <StatTile icon={ShieldAlert} label="Flagged placements" value="-" sub="needs review" tone="attention" />
        <StatTile icon={ShoppingBag} label="Coverage" value="-" sub="of delivery under a filter" tone="positive" />
      </StatGrid>

      <ToolSection title="Filters" sub="Category exclusions and placement-level safety rules">
        <DataGrid>
          <THead>
            <TR>
              <TH>Filter</TH>
              <TH>Category</TH>
              <TH>Scope</TH>
              <TH>Applied to</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={5}>
              No filters configured yet. Connect a TikTok Ads account with Brand Safety access to apply
              inventory filters here.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={ShieldAlert} tone="info">
        Brand Safety keeps delivery off flagged inventory before spend hits it, rather than reporting on
        exposure after the fact.
      </InsightBanner>
    </div>
  );
}

export const growthViews: ToolViewMap = {
  'creator-to-spark': CreatorToSparkView,
  'creator-discovery': CreatorDiscoveryView,
  'creator-crm': CreatorCrmView,
  'comment-manager': CommentManagerView,
  'business-recommendation': BusinessRecommendationView,
  'competitive-intel': CompetitiveIntelView,
  'api-mcp': ApiMcpView,
  'shop-manager': ShopManagerView,
  'brand-safety': BrandSafetyView,
};
