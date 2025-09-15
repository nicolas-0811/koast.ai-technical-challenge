import React, { useEffect, useState } from 'react';

type Rule = { id?: string; condition: string; action: string };
type ActionLog = { timestamp: number; campaignId: string; action: string; condition?: string };

export default function RulesList() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function displayCondition(cond: string): string {
    // Capitalize metrics
    let out = cond
      .replace(/\bspend\b/gi, 'Spend')
      .replace(/\bctr\b/gi, 'CTR')
      .replace(/\broas\b/gi, 'ROAS');

    // Add units: $ for Spend values, % for CTR/ROAS values
    // Heuristics: look for patterns like "Spend <num>" and add $; for CTR/ROAS <num>, add %
    out = out.replace(/(Spend\s*[<>=!]=?\s*)(\d+(?:\.\d+)?)/g, (_, p1, p2) => `${p1}$${p2}`);
    out = out.replace(/(CTR\s*[<>=!]=?\s*)(\d+(?:\.\d+)?)/g, (_, p1, p2) => `${p1}${p2}%`);
    out = out.replace(/(ROAS\s*[<>=!]=?\s*)(\d+(?:\.\d+)?)/g, (_, p1, p2) => `${p1}${p2}%`);

    return out;
  }

  function displayAction(action: string): string {
    return action ? action.charAt(0).toUpperCase() + action.slice(1) : action;
  }

  async function load() {
    setError(null);
    setIsLoading(true);
    try {
      const [rRes, aRes] = await Promise.all([
        fetch('http://localhost:4000/rules'),
        fetch('http://localhost:4000/actions'),
      ]);
      if (!rRes.ok) throw new Error(`/rules failed: ${rRes.status}`);
      if (!aRes.ok) throw new Error(`/actions failed: ${aRes.status}`);
      const r = (await rRes.json()) as Rule[];
      const a = (await aRes.json()) as ActionLog[];
      setRules(r);
      setActions(a);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Subscribe to Server-Sent Events for push updates
    const ev = new EventSource('http://localhost:4000/events');
    ev.onmessage = () => {
      load();
    };
    return () => ev.close();
  }, []);

  return (
    <div>
      <h2>Current Rules</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul className="list">
        {rules.map((r, idx) => (
          <li key={r.id ?? idx}>
          {displayCondition(r.condition)} {'->'} {displayAction(r.action)}
        </li>
        ))}
      </ul>
      <h2>Triggered Actions</h2>
      <ul className="list">
        {actions.map((a, idx) => (
          <li key={idx}>
            {new Date(a.timestamp).toLocaleString()} - Campaign {a.campaignId} - {displayAction(a.action)}
            {a.condition ? ` - Because -> ${displayCondition(a.condition)}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

