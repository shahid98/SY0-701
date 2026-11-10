import { Suspense, useState } from 'react';
import { Check, CircleCheck, CircleX } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import { WIDGETS } from '@/components/viz/widgets';
import { Button } from '@/components/ui/primitives';
import { ClassifyTable, LabStep, ResultBanner, type ClassifyItem } from './kit';
import { cn } from '@/lib/utils';

const NUMERIC = [
  { q: 'A customer database is valued at $200,000. A breach would expose 25% of its value. What is the SLE?', unit: '$', answer: 50000, tol: 1, how: 'SLE = AV × EF = $200,000 × 0.25 = $50,000.' },
  { q: 'That breach is expected once every five years. What is the ALE?', unit: '$', answer: 10000, tol: 1, how: 'ARO = 1/5 = 0.2, so ALE = SLE × ARO = $50,000 × 0.2 = $10,000.' },
  { q: 'Laptops worth $1,500 are lost about 8 times a year, each a total loss. What is the ALE?', unit: '$', answer: 12000, tol: 1, how: 'SLE = $1,500 × 100% = $1,500; ALE = $1,500 × 8 = $12,000.' },
  { q: 'A control costing $9,000/year would cut that laptop ARO from 8 to 2. What is the net annual value of the control?', unit: '$', answer: 0, tol: 1, how: 'New ALE = $1,500 × 2 = $3,000. Value = $12,000 − $3,000 − $9,000 = $0 — break-even, so other factors (data sensitivity, regulation) decide.' },
  { q: 'A server has an MTBF of 1,000 hours and an MTTR of 10 hours. What is its availability (%, two decimals)?', unit: '%', answer: 99.01, tol: 0.011, how: '1000 / (1000 + 10) = 0.9901 → 99.01%.' },
];

const STRATEGIES = ['Avoid', 'Mitigate', 'Transfer', 'Accept'];
const STRAT: ClassifyItem[] = [
  { prompt: 'The company buys cyber-insurance to cover ransomware recovery costs.', fields: [{ label: 'Strategy', options: STRATEGIES, answer: 2 }], explain: 'Transference shifts the financial impact to a third party (insurer). The risk itself still exists.' },
  { prompt: 'A risky new feature that would store card numbers is cancelled.', fields: [{ label: 'Strategy', options: STRATEGIES, answer: 0 }], explain: 'Avoidance removes the activity that creates the risk.' },
  { prompt: 'MFA is deployed to reduce the chance of account takeover.', fields: [{ label: 'Strategy', options: STRATEGIES, answer: 1 }], explain: 'Mitigation applies controls to reduce likelihood or impact.' },
  { prompt: 'A low-impact risk costs more to fix than it could ever lose; management signs off on it.', fields: [{ label: 'Strategy', options: STRATEGIES, answer: 3 }], explain: 'Acceptance: the risk is within appetite and formally acknowledged by the risk owner.' },
  { prompt: 'A legacy system can’t meet the encryption standard for 6 months; leadership formally approves an exception with compensating controls.', fields: [{ label: 'Strategy', options: STRATEGIES, answer: 3 }], explain: 'An exception is a form of risk acceptance — a documented, time-bound deviation from policy.' },
];

const BIA: ClassifyItem[] = [
  { prompt: 'The maximum amount of data, measured in time, the business can afford to lose.', fields: [{ label: 'Metric', options: ['RTO', 'RPO', 'MTTR', 'MTBF'], answer: 1 }], explain: 'Recovery point objective — drives backup frequency.' },
  { prompt: 'The target time to get a service working again after a disruption.', fields: [{ label: 'Metric', options: ['RTO', 'RPO', 'MTTR', 'MTBF'], answer: 0 }], explain: 'Recovery time objective — drives the recovery strategy (site type, failover).' },
  { prompt: 'The average time a component runs before it fails.', fields: [{ label: 'Metric', options: ['RTO', 'RPO', 'MTTR', 'MTBF'], answer: 3 }], explain: 'Mean time between failures — a reliability measure; higher is better.' },
  { prompt: 'The average time it takes to fix a failed component.', fields: [{ label: 'Metric', options: ['RTO', 'RPO', 'MTTR', 'MTBF'], answer: 2 }], explain: 'Mean time to repair — lower is better.' },
];

function W({ id }: { id: string }) {
  const C = WIDGETS[id];
  return <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-surface-2" />}><C /></Suspense>;
}

export default function RiskLab({ onComplete }: LabProps) {
  const [vals, setVals] = useState<string[]>(NUMERIC.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [scores, setScores] = useState<{ n?: [number, number]; s?: [number, number]; b?: [number, number] }>({});
  const ok = NUMERIC.map((n, i) => vals[i].trim() !== '' && Math.abs(Number(vals[i].replace(/[$,%\s]/g, '')) - n.answer) <= n.tol);
  const done = (k: 'n' | 's' | 'b', v: [number, number]) => {
    const nx = { ...scores, [k]: v };
    setScores(nx);
    if (nx.n && nx.s && nx.b) onComplete(Math.round(((nx.n[0] + nx.s[0] + nx.b[0]) / (nx.n[1] + nx.s[1] + nx.b[1])) * 100));
  };
  return (
    <div className="space-y-5">
      <LabStep n={1} title="Explore the formulas" sub="SLE = AV × EF · ALE = SLE × ARO · a control is worth it when it removes more annual loss than it costs.">
        <W id="risk-calc" />
      </LabStep>
      <LabStep n={2} title="Calculation challenges" sub="Type your answers (numbers only)." done={checked && ok.every(Boolean)}>
        <ol className="space-y-3">
          {NUMERIC.map((n, i) => (
            <li key={n.q} className={cn('rounded-xl border p-3', !checked ? 'border-line' : ok[i] ? 'border-ok/40 bg-ok/5' : 'border-bad/40 bg-bad/5')}>
              <p className="text-sm text-fg">{i + 1}. {n.q}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-muted">{n.unit}</span>
                <input inputMode="decimal" value={vals[i]} disabled={checked} onChange={(e) => setVals((v) => v.map((x, k) => (k === i ? e.target.value : x)))} className="h-9 w-40 rounded-lg border border-line bg-surface px-2.5 font-mono text-sm text-fg focus:border-accent focus:outline-none" aria-label={`Answer ${i + 1}`} />
                {checked && (ok[i] ? <CircleCheck className="h-5 w-5 text-ok" /> : <CircleX className="h-5 w-5 text-bad" />)}
              </div>
              {checked && <p className="mt-1.5 text-[13px] text-fg-2">{n.how}</p>}
            </li>
          ))}
        </ol>
        <div className="mt-3">
          {!checked ? (
            <Button variant="primary" disabled={vals.some((v) => !v.trim())} onClick={() => { setChecked(true); done('n', [ok.filter(Boolean).length, NUMERIC.length]); }}><Check className="h-4 w-4" /> Check calculations</Button>
          ) : (
            <ResultBanner score={ok.filter(Boolean).length} total={NUMERIC.length} onRetry={() => { setChecked(false); setVals(NUMERIC.map(() => '')); }} />
          )}
        </div>
      </LabStep>
      <LabStep n={3} title="Choose the risk treatment" done={!!scores.s}>
        <ClassifyTable items={STRAT} onScored={(c, t) => done('s', [c, t])} />
      </LabStep>
      <LabStep n={4} title="Business impact analysis: recovery metrics" sub="Move the sliders to see how RPO and RTO constrain a recovery plan, then name each metric." done={!!scores.b}>
        <div className="space-y-4">
          <W id="recovery-timeline" />
          <W id="availability" />
          <ClassifyTable items={BIA} onScored={(c, t) => done('b', [c, t])} />
        </div>
      </LabStep>
    </div>
  );
}
