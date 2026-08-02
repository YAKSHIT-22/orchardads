export const metadata = { title: 'Terms of Service - OrchardAds' };

const SECTIONS: [string, string][] = [
  ['Acceptance', 'By using OrchardAds you agree to these terms. If you use the service on behalf of an organization, you accept them for that organization.'],
  ['The service', 'OrchardAds provides diagnostics, recommendations, and safe change-management for TikTok Ads accounts you connect via the official API. You remain responsible for the advertising decisions you approve.'],
  ['Your responsibilities', 'Keep your credentials secure, comply with TikTok\'s advertising policies and developer terms, and ensure you are authorized to manage the ad accounts you connect. You approve every change before it is applied.'],
  ['Acceptable use', 'Do not misuse the service, attempt to bypass guardrails, reverse engineer it, or use it to violate any platform\'s terms or applicable law.'],
  ['Changes we apply', 'Changes are applied only after your explicit approval through the official API. We retain an audit trail and, where the platform allows, a rollback path. We are not liable for advertising outcomes.'],
  ['Availability', 'The service is provided on an "as is" basis. We aim for high availability but do not guarantee uninterrupted service.'],
  ['Limitation of liability', 'To the maximum extent permitted by law, OrchardAds is not liable for indirect or consequential damages, or for ad spend outcomes resulting from changes you approve.'],
  ['Termination', 'You may stop using the service and disconnect platforms at any time. We may suspend accounts that violate these terms.'],
  ['Contact', 'support@orchardads.in.'],
];

export default function TermsPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10 sm:py-20">
      <header className="flex flex-col gap-2">
        <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-iris/80">Legal</span>
        <h1 className="font-display text-4xl tracking-[-0.02em] text-ink sm:text-5xl">Terms of Service</h1>
        <p className="font-data text-[11px] text-ink-faint">Last updated: 2 August 2026</p>
      </header>
      <div className="flex flex-col gap-6">
        {SECTIONS.map(([h, b]) => (
          <section key={h} className="flex flex-col gap-1.5">
            <h2 className="font-ui text-[15px] font-semibold text-ink">{h}</h2>
            <p className="font-ui text-[13px] leading-6 text-ink-muted">{b}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
