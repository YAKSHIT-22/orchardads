'use client';

import { PasswordField } from '@/components/auth/password-field';
import { resetPassword } from '@/lib/actions/auth';
import { Button } from '@adsos/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters').max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-risk-wash text-risk">
          <TriangleAlert className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h2 className="font-display text-lg text-ink">This reset link isn't valid</h2>
          <p className="mt-0.5 font-ui text-sm text-ink-muted">{message}</p>
        </div>
      </div>
      <Link
        href="/forgot-password"
        className="self-center font-ui text-sm text-iris hover:underline"
      >
        Request a new reset link
      </Link>
    </div>
  );
}

function ResetSuccess() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-applied-wash text-applied">
          <CheckCircle2 className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h2 className="font-display text-lg text-ink">Password reset</h2>
          <p className="mt-0.5 font-ui text-sm text-ink-muted">
            Your password has been updated. Sign in with your new password to continue.
          </p>
        </div>
      </div>
      <Link href="/signin" className="self-center font-ui text-sm text-iris hover:underline">
        Go to sign in
      </Link>
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const res = await resetPassword({ token, password: values.password });

    if (res?.serverError) {
      setTokenError(res.serverError);
      return;
    }
    if (res?.data?.ok) {
      setSuccess(true);
      return;
    }
    setTokenError(res?.data?.error ?? 'This reset link is invalid or has expired.');
  }

  if (!token) {
    return (
      <InvalidLink message="The link is missing its reset token. Open the link from your email again, or request a new one." />
    );
  }

  if (success) return <ResetSuccess />;

  if (tokenError) return <InvalidLink message={tokenError} />;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl text-ink">Choose a new password</h1>
        <p className="font-ui text-sm text-ink-muted">
          Set a new password for your OrchardAds account. It must be 8-100 characters long.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <PasswordField
          id="password"
          label="New password"
          placeholder="Enter your new password"
          register={register('password')}
          error={errors.password?.message}
          autoComplete="new-password"
        />

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          placeholder="Re-enter your new password"
          register={register('confirmPassword')}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
        />

        <Button type="submit" disabled={isSubmitting} className="mt-1">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </Button>

        <Link href="/signin" className="text-center font-ui text-sm text-ink-muted hover:text-ink">
          Back to sign in
        </Link>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
