/**
 * Money is stored as integer minor units + a currency code. Never floats.
 * Platforms differ on scale (Spotify uses micro-amounts); normalize at the
 * adapter boundary into { amountMinor: bigint, currency }. ARCHITECTURE.md sec 5.2.
 */
export type Money = { amountMinor: bigint; currency: string };

/** Most currencies use 2 minor-unit digits; the exceptions that matter here. */
const MINOR_UNIT_DIGITS: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  CLP: 0,
  BHD: 3,
  KWD: 3,
  TND: 3,
};

export function minorDigits(currency: string): number {
  return MINOR_UNIT_DIGITS[currency.toUpperCase()] ?? 2;
}

/** Platform micro-amount (1e6 scale) -> our minor units. */
export function fromMicro(micro: bigint | number, currency: string): Money {
  const m = typeof micro === 'number' ? BigInt(Math.round(micro)) : micro;
  const scaleDown = 6 - minorDigits(currency);
  const divisor = 10n ** BigInt(scaleDown);
  return { amountMinor: m / divisor, currency: currency.toUpperCase() };
}

/** Our minor units -> platform micro-amount. */
export function toMicro(money: Money): bigint {
  const scaleUp = 6 - minorDigits(money.currency);
  return money.amountMinor * 10n ** BigInt(scaleUp);
}

/** Render for display only - never for arithmetic. */
export function formatMoney(money: Money, locale = 'en-US'): string {
  const digits = minorDigits(money.currency);
  const major = Number(money.amountMinor) / 10 ** digits;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: digits,
  }).format(major);
}

/** Percentage change between two minor-unit amounts of the same currency. */
export function pctChange(from: bigint, to: bigint): number {
  if (from === 0n) return to === 0n ? 0 : Number.POSITIVE_INFINITY;
  return (Number(to - from) / Number(from)) * 100;
}
