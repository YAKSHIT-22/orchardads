import { describe, expect, it } from 'vitest';
import { CATEGORY_ORDER, TOOLS, toolBySlug, toolsByCategory } from './tools-registry';

describe('tools registry integrity', () => {
  it('has unique slugs', () => {
    const slugs = TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every tool has a known category and 1..5 phase', () => {
    for (const t of TOOLS) {
      expect(CATEGORY_ORDER).toContain(t.category);
      expect(t.phase).toBeGreaterThanOrEqual(1);
      expect(t.phase).toBeLessThanOrEqual(5);
    }
  });

  it('gated tools declare a capability flag', () => {
    for (const t of TOOLS.filter((x) => x.status === 'gated')) {
      expect(t.capabilityFlag, `${t.slug} is gated but has no capabilityFlag`).toBeTruthy();
    }
  });

  it('toolBySlug resolves and toolsByCategory covers every tool', () => {
    expect(toolBySlug('waste-finder')?.name).toBe('Waste Finder');
    const grouped = toolsByCategory().flatMap((g) => g.tools);
    expect(grouped.length).toBe(TOOLS.length);
  });
});
