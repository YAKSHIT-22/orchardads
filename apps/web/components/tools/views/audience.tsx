'use client';

import * as React from 'react';
import {
  Button,
  cn,
  DataGrid,
  EmptyRow,
  InsightBanner,
  StatGrid,
  StatTile,
  TH,
  THead,
  ToolSection,
  TR,
} from '@adsos/ui';
import {
  Blocks,
  CheckCircle2,
  CircleDashed,
  Database,
  Gauge,
  Radar,
  ShieldCheck,
  ShoppingBag,
  Target,
  Upload,
  UserSearch,
  Users,
  Waypoints,
} from 'lucide-react';
import type { ToolViewMap, ToolViewProps } from './_registry';

/* -- Local shell controls (presentation-only, no data wired yet) -- */

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-rule bg-paper-sunk p-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={opt === value}
          className={cn(
            'rounded-sm px-2.5 py-1 font-ui text-[12px] font-medium transition-colors',
            opt === value ? 'bg-paper text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="h-[38px] w-56 rounded-md border border-rule bg-paper px-3 font-ui text-[13px] text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--iris)]"
    />
  );
}

function SelectField({ label, options }: { label: string; options: readonly string[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label text-ink-muted">{label}</span>
      <select className="h-[38px] rounded-md border border-rule bg-paper px-2 font-ui text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--iris)]">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function ContextLine({ children }: { children: React.ReactNode }) {
  return <p className="max-w-2xl font-ui text-[13px] leading-5 text-ink-muted">{children}</p>;
}

/** Bordered placeholder for a chart that has no data source yet. */
function ChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-rule bg-paper-sunk">
      <span className="font-ui text-[12px] text-ink-faint">{label}</span>
    </div>
  );
}

/* -- audience-lab (combination) -- */

const LAB_TABS = ['Audiences', 'Reach & frequency', 'Catalog wiring'] as const;

function AudienceLabView({ tool }: ToolViewProps) {
  const [tab, setTab] = React.useState<(typeof LAB_TABS)[number]>('Audiences');
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Build and expand custom and lookalike audiences, plan reach and frequency before launch, and wire
        catalogs into the audiences that use them - the combination view across Audience Management, Reach
        &amp; Frequency and DPA Catalog Management.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Users} label="Custom audiences" value="-" sub="from pixel, CRM or app" />
        <StatTile icon={UserSearch} label="Lookalike audiences" value="-" sub="expanded from seeds" />
        <StatTile icon={Gauge} label="Avg match rate" value="-" sub="uploaded vs matched" />
        <StatTile icon={ShoppingBag} label="Catalogs wired" value="-" sub="linked to audiences" tone="iris" />
      </StatGrid>

      <ToolSection
        title={tab}
        sub="Custom + lookalike audiences, planning and catalog wiring in one place"
        action={<Segmented options={LAB_TABS} value={tab} onChange={setTab} />}
      >
        {tab === 'Audiences' && (
          <DataGrid>
            <THead>
              <TR>
                <TH>Audience</TH>
                <TH>Type</TH>
                <TH>Source</TH>
                <TH numeric>Est. size</TH>
                <TH numeric>Match rate</TH>
                <TH>Status</TH>
                <TH>Last refreshed</TH>
              </TR>
            </THead>
            <tbody>
              <EmptyRow cols={7}>
                No audiences yet. Connect a TikTok Ads account to see custom and lookalike audiences, sized
                and ranked by match rate.
              </EmptyRow>
            </tbody>
          </DataGrid>
        )}
        {tab === 'Reach & frequency' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <SelectField label="Objective" options={['Reach', 'Video views', 'Awareness']} />
              <SelectField label="Flight length" options={['1 week', '2 weeks', '4 weeks']} />
              <SelectField label="Budget tier" options={['-', '-', '-']} />
            </div>
            <ChartPlaceholder label="Predicted reach curve renders once a budget and flight are set" />
            <DataGrid>
              <THead>
                <TR>
                  <TH>Scenario</TH>
                  <TH numeric>Reach</TH>
                  <TH numeric>Frequency</TH>
                  <TH numeric>Est. CPM</TH>
                </TR>
              </THead>
              <tbody>
                <EmptyRow cols={4}>
                  No plan yet. Set an objective and budget above to compare reach/frequency scenarios.
                </EmptyRow>
              </tbody>
            </DataGrid>
          </div>
        )}
        {tab === 'Catalog wiring' && (
          <DataGrid>
            <THead>
              <TR>
                <TH>Catalog</TH>
                <TH numeric>Products</TH>
                <TH>Linked audiences</TH>
                <TH>Linked ad groups</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <tbody>
              <EmptyRow cols={5}>
                No catalogs wired yet. Connect a DPA catalog in Catalog Manager, then wire it to an audience
                here for dynamic and retargeting ads.
              </EmptyRow>
            </tbody>
          </DataGrid>
        )}
      </ToolSection>

      <InsightBanner icon={Target} tone="info">
        Audience Lab is a combination tool: build the audience, plan how much reach and frequency it buys,
        and wire the product catalog it should shop from - all three stay in sync here instead of three
        separate screens.
      </InsightBanner>
    </div>
  );
}

/* -- catalog-manager -- */

const CATALOG_TABS = ['Feeds', 'Product groups'] as const;

function CatalogManagerView({ tool }: ToolViewProps) {
  const [tab, setTab] = React.useState<(typeof CATALOG_TABS)[number]>('Feeds');
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Product feeds and product groups that power shopping and dynamic (DPA) ads. A feed error here breaks
        every dynamic ad group that reads from it.
      </ContextLine>

      <StatGrid>
        <StatTile icon={ShoppingBag} label="Products in catalog" value="-" sub="across all feeds" />
        <StatTile icon={Blocks} label="Product groups" value="-" sub="filtered subsets" />
        <StatTile icon={ShieldCheck} label="Feed health" value="-" sub="feeds without errors" tone="positive" />
        <StatTile icon={Gauge} label="Last synced" value="-" sub="most recent feed pull" />
      </StatGrid>

      <ToolSection
        title={tab}
        action={
          <div className="flex items-center gap-2">
            <Segmented options={CATALOG_TABS} value={tab} onChange={setTab} />
            <SearchInput placeholder={tab === 'Feeds' ? 'Search feed' : 'Search product group'} />
          </div>
        }
      >
        {tab === 'Feeds' ? (
          <DataGrid>
            <THead>
              <TR>
                <TH>Feed</TH>
                <TH>Source</TH>
                <TH numeric>Products</TH>
                <TH>Status</TH>
                <TH>Last synced</TH>
                <TH numeric>Errors</TH>
              </TR>
            </THead>
            <tbody>
              <EmptyRow cols={6}>
                No feeds connected yet. Connect a TikTok Shop or product feed URL to populate your catalog.
              </EmptyRow>
            </tbody>
          </DataGrid>
        ) : (
          <DataGrid>
            <THead>
              <TR>
                <TH>Group</TH>
                <TH>Filter rule</TH>
                <TH numeric>Products matched</TH>
                <TH>Linked ad groups</TH>
              </TR>
            </THead>
            <tbody>
              <EmptyRow cols={4}>
                No product groups yet. Create a rule-based group once a feed is connected to target specific
                products in DPA ads.
              </EmptyRow>
            </tbody>
          </DataGrid>
        )}
      </ToolSection>

      <InsightBanner icon={ShoppingBag} tone="info">
        Catalog Manager keeps product feeds and the groups built on top of them healthy, so dynamic and
        shopping ads always show real, in-stock products.
      </InsightBanner>
    </div>
  );
}

/* -- reach-frequency -- */

function ReachFrequencyView({ tool }: ToolViewProps) {
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Plan reach and frequency for an awareness flight before you launch, and compare scenarios by budget
        and placement.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Radar} label="Planned reach" value="-" sub="unique users, est." />
        <StatTile icon={Gauge} label="Avg frequency" value="-" sub="impressions per user" />
        <StatTile icon={Database} label="Est. impressions" value="-" sub="over the flight" />
        <StatTile icon={ShoppingBag} label="Est. budget" value="-" sub="to hit the plan" />
      </StatGrid>

      <ToolSection
        title="Plan inputs"
        sub="Adjust to compare reach/frequency scenarios before committing budget"
      >
        <div className="flex flex-wrap items-end gap-3">
          <SelectField label="Objective" options={['Reach', 'Video views 6s', 'Awareness']} />
          <SelectField label="Flight length" options={['1 week', '2 weeks', '4 weeks']} />
          <SelectField label="Placements" options={['TikTok only', 'TikTok + Pangle']} />
          <SelectField label="Frequency cap" options={['Uncapped', '2/week', '4/week']} />
        </div>
      </ToolSection>

      <ToolSection title="Predicted reach curve" sub="Reach vs. budget for the selected plan">
        <ChartPlaceholder label="Predicted reach curve renders once a budget and flight are set" />
      </ToolSection>

      <ToolSection title="Scenario comparison">
        <DataGrid>
          <THead>
            <TR>
              <TH>Scenario</TH>
              <TH numeric>Reach</TH>
              <TH numeric>Frequency</TH>
              <TH numeric>Est. CPM</TH>
              <TH numeric>Budget</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={5}>
              No scenarios yet. Set plan inputs above to generate reach/frequency scenarios to compare.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={Radar} tone="info">
        Reach &amp; Frequency Planner estimates unique reach and average frequency for an awareness flight
        before you spend a dollar, so the budget matches the audience you actually want to cover.
      </InsightBanner>
    </div>
  );
}

/* -- tracking-doctor -- */

const TRACKING_TABS = ['All events', 'Standard events', 'Custom events'] as const;

function TrackingDoctorView({ tool }: ToolViewProps) {
  const [tab, setTab] = React.useState<(typeof TRACKING_TABS)[number]>('All events');
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        TikTok Pixel and Events API health: freshness, dedup between browser and server events, and any
        conversion source that has gone quiet.
      </ContextLine>

      <StatGrid>
        <StatTile icon={ShieldCheck} label="Pixels connected" value="-" sub="across ad accounts" />
        <StatTile icon={Waypoints} label="Events API" value="-" sub="connection status" tone="iris" />
        <StatTile icon={CheckCircle2} label="Event match quality" value="-" sub="TikTok match score" />
        <StatTile icon={CircleDashed} label="Missing sources" value="-" sub="expected but silent" tone="risk" />
      </StatGrid>

      <ToolSection
        title="Events"
        sub="Freshness, dedup rate and match quality per event"
        action={
          <div className="flex items-center gap-2">
            <Segmented options={TRACKING_TABS} value={tab} onChange={setTab} />
            <SearchInput placeholder="Search event name" />
          </div>
        }
      >
        <DataGrid>
          <THead>
            <TR>
              <TH>Event</TH>
              <TH>Source</TH>
              <TH>Last received</TH>
              <TH numeric>Dedup rate</TH>
              <TH numeric>Match quality</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={6}>
              No pixel or Events API data yet. Connect a TikTok Pixel or the Events API to see event
              freshness, dedup rate and match quality here.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={ShieldCheck} tone="info">
        Tracking Doctor checks every expected conversion source - browser pixel and server Events API - for
        freshness, duplicate suppression and match quality, and flags the ones that have gone silent.
      </InsightBanner>
    </div>
  );
}

/* -- conversion-command (combination) -- */

const STACK_CHECKLIST = [
  'Pixel installed and firing',
  'Events API connected',
  'Custom conversions mapped',
  'Offline events uploading',
  'CRM events syncing',
];

function ConversionCommandView({ tool }: ToolViewProps) {
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        A full audit of the tracking stack - pixel, custom conversions, offline events and CRM events - so
        conversion-optimizing actions only run once measurement is healthy.
      </ContextLine>

      <StatGrid>
        <StatTile icon={ShieldCheck} label="Stack health score" value="-" sub="out of 100" tone="iris" />
        <StatTile icon={CircleDashed} label="Gaps found" value="-" sub="across the stack" tone="risk" />
        <StatTile icon={Waypoints} label="Sources connected" value="-" sub="of 5 expected" />
        <StatTile icon={Gauge} label="Last audit" value="-" sub="most recent run" />
      </StatGrid>

      <ToolSection title="Stack checklist" sub="Every gate a conversion-optimizing action depends on">
        <ul className="flex flex-col divide-y divide-rule rounded-md border border-rule bg-paper">
          {STACK_CHECKLIST.map((item) => (
            <li key={item} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="font-ui text-[13px] text-ink">{item}</span>
              <span className="font-data text-[12px] text-ink-faint">-</span>
            </li>
          ))}
        </ul>
      </ToolSection>

      <ToolSection title="Component status">
        <DataGrid>
          <THead>
            <TR>
              <TH>Component</TH>
              <TH>Scope</TH>
              <TH>Status</TH>
              <TH>Last verified</TH>
              <TH>Issue</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={5}>
              No audit run yet. Connect a TikTok Ads account to audit pixel, custom conversions, offline
              events and CRM events in one pass.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={Waypoints} tone="info">
        Conversion Command audits the whole tracking stack in one pass and gates conversion-optimizing
        actions elsewhere in the product until every required source is healthy.
      </InsightBanner>
    </div>
  );
}

/* -- offline-events -- */

function OfflineEventsView({ tool }: ToolViewProps) {
  void tool;
  return (
    <div className="flex flex-col gap-6">
      <ContextLine>
        Upload offline conversions and CRM events to close the loop between in-store or sales-assisted
        conversions and the ad that drove them.
      </ContextLine>

      <StatGrid>
        <StatTile icon={Upload} label="Events uploaded" value="-" sub="trailing 30 days" />
        <StatTile icon={Gauge} label="Match rate" value="-" sub="matched to TikTok users" />
        <StatTile icon={CircleDashed} label="Last upload" value="-" sub="most recent batch" />
        <StatTile icon={ShieldCheck} label="Failed rows" value="-" sub="needs remapping" tone="risk" />
      </StatGrid>

      <ToolSection
        title="Upload"
        sub="CSV or CRM export, mapped to a TikTok event set"
        action={
          <div className="flex items-center gap-2">
            <SelectField label="" options={['Select event set']} />
            <Button size="sm">
              <Upload className="h-3.5 w-3.5" />
              Upload file
            </Button>
          </div>
        }
      >
        <DataGrid>
          <THead>
            <TR>
              <TH>Batch</TH>
              <TH>Event set</TH>
              <TH numeric>Rows</TH>
              <TH numeric>Matched</TH>
              <TH numeric>Failed</TH>
              <TH>Uploaded</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            <EmptyRow cols={7}>
              No uploads yet. Upload a CSV of offline or CRM events to see match rate and any rows that
              failed to map.
            </EmptyRow>
          </tbody>
        </DataGrid>
      </ToolSection>

      <InsightBanner icon={Upload} tone="info">
        Offline &amp; CRM Events closes the measurement loop for conversions that happen outside the
        browser - in-store purchases, sales-assisted deals, CRM-qualified leads - by matching them back to
        the ad that drove them.
      </InsightBanner>
    </div>
  );
}

export const audienceViews: ToolViewMap = {
  'audience-lab': AudienceLabView,
  'catalog-manager': CatalogManagerView,
  'reach-frequency': ReachFrequencyView,
  'tracking-doctor': TrackingDoctorView,
  'conversion-command': ConversionCommandView,
  'offline-events': OfflineEventsView,
};
