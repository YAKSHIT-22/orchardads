import { prisma } from '../client';

export type AuthTokenKind = 'EMAIL_OTP' | 'PASSWORD_RESET';

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function createUser(input: { email: string; name: string; passwordHash: string }) {
  return prisma.user.create({
    data: { email: input.email.toLowerCase(), name: input.name, passwordHash: input.passwordHash },
  });
}

export async function setPassword(userId: string, passwordHash: string) {
  return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function markEmailVerified(userId: string) {
  return prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
}

/** Replace any outstanding token of this kind with a fresh one. */
export async function issueToken(userId: string, kind: AuthTokenKind, codeHash: string, ttlMs: number) {
  await prisma.authToken.deleteMany({ where: { userId, kind } });
  return prisma.authToken.create({
    data: { userId, kind, codeHash, expiresAt: new Date(Date.now() + ttlMs) },
  });
}

/** Verify + consume a token by matching its hash; returns the userId when valid. */
export async function consumeToken(kind: AuthTokenKind, codeHash: string, userId?: string): Promise<string | null> {
  const token = await prisma.authToken.findFirst({
    where: {
      kind,
      codeHash,
      consumed: false,
      expiresAt: { gt: new Date() },
      ...(userId ? { userId } : {}),
    },
  });
  if (!token) return null;
  await prisma.authToken.update({ where: { id: token.id }, data: { consumed: true } });
  return token.userId;
}

/** First workspace + role for a user (used to mint the session). */
export async function firstMembership(userId: string) {
  return prisma.member.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { workspaceId: true, role: true },
  });
}

/** Bootstrap an org + workspace + owner membership for a new user. */
export async function bootstrapWorkspace(userId: string, orgName = 'My Organization') {
  const org = await prisma.organization.create({ data: { name: orgName } });
  const workspace = await prisma.workspace.create({
    data: { organizationId: org.id, name: 'Default', slug: `ws-${org.id.slice(0, 8)}` },
  });
  await prisma.member.create({ data: { workspaceId: workspace.id, userId, role: 'OWNER' } });
  return { workspaceId: workspace.id, role: 'OWNER' as const };
}
