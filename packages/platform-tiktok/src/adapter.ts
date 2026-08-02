import { type Money, type NormalizedStatus, minorDigits } from '@adsos/core';
import type { EntityType } from '@adsos/core';
import {
  type ActionPreview,
  type ActionResult,
  type AdsPlatformAdapter,
  type AppliedAction,
  type ApprovedAction,
  type CapabilityManifest,
  type EntityRef,
  type EntitySnapshot,
  type ExternalAccount,
  type NormalizedAd,
  type NormalizedAdGroup,
  type NormalizedAudience,
  type NormalizedCampaign,
  type NormalizedCreative,
  type NormalizedMetricRow,
  type PlatformReportQuery,
  type ProposedAction,
  type RateLimitSnapshot,
  type SyncPage,
  type SyncQuery,
  type ValidationResult,
  evaluateDraft,
  retentionFor,
} from '@adsos/platform-core';
import { TIKTOK_API_BASE, TIKTOK_API_VERSION } from './generated/enums';
import { TIKTOK_AD_GROUP_RULES, TIKTOK_AD_RULES, TIKTOK_CAMPAIGN_RULES } from './rules';

export type TikTokAdapterDeps = {
  getAccessToken(connectionId: string): Promise<string | null>;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  /** TikTok app credentials (needed for advertiser listing). */
  appId?: string;
  secret?: string;
};

type Row = Record<string, unknown>;
const noRateLimit: RateLimitSnapshot = { bucket: 'tiktok:default', remaining: null, limit: null, resetAt: null };
const emptyPage = <T>(): SyncPage<T> => ({ rows: [], nextCursor: null, rateLimit: noRateLimit });

const str = (v: unknown, d = ''): string => (v == null ? d : String(v));
const obj = (v: unknown): Row => (v && typeof v === 'object' ? (v as Row) : {});
const big = (v: unknown): bigint => {
  try {
    return BigInt(Math.round(Number(v) || 0));
  } catch {
    return 0n;
  }
};

function normStatus(raw: string): NormalizedStatus {
  const s = raw.toUpperCase();
  if (s.includes('DELETE')) return 'ENDED';
  if (s.includes('DISABLE') || s.includes('PAUSE')) return 'PAUSED';
  if (s.includes('ENABLE') || s.includes('DELIVERY_OK') || s === 'ENABLE') return 'ACTIVE';
  if (s.includes('AUDIT') || s.includes('REVIEW') || s.includes('PENDING')) return 'PENDING_REVIEW';
  if (s.includes('REJECT') || s.includes('DISAPPROVE')) return 'REJECTED';
  return 'UNKNOWN';
}

/** TikTok money is a decimal in the account currency (e.g. "50.00"), not micro. */
function money(v: unknown, currency: string): Money | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return { amountMinor: BigInt(Math.round(n * 10 ** minorDigits(currency))), currency };
}

function rulesFor(entity: EntityType) {
  switch (entity) {
    case 'CAMPAIGN':
      return TIKTOK_CAMPAIGN_RULES;
    case 'AD_GROUP':
      return TIKTOK_AD_GROUP_RULES;
    case 'AD':
      return TIKTOK_AD_RULES;
    default:
      return [];
  }
}

export function createTikTokAdapter(deps: TikTokAdapterDeps): AdsPlatformAdapter {
  const base = deps.baseUrl ?? TIKTOK_API_BASE;
  const doFetch = deps.fetchImpl ?? fetch;
  const appId = deps.appId ?? process.env.TIKTOK_CLIENT_ID ?? '';
  const secret = deps.secret ?? process.env.TIKTOK_CLIENT_SECRET ?? '';

  /** TikTok GET: query params + Access-Token header; envelope { code, data }. */
  async function get(connectionId: string, path: string, params: Record<string, string>) {
    const token = await deps.getAccessToken(connectionId);
    if (!token) return { code: -1, data: {} as Row, token: null };
    const url = new URL(`${base}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await doFetch(url.toString(), { headers: { 'Access-Token': token, accept: 'application/json' } });
    const json = (await res.json().catch(() => ({}))) as Row;
    return { code: Number(json.code ?? -1), data: obj(json.data), token };
  }

  async function post(connectionId: string, path: string, body: Row) {
    const token = await deps.getAccessToken(connectionId);
    if (!token) return { ok: false, code: -1, json: {} as Row };
    const res = await doFetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Access-Token': token, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as Row;
    return { ok: res.ok && Number(json.code ?? -1) === 0, code: Number(json.code ?? -1), json };
  }

  function pageInfo(data: Row): { cursor: string | null } {
    const pi = obj(data.page_info);
    const page = Number(pi.page ?? 1);
    const totalPage = Number(pi.total_page ?? 1);
    return { cursor: page < totalPage ? String(page + 1) : null };
  }

  const adapter: AdsPlatformAdapter = {
    platform: 'TIKTOK',
    apiVersion: TIKTOK_API_VERSION,

    getRetentionPolicy(entity) {
      return retentionFor('TIKTOK', entity);
    },

    async getCapabilities(connectionId): Promise<CapabilityManifest> {
      await deps.getAccessToken(connectionId);
      return {
        platform: 'TIKTOK',
        apiVersion: TIKTOK_API_VERSION,
        resolvedAt: new Date().toISOString(),
        features: {},
        limits: [{ bucket: 'tiktok:app', tokens: 10, windowSeconds: 1 }],
      };
    },

    async listAccounts(connectionId): Promise<ExternalAccount[]> {
      const authed = await get(connectionId, '/oauth2/advertiser/get/', { app_id: appId, secret });
      if (authed.code !== 0) return [];
      const list = Array.isArray(authed.data.list) ? (authed.data.list as Row[]) : [];
      const ids = list.map((a) => str(a.advertiser_id)).filter(Boolean);
      if (ids.length === 0) return [];
      const info = await get(connectionId, '/advertiser/info/', {
        advertiser_ids: JSON.stringify(ids),
        fields: JSON.stringify(['advertiser_id', 'name', 'currency', 'timezone']),
      });
      const infoList = Array.isArray(info.data.list) ? (info.data.list as Row[]) : list;
      return infoList.map((a) => ({
        externalId: str(a.advertiser_id),
        name: str(a.name ?? a.advertiser_name, 'TikTok advertiser'),
        currency: str(a.currency, 'USD'),
        timezone: str(a.timezone ?? a.display_timezone, 'UTC'),
        rawStatus: str(a.status, 'STATUS_ENABLE'),
      }));
    },

    async syncCampaigns(q: SyncQuery): Promise<SyncPage<NormalizedCampaign>> {
      const r = await get(q.connectionId, '/campaign/get/', {
        advertiser_id: q.accountExternalId,
        page: q.cursor ?? '1',
        page_size: '100',
      });
      if (r.code !== 0) return emptyPage();
      const list = Array.isArray(r.data.list) ? (r.data.list as Row[]) : [];
      return {
        rows: list.map((c) => {
          const raw = str(c.operation_status ?? c.secondary_status ?? c.status, 'UNKNOWN');
          return {
            externalId: str(c.campaign_id),
            name: str(c.campaign_name),
            normalizedStatus: normStatus(raw),
            rawStatus: raw,
            retentionPolicy: 'PERSIST',
            apiVersion: TIKTOK_API_VERSION,
            extension: { advertiser_id: q.accountExternalId },
            rawSnapshot: c,
            accountExternalId: q.accountExternalId,
            normalizedObjective: str(c.objective_type) || null,
            rawObjective: str(c.objective_type) || null,
            budget: money(c.budget, 'USD'),
            budgetType: c.budget_mode === 'BUDGET_MODE_TOTAL' ? 'LIFETIME' : c.budget_mode === 'BUDGET_MODE_DAY' ? 'DAILY' : null,
          };
        }),
        nextCursor: pageInfo(r.data).cursor,
        rateLimit: noRateLimit,
      };
    },

    async syncAdGroups(q: SyncQuery): Promise<SyncPage<NormalizedAdGroup>> {
      const r = await get(q.connectionId, '/adgroup/get/', {
        advertiser_id: q.accountExternalId,
        page: q.cursor ?? '1',
        page_size: '100',
      });
      if (r.code !== 0) return emptyPage();
      const list = Array.isArray(r.data.list) ? (r.data.list as Row[]) : [];
      return {
        rows: list.map((g) => {
          const raw = str(g.operation_status ?? g.secondary_status ?? g.status, 'UNKNOWN');
          return {
            externalId: str(g.adgroup_id),
            name: str(g.adgroup_name),
            normalizedStatus: normStatus(raw),
            rawStatus: raw,
            retentionPolicy: 'PERSIST',
            apiVersion: TIKTOK_API_VERSION,
            extension: { advertiser_id: q.accountExternalId },
            rawSnapshot: g,
            campaignExternalId: str(g.campaign_id),
            budget: money(g.budget, 'USD'),
            budgetType: g.budget_mode === 'BUDGET_MODE_TOTAL' ? 'LIFETIME' : g.budget_mode === 'BUDGET_MODE_DAY' ? 'DAILY' : null,
            bid: money(g.bid_price ?? g.bid, 'USD'),
            bidStrategy: str(g.bid_type) || null,
            conversionSourceExternalId: str(g.pixel_id) || null,
            targeting: obj(g.targeting ?? g),
          };
        }),
        nextCursor: pageInfo(r.data).cursor,
        rateLimit: noRateLimit,
      };
    },

    async syncAds(q: SyncQuery): Promise<SyncPage<NormalizedAd>> {
      const r = await get(q.connectionId, '/ad/get/', {
        advertiser_id: q.accountExternalId,
        page: q.cursor ?? '1',
        page_size: '100',
      });
      if (r.code !== 0) return emptyPage();
      const list = Array.isArray(r.data.list) ? (r.data.list as Row[]) : [];
      return {
        rows: list.map((ad) => {
          const raw = str(ad.operation_status ?? ad.secondary_status ?? ad.status, 'UNKNOWN');
          return {
            externalId: str(ad.ad_id),
            name: str(ad.ad_name),
            normalizedStatus: normStatus(raw),
            rawStatus: raw,
            retentionPolicy: 'PERSIST',
            apiVersion: TIKTOK_API_VERSION,
            extension: { advertiser_id: q.accountExternalId },
            rawSnapshot: ad,
            adGroupExternalId: str(ad.adgroup_id),
            creativeExternalId: str(ad.creative_id ?? ad.video_id ?? ad.identity_id) || null,
          };
        }),
        nextCursor: pageInfo(r.data).cursor,
        rateLimit: noRateLimit,
      };
    },

    async syncCreatives(_q: SyncQuery): Promise<SyncPage<NormalizedCreative>> {
      // On TikTok the creative material is carried by the Ad (surfaced via syncAds).
      return emptyPage();
    },

    async syncAudiences(_q: SyncQuery): Promise<SyncPage<NormalizedAudience>> {
      return emptyPage();
    },

    async fetchReport(q: PlatformReportQuery): Promise<SyncPage<NormalizedMetricRow>> {
      const r = await get(q.connectionId, '/report/integrated/get/', {
        advertiser_id: q.accountExternalId,
        report_type: 'BASIC',
        data_level: 'AUCTION_ADGROUP',
        dimensions: JSON.stringify(['adgroup_id', 'stat_time_day']),
        metrics: JSON.stringify(['impressions', 'clicks', 'spend', 'conversion', 'total_complete_payment_rate']),
        start_date: q.since.slice(0, 10),
        end_date: q.until.slice(0, 10),
        page: '1',
        page_size: '1000',
      });
      if (r.code !== 0) return emptyPage();
      const list = Array.isArray(r.data.list) ? (r.data.list as Row[]) : [];
      return {
        rows: list.map((m) => {
          const dims = obj(m.dimensions);
          const mx = obj(m.metrics);
          const date = str(dims.stat_time_day, `${q.since.slice(0, 10)} 00:00:00`).slice(0, 10);
          return {
            entityType: 'AD_GROUP',
            entityExternalId: str(dims.adgroup_id),
            grain: 'DAY',
            bucketAt: `${date}T00:00:00Z`,
            breakdownHash: '',
            breakdown: null,
            schemaVersion: 1,
            impressions: big(mx.impressions),
            clicks: big(mx.clicks),
            spend: money(mx.spend, 'USD') ?? { amountMinor: 0n, currency: 'USD' },
            conversions: big(mx.conversion),
            convValue: money(mx.total_complete_payment ?? 0, 'USD') ?? { amountMinor: 0n, currency: 'USD' },
            native: {},
          };
        }),
        nextCursor: null,
        rateLimit: noRateLimit,
      };
    },

    async validateAction(a: ProposedAction): Promise<ValidationResult> {
      const evalr = evaluateDraft(a.proposedPayload, rulesFor(a.entityRef.entityType));
      return { valid: evalr.valid, violations: evalr.violations };
    },

    async previewAction(a: ProposedAction): Promise<ActionPreview> {
      const humanDiff = Object.entries(a.proposedPayload).map(([field, to]) => ({
        field,
        from: '(current)',
        to: typeof to === 'object' ? JSON.stringify(to) : String(to),
        changed: true,
      }));
      return { humanDiff };
    },

    async executeAction(a: ApprovedAction): Promise<ActionResult> {
      const advertiserId = a.entityRef.accountExternalId ?? str(a.proposedPayload.advertiser_id);
      if (!advertiserId) {
        return { ok: false, apiResponse: {}, rateLimit: noRateLimit, error: 'TikTok write needs the advertiser id.' };
      }
      const w = writeCall(a, advertiserId);
      if (!w) return { ok: false, apiResponse: {}, rateLimit: noRateLimit, error: 'Unsupported action.' };
      const res = await post(a.entityRef.workspaceId, w.path, w.body);
      return {
        ok: res.ok,
        apiResponse: res.json as Record<string, unknown>,
        rateLimit: noRateLimit,
        error: res.ok ? undefined : `TikTok rejected the change (code ${res.code}).`,
      };
    },

    async captureState(ref: EntityRef): Promise<EntitySnapshot> {
      const advertiserId = ref.accountExternalId;
      if (!advertiserId) return { ref, state: {}, capturedAt: new Date().toISOString() };
      const path = ref.entityType === 'CAMPAIGN' ? '/campaign/get/' : ref.entityType === 'AD_GROUP' ? '/adgroup/get/' : '/ad/get/';
      const idField = ref.entityType === 'CAMPAIGN' ? 'campaign_ids' : ref.entityType === 'AD_GROUP' ? 'adgroup_ids' : 'ad_ids';
      const r = await get(ref.workspaceId, path, {
        advertiser_id: advertiserId,
        filtering: JSON.stringify({ [idField]: [ref.externalId] }),
      });
      const list = Array.isArray(r.data.list) ? (r.data.list as Row[]) : [];
      return { ref, state: (list[0] ?? {}) as Record<string, unknown>, capturedAt: new Date().toISOString() };
    },

    async rollback(a: AppliedAction): Promise<ActionResult> {
      const restore: Record<string, unknown> = {};
      for (const field of Object.keys(a.proposedPayload)) {
        const mapped = PAYLOAD_TO_TIKTOK[field];
        if (mapped && a.previousState.state[mapped] !== undefined) restore[field] = a.previousState.state[mapped];
      }
      if (Object.keys(restore).length === 0) {
        return { ok: false, apiResponse: {}, rateLimit: noRateLimit, error: 'No captured previous state to roll back to.' };
      }
      return adapter.executeAction({ ...a, proposedPayload: restore });
    },
  };

  return adapter;
}

const PAYLOAD_TO_TIKTOK: Record<string, string> = {
  dailyBudgetMinor: 'budget',
  bidMinor: 'bid_price',
  name: 'adgroup_name',
};

const RESOURCE = { CAMPAIGN: 'campaign', AD_GROUP: 'adgroup', AD: 'ad' } as const;
const ID_FIELD = { CAMPAIGN: 'campaign_id', AD_GROUP: 'adgroup_id', AD: 'ad_id' } as const;
const IDS_FIELD = { CAMPAIGN: 'campaign_ids', AD_GROUP: 'adgroup_ids', AD: 'ad_ids' } as const;

function writeCall(a: ApprovedAction, advertiserId: string): { path: string; body: Row } | null {
  const id = a.entityRef.externalId;
  const t = a.entityRef.entityType as 'CAMPAIGN' | 'AD_GROUP' | 'AD';
  const resource = RESOURCE[t] ?? 'adgroup';
  const idField = ID_FIELD[t] ?? 'adgroup_id';
  const idsField = IDS_FIELD[t] ?? 'adgroup_ids';
  const statusPath = `/${resource}/status/update/`;
  const updatePath = `/${resource}/update/`;
  const base = { advertiser_id: advertiserId };

  switch (a.kind) {
    case 'PAUSE':
      return { path: statusPath, body: { ...base, [idsField]: [id], operation_status: 'DISABLE' } };
    case 'RESUME':
      return { path: statusPath, body: { ...base, [idsField]: [id], operation_status: 'ENABLE' } };
    case 'DELETE':
      return { path: statusPath, body: { ...base, [idsField]: [id], operation_status: 'DELETE' } };
    case 'SET_BUDGET':
      return { path: updatePath, body: { ...base, [idField]: id, budget: a.proposedPayload.dailyBudgetMinor } };
    case 'SET_BID':
      return { path: updatePath, body: { ...base, [idField]: id, bid_price: a.proposedPayload.bidMinor } };
    case 'RENAME':
      return { path: updatePath, body: { ...base, [idField]: id, [`${resource}_name`]: a.proposedPayload.name } };
    case 'UPDATE':
      // Generic partial update: send only the provided TikTok-shaped fields.
      return { path: updatePath, body: { ...base, [idField]: id, ...a.proposedPayload } };
    case 'CREATE_CAMPAIGN':
      return { path: '/campaign/create/', body: { ...base, ...a.proposedPayload } };
    case 'CREATE_AD_GROUP':
      return { path: '/adgroup/create/', body: { ...base, ...a.proposedPayload } };
    case 'CREATE_AD':
      return { path: '/ad/create/', body: { ...base, ...a.proposedPayload } };
    default:
      return null;
  }
}
