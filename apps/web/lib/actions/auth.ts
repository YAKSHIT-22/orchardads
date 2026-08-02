'use server';

import { repositories } from '@adsos/db';
import { z } from 'zod';
import { generateOtp, hashCode, hashPassword, verifyPassword } from '../auth/passwords';
import { sendOtpEmail, sendPasswordResetEmail } from '../mailer';
import { rateLimit } from '../rate-limit';
import { actionClient } from '../safe-action';
import { clearSession, setWorkspaceSession } from '../session';

const OTP_TTL = 10 * 60 * 1000;
const RESET_TTL = 60 * 60 * 1000;

const email = z.string().email();
const password = z.string().min(8, 'Use at least 8 characters');

// ── Sign up: create user, send email OTP. ──
const signUpSchema = z.object({ name: z.string().min(1).max(120), email, password });

export const signUp = actionClient.inputSchema(signUpSchema).action(async ({ parsedInput }) => {
  if (!(await rateLimit(`signup:${parsedInput.email}`, 5, 3600))) {
    return { ok: false as const, error: 'Too many attempts. Try again later.' };
  }
  const existing = await repositories.users.findByEmail(parsedInput.email);
  if (existing) return { ok: false as const, error: 'An account with this email already exists.' };

  const user = await repositories.users.createUser({
    name: parsedInput.name,
    email: parsedInput.email,
    passwordHash: await hashPassword(parsedInput.password),
  });
  const code = generateOtp();
  await repositories.users.issueToken(user.id, 'EMAIL_OTP', hashCode(code), OTP_TTL);
  await sendOtpEmail(parsedInput.email, code);
  return { ok: true as const };
});

// ── Verify email OTP: mark verified, bootstrap workspace, sign in. ──
const verifySchema = z.object({ email, code: z.string().length(6) });

export const verifyEmail = actionClient.inputSchema(verifySchema).action(async ({ parsedInput }) => {
  const user = await repositories.users.findByEmail(parsedInput.email);
  if (!user) return { ok: false as const, error: 'Account not found.' };
  const userId = await repositories.users.consumeToken('EMAIL_OTP', hashCode(parsedInput.code), user.id);
  if (!userId) return { ok: false as const, error: 'Invalid or expired code.' };

  await repositories.users.markEmailVerified(user.id);
  let membership = await repositories.users.firstMembership(user.id);
  if (!membership) membership = await repositories.users.bootstrapWorkspace(user.id);
  await setWorkspaceSession({ workspaceId: membership.workspaceId, userId: user.id, role: membership.role });
  return { ok: true as const };
});

export const resendOtp = actionClient.inputSchema(z.object({ email })).action(async ({ parsedInput }) => {
  if (!(await rateLimit(`otp:${parsedInput.email}`, 5, 900))) {
    return { ok: false as const, error: 'Please wait before requesting another code.' };
  }
  const user = await repositories.users.findByEmail(parsedInput.email);
  if (user) {
    const code = generateOtp();
    await repositories.users.issueToken(user.id, 'EMAIL_OTP', hashCode(code), OTP_TTL);
    await sendOtpEmail(parsedInput.email, code);
  }
  return { ok: true as const };
});

// ── Sign in: verify password, mint session (or ask for verification). ──
const signInSchema = z.object({ email, password: z.string().min(1) });

export const signIn = actionClient.inputSchema(signInSchema).action(async ({ parsedInput }) => {
  if (!(await rateLimit(`signin:${parsedInput.email}`, 10, 900))) {
    return { ok: false as const, error: 'Too many attempts. Try again later.' };
  }
  const user = await repositories.users.findByEmail(parsedInput.email);
  if (!user?.passwordHash || !(await verifyPassword(parsedInput.password, user.passwordHash))) {
    return { ok: false as const, error: 'Incorrect email or password.' };
  }
  if (!user.emailVerified) {
    const code = generateOtp();
    await repositories.users.issueToken(user.id, 'EMAIL_OTP', hashCode(code), OTP_TTL);
    await sendOtpEmail(user.email, code);
    return { ok: false as const, needsVerification: true as const, error: 'Please verify your email. We sent a new code.' };
  }
  let membership = await repositories.users.firstMembership(user.id);
  if (!membership) membership = await repositories.users.bootstrapWorkspace(user.id);
  await setWorkspaceSession({ workspaceId: membership.workspaceId, userId: user.id, role: membership.role });
  return { ok: true as const };
});

// ── Forgot / reset password. ──
export const forgotPassword = actionClient.inputSchema(z.object({ email })).action(async ({ parsedInput }) => {
  if (!(await rateLimit(`forgot:${parsedInput.email}`, 5, 3600))) {
    return { ok: true as const }; // do not reveal rate-limit state
  }
  const user = await repositories.users.findByEmail(parsedInput.email);
  if (user) {
    const token = generateOtp() + generateOtp(); // 12-digit opaque token
    await repositories.users.issueToken(user.id, 'PASSWORD_RESET', hashCode(token), RESET_TTL);
    await sendPasswordResetEmail(user.email, token);
  }
  // Always succeed - do not disclose whether the email exists.
  return { ok: true as const };
});

const resetSchema = z.object({ token: z.string().min(8), password });

export const resetPassword = actionClient.inputSchema(resetSchema).action(async ({ parsedInput }) => {
  const userId = await repositories.users.consumeToken('PASSWORD_RESET', hashCode(parsedInput.token));
  if (!userId) return { ok: false as const, error: 'This reset link is invalid or has expired.' };
  await repositories.users.setPassword(userId, await hashPassword(parsedInput.password));
  return { ok: true as const };
});

export const signOut = actionClient.action(async () => {
  await clearSession();
  return { ok: true as const };
});
