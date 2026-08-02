export const metadata = { title: 'Privacy Policy - OrchardAds' };

const SECTIONS: [string, string][] = [
  ['Who we are', 'OrchardAds is an ad-optimization workspace for TikTok Ads. This policy explains what we collect, why, and your choices.'],
  ['What we collect', 'Account details you provide (name, email). Advertising data you authorize us to access through TikTok\'s official API via OAuth - campaigns, ad groups, ads, and performance metrics for the ad accounts you connect. We also store operational data such as recommendations, actions you approve, and audit records.'],
  ['How we use it', 'Solely to provide the service: to compute diagnostics and recommendations, to apply changes you approve through the official API, to show reporting, and to maintain an audit trail. We do not sell your data or share it with third parties for their own marketing.'],
  ['Access tokens', 'OAuth access and refresh tokens are encrypted at rest (AES-256-GCM) and never exposed to your browser. We request the minimum scopes needed and only act on your explicit approval.'],
  ['Platform data', 'Data accessed through the TikTok Marketing API is used only to operate features for your own connected accounts, in line with TikTok\'s developer terms. We do not use it to train models without consent and do not resell it.'],
  ['Retention and deletion', 'You can disconnect a platform or request deletion of your workspace data at any time; on request we delete your data within 30 days, except where retention is legally required.'],
  ['Security', 'Encryption in transit and at rest, strict tenant isolation (row-level security), role-based access, an immutable audit trail, and least-privilege access to platform APIs.'],
  ['Contact', 'Questions about this policy: hello@adsos.app.'],
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-[760px] flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <span className="text-label text-iris">Legal</span>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] text-ink">Privacy Policy</h1>
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
