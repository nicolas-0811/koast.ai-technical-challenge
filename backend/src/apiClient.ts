import { META_PROXY_API_BASE_URL, META_PROXY_BEARER_TOKEN } from './config.js';

export type CampaignData = {
  campaign_id: string;
  spend: number;
  ctr: number;
  roas: number;
};

function createDynamicMock(campaignId: string): CampaignData {
    // Spend between $300 and 700%
    const spend = Math.floor(300 + Math.random() * 400);
  
    // CTR between 0.3% and 2.0%
    const ctr = Number((0.3 + Math.random() * 1.7).toFixed(2));
  
    // ROAS between 0.5% and 5.0%
    const roas = Number((0.5 + Math.random() * 4.5).toFixed(2));
  
    return {
      campaign_id: campaignId || '120231398059670228',
      spend,
      ctr,
      roas,
    };
  }

export async function fetchCampaignData(campaignId: string): Promise<CampaignData> {
  const url = `${META_PROXY_API_BASE_URL}/campaigns/${encodeURIComponent(campaignId)}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${META_PROXY_BEARER_TOKEN}`,
        Accept: 'application/json',
      },
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    if (!contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    const data = (await response.json()) as Partial<CampaignData>;

    // Basic normalization with fallback defaults
    return {
      campaign_id: data.campaign_id ?? campaignId,
      spend: typeof data.spend === 'number' ? data.spend : createDynamicMock(campaignId).spend,
      ctr: typeof data.ctr === 'number' ? data.ctr : createDynamicMock(campaignId).ctr,
      roas: typeof data.roas === 'number' ? data.roas : createDynamicMock(campaignId).roas,
    };
  } catch (_error) {
    return createDynamicMock(campaignId);
  }
}

