import { ContactForm } from '@/components/marketing/contact-form';
import { Mail } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-col gap-4">
        <span className="text-label text-iris">Contact</span>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] leading-tight text-ink">
          Talk to us about your channels.
        </h1>
        <p className="font-ui text-[14px] leading-6 text-ink-muted">
          Agency onboarding, Enterprise, or a question about a specific platform - we read every
          message. If you are evaluating OrchardAds for a client roster, tell us how many accounts and
          which platforms.
        </p>
        <div className="flex items-center gap-2 text-ink-muted">
          <Mail className="h-4 w-4" />
          <a href="mailto:hello@adsos.app" className="font-ui text-[13px] hover:text-ink">
            hello@adsos.app
          </a>
        </div>
      </div>
      <div className="rounded-lg border border-rule bg-paper-sunk p-6">
        <ContactForm />
      </div>
    </main>
  );
}
