/**
 * The AI tool surface is READ-ONLY. The model receives no credentials and has
 * no write tools; its only platform-bound output is a ProposedAction[] parsed by
 * deterministic code (ARCHITECTURE.md sec 8). Every tool here declares readOnly:true
 * and a test asserts the registry exposes zero mutating tools.
 */
export type AiTool = {
  name: string;
  description: string;
  readOnly: true;
  /** JSON-schema-ish description of inputs; kept loose for the POC. */
  input: Record<string, string>;
};

export const READ_TOOLS: AiTool[] = [
  {
    name: 'query_metrics',
    description: 'Read aggregated metrics for an entity and date range from the normalized store.',
    readOnly: true,
    input: { entityId: 'string', since: 'ISO date', until: 'ISO date' },
  },
  {
    name: 'list_entities',
    description: 'List campaigns / ad groups / ads for the connected account.',
    readOnly: true,
    input: { accountId: 'string', entityType: 'CAMPAIGN | AD_GROUP | AD' },
  },
  {
    name: 'get_recommendation_evidence',
    description: 'Fetch the pre-computed evidence bundle behind a recommendation.',
    readOnly: true,
    input: { recommendationId: 'string' },
  },
  {
    name: 'get_tracking_health',
    description: 'Read the conversion-tracking health for an account.',
    readOnly: true,
    input: { accountId: 'string' },
  },
];

export function hasNoMutatingTools(tools: AiTool[]): boolean {
  return tools.every((t) => t.readOnly === true);
}
