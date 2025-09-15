import type { CampaignData } from './apiClient.js';

export type Rule = {
  id: string;
  description?: string;
  // A rule is defined as a boolean expression over campaign metrics
  // e.g. "(spend > 500 && ctr < 1) || roas < 2"
  condition: string;
  // Action description to return if triggered
  action: string;
};

export type TriggeredAction = { action: string; condition: string; ruleId: string };

export function evaluateRules(campaignData: CampaignData, rules: Rule[]): TriggeredAction[] {
  const triggeredActions: TriggeredAction[] = [];

  for (const rule of rules) {
    const { spend, ctr, roas } = campaignData;
    const condition = rule.condition;

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('spend', 'ctr', 'roas', `return (${condition});`);
      const result = Boolean(fn(spend, ctr, roas));
      if (result) {
        triggeredActions.push({ action: rule.action, condition: rule.condition, ruleId: rule.id });
      }
    } catch (_error) {
      // Ignore malformed rules
      continue;
    }
  }

  return triggeredActions;
}

