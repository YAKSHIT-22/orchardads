'use server';

import { createHash } from 'node:crypto';
import type { EntityType } from '@adsos/core';
import { repositories } from '@adsos/db';
import type { ActionKind, ApprovedAction, EntityRef, ProposedAction } from '@adsos/platform-core';
import {
  TIKTOK_AD_GROUP_RULES,
  TIKTOK_AD_RULES,
  TIKTOK_CAMPAIGN_RULES,
} from '@adsos/platform-tiktok';
import { evaluateDraft } from '@adsos/platform-core';
import { canApprove, evaluatePolicy } from '@adsos/policy-engine';
import { z } from 'zod';
import { getAdapter } from '../adapters';
import { authedAction } from '../safe-action';

const RULES = {
  CAMPAIGN: TIKTOK_CAMPAIGN_RULES,
  AD_GROUP: TIKTOK_AD_GROUP_RULES,
  AD: TIKTOK_AD_RULES,
} as const;

/**
 * Validate a TikTok campaign/ad-group/ad draft against the platform's conditional
 * rules (combination restrictions) - live, no network. This is what makes invalid
 * combinations unrepresentable in Campaign Studio: the UI calls this on every
 * change and blocks submit until valid (CAMPAIGN_FLOWS.md).
 */
const validateSchema = z.object({
  entityType: z.enum(['CAMPAIGN', 'AD_GROUP', 'AD']),
  draft: z.record(z.string(), z.unknown()),
  isEdit: z.boolean().optional(),
});

export const validateDraft = authedAction.inputSchema(validateSchema).action(async ({ parsedInput }) => {
  const evalr = evaluateDraft(parsedInput.draft, RULES[parsedInput.entityType], parsedInput.isEdit ?? false);
  return {
    valid: evalr.valid,
    requiredNow: evalr.requiredNow,
    forbiddenNow: evalr.forbiddenNow,
    narrowedOptions: evalr.narrowedOptions,
    violations: evalr.violations,
    immutable: evalr.immutable,
  };
});

// ── Create / update / delete, each routed through validation + policy + audit. ──

const KIND_BY_TYPE: Record<'CAMPAIGN' | 'AD_GROUP' | 'AD', ActionKind> = {
  CAMPAIGN: 'CREATE_CAMPAIGN',
  AD_GROUP: 'CREATE_AD_GROUP',
  AD: 'CREATE_AD',
};

function idem(workspaceId: string, kind: string, payload: unknown, ref: string): string {
  const bucket = Math.floor(Date.now() / 3_600_000);
  return createHash('sha256').update(`${workspaceId}|TIKTOK|${kind}|${ref}|${JSON.stringify(payload)}|${bucket}`).digest('hex');
}

const createSchema = z.object({
  entityType: z.enum(['CAMPAIGN', 'AD_GROUP', 'AD']),
  accountExternalId: z.string().optional(),
  draft: z.record(z.string(), z.unknown()),
});

/** Create a TikTok entity. Validates combination rules FIRST, then routes through
 *  the HIGH-risk action pipeline (policy -> execute -> audit). When no account is
 *  passed, the first connected advertiser is used. */
export const createEntity = authedAction.inputSchema(createSchema).action(async ({ parsedInput, ctx }) => {
  const wsCtx = ctx.workspace;
  const { entityType, draft } = parsedInput;
  const accounts = await repositories.sync.listAccountRecords(wsCtx, 'TIKTOK');
  const accountExternalId = parsedInput.accountExternalId ?? accounts[0]?.externalId;
  if (!accountExternalId) {
    return { ok: false as const, violations: [{ field: 'account', because: 'Connect a TikTok ad account first.' }] };
  }

  // 1. Combination-rule validation (unrepresentable-invalid guarantee).
  const evalr = evaluateDraft(draft, RULES[entityType]);
  if (!evalr.valid) return { ok: false as const, violations: evalr.violations };

  // 2. Policy: creation is always HIGH risk (new spend). Requires ADMIN+.
  const kind = KIND_BY_TYPE[entityType];
  const policy = evaluatePolicy({
    kind,
    conversionOptimizing: false,
    trackingHealth: await repositories.metrics.accountTrackingHealth(wsCtx, 'TIKTOK'),
    killSwitch: false,
  });
  if (!policy.allowed) return { ok: false as const, violations: policy.violations.map((v) => ({ field: v.code, because: v.message })) };
  if (!canApprove(wsCtx.role, policy.approval.minRole)) {
    return { ok: false as const, violations: [{ field: 'role', because: `Creation needs ${policy.approval.minRole}+.` }] };
  }

  const key = idem(wsCtx.workspaceId, kind, draft, accountExternalId);
  const { action, created } = await repositories.actions.createAction(wsCtx, {
    platform: 'TIKTOK',
    kind,
    entityType,
    entityId: crypto.randomUUID(),
    externalEntityId: 'pending',
    proposedPayload: draft,
    humanDiff: Object.entries(draft).map(([field, to]) => ({ field, from: '(new)', to: String(to), changed: true })),
    validation: { violations: [] },
    estimatedImpact: {},
    riskBand: policy.riskBand,
    approvalPolicy: policy.approval,
    idempotencyKey: key,
    proposedBy: wsCtx.userId,
  });
  if (!created && action.status !== 'PROPOSED') {
    return { ok: action.status === 'APPLIED', already: true as const };
  }
  await repositories.actions.setStatus(wsCtx, action.id, 'APPROVED', { approvedBy: wsCtx.userId });

  const adapter = getAdapter('TIKTOK', wsCtx);
  const ref: EntityRef = {
    platform: 'TIKTOK',
    entityType: entityType as EntityType,
    externalId: 'pending',
    workspaceId: wsCtx.workspaceId,
    accountExternalId,
  };
  const proposed: ProposedAction = { workspaceId: wsCtx.workspaceId, platform: 'TIKTOK', kind, entityRef: ref, proposedPayload: draft, riskBand: policy.riskBand };
  const approved: ApprovedAction = { ...proposed, actionId: action.id, idempotencyKey: key };
  const result = await adapter.executeAction(approved);

  await repositories.actions.appendExecution(wsCtx, action.id, { attempt: 1, request: draft, response: result.apiResponse, error: result.error });
  await repositories.actions.setStatus(wsCtx, action.id, result.ok ? 'APPLIED' : 'FAILED', { apiResponse: result.apiResponse, error: result.error });
  await repositories.actions.appendAudit(wsCtx, {
    actorId: wsCtx.userId,
    actorType: 'USER',
    verb: result.ok ? 'entity.created' : 'entity.create_failed',
    subjectType: entityType,
    after: draft,
  });
  return { ok: result.ok, error: result.error, apiResponse: result.apiResponse };
});

const deleteSchema = z.object({
  entityType: z.enum(['CAMPAIGN', 'AD_GROUP', 'AD']),
  entityId: z.string(),
  externalId: z.string(),
});

/** Delete (archive) a TikTok entity - HIGH risk, ADMIN+, audited. */
export const deleteEntity = authedAction.inputSchema(deleteSchema).action(async ({ parsedInput, ctx }) => {
  const wsCtx = ctx.workspace;
  const { entityType, entityId, externalId } = parsedInput;

  const policy = evaluatePolicy({ kind: 'DELETE', conversionOptimizing: false, trackingHealth: 'HEALTHY', killSwitch: false });
  if (!canApprove(wsCtx.role, policy.approval.minRole)) {
    return { ok: false as const, error: `Delete needs ${policy.approval.minRole}+.` };
  }
  const accountExternalId = (await repositories.sync.entityAccountExternalId(wsCtx, entityType, entityId)) ?? undefined;
  const key = idem(wsCtx.workspaceId, 'DELETE', {}, externalId);
  const { action, created } = await repositories.actions.createAction(wsCtx, {
    platform: 'TIKTOK',
    kind: 'DELETE',
    entityType,
    entityId,
    externalEntityId: externalId,
    proposedPayload: { operation_status: 'DELETE' },
    humanDiff: [{ field: 'status', from: 'active', to: 'deleted', changed: true }],
    validation: { violations: [] },
    estimatedImpact: {},
    riskBand: 'HIGH',
    approvalPolicy: policy.approval,
    idempotencyKey: key,
    proposedBy: wsCtx.userId,
  });
  if (!created && action.status !== 'PROPOSED') return { ok: action.status === 'APPLIED' };
  await repositories.actions.setStatus(wsCtx, action.id, 'APPROVED', { approvedBy: wsCtx.userId });

  const adapter = getAdapter('TIKTOK', wsCtx);
  const ref: EntityRef = { platform: 'TIKTOK', entityType: entityType as EntityType, externalId, workspaceId: wsCtx.workspaceId, accountExternalId };
  const result = await adapter.executeAction({
    workspaceId: wsCtx.workspaceId,
    platform: 'TIKTOK',
    kind: 'DELETE',
    entityRef: ref,
    proposedPayload: {},
    riskBand: 'HIGH',
    actionId: action.id,
    idempotencyKey: key,
  });
  await repositories.actions.setStatus(wsCtx, action.id, result.ok ? 'APPLIED' : 'FAILED', { apiResponse: result.apiResponse, error: result.error });
  await repositories.actions.appendAudit(wsCtx, { actorId: wsCtx.userId, actorType: 'USER', verb: result.ok ? 'entity.deleted' : 'entity.delete_failed', subjectType: entityType, subjectId: externalId });
  return { ok: result.ok, error: result.error };
});
