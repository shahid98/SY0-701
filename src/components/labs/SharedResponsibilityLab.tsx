import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import { Button, Callout } from '@/components/ui/primitives';
import { LabStep, ResultBanner } from './kit';
import { cn } from '@/lib/utils';

type Owner = 'C' | 'S' | 'P';
const MODELS = ['On-premises', 'IaaS', 'PaaS', 'SaaS'];
// Typical split, following the published matrices of major cloud providers.
const ROWS: { layer: string; answer: Owner[]; note: string }[] = [
  { layer: 'Information & data', answer: ['C', 'C', 'C', 'C'], note: 'Always the customer: you decide what data goes in, how it is classified and who may see it.' },
  { layer: 'Devices (endpoints)', answer: ['C', 'C', 'C', 'C'], note: 'The laptops and phones used to reach the service are always yours to secure.' },
  { layer: 'Accounts & identities', answer: ['C', 'C', 'C', 'C'], note: 'Even in SaaS you create users, assign roles and enforce MFA.' },
  { layer: 'Identity & directory infrastructure', answer: ['C', 'C', 'S', 'S'], note: 'In PaaS/SaaS the provider runs the identity platform; you configure it.' },
  { layer: 'Applications', answer: ['C', 'C', 'S', 'P'], note: 'PaaS: you write the app on the provider’s platform (shared). SaaS: the provider owns the application.' },
  { layer: 'Network controls', answer: ['C', 'C', 'S', 'P'], note: 'IaaS: you configure security groups/firewalls. PaaS: shared. SaaS: provider.' },
  { layer: 'Operating system', answer: ['C', 'C', 'P', 'P'], note: 'IaaS: you patch the guest OS. From PaaS upward the provider manages it.' },
  { layer: 'Physical hosts', answer: ['C', 'P', 'P', 'P'], note: 'In every cloud model the provider owns the hardware.' },
  { layer: 'Physical network', answer: ['C', 'P', 'P', 'P'], note: 'Cabling, switches and routers in the data center are the provider’s.' },
  { layer: 'Physical data center', answer: ['C', 'P', 'P', 'P'], note: 'Buildings, power, cooling and guards belong to the provider.' },
];
const LABEL: Record<Owner, string> = { C: 'Customer', S: 'Shared', P: 'Provider' };
const CLS: Record<Owner, string> = { C: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40', S: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40', P: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40' };
const CYCLE: (Owner | undefined)[] = [undefined, 'C', 'S', 'P'];

export default function SharedResponsibilityLab({ onComplete }: LabProps) {
  const [grid, setGrid] = useState<(Owner | undefined)[][]>(ROWS.map((r) => r.answer.map((a, j) => (j === 0 ? a : undefined))));
  const [checked, setChecked] = useState(false);
  const cell = (i: number, j: number) => {
    if (checked || j === 0) return;
    setGrid((g) => g.map((row, ri) => (ri !== i ? row : row.map((v, cj) => (cj !== j ? v : CYCLE[(CYCLE.indexOf(v) + 1) % CYCLE.length])))));
  };
  const filled = grid.every((r) => r.every(Boolean));
  const total = ROWS.length * 3;
  const correct = ROWS.reduce((s, r, i) => s + r.answer.filter((a, j) => j > 0 && grid[i][j] === a).length, 0);
  return (
    <div className="space-y-5">
      <LabStep n={1} title="Who is responsible for each layer?" sub="Tap a cell to cycle Customer → Shared → Provider. The on-premises column is filled in for you: there, it’s all you.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="w-52 text-left text-xs font-semibold uppercase tracking-wide text-muted">Layer</th>
                {MODELS.map((m) => <th key={m} className="text-center text-xs font-semibold uppercase tracking-wide text-muted">{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={r.layer}>
                  <th scope="row" className="pr-2 text-left text-[13px] font-medium text-fg">{r.layer}</th>
                  {r.answer.map((a, j) => {
                    const v = grid[i][j];
                    const wrong = checked && j > 0 && v !== a;
                    return (
                      <td key={j}>
                        <button
                          type="button"
                          onClick={() => cell(i, j)}
                          disabled={checked || j === 0}
                          aria-label={`${r.layer}, ${MODELS[j]}: ${v ? LABEL[v] : 'not set'}`}
                          className={cn('h-10 w-full rounded-lg border text-xs font-semibold transition-colors', v ? CLS[v] : 'border-dashed border-line-strong text-muted hover:bg-surface-2', wrong && 'ring-2 ring-bad', j === 0 && 'opacity-80')}
                        >
                          {v ? LABEL[v] : 'Tap'}
                          {wrong && <span className="block text-[10px] font-medium text-bad">→ {LABEL[a]}</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!checked ? (
            <Button variant="primary" disabled={!filled} onClick={() => { setChecked(true); onComplete(Math.round((correct / total) * 100)); }}><Check className="h-4 w-4" /> Check matrix</Button>
          ) : (
            <Button onClick={() => { setChecked(false); setGrid(ROWS.map((r) => r.answer.map((a, j) => (j === 0 ? a : undefined)))); }}><RotateCcw className="h-4 w-4" /> Reset</Button>
          )}
          {!filled && !checked && <span className="text-xs text-muted">Fill every cloud cell to check.</span>}
        </div>
        {checked && (
          <div className="mt-4 space-y-3">
            <ResultBanner score={correct} total={total} />
            <ul className="space-y-1.5 text-sm text-fg-2">{ROWS.map((r) => <li key={r.layer}><strong className="text-fg">{r.layer}:</strong> {r.note}</li>)}</ul>
          </div>
        )}
      </LabStep>
      <Callout kind="exam" title="Exam rule of thumb">The customer is <strong>always</strong> responsible for its data, identities/access and endpoints. The further you move from IaaS toward SaaS, the more of the stack the provider runs — but misconfigurations of what you control (e.g. a public storage bucket) remain your fault.</Callout>
    </div>
  );
}
