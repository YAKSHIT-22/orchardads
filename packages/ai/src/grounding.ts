/**
 * The model explains a pre-computed evidence bundle; it never invents a metric
 * (ARCHITECTURE.md sec 8). This guard flags any number in model output that is not
 * present in the input bundle. Run it in CI against a fixture set (Task 30).
 */
export function extractNumbers(text: string): number[] {
  const matches = text.match(/-?\d[\d,]*(?:\.\d+)?/g) ?? [];
  return matches
    .map((m) => Number(m.replace(/,/g, '')))
    .filter((n) => Number.isFinite(n));
}

export type GroundingResult = { grounded: boolean; ungrounded: number[] };

/** Every number in `text` must appear in `allowed` (within a small tolerance). */
export function assertGrounded(text: string, allowed: number[], tolerance = 0.01): GroundingResult {
  const allow = allowed.map((n) => n);
  const ungrounded = extractNumbers(text).filter(
    (n) => !allow.some((a) => Math.abs(a - n) <= Math.max(tolerance, Math.abs(a) * tolerance)),
  );
  return { grounded: ungrounded.length === 0, ungrounded };
}
