import { useState } from 'react';
import { Segmented } from '@/components/ui/primitives';
import { Field, WidgetFrame, inputCls, monoBox } from './WidgetFrame';
import { cn } from '@/lib/utils';

const USERS = [
  { id: 1, user: 'alice', role: 'customer' },
  { id: 2, user: 'bob', role: 'customer' },
  { id: 3, user: 'admin', role: 'administrator' },
];

const PRESETS = ['alice', "' OR '1'='1", "admin'--"];

/**
 * Simulated (no real database) login query showing how string concatenation lets input
 * change the query's logic, and how parameterized queries keep input as data.
 */
export default function SqliDemo() {
  const [name, setName] = useState("' OR '1'='1");
  const [mode, setMode] = useState<'concat' | 'param'>('concat');
  const concatQuery = `SELECT * FROM users WHERE username = '${name}' AND password = '••••';`;
  const injected = /'\s*or\s*'?1'?\s*=\s*'?1/i.test(name) || name.includes('--');
  const commentOut = name.includes('--');
  let rows: typeof USERS = [];
  let note: string;
  if (mode === 'param') {
    rows = USERS.filter((u) => u.user === name);
    note = rows.length
      ? 'Matched the literal username (password still required in reality).'
      : `The whole input — quotes and all — is treated as a username string. No user is literally named ${JSON.stringify(name)}, so nothing is returned.`;
  } else if (/'\s*or\s*'?1'?\s*=\s*'?1/i.test(name)) {
    rows = USERS;
    note = "The quote closed the string early, and OR '1'='1' is always true, so the WHERE clause matches every row — the attacker is logged in as the first user and can dump the table.";
  } else if (commentOut) {
    const u = name.split("'")[0];
    rows = USERS.filter((x) => x.user === u);
    note = `The -- starts a SQL comment, so the password check is ignored entirely — logged in as ${u || 'nobody'} without a password.`;
  } else {
    rows = USERS.filter((u) => u.user === name);
    note = injected ? 'Input altered the query.' : 'Normal input: the query behaves as intended.';
  }
  return (
    <WidgetFrame title="SQL injection: concatenation vs parameterized queries" badge="Simulation" note="Simulated query engine for learning — nothing is sent to a real database. Defences: parameterized queries/prepared statements, input validation, least-privilege DB accounts, WAF as an extra layer.">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Field label="Username field" className="min-w-0 flex-1">
          <input className={cn(inputCls, 'font-mono')} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Segmented label="Query style" value={mode} onChange={setMode} options={[{ value: 'concat', label: 'String concatenation' }, { value: 'param', label: 'Parameterized' }]} />
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => <button key={p} type="button" onClick={() => setName(p)} className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-xs text-fg hover:border-accent">{p}</button>)}
      </div>
      {mode === 'concat' ? (
        <div className={monoBox}>
          <div className="mb-1 font-sans text-[10px] font-semibold uppercase text-muted">Query the database actually receives</div>
          SELECT * FROM users WHERE username = &apos;<span className={cn(injected && 'rounded bg-bad/25 text-bad')}>{name}</span>&apos; AND password = &apos;••••&apos;;
          <div className="mt-1 font-sans text-[11px] text-muted">{concatQuery.length} characters built by gluing user input into code.</div>
        </div>
      ) : (
        <div className={monoBox}>
          <div className="mb-1 font-sans text-[10px] font-semibold uppercase text-muted">Prepared statement + bound parameter</div>
          SELECT * FROM users WHERE username = <span className="rounded bg-ok/20 text-ok">?</span> AND password = <span className="rounded bg-ok/20 text-ok">?</span>;
          <div className="mt-1">param[1] = <span className="text-ok">{JSON.stringify(name)}</span> <span className="font-sans text-[11px] text-muted">(sent separately, always data, never code)</span></div>
        </div>
      )}
      <div className="mt-3 overflow-x-auto rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead><tr className="bg-surface-2/60 text-left text-xs text-muted"><th className="px-3 py-1.5">id</th><th className="px-3 py-1.5">username</th><th className="px-3 py-1.5">role</th></tr></thead>
          <tbody>
            {rows.map((r) => <tr key={r.id} className="border-t border-line"><td className="px-3 py-1.5 font-mono">{r.id}</td><td className="px-3 py-1.5 font-mono">{r.user}</td><td className={cn('px-3 py-1.5', r.role === 'administrator' && 'font-semibold text-bad')}>{r.role}</td></tr>)}
            {rows.length === 0 && <tr><td colSpan={3} className="px-3 py-3 text-center text-muted">0 rows — login fails</td></tr>}
          </tbody>
        </table>
      </div>
      <p className={cn('mt-3 rounded-lg px-3 py-2 text-sm', mode === 'concat' && injected ? 'bg-bad/10' : 'bg-ok/10')}>{note}</p>
    </WidgetFrame>
  );
}
