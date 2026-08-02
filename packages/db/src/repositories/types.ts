export type EntityBudgetLike = {
  entityId: string;
  externalId: string;
  name: string;
  dailyBudgetMinor: bigint | null;
  budgetType: 'DAILY' | 'LIFETIME' | null;
};
