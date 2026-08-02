'use client';

import { PasswordField } from '@/components/auth/password-field';
import { signIn } from '@/lib/actions/auth';
import { Button, Field, Input } from '@adsos/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function SignInPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const res = await signIn(values);

    if (res?.serverError) {
      toast.error(res.serverError);
      return;
    }
    if (res?.data?.needsVerification) {
      toast.error(res.data.error ?? 'Please verify your email.');
      router.push(`/signup?verify=${encodeURIComponent(values.email)}`);
      return;
    }
    if (res?.data?.ok) {
      router.push('/dashboard');
      return;
    }
    toast.error(res?.data?.error ?? 'Something went wrong.');
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[28px] leading-tight text-ink">Welcome back</h1>
        <p className="font-ui text-sm text-ink-muted">
          Sign in to manage, diagnose and optimize your TikTok Ads accounts.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
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

        <div className="flex flex-col gap-1.5">
          <PasswordField
            id="password"
            label="Password"
            placeholder="Enter your password"
            register={register('password')}
            error={errors.password?.message}
            autoComplete="current-password"
          />
          <Link
            href="/forgot-password"
            className="self-end font-ui text-[12px] text-iris hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1 w-full">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center font-ui text-sm text-ink-muted">
        Don't have an account?{' '}
        <Link href="/signup" className="text-iris hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
