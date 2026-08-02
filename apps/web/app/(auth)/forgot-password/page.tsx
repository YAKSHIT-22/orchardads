'use client';

import { forgotPassword } from '@/lib/actions/auth';
import { Button, Field, Input } from '@adsos/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await forgotPassword(values);
    } catch {
      // Fall through to the success state regardless - the server never
      // discloses whether an account exists for a given email.
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-iris-wash text-iris">
            <MailCheck className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h2 className="font-display text-lg text-ink">Check your inbox</h2>
            <p className="mt-0.5 font-ui text-sm text-ink-muted">
              If that email is registered, a reset link is on its way. The link expires in an hour,
              so use it while it's fresh.
            </p>
          </div>
        </div>
        <Link
          href="/signin"
          className="inline-flex items-center gap-1.5 self-center font-ui text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl text-ink">Forgot your password?</h1>
        <p className="font-ui text-sm text-ink-muted">
          Enter the email you signed up with and we'll send you a link to reset it.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            invalid={!!errors.email}
            autoComplete="email"
            {...register('email')}
          />
        </Field>

        <Button type="submit" disabled={isSubmitting} className="mt-1">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </Button>

        <Link
          href="/signin"
          className="inline-flex items-center justify-center gap-1.5 font-ui text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </form>
    </>
  );
}
