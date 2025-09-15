import React, { useState } from 'react';

type Metric = 'spend' | 'ctr' | 'roas';
type Operator = '>' | '<' | '=';
type Action = 'pause' | 'log' | 'adjust';

type ConditionRow = { metric: Metric; operator: Operator; threshold: string };

export default function RuleForm() {
  const [rows, setRows] = useState<ConditionRow[]>([
    { metric: 'spend', operator: '>', threshold: '500' },
  ]);
  const [joiner, setJoiner] = useState<'AND' | 'OR'>('AND');
  const [action, setAction] = useState<Action>('pause');
  const [message, setMessage] = useState<string | null>(null);

  function updateRow(index: number, next: Partial<ConditionRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...next } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { metric: 'ctr', operator: '<', threshold: '1' }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function buildCondition(): string {
    const exprs = rows.map((r) => {
      const op = r.operator === '=' ? '===' : r.operator;
      return `(${r.metric} ${op} ${Number(r.threshold)})`;
    });
    const glue = joiner === 'AND' ? ' && ' : ' || ';
    return exprs.join(glue);
  }

  function displayBuildCondition(): string {
    const label = (m: Metric) => (m === 'spend' ? 'Spend' : m === 'ctr' ? 'CTR' : 'ROAS');
    const exprs = rows.map((r) => {
      const op = r.operator === '=' ? '===' : r.operator;
      const val = r.metric === 'spend' ? `$${Number(r.threshold)}` : `${Number(r.threshold)}%`;
      return `(${label(r.metric)} ${op} ${val})`;
    });
    const glue = joiner === 'AND' ? ' && ' : ' || ';
    return exprs.join(glue);
  }

  function displayAction(): string {
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const condition = buildCondition();

    try {
      const res = await fetch('http://localhost:4000/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition, action }),
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      setMessage('Rule added successfully.');
    } catch (err: any) {
      setMessage(`Error adding rule: ${err.message || 'unknown error'}`);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Rule</h2>
      <div>
        <label>
          Combine with:
          <select value={joiner} onChange={(e) => setJoiner(e.target.value as 'AND' | 'OR')}>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </label>
      </div>

      {rows.map((row, idx) => (
        <div key={idx} className="form-row">
          <label>
            Metric:
            <select value={row.metric} onChange={(e) => updateRow(idx, { metric: e.target.value as Metric })}>
              <option value="spend">Spend</option>
              <option value="ctr">CTR</option>
              <option value="roas">ROAS</option>
            </select>
          </label>
          <label>
            Operator:
            <select value={row.operator} onChange={(e) => updateRow(idx, { operator: e.target.value as Operator })}>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value="=">=</option>
            </select>
          </label>
          <label>
            Threshold:
            <input
              type="number"
              value={row.threshold}
              onChange={(e) => updateRow(idx, { threshold: e.target.value })}
            />
          </label>
          {rows.length > 1 && (
            <button type="button" onClick={() => removeRow(idx)}>Remove</button>
          )}
        </div>
      ))}

      <div>
        <button type="button" className="secondary" onClick={addRow}>Add Condition</button>
      </div>

      <div>
        <label>
          Action:
          <select value={action} onChange={(e) => setAction(e.target.value as Action)}>
            <option value="pause">Pause</option>
            <option value="log">Log</option>
            <option value="adjust">Adjust</option>
          </select>
        </label>
      </div>

      <div className="preview">
        <strong>Preview:</strong> {displayBuildCondition()} → {displayAction()}
      </div>

      <button type="submit">Add Rule</button>
      {message && <p>{message}</p>}
    </form>
  );
}

