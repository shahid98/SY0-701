import { useState } from 'react';
import { ArrowDown, ArrowUp, CircleCheck, CircleX, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import { evaluate, packetLabel, ruleError, type FwRule, type Packet, type Proto } from '@/lib/firewall';
import { Badge, Button, Callout, Card } from '@/components/ui/primitives';
import { LabStep } from './kit';
import { cn } from '@/lib/utils';

export interface Task {
  title: string;
  brief: string[];
  start: Omit<FwRule, 'id'>[];
  tests: { p: Packet; expect: 'allow' | 'deny'; why: string }[];
}

const TASKS: Task[] = [
  {
    title: 'Publish a web server safely',
    brief: ['Allow HTTPS (TCP 443) from anywhere to the web server 10.0.1.10.', 'Allow SSH (TCP 22) to 10.0.1.10 only from the admin subnet 10.0.9.0/24.', 'Everything else must be denied.'],
    start: [],
    tests: [
      { p: { proto: 'tcp', src: '203.0.113.5', dst: '10.0.1.10', port: 443 }, expect: 'allow', why: 'Public HTTPS to the web server.' },
      { p: { proto: 'tcp', src: '10.0.9.25', dst: '10.0.1.10', port: 22 }, expect: 'allow', why: 'Admin subnet SSH.' },
      { p: { proto: 'tcp', src: '198.51.100.7', dst: '10.0.1.10', port: 22 }, expect: 'deny', why: 'SSH from the Internet must be blocked.' },
      { p: { proto: 'tcp', src: '203.0.113.5', dst: '10.0.1.10', port: 80 }, expect: 'deny', why: 'Plain HTTP was not requested.' },
      { p: { proto: 'tcp', src: '203.0.113.5', dst: '10.0.1.20', port: 443 }, expect: 'deny', why: 'Only 10.0.1.10 is published.' },
      { p: { proto: 'udp', src: '203.0.113.5', dst: '10.0.1.10', port: 443 }, expect: 'deny', why: 'UDP was not requested.' },
    ],
  },
  {
    title: 'Fix the shadowed rule',
    brief: ['Admins in 10.0.9.0/24 must be able to SSH to 10.0.1.10, but SSH from everywhere else stays blocked.', 'HTTPS to the web server must keep working.', 'The current rules are in the wrong order — fix them without adding new rules.'],
    start: [
      { action: 'deny', proto: 'tcp', src: 'any', dst: 'any', port: '22' },
      { action: 'allow', proto: 'tcp', src: '10.0.9.0/24', dst: '10.0.1.10', port: '22' },
      { action: 'allow', proto: 'tcp', src: 'any', dst: '10.0.1.10', port: '443' },
    ],
    tests: [
      { p: { proto: 'tcp', src: '10.0.9.5', dst: '10.0.1.10', port: 22 }, expect: 'allow', why: 'Admin SSH.' },
      { p: { proto: 'tcp', src: '10.0.5.5', dst: '10.0.1.10', port: 22 }, expect: 'deny', why: 'Non-admin SSH.' },
      { p: { proto: 'tcp', src: '203.0.113.9', dst: '10.0.1.10', port: 443 }, expect: 'allow', why: 'Public HTTPS.' },
    ],
  },
  {
    title: 'Internal DNS, outbound web, no Telnet',
    brief: ['Allow DNS (UDP 53) to the DNS server 10.0.1.53 only from internal clients 10.0.0.0/16.', 'Allow internal clients (10.0.0.0/16) outbound HTTPS (TCP 443) to anywhere.', 'Telnet (TCP 23) must be blocked everywhere; nothing from the Internet may reach internal clients.'],
    start: [],
    tests: [
      { p: { proto: 'udp', src: '10.0.4.20', dst: '10.0.1.53', port: 53 }, expect: 'allow', why: 'Internal DNS query.' },
      { p: { proto: 'udp', src: '203.0.113.50', dst: '10.0.1.53', port: 53 }, expect: 'deny', why: 'External DNS to the internal resolver.' },
      { p: { proto: 'tcp', src: '10.0.4.20', dst: '198.51.100.80', port: 443 }, expect: 'allow', why: 'Outbound HTTPS.' },
      { p: { proto: 'tcp', src: '10.0.4.20', dst: '198.51.100.80', port: 23 }, expect: 'deny', why: 'Outbound Telnet.' },
      { p: { proto: 'tcp', src: '10.0.4.20', dst: '10.0.1.53', port: 23 }, expect: 'deny', why: 'Internal Telnet.' },
      { p: { proto: 'tcp', src: '203.0.113.50', dst: '10.0.4.20', port: 443 }, expect: 'deny', why: 'Inbound from the Internet to a client.' },
    ],
  },
];

let uid = 0;
const withId = (r: Omit<FwRule, 'id'>): FwRule => ({ ...r, id: `r${++uid}` });
const inputCls = 'h-8 w-full rounded-md border border-line bg-surface px-2 font-mono text-xs text-fg focus:border-accent focus:outline-none';

/** Rule-table editor + test-packet grader for one firewall task (shared by the lab and the PBQ simulator). */
export function FirewallTaskEditor({ task, step, onResult, orderOnly }: { task: Task; step?: number; onResult: (passed: boolean[]) => void; orderOnly?: boolean }) {
  const [rs, setRs] = useState<FwRule[]>(() => task.start.map(withId));
  const [res, setRes] = useState<boolean[] | null>(null);
  const [traceFor, setTraceFor] = useState<number | null>(null);
  const [custom, setCustom] = useState<Packet>({ proto: 'tcp', src: '203.0.113.5', dst: '10.0.1.10', port: 443 });
  const errors = rs.map(ruleError);

  const update = (i: number, patch: Partial<FwRule>) => setRs((list) => list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: -1 | 1) => setRs((list) => {
    const n = list.slice();
    const j = i + d;
    if (j < 0 || j >= n.length) return list;
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const remove = (i: number) => setRs((list) => list.filter((_, j) => j !== i));
  const add = () => setRs((list) => [...list, withId({ action: 'allow', proto: 'tcp', src: 'any', dst: 'any', port: 'any' })]);
  const resetTask = () => { setRs(task.start.map(withId)); setRes(null); setTraceFor(null); };

  const run = () => {
    const out = task.tests.map((t) => evaluate(rs, t.p).action === t.expect);
    setRes(out);
    setTraceFor(null);
    onResult(out);
  };

  const customRes = evaluate(rs, custom);

  return (
    <div className="space-y-5">
      <LabStep n={step ?? 1} title={task.title} sub={<ul className="mt-1 list-disc space-y-0.5 pl-4">{task.brief.map((b) => <li key={b}>{b}</li>)}</ul>} done={!!res?.every(Boolean)}>
        <Callout kind="note" className="mb-4" title="How this firewall decides">Rules are checked <strong>top to bottom</strong>; the <strong>first match wins</strong>. If nothing matches, the packet hits the <strong>implicit deny</strong>. Put specific rules above general ones.</Callout>
        {/* Phones: one card per rule so every field is visible without sideways scrolling. */}
        <ol className="space-y-2 sm:hidden" aria-label="Firewall rules">
          {rs.map((r, i) => (
            <li key={r.id} className={cn('rounded-xl border border-line p-3', traceFor !== null && evaluate(rs, task.tests[traceFor].p).index === i && 'border-accent bg-accent/10')}>
              <div className="mb-2 flex items-center gap-1">
                <span className="font-mono text-xs font-semibold text-muted">Rule {i + 1}</span>
                <div className="ml-auto flex gap-1">
                  <Button size="icon" variant="ghost" className="h-10 w-10" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move rule ${i + 1} up`}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-10 w-10" onClick={() => move(i, 1)} disabled={i === rs.length - 1} aria-label={`Move rule ${i + 1} down`}><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-10 w-10 text-bad" onClick={() => remove(i)} aria-label={`Delete rule ${i + 1}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <label className="flex min-w-0 flex-col gap-1">Action
                  <select value={r.action} onChange={(e) => update(i, { action: e.target.value as FwRule['action'] })} className={cn(inputCls, 'h-10', r.action === 'allow' ? 'text-ok' : 'text-bad')}>
                    <option value="allow">ALLOW</option><option value="deny">DENY</option>
                  </select>
                </label>
                <label className="flex min-w-0 flex-col gap-1">Protocol
                  <select value={r.proto} onChange={(e) => update(i, { proto: e.target.value as Proto })} className={cn(inputCls, 'h-10')}>
                    {['tcp', 'udp', 'icmp', 'any'].map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                  </select>
                </label>
                <label className="col-span-2 flex min-w-0 flex-col gap-1">Source
                  <input value={r.src} onChange={(e) => update(i, { src: e.target.value })} className={cn(inputCls, 'h-10')} />
                </label>
                <label className="col-span-2 flex min-w-0 flex-col gap-1">Destination
                  <input value={r.dst} onChange={(e) => update(i, { dst: e.target.value })} className={cn(inputCls, 'h-10')} />
                </label>
                <label className="col-span-2 flex min-w-0 flex-col gap-1">Port(s)
                  <input value={r.port} onChange={(e) => update(i, { port: e.target.value })} className={cn(inputCls, 'h-10')} disabled={r.proto === 'icmp'} />
                </label>
              </div>
            </li>
          ))}
          <li className="rounded-xl border border-dashed border-line px-3 py-2 text-xs italic text-muted">∞ Implicit deny — any packet that matched no rule above is dropped</li>
        </ol>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className="w-8 py-1">#</th><th className="w-24">Action</th><th className="w-24">Protocol</th><th>Source</th><th>Destination</th><th className="w-28">Port(s)</th><th className="w-28" />
              </tr>
            </thead>
            <tbody>
              {rs.map((r, i) => (
                <tr key={r.id} className={cn('border-t border-line', traceFor !== null && evaluate(rs, task.tests[traceFor].p).index === i && 'bg-accent/10')}>
                  <td className="py-1.5 font-mono text-xs text-muted">{i + 1}</td>
                  <td className="pr-1.5">
                    <select value={r.action} onChange={(e) => update(i, { action: e.target.value as FwRule['action'] })} className={cn(inputCls, r.action === 'allow' ? 'text-ok' : 'text-bad')} aria-label={`Rule ${i + 1} action`}>
                      <option value="allow">ALLOW</option><option value="deny">DENY</option>
                    </select>
                  </td>
                  <td className="pr-1.5">
                    <select value={r.proto} onChange={(e) => update(i, { proto: e.target.value as Proto })} className={inputCls} aria-label={`Rule ${i + 1} protocol`}>
                      {['tcp', 'udp', 'icmp', 'any'].map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td className="pr-1.5"><input value={r.src} onChange={(e) => update(i, { src: e.target.value })} className={inputCls} aria-label={`Rule ${i + 1} source`} /></td>
                  <td className="pr-1.5"><input value={r.dst} onChange={(e) => update(i, { dst: e.target.value })} className={inputCls} aria-label={`Rule ${i + 1} destination`} /></td>
                  <td className="pr-1.5"><input value={r.port} onChange={(e) => update(i, { port: e.target.value })} className={inputCls} disabled={r.proto === 'icmp'} aria-label={`Rule ${i + 1} ports`} /></td>
                  <td>
                    <div className="flex gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10" onClick={() => move(i, 1)} disabled={i === rs.length - 1} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10 text-bad" onClick={() => remove(i)} aria-label="Delete rule"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-line text-muted">
                <td className="py-1.5 font-mono text-xs">∞</td>
                <td colSpan={6} className="text-xs italic">Implicit deny — any packet that matched no rule above is dropped</td>
              </tr>
            </tbody>
          </table>
        </div>
        {errors.some(Boolean) && <p className="mt-2 text-sm text-bad">{errors.map((e, i) => e && `Rule ${i + 1}: ${e}`).filter(Boolean).join(' · ')}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={add} disabled={orderOnly}><Plus className="h-4 w-4" /> Add rule</Button>
          <Button variant="primary" onClick={run} disabled={errors.some(Boolean)}><Play className="h-4 w-4" /> Run test packets</Button>
          <Button variant="ghost" onClick={resetTask}><RotateCcw className="h-4 w-4" /> Reset task</Button>
          {orderOnly && <span className="self-center text-xs text-muted">This task is about order only — use the arrows.</span>}
        </div>
      </LabStep>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-fg">Test packets {res && <Badge tone={res.every(Boolean) ? 'ok' : 'bad'} className="ml-2">{res.filter(Boolean).length}/{res.length} as required</Badge>}</h3>
          <ul className="space-y-1.5">
            {task.tests.map((t, i) => {
              const r = evaluate(rs, t.p);
              const ok = res ? res[i] : null;
              return (
                <li key={i}>
                  <button type="button" onClick={() => setTraceFor(traceFor === i ? null : i)} className={cn('flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-sm', traceFor === i ? 'border-accent bg-accent/5' : 'border-line hover:bg-surface-2')}>
                    {ok === null ? <span className="mt-0.5 h-4 w-4 rounded-full border border-line-strong" /> : ok ? <CircleCheck className="mt-0.5 h-4 w-4 text-ok" /> : <CircleX className="mt-0.5 h-4 w-4 text-bad" />}
                    <span className="flex-1">
                      <span className="font-mono text-xs text-fg">{packetLabel(t.p)}</span>
                      <span className="block text-xs text-muted">Required: {t.expect.toUpperCase()} — {t.why}{res && <> · Got: <strong className={r.action === 'allow' ? 'text-ok' : 'text-bad'}>{r.action.toUpperCase()}</strong> ({r.index < 0 ? 'implicit deny' : `rule ${r.index + 1}`})</>}</span>
                    </span>
                  </button>
                  {traceFor === i && (
                    <ol className="ml-6 mt-1 space-y-0.5 border-l border-line pl-3 text-xs">
                      {r.trace.map((s) => (
                        <li key={s.index} className={s.matched ? 'font-semibold text-fg' : 'text-muted'}>{s.index < 0 ? 'End of list' : `Rule ${s.index + 1}`}: {s.reason}</li>
                      ))}
                    </ol>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-fg">Try your own packet</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select value={custom.proto} onChange={(e) => setCustom({ ...custom, proto: e.target.value as Packet['proto'] })} className={inputCls} aria-label="Packet protocol">
              {['tcp', 'udp', 'icmp'].map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
            <input value={custom.src} onChange={(e) => setCustom({ ...custom, src: e.target.value })} className={inputCls} aria-label="Packet source" />
            <input value={custom.dst} onChange={(e) => setCustom({ ...custom, dst: e.target.value })} className={inputCls} aria-label="Packet destination" />
            <input type="number" value={custom.port} onChange={(e) => setCustom({ ...custom, port: Number(e.target.value) })} className={inputCls} aria-label="Packet port" />
          </div>
          <div className={cn('mt-3 rounded-lg px-3 py-2 text-sm font-semibold', customRes.action === 'allow' ? 'bg-ok/10 text-ok' : 'bg-bad/10 text-bad')}>
            {customRes.action.toUpperCase()} — {customRes.index < 0 ? 'implicit deny' : `matched rule ${customRes.index + 1}`}
          </div>
          <ol className="mt-2 space-y-0.5 text-xs">
            {customRes.trace.map((s) => <li key={s.index} className={s.matched ? 'font-semibold text-fg' : 'text-muted'}>{s.index < 0 ? 'End of list' : `Rule ${s.index + 1}`}: {s.reason}</li>)}
          </ol>
          <p className="mt-3 text-xs text-muted">Address formats: <code>any</code>, <code>10.0.1.10</code>, <code>10.0.0.0/16</code>. Ports: <code>any</code>, <code>443</code>, <code>80,443</code>, <code>1024-65535</code>.</p>
        </Card>
      </div>
    </div>
  );
}

export default function FirewallLab({ onComplete }: LabProps) {
  const [ti, setTi] = useState(0);
  const [results, setResults] = useState<(boolean[] | null)[]>(TASKS.map(() => null));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {TASKS.map((t, i) => (
          <Button key={t.title} size="sm" variant={i === ti ? 'primary' : 'secondary'} onClick={() => setTi(i)}>
            {results[i]?.every(Boolean) && <CircleCheck className="h-4 w-4" />} Task {i + 1}: {t.title}
          </Button>
        ))}
      </div>
      <FirewallTaskEditor
        key={ti}
        task={TASKS[ti]}
        step={ti + 1}
        orderOnly={ti === 1}
        onResult={(out) => {
          const next = results.map((r, k) => (k === ti ? out : r));
          setResults(next);
          if (next.every((r) => r && r.every(Boolean))) onComplete(100);
        }}
      />
    </div>
  );
}
