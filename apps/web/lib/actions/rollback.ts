'use server';

import type { ActionKind, AppliedAction } from '@adsos/platform-core';
import type { EntityType, Platform, RiskBand } from '@adsos/core';
import { repositories } from '@adsos/db';
import { canApprove } from '@adsos/policy-engine';
import { z } from 'zod';
import { getAdapter } from '../adapters';
import { authedAction } from '../safe-action';

const schema = z.object({ actionId: z.string() });

/** Roll an applied action back to its captured previous state (DESIGN_SYSTEM sec 7). */
export const rollbackAction = authedAction.inputSchema(schema).action(async ({ parsedInput, ctx }) => {
  const wsCtx = ctx.workspace;
  if (!canApprove(wsCtx.role, 'ADMIN')) {
    return { ok: false as const, error: 'Rollback needs ADMIN or above.' };
  }
  const action = await repositories.actions.getAction(wsCtx, parsedInput.actionId);
  if (!action) return { ok: false as const, error: 'Action not found.' };
  if (action.status !== 'APPLIED') return { ok: false as const, error: 'Only an applied action can be rolled back.' };
  if (!action.rollbackPlan) return { ok: false as const, error: 'This action is not reversible.' };

  const platform = action.platform as Platform;
  const accountExternalId =
    (await repositories.sync.entityAccountExternalId(
      wsCtx,
      action.entityType as 'CAMPAIGN' | 'AD_GROUP' | 'AD',
      action.entityId,
    )) ?? undefined;
  const ref = {
    platform,
    entityType: action.entityType as EntityType,
    externalId: action.externalEntityId,
    workspaceId: wsCtx.workspaceId,
    accountExternalId,
  };
  const applied: AppliedAction = {
    workspaceId: wsCtx.workspaceId,
    platform,
    kind: action.kind as ActionKind,
    entityRef: ref,
    proposedPayload: action.proposedPayload as Record<string, unknown>,
    riskBand: action.riskBand as RiskBand,
    actionId: action.id,
    idempotencyKey: action.idempotencyKey,
    previousState: { ref, state: (action.previousState ?? {}) as Record<string, unknown>, capturedAt: '' },
  };

  const adapter = getAdapter(platform, wsCtx);
  const result = await adapter.rollback(applied);

  await repositories.actions.appendExecution(wsCtx, action.id, {
    attempt: 2,
    request: { rollback: true },
    response: result.apiResponse,
    rateLimit: result.rateLimit,
    error: result.error,
  });
  if (result.ok) {
    await repositories.actions.setStatus(wsCtx, action.id, 'ROLLED_BACK', { apiResponse: result.apiResponse });
    await repositories.actions.appendAudit(wsCtx, {
      actorId: wsCtx.userId,
      actorType: 'USER',
      verb: 'action.rolled_back',
      subjectType: action.entityType,
      subjectId: action.externalEntityId,
      before: action.proposedPayload,
      after: action.previousState ?? {},
    });
  }
  return { ok: result.ok, error: result.error };
});
