import type { RecommendationDraft } from '@adsos/recommendations';
import { assertGrounded, extractNumbers } from './grounding';
import type { AiProvider, AiMessage } from './provider';

/** The numbers the model is allowed to use = every number already in the draft. */
export function allowedNumbers(rec: RecommendationDraft): number[] {
  const texts = [
    ...rec.evidence,
    ...rec.diff.flatMap((d) => [d.from, d.to]),
    rec.estimatedImpact ? `${rec.estimatedImpact.deltaMin} ${rec.estimatedImpact.deltaMax}` : '',
  ];
  return texts.flatMap(extractNumbers);
}

const SYSTEM =
  'You explain an ad-optimization recommendation to a media buyer. Use ONLY the numbers in the evidence. ' +
  'Never invent a metric. Two sentences, plain language, no hype.';

export function buildMessages(rec: RecommendationDraft): AiMessage[] {
  const bundle = {
    kind: rec.kind,
    entity: rec.entityName,
    diff: rec.diff,
    evidence: rec.evidence,
    estimate: rec.estimatedImpact,
  };
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Evidence bundle:\n${JSON.stringify(bundle, null, 2)}\n\nExplain why.` },
  ];
}

export type Explanation = { text: string; grounded: boolean; ungrounded: number[] };

/** Explain a draft; reject (return grounded:false) if the model invents a number. */
export async function explainRecommendation(
  provider: AiProvider,
  rec: RecommendationDraft,
): Promise<Explanation> {
  const text = await provider.complete({ messages: buildMessages(rec), maxTokens: 300 });
  const check = assertGrounded(text, allowedNumbers(rec));
  return { text, grounded: check.grounded, ungrounded: check.ungrounded };
}
