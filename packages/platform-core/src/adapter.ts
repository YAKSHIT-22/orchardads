import type { EntityType, Platform, RetentionPolicy } from '@adsos/core';
import type { CapabilityManifest } from './capability';
import type {
  ActionPreview,
  ActionResult,
  AppliedAction,
  ApprovedAction,
  EntityRef,
  EntitySnapshot,
  ExternalAccount,
  NormalizedAd,
  NormalizedAdGroup,
  NormalizedAudience,
  NormalizedCampaign,
  NormalizedCreative,
  NormalizedMetricRow,
  PlatformReportQuery,
  ProposedAction,
  SyncPage,
  SyncQuery,
  ValidationResult,
} from './types';

/**
 * The one interface every platform implements. Nothing in the app talks to a
 * platform except through an adapter. ARCHITECTURE.md sec 12.
 * All sync methods are cursor-based and resumable.
 */
export interface AdsPlatformAdapter {
  readonly platform: Platform;
  readonly apiVersion: string;

  getCapabilities(connectionId: string): Promise<CapabilityManifest>;
  getRetentionPolicy(entity: EntityType): RetentionPolicy;

  listAccounts(connectionId: string): Promise<ExternalAccount[]>;

  syncCampaigns(q: SyncQuery): Promise<SyncPage<NormalizedCampaign>>;
  syncAdGroups(q: SyncQuery): Promise<SyncPage<NormalizedAdGroup>>;
  syncAds(q: SyncQuery): Promise<SyncPage<NormalizedAd>>;
  syncCreatives(q: SyncQuery): Promise<SyncPage<NormalizedCreative>>;
  syncAudiences(q: SyncQuery): Promise<SyncPage<NormalizedAudience>>;

  fetchReport(q: PlatformReportQuery): Promise<SyncPage<NormalizedMetricRow>>;

  validateAction(a: ProposedAction): Promise<ValidationResult>;
  previewAction(a: ProposedAction): Promise<ActionPreview>;
  executeAction(a: ApprovedAction): Promise<ActionResult>;
  captureState(ref: EntityRef): Promise<EntitySnapshot>;
  rollback(a: AppliedAction): Promise<ActionResult>;
}
