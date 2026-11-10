import { useState } from 'react';
import { Segmented } from '@/components/ui/primitives';
import { WidgetFrame, monoBox } from './WidgetFrame';
import { cn } from '@/lib/utils';

type M = { AV: 'N' | 'A' | 'L' | 'P'; AC: 'L' | 'H'; PR: 'N' | 'L' | 'H'; UI: 'N' | 'R'; S: 'U' | 'C'; C: 'H' | 'L' | 'N'; I: 'H' | 'L' | 'N'; A: 'H' | 'L' | 'N' };

const W = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  UI: { N: 0.85, R: 0.62 },
  CIA: { H: 0.56, L: 0.22, N: 0 },
};

/** CVSS v3.1 "Roundup" as defined in the specification. */
function roundup(x: number): number {
  const i = Math.round(x * 100000);
  return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10;
}

export function cvss31(m: M): number {
  const pr = m.PR === 'N' ? 0.85 : m.PR === 'L' ? (m.S === 'C' ? 0.68 : 0.62) : m.S === 'C' ? 0.5 : 0.27;
  const iss = 1 - (1 - W.CIA[m.C]) * (1 - W.CIA[m.I]) * (1 - W.CIA[m.A]);
  const impact = m.S === 'U' ? 6.42 * iss : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  const expl = 8.22 * W.AV[m.AV] * W.AC[m.AC] * pr * W.UI[m.UI];
  if (impact <= 0) return 0;
  return m.S === 'U' ? roundup(Math.min(impact + expl, 10)) : roundup(Math.min(1.08 * (impact + expl), 10));
}

export function severity(s: number): { label: string; cls: string } {
  if (s === 0) return { label: 'None', cls: 'bg-surface-3 text-fg-2' };
  if (s < 4) return { label: 'Low', cls: 'bg-ok/15 text-ok' };
  if (s < 7) return { label: 'Medium', cls: 'bg-warn/15 text-warn' };
  if (s < 9) return { label: 'High', cls: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' };
  return { label: 'Critical', cls: 'bg-bad/15 text-bad' };
}

const FIELDS: { k: keyof M; label: string; opts: { value: string; label: string }[]; help: string }[] = [
  { k: 'AV', label: 'Attack vector', opts: [{ value: 'N', label: 'Network' }, { value: 'A', label: 'Adjacent' }, { value: 'L', label: 'Local' }, { value: 'P', label: 'Physical' }], help: 'How remote can the attacker be?' },
  { k: 'AC', label: 'Attack complexity', opts: [{ value: 'L', label: 'Low' }, { value: 'H', label: 'High' }], help: 'Are special conditions needed?' },
  { k: 'PR', label: 'Privileges required', opts: [{ value: 'N', label: 'None' }, { value: 'L', label: 'Low' }, { value: 'H', label: 'High' }], help: 'What access must the attacker already have?' },
  { k: 'UI', label: 'User interaction', opts: [{ value: 'N', label: 'None' }, { value: 'R', label: 'Required' }], help: 'Must a victim click or open something?' },
  { k: 'S', label: 'Scope', opts: [{ value: 'U', label: 'Unchanged' }, { value: 'C', label: 'Changed' }], help: 'Can it affect components beyond the vulnerable one?' },
  { k: 'C', label: 'Confidentiality', opts: [{ value: 'H', label: 'High' }, { value: 'L', label: 'Low' }, { value: 'N', label: 'None' }], help: 'Impact on data secrecy.' },
  { k: 'I', label: 'Integrity', opts: [{ value: 'H', label: 'High' }, { value: 'L', label: 'Low' }, { value: 'N', label: 'None' }], help: 'Impact on data trustworthiness.' },
  { k: 'A', label: 'Availability', opts: [{ value: 'H', label: 'High' }, { value: 'L', label: 'Low' }, { value: 'N', label: 'None' }], help: 'Impact on uptime.' },
];

/** Real CVSS v3.1 base score calculator. */
export default function CvssCalc() {
  const [m, setM] = useState<M>({ AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'H', I: 'H', A: 'H' });
  const score = cvss31(m);
  const sev = severity(score);
  const vector = `CVSS:3.1/AV:${m.AV}/AC:${m.AC}/PR:${m.PR}/UI:${m.UI}/S:${m.S}/C:${m.C}/I:${m.I}/A:${m.A}`;
  return (
    <WidgetFrame title="CVSS v3.1 base score calculator" badge="Real formula" note="Implements the published CVSS v3.1 base equations. CVSS v4.0 also exists; organizations combine the base score with environmental and threat context to prioritize.">
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.k}>
            <div className="mb-1 flex items-baseline justify-between gap-2"><span className="text-xs font-semibold text-fg">{f.label}</span><span className="text-[11px] text-muted">{f.help}</span></div>
            <Segmented label={f.label} size="sm" value={m[f.k]} onChange={(v) => setM((x) => ({ ...x, [f.k]: v }))} options={f.opts} />
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className={cn('rounded-2xl px-5 py-3 text-center', sev.cls)}>
          <div className="text-3xl font-bold tabular-nums">{score.toFixed(1)}</div>
          <div className="text-xs font-bold uppercase tracking-wide">{sev.label}</div>
        </div>
        <div className={cn(monoBox, 'min-w-0 flex-1')}>{vector}</div>
      </div>
      <p className="mt-3 text-sm text-fg-2">Severity bands: None 0.0 · Low 0.1–3.9 · Medium 4.0–6.9 · High 7.0–8.9 · Critical 9.0–10.0. Try making the attack require physical access or user interaction and watch the score drop.</p>
    </WidgetFrame>
  );
}
