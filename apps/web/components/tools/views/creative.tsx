'use client';

import * as React from 'react';
import {
  Button,
  Card,
  CardContent,
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
  ContextLine,
  Checkbox,
  BulkActionBar,
} from '@adsos/ui';
import {
  Ban,
  Clapperboard,
  Clock,
  FileText,
  Flame,
  Layers,
  Repeat,
  ScanSearch,
  Sparkles,
  UserSearch,
  Video,
  Wand2,
} from 'lucide-react';
import type { ToolViewMap, ToolViewProps } from './_registry';

/* -- creative-fatigue -- */

const FATIGUE_TABS = ['All', 'Fatigued', 'Healthy', 'New'] as const;

function CreativeFatigueView({ tool }: ToolViewProps) {
  const [tab, setTab] = React.useState<(typeof FATIGUE_TABS)[number]>('All');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Every video creative ranked by CTR decay against frequency and days live, so a fading ad gets
        flagged before the decline shows up in CPA.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Video} label="Creatives tracked" value="-" sub="active last 30 days" />
        <StatTile icon={Flame} label="Fatigued" value="-" sub="CTR decay flagged" tone="attention" />
        <StatTile icon={Clock} label="Avg days live" value="-" sub="before decay onset" />
        <StatTile icon={Repeat} label="Frequency breaches" value="-" sub="over the cap" tone="risk" />
      </StatGrid>

      <ToolSection
        title="Creatives"
        sub="Sorted by CTR decay, steepest first"
        action={
          <div className="flex items-center gap-2">
            <Segmented options={FATIGUE_TABS} value={tab} onChange={setTab} />
            <SearchInput placeholder="Search creative or ad group" />
          </div>
        }
      >
        <DataGrid>
          <THead>
            <TR>
              <TH className="w-8">
                <Checkbox checked={false} onCheckedChange={() => {}} disabled aria-label="Select all" />
              </TH>
              <TH>Creative</TH>
              <TH>Ad group</TH>
              <TH numeric>Days live</TH>
              <TH numeric>Frequency</TH>
              <TH numeric>CTR (7d)</TH>
              <TH numeric>CTR trend</TH>
              <TH numeric>CPA</TH>
              <TH numeric>Spend</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={10}>
              Connect a TikTok Ads account to analyze creative fatigue. Once 7 days of delivery data has
              synced, creatives with declining CTR appear here ranked by decay - about 3 days away for a new
              connection.
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
                <Ban className="h-3.5 w-3.5" />
                Pause selected
              </Button>
              <Button variant="primary" size="sm" disabled={selected.size === 0} className="gap-1.5">
                <Repeat className="h-3.5 w-3.5" />
                Send to Creative Refresh
              </Button>
            </>
          }
        />
      </ToolSection>

      <InsightBanner icon={ScanSearch} tone="info">
        Creative Fatigue watches CTR decay against frequency and days live for every video creative in the
        account. A creative crossing the decay threshold moves to Fatigued before it drags account CPA up -
        this is the signal Creative Refresh Engine acts on.
      </InsightBanner>
    </div>
  );
}

/* -- creative-agent -- */

function CreativeAgentView({ tool }: ToolViewProps) {
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Analyzes your top-performing videos for shared patterns - hook, pacing, visual style, CTA - and
        drafts a creative brief from what is actually working.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Video} label="Top videos analyzed" value="-" sub="top decile by CTR" />
        <StatTile icon={Sparkles} label="Winning patterns" value="-" sub="shared across top videos" tone="iris" />
        <StatTile icon={FileText} label="Briefs generated" value="-" sub="auto-drafted" />
        <StatTile icon={Flame} label="Top decile CTR" value="-" sub="vs account avg" tone="positive" />
      </StatGrid>

      <ToolSection title="Top-performing videos" sub="Ranked by CTR, watch time and conversions">
        <DataGrid>
          <THead>
            <TR>
              <TH>Video</TH>
              <TH>Hook (first 3s)</TH>
              <TH numeric>CTR</TH>
              <TH numeric>Watch time</TH>
              <TH numeric>Conversions</TH>
              <TH numeric>Spend</TH>
              <TH>Pattern</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={7}>
              No creative data yet. Once your TikTok Ads account syncs video performance, the agent analyzes
              the top decile and surfaces the patterns behind the wins.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <ToolSection
        title="Auto-generated brief"
        sub="Drafted from the patterns above - review before using in Creative Studio"
        action={
          <Button size="sm" disabled>
            <Wand2 className="h-3.5 w-3.5" />
            Generate brief
          </Button>
        }
      >
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
            {[
              ['Hook', 'Pattern seen in the top-performing opens'],
              ['Visual style', 'Shot type, pacing, on-screen text'],
              ['Pacing', 'Cut frequency across the first 5 seconds'],
              ['CTA', 'Wording and placement that converts'],
              ['Suggested duration', 'Length that held watch time longest'],
              ['Sound', 'Trending audio or voiceover pattern'],
            ].map(([label, sub]) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-label text-ink-muted">{label}</span>
                <span className="font-data text-[15px] text-ink">-</span>
                <span className="font-ui text-[11px] text-ink-faint">{sub}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </ToolSection>

      <InsightBanner icon={Sparkles} tone="info">
        Creative Intelligence Agent reads your top decile of video creatives, finds what they share, and
        drafts a brief so the next batch starts from what already works instead of a blank page.
      </InsightBanner>
    </div>
  );
}

/* -- creative-refresh (combination) -- */

const REFRESH_STAGES = ['Fatigue queue', 'Creator sourcing', 'Variant launch'] as const;

function CreativeRefreshView({ tool }: ToolViewProps) {
  const [stage, setStage] = React.useState<(typeof REFRESH_STAGES)[number]>('Fatigue queue');
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        The combination engine: detects fatigue, sources fresh creator and organic content to replace it,
        and launches tested variants before performance decays. Spans Creative Management, creative-fatigue
        signals, the Creator Marketplace and Ads Management.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Flame} label="Fatigued creatives" value="-" sub="need replacement" tone="attention" />
        <StatTile icon={UserSearch} label="Creators sourced" value="-" sub="matched to fatigued slots" />
        <StatTile icon={Layers} label="Variants queued" value="-" sub="ready to launch" />
        <StatTile icon={Sparkles} label="Variants launched" value="-" sub="this month" tone="iris" />
      </StatGrid>

      <ToolSection
        title={stage}
        sub="Fatigue detection flows into sourcing, sourcing flows into launch"
        action={<Segmented options={REFRESH_STAGES} value={stage} onChange={setStage} />}
      >
        {stage === 'Fatigue queue' && (
          <DataGrid>
            <THead>
              <TR>
                <TH>Creative</TH>
                <TH>Ad group</TH>
                <TH numeric>Days live</TH>
                <TH numeric>CTR trend</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <tbody>
              <EmptyRow cols={5}>
                No fatigued creatives yet. This queue fills from Creative Fatigue once delivery data has
                synced.
              </EmptyRow>
            </tbody>
          </DataGrid>
        )}
        {stage === 'Creator sourcing' && (
          <DataGrid>
            <THead>
              <TR>
                <TH>Creator</TH>
                <TH>Niche</TH>
                <TH numeric>Followers</TH>
                <TH numeric>Engagement rate</TH>
                <TH>Content match</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <tbody>
              <EmptyRow cols={6}>
                No sourcing candidates yet. Once a fatigued slot is selected, matching creators from the
                Creator Marketplace appear here.
              </EmptyRow>
            </tbody>
          </DataGrid>
        )}
        {stage === 'Variant launch' && (
          <DataGrid>
            <THead>
              <TR>
                <TH>Variant</TH>
                <TH>Source</TH>
                <TH>Replaces</TH>
                <TH>Ad group</TH>
                <TH>Launch status</TH>
                <TH numeric>Vs. original</TH>
              </TR>
            </THead>
            <tbody>
              <EmptyRow cols={6}>
                No variants launched yet. Queue a sourced creator or an internal remix to test it against
                the fatigued original.
              </EmptyRow>
            </tbody>
          </DataGrid>
        )}
      </ToolSection>

      <InsightBanner icon={Layers} tone="info">
        Creative Refresh Engine is a combination tool: it reads fatigue signals, sources replacement content
        from the Creator Marketplace, and launches variants through Ads Management - one flow instead of
        three separate tools.
      </InsightBanner>
    </div>
  );
}

/* -- spark-ads -- */

const SPARK_TABS = ['All', 'Authorized', 'Promoted'] as const;

function SparkAdsView({ tool }: ToolViewProps) {
  const [tab, setTab] = React.useState<(typeof SPARK_TABS)[number]>('All');
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Organic and creator posts eligible for Spark Ads. Authorize a post, then promote it as a paid unit
        and track it end to end.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Clapperboard} label="Eligible posts" value="-" sub="from linked accounts" />
        <StatTile icon={FileText} label="Authorized" value="-" sub="video code granted" />
        <StatTile icon={Video} label="Promoted as Spark Ads" value="-" sub="live in ad groups" tone="iris" />
        <StatTile icon={Flame} label="Avg engagement rate" value="-" sub="on promoted posts" tone="positive" />
      </StatGrid>

      <ToolSection
        title="Posts"
        sub="Organic posts and creator content available to promote"
        action={
          <div className="flex items-center gap-2">
            <Segmented options={SPARK_TABS} value={tab} onChange={setTab} />
            <SearchInput placeholder="Search post or creator" />
          </div>
        }
      >
        <DataGrid>
          <THead>
            <TR>
              <TH>Post</TH>
              <TH>Creator</TH>
              <TH>Posted</TH>
              <TH numeric>Views</TH>
              <TH numeric>Engagement rate</TH>
              <TH>Authorization</TH>
              <TH>Spark Ad status</TH>
              <TH>Action</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={8}>
              No posts to promote yet. Connect a TikTok Business account and a creator's authorized content
              appears here, ready to promote as a Spark Ad.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={Clapperboard} tone="info">
        Spark Ads Manager keeps organic reach and paid reach on the same post: authorize once, promote as a
        Spark Ad, and the original post's engagement carries into the ad.
      </InsightBanner>
    </div>
  );
}

export const creativeViews: ToolViewMap = {
  'creative-fatigue': CreativeFatigueView,
  'creative-agent': CreativeAgentView,
  'creative-refresh': CreativeRefreshView,
  'spark-ads': SparkAdsView,
};
