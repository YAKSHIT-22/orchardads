import { ContactForm } from '@/components/marketing/contact-form';
import { Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col gap-4">
        <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-iris/80">Contact</span>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.02em] text-ink sm:text-5xl">
          Talk to us about your channels.
        </h1>
        <p className="font-ui text-[14px] leading-6 text-ink-muted">
          Agency onboarding, Enterprise, or a question about a specific platform - we read every
          message. If you are evaluating OrchardAds for a client roster, tell us how many accounts and
          which platforms.
        </p>
        <div className="flex items-center gap-2 text-ink-muted">
          <Mail className="h-4 w-4" />
          <a href="mailto:support@orchardads.in" className="font-ui text-[13px] hover:text-ink">
            support@orchardads.in
          </a>
        </div>
      </div>
      <div className="rounded-2xl border border-rule bg-paper-sunk p-6 sm:p-8">
        <ContactForm />
      </div>
    </main>
  );
}
