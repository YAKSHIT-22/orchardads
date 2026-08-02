import type { Prisma } from '@prisma/client';
import type { EntityBudgetLike } from './types';
import type { WorkspaceContext } from '../workspace-context';
import { withWorkspace } from '../workspace-context';

/** Budgets keyed by internal entity id (AdGroup.id), for the recommendation engine. */
export async function loadBudgets(
  ctx: WorkspaceContext,
  accountId: string,
): Promise<Map<string, EntityBudgetLike>> {
  return withWorkspace(ctx, async (tx) => {
    const groups = await tx.adGroup.findMany({
      where: { workspaceId: ctx.workspaceId, campaign: { accountId } },
      select: { id: true, externalId: true, budgetMinor: true, budgetType: true, name: true },
    });
    const map = new Map<string, EntityBudgetLike>();
    for (const g of groups) {
      map.set(g.id, {
        entityId: g.id,
        externalId: g.externalId,
        name: g.name,
        dailyBudgetMinor: g.budgetMinor ?? null,
        budgetType: g.budgetType ?? null,
      });
    }
    return map;
  });
}

export type SelectableAccount = {
  externalId: string;
  name: string;
  currency: string;
  timezone: string;
};

/** Persist the ad accounts a user picked during onboarding (hand-pick model). */
export async function upsertAccounts(
  ctx: WorkspaceContext,
  platform: 'TIKTOK',
  connectionId: string,
  accounts: SelectableAccount[],
): Promise<number> {
  return withWorkspace(ctx, async (tx) => {
    for (const a of accounts) {
      await tx.advertiserAccount.upsert({
        where: { workspaceId_platform_externalId: { workspaceId: ctx.workspaceId, platform, externalId: a.externalId } },
        create: {
          workspaceId: ctx.workspaceId,
          connectionId,
          platform,
          externalId: a.externalId,
          name: a.name,
          currency: a.currency,
          timezone: a.timezone,
          status: 'ACTIVE',
        },
        update: { name: a.name, currency: a.currency, timezone: a.timezone },
      });
    }
    return accounts.length;
  });
}

/** Current daily budget (minor units) for an entity - the server-side truth for
 *  the policy engine, never trusted from the client. */
export async function currentBudgetMinor(ctx: WorkspaceContext, entityId: string): Promise<bigint | null> {
  return withWorkspace(ctx, async (tx) => {
    const g = await tx.adGroup.findFirst({
      where: { workspaceId: ctx.workspaceId, id: entityId },
      select: { budgetMinor: true },
    });
    return g?.budgetMinor ?? null;
  });
}

export async function listAccountRecords(
  ctx: WorkspaceContext,
  platform: 'TIKTOK',
): Promise<{ id: string; externalId: string; currency: string }[]> {
  return withWorkspace(ctx, (tx) =>
    tx.advertiserAccount.findMany({
      where: { workspaceId: ctx.workspaceId, platform },
      select: { id: true, externalId: true, currency: true },
    }),
  );
}

export async function firstAccountId(ctx: WorkspaceContext): Promise<string | null> {
  return withWorkspace(ctx, async (tx) => {
    const a = await tx.advertiserAccount.findFirst({
      where: { workspaceId: ctx.workspaceId },
      select: { id: true },
      orderBy: { lastSyncedAt: 'desc' },
    });
    return a?.id ?? null;
  });
}

export async function missingPixelAdGroupIds(ctx: WorkspaceContext, accountId: string): Promise<string[]> {
  return withWorkspace(ctx, async (tx) => {
    const groups = await tx.adGroup.findMany({
      where: { workspaceId: ctx.workspaceId, campaign: { accountId } },
      select: { id: true, extension: true },
    });
    return groups
      .filter((g) => !(g.extension as { conversion_pixel_id?: string } | null)?.conversion_pixel_id)
      .map((g) => g.id);
  });
}

// ── Entity upserts from a sync (adapter rows -> normalized store). ──
type Status = 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | 'PENDING_REVIEW' | 'REJECTED' | 'ENDED' | 'UNKNOWN';
type BudgetType = 'DAILY' | 'LIFETIME' | null;

export type CampaignUpsert = {
  externalId: string;
  name: string;
  normalizedStatus: Status;
  rawStatus: string;
  normalizedObjective: string | null;
  rawObjective: string | null;
  budgetMinor: bigint | null;
  budgetType: BudgetType;
  currency: string;
};
export type AdGroupUpsert = {
  externalId: string;
  campaignExternalId: string;
  name: string;
  normalizedStatus: Status;
  rawStatus: string;
  budgetMinor: bigint | null;
  budgetType: BudgetType;
  bidMinor: bigint | null;
  bidStrategy: string | null;
  conversionPixelId: string | null;
  targeting: Record<string, unknown>;
  currency: string;
};
export type AdUpsert = {
  externalId: string;
  adGroupExternalId: string;
  name: string;
  normalizedStatus: Status;
  rawStatus: string;
};

export async function upsertCampaigns(
  ctx: WorkspaceContext,
  accountId: string,
  apiVersion: string,
  items: CampaignUpsert[],
): Promise<Map<string, string>> {
  return withWorkspace(ctx, async (tx) => {
    const map = new Map<string, string>();
    for (const c of items) {
      const row = await tx.campaign.upsert({
        where: { workspaceId_platform_externalId: { workspaceId: ctx.workspaceId, platform: 'TIKTOK', externalId: c.externalId } },
        create: {
          workspaceId: ctx.workspaceId,
          accountId,
          platform: 'TIKTOK',
          externalId: c.externalId,
          name: c.name,
          status: c.normalizedStatus,
          rawStatus: c.rawStatus,
          normalizedObjective: c.normalizedObjective,
          rawObjective: c.rawObjective,
          currency: c.currency,
          budgetMinor: c.budgetMinor,
          budgetType: c.budgetType ?? undefined,
          apiVersion,
          lastSyncedAt: new Date(),
        },
        update: {
          name: c.name,
          status: c.normalizedStatus,
          rawStatus: c.rawStatus,
          normalizedObjective: c.normalizedObjective,
          rawObjective: c.rawObjective,
          budgetMinor: c.budgetMinor,
          budgetType: c.budgetType ?? undefined,
          lastSyncedAt: new Date(),
        },
        select: { id: true },
      });
      map.set(c.externalId, row.id);
    }
    return map;
  });
}

export async function upsertAdGroups(
  ctx: WorkspaceContext,
  campaignIdByExternal: Map<string, string>,
  apiVersion: string,
  items: AdGroupUpsert[],
): Promise<Map<string, string>> {
  return withWorkspace(ctx, async (tx) => {
    const map = new Map<string, string>();
    for (const g of items) {
      const campaignId = campaignIdByExternal.get(g.campaignExternalId);
      if (!campaignId) continue; // campaign not in this workspace/sync
      const row = await tx.adGroup.upsert({
        where: { workspaceId_platform_externalId: { workspaceId: ctx.workspaceId, platform: 'TIKTOK', externalId: g.externalId } },
        create: {
          workspaceId: ctx.workspaceId,
          campaignId,
          platform: 'TIKTOK',
          externalId: g.externalId,
          name: g.name,
          status: g.normalizedStatus,
          rawStatus: g.rawStatus,
          currency: g.currency,
          budgetMinor: g.budgetMinor,
          budgetType: g.budgetType ?? undefined,
          bidMinor: g.bidMinor,
          bidStrategy: g.bidStrategy,
          targeting: g.targeting as Prisma.InputJsonValue,
          extension: { conversion_pixel_id: g.conversionPixelId } as Prisma.InputJsonValue,
          apiVersion,
          lastSyncedAt: new Date(),
        },
        update: {
          name: g.name,
          status: g.normalizedStatus,
          rawStatus: g.rawStatus,
          budgetMinor: g.budgetMinor,
          budgetType: g.budgetType ?? undefined,
          bidMinor: g.bidMinor,
          bidStrategy: g.bidStrategy,
          targeting: g.targeting as Prisma.InputJsonValue,
          extension: { conversion_pixel_id: g.conversionPixelId } as Prisma.InputJsonValue,
          lastSyncedAt: new Date(),
        },
        select: { id: true },
      });
      map.set(g.externalId, row.id);
    }
    return map;
  });
}

export async function upsertAds(
  ctx: WorkspaceContext,
  adGroupIdByExternal: Map<string, string>,
  apiVersion: string,
  items: AdUpsert[],
): Promise<number> {
  return withWorkspace(ctx, async (tx) => {
    let n = 0;
    for (const ad of items) {
      const adGroupId = adGroupIdByExternal.get(ad.adGroupExternalId);
      if (!adGroupId) continue;
      await tx.ad.upsert({
        where: { workspaceId_platform_externalId: { workspaceId: ctx.workspaceId, platform: 'TIKTOK', externalId: ad.externalId } },
        create: {
          workspaceId: ctx.workspaceId,
          adGroupId,
          platform: 'TIKTOK',
          externalId: ad.externalId,
          name: ad.name,
          status: ad.normalizedStatus,
          rawStatus: ad.rawStatus,
          apiVersion,
          lastSyncedAt: new Date(),
        },
        update: { name: ad.name, status: ad.normalizedStatus, rawStatus: ad.rawStatus, lastSyncedAt: new Date() },
      });
      n++;
    }
    return n;
  });
}

/** Map an ad group's EXTERNAL id -> INTERNAL id, for attaching metric facts. */
export async function adGroupIdMap(ctx: WorkspaceContext, accountId: string): Promise<Map<string, string>> {
  return withWorkspace(ctx, async (tx) => {
    const groups = await tx.adGroup.findMany({
      where: { workspaceId: ctx.workspaceId, campaign: { accountId } },
      select: { id: true, externalId: true },
    });
    return new Map(groups.map((g) => [g.externalId, g.id]));
  });
}

/** Resolve the external ad-account id for an internal entity (TikTok writes need it). */
export async function entityAccountExternalId(
  ctx: WorkspaceContext,
  entityType: 'CAMPAIGN' | 'AD_GROUP' | 'AD',
  entityId: string,
): Promise<string | null> {
  return withWorkspace(ctx, async (tx) => {
    if (entityType === 'CAMPAIGN') {
      const c = await tx.campaign.findFirst({
        where: { workspaceId: ctx.workspaceId, id: entityId },
        select: { account: { select: { externalId: true } } },
      });
      return c?.account.externalId ?? null;
    }
    if (entityType === 'AD_GROUP') {
      const g = await tx.adGroup.findFirst({
        where: { workspaceId: ctx.workspaceId, id: entityId },
        select: { campaign: { select: { account: { select: { externalId: true } } } } },
      });
      return g?.campaign.account.externalId ?? null;
    }
    const a = await tx.ad.findFirst({
      where: { workspaceId: ctx.workspaceId, id: entityId },
      select: { adGroup: { select: { campaign: { select: { account: { select: { externalId: true } } } } } } },
    });
    return a?.adGroup.campaign.account.externalId ?? null;
  });
}

export async function markAccountSynced(ctx: WorkspaceContext, accountId: string): Promise<void> {
  await withWorkspace(ctx, (tx) =>
    tx.advertiserAccount.update({ where: { id: accountId }, data: { lastSyncedAt: new Date() } }),
  );
}
