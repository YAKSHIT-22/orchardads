import { Recycle, ScanSearch, ShieldCheck, TrendingUp } from 'lucide-react';

const FEATURES = [
  { icon: ScanSearch, label: 'Delivery Doctor' },
  { icon: Recycle, label: 'Waste Finder' },
  { icon: ShieldCheck, label: 'Tracking Doctor' },
];

/**
 * Branded showcase panel for the auth split layout - our cyan/teal system,
 * TikTok cyan rationed to a single identity chip (per DESIGN_SYSTEM.md sec 2:
 * platform colour lives only in rails/chips, never in chrome).
 */
export function AuthShowcase() {
  return (
    <div className="relative flex h-full max-h-[640px] w-full max-w-md flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-[#04141a] p-8 text-white lg:p-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-20 -right-10 h-72 w-72 rounded-full blur-[110px]"
          style={{ background: 'color-mix(in oklch, var(--iris) 35%, transparent)' }}
        />
        <div
          className="absolute -left-16 bottom-0 h-72 w-72 rounded-full blur-[120px]"
          style={{ background: 'color-mix(in oklch, var(--p-tiktok) 30%, transparent)' }}
        />
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full opacity-[0.05]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="auth-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
      </div>

      <div className="relative z-10">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 font-data text-[10px] font-medium uppercase tracking-wide"
          style={{ color: 'var(--p-tiktok)' }}
        >
          TikTok Ads
        </span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center gap-6 py-8">
        <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="font-ui text-[11px] text-white/50">Recommendation</span>
            <span className="rounded-full bg-applied/20 px-2 py-0.5 font-data text-[10px] text-applied">
              +18% CPA
            </span>
          </div>
          <p className="mt-2 font-ui text-sm text-white">
            Reallocate budget from "Loser - Ad Group 4" to "Winner - Ad Group 9"
          </p>
          <div className="mt-3 flex items-center gap-2 font-data text-[11px] text-white/50">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
            Evidence-backed - one click apply
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <h2 className="font-display text-2xl leading-tight text-white">
          Run TikTok Ads like a media buyer, not a spreadsheet.
        </h2>
        <p className="max-w-xs font-ui text-sm text-white/70">
          Diagnostics, recommendations and safe one-click actions - every answer shows its evidence.
        </p>
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 font-ui text-xs text-white/80"
            >
              <f.icon className="h-3.5 w-3.5" />
              {f.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
