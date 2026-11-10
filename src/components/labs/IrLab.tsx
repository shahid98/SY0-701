import { useState } from 'react';
import { Reorder } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, GripVertical, RotateCcw } from 'lucide-react';
import type { LabProps } from '@/components/labs/registry';
import { Button, Callout } from '@/components/ui/primitives';
import { ClassifyTable, LabStep, ResultBanner, type ClassifyItem } from './kit';
import { cn, shuffle } from '@/lib/utils';

const PHASES = ['Preparation', 'Detection', 'Analysis', 'Containment', 'Eradication', 'Recovery', 'Lessons learned'];

const ACTIONS: ClassifyItem[] = [
  { prompt: 'Maintain an up-to-date IR plan, contact list and jump bag of forensic tools.', fields: [{ label: 'Phase', options: PHASES, answer: 0 }], explain: 'Preparation happens before any incident.' },
  { prompt: 'Run a tabletop exercise of the ransomware playbook with executives.', fields: [{ label: 'Phase', options: PHASES, answer: 0 }], explain: 'Training and testing are part of preparation.' },
  { prompt: 'The SIEM raises an alert for mass file renames on a file server.', fields: [{ label: 'Phase', options: PHASES, answer: 1 }], explain: 'Detection: an indicator surfaces from monitoring.' },
  { prompt: 'Review EDR telemetry to determine which hosts are affected and how the attacker got in.', fields: [{ label: 'Phase', options: PHASES, answer: 2 }], explain: 'Analysis scopes the incident and confirms it is real.' },
  { prompt: 'Capture memory and disk images of an infected server before changes are made.', fields: [{ label: 'Phase', options: PHASES, answer: [2, 3] }], explain: 'Evidence acquisition happens early — during analysis or as part of containment — before eradication destroys it.' },
  { prompt: 'Disconnect infected hosts from the network and disable the compromised account.', fields: [{ label: 'Phase', options: PHASES, answer: 3 }], explain: 'Containment limits spread and damage.' },
  { prompt: 'Remove the malware, close the exploited vulnerability and reset all exposed credentials.', fields: [{ label: 'Phase', options: PHASES, answer: 4 }], explain: 'Eradication removes the cause and the attacker’s foothold.' },
  { prompt: 'Restore servers from known-clean, offline backups and return them to production.', fields: [{ label: 'Phase', options: PHASES, answer: 5 }], explain: 'Recovery restores normal operations.' },
  { prompt: 'Monitor restored systems closely for signs of reinfection.', fields: [{ label: 'Phase', options: PHASES, answer: 5 }], explain: 'Validation monitoring is part of recovery.' },
  { prompt: 'Hold an after-action meeting and update playbooks and detection rules with the new IoCs.', fields: [{ label: 'Phase', options: PHASES, answer: 6 }], explain: 'Lessons learned feed improvements back into preparation.' },
];

const ISSUES = ['No problem', 'Gap: evidence unaccounted for', 'Hash not verified at transfer', 'Hash mismatch — evidence altered', 'Handler not authorized'];
const CUSTODY: ClassifyItem[] = [
  { prompt: '09:14 · Collected laptop LT-221 from desk · by J. Ortiz (IR) · SHA-256 of disk image recorded: 9f2c…a1', fields: [{ label: 'Issue', options: ISSUES, answer: 0 }], explain: 'Proper: who, what, when, and an integrity hash at acquisition.' },
  { prompt: '09:40 · Transferred to evidence locker · from J. Ortiz to K. Liu (evidence custodian) · hash verified 9f2c…a1', fields: [{ label: 'Issue', options: ISSUES, answer: 0 }], explain: 'Both parties sign and the hash is re-verified.' },
  { prompt: '(no entry between 18:00 Monday and 10:30 Wednesday)', fields: [{ label: 'Issue', options: ISSUES, answer: 1 }], explain: 'Any unexplained gap lets opposing counsel argue the evidence could have been tampered with.' },
  { prompt: '10:30 · Released to external analyst M. Grant (contractor, not on the authorized list) · signature only', fields: [{ label: 'Issue', options: ISSUES, answer: [4, 2] }], explain: 'Handlers must be authorized, and the hash should be verified at every transfer.' },
  { prompt: '15:05 · Returned to locker · hash computed: 4b7e…0c (original 9f2c…a1)', fields: [{ label: 'Issue', options: ISSUES, answer: 3 }], explain: 'A different hash means the image changed; its integrity (and admissibility) is now in doubt — always analyse a copy.' },
];

export default function IrLab({ onComplete }: LabProps) {
  const [order, setOrder] = useState(() => shuffle(PHASES));
  const [orderChecked, setOrderChecked] = useState(false);
  const [scores, setScores] = useState<{ o?: [number, number]; a?: [number, number]; c?: [number, number] }>({});
  const [round, setRound] = useState(0);
  const correctPos = order.filter((p, i) => p === PHASES[i]).length;

  const done = (k: 'o' | 'a' | 'c', v: [number, number]) => {
    const n = { ...scores, [k]: v };
    setScores(n);
    if (n.o && n.a && n.c) onComplete(Math.round(((n.o[0] + n.a[0] + n.c[0]) / (n.o[1] + n.a[1] + n.c[1])) * 100));
  };
  const move = (i: number, d: -1 | 1) => setOrder((o) => {
    const j = i + d;
    if (j < 0 || j >= o.length) return o;
    const n = o.slice();
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });

  return (
    <div className="space-y-5">
      <Callout kind="info" title="Scenario">Monday 08:55: a SIEM alert reports mass file encryption on FS-02. You are the incident lead.</Callout>
      <LabStep n={1} title="Put the incident response phases in order" sub="Drag the cards (or use the arrows) — then check." done={orderChecked && correctPos === PHASES.length}>
        <Reorder.Group axis="y" values={order} onReorder={(v) => !orderChecked && setOrder(v)} className="space-y-1.5">
          {order.map((p, i) => (
            <Reorder.Item key={p} value={p} className={cn('flex cursor-grab items-center gap-2 rounded-xl border bg-surface px-3 py-2 active:cursor-grabbing', orderChecked ? (p === PHASES[i] ? 'border-ok/50 bg-ok/5' : 'border-bad/50 bg-bad/5') : 'border-line')}>
              <GripVertical className="h-4 w-4 text-muted" />
              <span className="w-5 text-xs font-bold text-muted">{i + 1}</span>
              <span className="flex-1 text-sm font-medium text-fg">{p}</span>
              {orderChecked && p !== PHASES[i] && <span className="text-xs text-bad">should be #{PHASES.indexOf(p) + 1}</span>}
              {!orderChecked && (
                <span className="flex gap-0.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${p} up`}><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move ${p} down`}><ArrowDown className="h-3.5 w-3.5" /></Button>
                </span>
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>
        <div className="mt-3">
          {!orderChecked ? (
            <Button variant="primary" onClick={() => { setOrderChecked(true); done('o', [correctPos, PHASES.length]); }}><Check className="h-4 w-4" /> Check order</Button>
          ) : (
            <div className="space-y-2">
              <ResultBanner score={correctPos} total={PHASES.length} onRetry={() => { setOrderChecked(false); setOrder(shuffle(PHASES)); }} message="Preparation → Detection → Analysis → Containment → Eradication → Recovery → Lessons learned" />
              <p className="text-xs text-muted">In real incidents analysis, containment and eradication often loop; lessons learned feeds back into preparation.</p>
            </div>
          )}
        </div>
      </LabStep>
      <LabStep n={2} title="Which phase does each action belong to?" done={!!scores.a}>
        <ClassifyTable key={`a${round}`} items={ACTIONS} onScored={(c, t) => done('a', [c, t])} />
      </LabStep>
      <LabStep n={3} title="Audit the chain of custody" sub="Digital evidence is only useful if you can prove who had it, when, and that it never changed. Find the problems in this log." done={!!scores.c}>
        <ClassifyTable key={`c${round}`} items={CUSTODY} onScored={(c, t) => done('c', [c, t])} />
      </LabStep>
      {scores.o && scores.a && scores.c && (
        <div className="flex justify-end"><Button variant="ghost" onClick={() => { setScores({}); setOrderChecked(false); setOrder(shuffle(PHASES)); setRound((r) => r + 1); }}><RotateCcw className="h-4 w-4" /> Restart lab</Button></div>
      )}
    </div>
  );
}
