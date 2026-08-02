import { describe, expect, it } from 'vitest';
import { assertGrounded } from './grounding';
import { hasNoMutatingTools, READ_TOOLS } from './tools';

describe('ai safety', () => {
  it('exposes zero mutating tools', () => {
    expect(hasNoMutatingTools(READ_TOOLS)).toBe(true);
    expect(READ_TOOLS.length).toBeGreaterThan(0);
  });

  it('grounding flags an invented number', () => {
    const r = assertGrounded('CPA is 14.20, saving 99 conversions', [14.2]);
    expect(r.grounded).toBe(false);
    expect(r.ungrounded).toContain(99);
  });

  it('grounding passes when every number is allowed', () => {
    expect(assertGrounded('CPA 14.20 over 21 days', [14.2, 21]).grounded).toBe(true);
  });
});
