/**
 * Conditional field rules for Campaign Studio (CAMPAIGN_FLOWS.md sec 3). Generated
 * schemas capture *types*; these capture "field X required only when Y = Z". One
 * shared engine evaluates them. `because` is mandatory on every rule and is
 * rendered verbatim in the UI.
 */
export type Draft = Record<string, unknown>;
export type Predicate = (d: Draft) => boolean;

export type FieldRule =
  | { kind: 'requiredWhen'; field: string; when: Predicate; because: string }
  | { kind: 'forbiddenWhen'; field: string; when: Predicate; because: string }
  | { kind: 'allowedValues'; field: string; when: Predicate; values: string[]; because: string }
  | { kind: 'defaultsTo'; field: string; when: Predicate; value: unknown }
  | { kind: 'immutableAfterCreate'; field: string; because: string }
  | { kind: 'range'; field: string; when?: Predicate; min?: number; max?: number; because: string }
  | { kind: 'crossField'; fields: string[]; assert: (d: Draft) => boolean; because: string };

export type FieldPath = string;

export type DraftEvaluation = {
  valid: boolean;
  requiredNow: FieldPath[];
  forbiddenNow: FieldPath[];
  narrowedOptions: Record<FieldPath, string[]>;
  violations: { field: FieldPath; because: string }[];
  immutable: FieldPath[];
};

const has = (d: Draft, f: string) => d[f] !== undefined && d[f] !== null && d[f] !== '';

/** Evaluate a partial draft. Editing mode passes `isEdit` to surface immutables. */
export function evaluateDraft(draft: Draft, rules: FieldRule[], isEdit = false): DraftEvaluation {
  const requiredNow = new Set<FieldPath>();
  const forbiddenNow = new Set<FieldPath>();
  const narrowedOptions: Record<FieldPath, string[]> = {};
  const violations: { field: FieldPath; because: string }[] = [];
  const immutable = new Set<FieldPath>();

  // Apply defaults first so downstream predicates see them.
  const d: Draft = { ...draft };
  for (const r of rules) {
    if (r.kind === 'defaultsTo' && r.when(d) && !has(d, r.field)) d[r.field] = r.value;
  }

  for (const r of rules) {
    switch (r.kind) {
      case 'requiredWhen': {
        if (r.when(d)) {
          requiredNow.add(r.field);
          if (!has(d, r.field)) violations.push({ field: r.field, because: r.because });
        }
        break;
      }
      case 'forbiddenWhen': {
        if (r.when(d)) {
          forbiddenNow.add(r.field);
          if (has(d, r.field)) violations.push({ field: r.field, because: r.because });
        }
        break;
      }
      case 'allowedValues': {
        if (r.when(d)) {
          narrowedOptions[r.field] = r.values;
          const v = d[r.field];
          if (v != null && v !== '' && !r.values.includes(String(v))) {
            violations.push({ field: r.field, because: r.because });
          }
        }
        break;
      }
      case 'range': {
        if (!r.when || r.when(d)) {
          const v = d[r.field];
          if (typeof v === 'number') {
            if ((r.min != null && v < r.min) || (r.max != null && v > r.max)) {
              violations.push({ field: r.field, because: r.because });
            }
          }
        }
        break;
      }
      case 'immutableAfterCreate': {
        if (isEdit) immutable.add(r.field);
        break;
      }
      case 'crossField': {
        if (r.fields.every((f) => has(d, f)) && !r.assert(d)) {
          violations.push({ field: r.fields[0] ?? '', because: r.because });
        }
        break;
      }
    }
  }

  return {
    valid: violations.length === 0,
    requiredNow: [...requiredNow],
    forbiddenNow: [...forbiddenNow],
    narrowedOptions,
    violations,
    immutable: [...immutable],
  };
}

export const eq = (field: string, value: unknown): Predicate => (d) => d[field] === value;
export const oneOf = (field: string, values: unknown[]): Predicate => (d) => values.includes(d[field]);
export const always: Predicate = () => true;
