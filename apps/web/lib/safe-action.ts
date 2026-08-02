import { createSafeActionClient } from 'next-safe-action';
import { getWorkspaceContext } from './session';

/** Base client: every action asserts a workspace context. */
export const actionClient = createSafeActionClient();

export const authedAction = actionClient.use(async ({ next }) => {
  const ctx = await getWorkspaceContext();
  if (!ctx) throw new Error('Not authenticated.');
  return next({ ctx: { workspace: ctx } });
});
