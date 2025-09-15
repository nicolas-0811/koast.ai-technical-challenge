import type { CampaignData } from './apiClient.js';
import type { Rule, TriggeredAction } from './rulesEngine.js';

type ActionLog = {
  timestamp: number;
  campaignId: string;
  action: string;
  condition?: string;
};

let campaigns: Record<string, CampaignData> = {};
let rules: Rule[] = [];
let actions: ActionLog[] = [];
const firedRuleByCampaign: Set<string> = new Set(); // key: `${campaignId}:${ruleId}`

export function setCampaigns(list: CampaignData[]): void {
  campaigns = list.reduce<Record<string, CampaignData>>((acc, c) => {
    acc[c.campaign_id] = c;
    return acc;
  }, {});
}

export function getCampaigns(): CampaignData[] {
  return Object.values(campaigns);
}

export function addRule(rule: Rule): void {
  rules.push(rule);
}

export function getRules(): Rule[] {
  return [...rules];
}

export function logAction(campaignId: string, action: string, condition?: string): ActionLog {
  const entry: ActionLog = { timestamp: Date.now(), campaignId, action, condition };
  actions.push(entry);
  return entry;
}

export function getActions(): ActionLog[] {
  return [...actions];
}

export function hasRuleFired(campaignId: string, ruleId: string): boolean {
  return firedRuleByCampaign.has(`${campaignId}:${ruleId}`);
}

export function markRuleFired(campaignId: string, ruleId: string): void {
  firedRuleByCampaign.add(`${campaignId}:${ruleId}`);
}

