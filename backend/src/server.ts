import express, { Request, Response } from 'express';
import cors from 'cors';
import { SAMPLE_CAMPAIGN_ID } from './config.js';
import { fetchCampaignData } from './apiClient.js';
import { evaluateRules, type Rule } from './rulesEngine.js';
import { addRule, getRules, logAction, getActions, setCampaigns, hasRuleFired, markRuleFired } from './store.js';

const app = express();
app.use(cors());

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Simple rules and actions API
app.get('/rules', (_req: Request, res: Response) => {
  res.json(getRules());
});

app.post('/rules', (req: Request, res: Response) => {
  const body = req.body as Partial<Rule>;
  if (!body || !body.condition || !body.action) {
    return res.status(400).json({ error: 'condition and action are required' });
  }
  // Basic safety validation: allow only expected identifiers, numbers, spaces, operators and parentheses
  const allowed = /^[\s()0-9.<>=!&|roaspdcn]+$/i; // rough check; refined below
  const normalized = String(body.condition)
    .replace(/spend|ctr|roas/gi, 'm')
    .replace(/[0-9.]/g, 'n')
    .replace(/[()\s]/g, ' ')
    .replace(/[+\-*/]/g, '')
    .trim();
  // Not exhaustive; aims to prevent obvious injections beyond metrics and boolean ops
  if (!/^[mn<>=!&|\s()]+$/.test(normalized)) {
    return res.status(400).json({ error: 'invalid condition syntax' });
  }
  const rule: Rule = {
    id: Math.random().toString(36).slice(2),
    description: body.description,
    condition: String(body.condition),
    action: String(body.action),
  };
  addRule(rule);
  res.status(201).json(rule);
  // Notify clients via Server-Sent Events if needed
  broadcast({ type: 'rule_added', rule });
});

app.get('/actions', (_req: Request, res: Response) => {
  res.json(getActions());
});

// --- Server-Sent Events (SSE) for real-time updates ---
type Client = { id: number; res: Response };
const clients: Client[] = [];
let clientIdSeq = 1;

app.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const client: Client = { id: clientIdSeq++, res };
  clients.push(client);

  res.write(`event: ping\n`);
  res.write(`data: connected\n\n`);

  req.on('close', () => {
    const idx = clients.findIndex((c) => c.id === client.id);
    if (idx >= 0) clients.splice(idx, 1);
  });
});

function broadcast(payload: unknown): void {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((c) => c.res.write(data));
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Periodic fetch-evaluate loop (every 10 seconds)
const INTERVAL_MS = 10_000;
let isPolling = false;

async function fetchAndEvaluateOnce() {
  if (isPolling) return;
  isPolling = true;
  try {
    const data = await fetchCampaignData(SAMPLE_CAMPAIGN_ID);
    setCampaigns([data]);
    const rules = getRules();
    const actions = evaluateRules(data, rules);
    actions.forEach((a) => {
      if (!hasRuleFired(data.campaign_id, a.ruleId)) {
        const entry = logAction(data.campaign_id, a.action, a.condition);
        markRuleFired(data.campaign_id, a.ruleId);
        broadcast({ type: 'action_logged', action: entry });
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Periodic fetch failed', err);
  } finally {
    isPolling = false;
  }
}

// Kick off immediately, then every INTERVAL_MS
fetchAndEvaluateOnce();
setInterval(fetchAndEvaluateOnce, INTERVAL_MS);

export default app;

