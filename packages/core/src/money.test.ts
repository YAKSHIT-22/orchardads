import { describe, expect, it } from 'vitest';
import { formatMoney, fromMicro, minorDigits, pctChange, toMicro } from './money';

describe('money', () => {
  it('round-trips USD micro-amounts (2 minor digits)', () => {
    const m = fromMicro(1_500_000n, 'USD'); // $1.50
    expect(m.amountMinor).toBe(150n);
    expect(toMicro(m)).toBe(1_500_000n);
  });

  it('handles JPY (0 minor digits) without losing yen', () => {
    const m = fromMicro(1_500_000_000n, 'JPY'); // 1500
    expect(m.amountMinor).toBe(1500n);
    expect(minorDigits('JPY')).toBe(0);
  });

  it('handles 3-digit minor currencies (KWD)', () => {
    const m = fromMicro(1_500_000n, 'KWD'); // 1.500 KWD
    expect(m.amountMinor).toBe(1500n);
    expect(toMicro(m)).toBe(1_500_000n);
  });

  it('computes pct change and guards divide-by-zero', () => {
    expect(pctChange(1200n, 1500n)).toBeCloseTo(25);
    expect(pctChange(0n, 0n)).toBe(0);
    expect(pctChange(0n, 5n)).toBe(Number.POSITIVE_INFINITY);
  });

  it('formats for display', () => {
    expect(formatMoney({ amountMinor: 150n, currency: 'USD' })).toBe('$1.50');
  });
});
