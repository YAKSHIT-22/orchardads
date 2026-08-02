import { OnboardingWizard } from '@/components/onboarding/wizard';

const ERRORS: Record<string, string> = {
  tiktok_not_configured: 'TikTok is not connected on this deployment yet. Add the TikTok API keys to enable it.',
  oauth_state: 'The connection could not be verified. Please try again.',
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const errorMessage = error ? ERRORS[error] ?? 'Something went wrong. Please try again.' : null;
  return (
    <main className="min-h-screen bg-paper">
      <OnboardingWizard initialConnected={connected ?? null} initialError={errorMessage} />
    </main>
  );
}
