import { useMemo, useState } from 'react';
import type { LabProps } from '@/components/labs/registry';
import { Badge, Callout, Card, Segmented, Select } from '@/components/ui/primitives';
import { ClassifyTable, LabStep, type ClassifyItem } from './kit';
import { cn } from '@/lib/utils';

type Strategy = 'full' | 'inc' | 'diff';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DATA_GB = 500;
const CHANGE_GB = 50; // changed per day
const BACKUP_RATE = 100; // GB/hour
const RESTORE_RATE = 125; // GB/hour

function plan(s: Strategy) {
  return DAYS.map((d, i) => {
    if (s === 'full' || i === 0) return { day: d, type: 'Full', gb: DATA_GB };
    if (s === 'inc') return { day: d, type: 'Incremental', gb: CHANGE_GB };
    return { day: d, type: 'Differential', gb: CHANGE_GB * i };
  });
}

function restoreSet(s: Strategy, lastBackup: number): number[] {
  if (s === 'full' || lastBackup === 0) return [lastBackup];
  if (s === 'inc') return Array.from({ length: lastBackup + 1 }, (_, i) => i);
  return [0, lastBackup];
}

const SITES = ['Hot site', 'Warm site', 'Cold site'];
const SITE_ITEMS: ClassifyItem[] = [
  { prompt: 'Online trading platform: must be running again within 15 minutes; budget is not a constraint.', fields: [{ label: 'Recovery site', options: SITES, answer: 0 }], explain: 'A hot site is fully equipped with current data and can take over in minutes — the most expensive option.' },
  { prompt: 'Internal wiki: can be down for up to a week; very limited budget.', fields: [{ label: 'Recovery site', options: SITES, answer: 2 }], explain: 'A cold site is space and power only; hardware and data must be brought in — cheapest, slowest (days to weeks).' },
  { prompt: 'Order management: RTO of 24 hours; moderate budget.', fields: [{ label: 'Recovery site', options: SITES, answer: 1 }], explain: 'A warm site has hardware and connectivity ready but needs current data restored — hours to a day.' },
];

const TECH = ['Snapshot', 'Replication', 'Journaling', 'Offline / immutable backup', 'Differential backup'];
const TECH_ITEMS: ClassifyItem[] = [
  { prompt: 'Roll a VM back to the exact state it was in before a patch applied 30 minutes ago.', fields: [{ label: 'Technique', options: TECH, answer: 0 }], explain: 'A snapshot captures a point-in-time image of a VM or volume — ideal before risky changes.' },
  { prompt: 'Keep a second data center’s database continuously in sync to minimise RPO.', fields: [{ label: 'Technique', options: TECH, answer: 1 }], explain: 'Replication copies changes continuously (synchronously or asynchronously) to another location.' },
  { prompt: 'Recover a database to 10:42:17, between two backups.', fields: [{ label: 'Technique', options: TECH, answer: 2 }], explain: 'Journaling (transaction logs) records every change, so you can replay up to an exact point in time.' },
  { prompt: 'Make sure ransomware that compromises admin accounts cannot destroy the restore points.', fields: [{ label: 'Technique', options: TECH, answer: 3 }], explain: 'Offline (air-gapped) or immutable backups can’t be encrypted or deleted from the network. Note replication would faithfully copy the ransomware damage.' },
  { prompt: 'Restore needs only the last full backup plus ONE other set.', fields: [{ label: 'Technique', options: TECH, answer: 4 }], explain: 'A differential contains everything changed since the last full backup, so restore = full + latest differential.' },
];

export default function BackupDrLab({ onComplete }: LabProps) {
  const [s, setS] = useState<Strategy>('inc');
  const [fail, setFail] = useState(4); // fails during Thursday → last backup Wednesday night
  const [scores, setScores] = useState<{ a?: [number, number]; b?: [number, number] }>({});
  const p = useMemo(() => plan(s), [s]);
  const last = fail - 1;
  const set = restoreSet(s, last);
  const restoreGb = set.reduce((sum, i) => sum + p[i].gb, 0);
  const weekGb = p.reduce((sum, x) => sum + x.gb, 0);
  const nightly = Math.max(...p.map((x) => x.gb)) / BACKUP_RATE;

  const done = (k: 'a' | 'b', v: [number, number]) => {
    const n = { ...scores, [k]: v };
    setScores(n);
    if (n.a && n.b) onComplete(Math.round(((n.a[0] + n.b[0]) / (n.a[1] + n.b[1])) * 100));
  };

  return (
    <div className="space-y-5">
      <LabStep n={1} title="Backup types: what do you need to restore?" sub={`A ${DATA_GB} GB file server changes about ${CHANGE_GB} GB of new data per day. Backups run every night.`}>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <Segmented label="Strategy" value={s} onChange={setS} options={[{ value: 'full', label: 'Full every night' }, { value: 'inc', label: 'Full + incrementals' }, { value: 'diff', label: 'Full + differentials' }]} />
          <Select label="Server fails during…" value={String(fail)} onChange={(v) => setFail(Number(v))} className="w-40" options={DAYS.slice(1).map((d, i) => ({ value: String(i + 1), label: `${d} (day)` }))} />
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {p.map((x, i) => {
            const inSet = set.includes(i);
            const after = i > last;
            return (
              <div key={x.day} className={cn('flex flex-col items-center rounded-xl border p-2 text-center transition-all', inSet ? 'border-accent bg-accent/12 ring-2 ring-accent/40' : 'border-line bg-surface-2/40', after && 'opacity-40')}>
                <span className="text-[11px] font-bold text-fg">{x.day}</span>
                <span className={cn('mt-1 rounded px-1 text-[9.5px] font-semibold', x.type === 'Full' ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300' : x.type === 'Incremental' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300')}>{x.type}</span>
                <span className="mt-1 text-[11px] tabular-nums text-muted">{x.gb} GB</span>
                {i === fail && <span className="mt-1 text-[10px] font-bold text-bad">💥 failure</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Card className="p-3"><div className="text-[11px] font-semibold uppercase text-muted">Restore set</div><div className="mt-0.5 text-sm font-bold text-fg">{set.map((i) => `${p[i].day} ${p[i].type.toLowerCase()}`).join(' + ')}</div></Card>
          <Card className="p-3"><div className="text-[11px] font-semibold uppercase text-muted">Restore time</div><div className="mt-0.5 text-lg font-bold text-fg">{(restoreGb / RESTORE_RATE).toFixed(1)} h</div><div className="text-[11px] text-muted">{restoreGb} GB to restore</div></Card>
          <Card className="p-3"><div className="text-[11px] font-semibold uppercase text-muted">Longest nightly backup</div><div className="mt-0.5 text-lg font-bold text-fg">{nightly.toFixed(1)} h</div></Card>
          <Card className="p-3"><div className="text-[11px] font-semibold uppercase text-muted">Storage per week</div><div className="mt-0.5 text-lg font-bold text-fg">{weekGb} GB</div></Card>
        </div>
        <Callout kind="exam" className="mt-4" title="What to notice">
          {s === 'full' && 'Full every night: simplest and fastest restore (one set) but the longest backups and the most storage.'}
          {s === 'inc' && 'Incrementals back up only what changed since the previous backup: fastest nightly backups, least storage — but a restore needs the full plus every incremental since, and one damaged tape breaks the chain.'}
          {s === 'diff' && 'Differentials grow each day (everything since the last full): middle ground — restore needs only the full + the latest differential.'}
          {' '}Data lost (RPO) is the same for all three: whatever changed since last night’s backup. Shrinking RPO needs more frequent backups, journaling or replication.
        </Callout>
      </LabStep>
      <LabStep n={2} title="Pick the recovery site" sub="Match the site type to the recovery time objective (RTO) and budget." done={!!scores.a}>
        <ClassifyTable items={SITE_ITEMS} onScored={(c, t) => done('a', [c, t])} />
      </LabStep>
      <LabStep n={3} title="Pick the resilience technique" sub="Snapshots, replication, journaling and offline copies solve different problems." done={!!scores.b}>
        <ClassifyTable items={TECH_ITEMS} onScored={(c, t) => done('b', [c, t])} />
      </LabStep>
      {scores.a && scores.b && <div className="flex justify-end"><Badge tone="ok">Lab complete</Badge></div>}
    </div>
  );
}
