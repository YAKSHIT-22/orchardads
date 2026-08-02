'use client';

import { OtpInput } from '@/components/auth/otp-input';
import { PasswordField } from '@/components/auth/password-field';
import { resendOtp, signUp, verifyEmail } from '@/lib/actions/auth';
import { Button, Field, Input } from '@adsos/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

type SignUpValues = z.infer<typeof signUpSchema>;

function VerifyStep({ email, onBack }: { email: string; onBack: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  async function verify() {
    if (code.length !== 6) return;
    setVerifying(true);
    try {
      const res = await verifyEmail({ email, code });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      if (res?.data?.ok) {
        toast.success('Email verified');
        router.push('/dashboard');
        return;
      }
      toast.error(res?.data?.error ?? 'Invalid or expired code.');
    } finally {
      setVerifying(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      const res = await resendOtp({ email });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      toast.success('A new code is on its way.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-iris-wash text-iris">
          <MailCheck className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h2 className="font-display text-lg text-ink">Check your email</h2>
          <p className="mt-0.5 font-ui text-sm text-ink-muted">
            We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>. Enter
            it below to verify your account.
          </p>
        </div>
      </div>

      <OtpInput value={code} onChange={setCode} disabled={verifying} autoFocus />

      <Button type="button" onClick={verify} disabled={verifying || code.length !== 6}>
        {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
        {verifying ? 'Verifying...' : 'Verify & continue'}
      </Button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-ui text-[12px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="font-ui text-[12px] text-iris hover:underline disabled:opacity-50"
        >
          {resending ? 'Sending...' : 'Resend code'}
        </button>
      </div>
    </div>
  );
}

function SignUpForm() {
  const searchParams = useSearchParams();
  const verifyEmailParam = searchParams.get('verify');
  const [step, setStep] = useState<'form' | 'verify'>(verifyEmailParam ? 'verify' : 'form');
  const [email, setEmail] = useState(verifyEmailParam ?? '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  async function onSubmit(values: SignUpValues) {
    const res = await signUp(values);

    if (res?.serverError) {
      toast.error(res.serverError);
      return;
    }
    if (res?.data?.ok) {
      setEmail(values.email);
      setStep('verify');
      toast.success('Account created - check your email for a code.');
      return;
    }
    toast.error(res?.data?.error ?? 'Something went wrong.');
  }

  if (step === 'verify') {
    return (
      <>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[28px] leading-tight text-ink">Verify your email</h1>
        </div>
        <VerifyStep email={email} onBack={() => setStep('form')} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] leading-tight text-ink">Get started with OrchardAds</h1>
        <p className="font-ui text-sm text-ink-muted">
          Diagnose, optimize and automate your TikTok Ads accounts - free to try.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            placeholder="Your name"
            invalid={!!errors.name}
            autoComplete="name"
            {...register('name')}
          />
        </Field>

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

        <PasswordField
          id="password"
          label="Password"
          placeholder="At least 8 characters"
          register={register('password')}
          error={errors.password?.message}
          autoComplete="new-password"
        />

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-center font-ui text-sm text-ink-muted">
        Already have an account?{' '}
        <Link href="/signin" className="text-iris hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-ink-faint" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
