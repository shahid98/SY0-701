import { useState } from 'react';
import { WidgetFrame } from './WidgetFrame';
import { cn } from '@/lib/utils';

function Slider({ label, v, set, max }: { label: string; v: number; set: (n: number) => void; max: number }) {
  return (
    <label className="flex items-center gap-2 text-xs text-fg-2">
      <span className="w-28 shrink-0 sm:w-44">{label}</span>
      <input type="range" min={0} max={max} value={v} onChange={(e) => set(Number(e.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" aria-label={label} />
      <span className="w-10 text-right font-mono font-semibold text-fg">{v}h</span>
    </label>
  );
}

/** RPO/RTO on a timeline: data loss window (last backup → incident) and downtime window (incident → restored). */
export default function RecoveryTimeline() {
  const [sinceBackup, setSinceBackup] = useState(6); // hours of data since last good backup
  const [restore, setRestore] = useState(8); // hours to restore service
  const [rpo, setRpo] = useState(4);
  const [rto, setRto] = useState(12);
  const [mtd, setMtd] = useState(24);
  const span = 48;
  const x = (h: number) => `${((h + 24) / span) * 100}%`; // incident at 0, window -24..+24
  const rpoOk = sinceBackup <= rpo;
  const rtoOk = restore <= rto;
  return (
    <WidgetFrame title="RPO and RTO on the incident timeline" badge="Interactive" note="RPO looks backwards from the incident (how much data you can lose); RTO looks forwards (how long until service is back). Both must fit inside what the business can tolerate.">
      <div className="space-y-2">
        <Slider label="Time since last good backup" v={sinceBackup} set={setSinceBackup} max={24} />
        <Slider label="Time to restore the service" v={restore} set={setRestore} max={24} />
        <Slider label="RPO target (from the BIA)" v={rpo} set={setRpo} max={24} />
        <Slider label="RTO target (from the BIA)" v={rto} set={setRto} max={24} />
        <Slider label="Maximum tolerable downtime" v={mtd} set={setMtd} max={24} />
      </div>
      <div className="relative mt-6 h-28 rounded-xl border border-line bg-surface-2/40">
        <div className="absolute left-0 right-0 top-12 h-0.5 bg-line-strong" />
        <div className="absolute top-8 h-8 rounded-l-md bg-[#e11d48]/30 dark:bg-[#f43f5e]/30" style={{ left: x(-sinceBackup), width: `${(sinceBackup / span) * 100}%` }} />
        <div className="absolute top-8 h-8 rounded-r-md bg-[#d97706]/35" style={{ left: x(0), width: `${(restore / span) * 100}%` }} />
        <div className="absolute top-2 h-24 w-px border-l-2 border-dashed border-[#0891b2]" style={{ left: x(-rpo) }} />
        <div className="absolute top-2 h-24 w-px border-l-2 border-dashed border-[#7c3aed]" style={{ left: x(rto) }} />
        <div className="absolute top-2 h-24 w-px border-l-2 border-dotted border-muted" style={{ left: x(mtd) }} />
        <div className="absolute top-4 h-20 w-0.5 bg-bad" style={{ left: x(0) }} />
        <span className="absolute -translate-x-1/2 text-[10px] font-bold text-bad" style={{ left: x(0), top: 2 }}>INCIDENT</span>
        <span className="absolute -translate-x-1/2 text-[10px] font-semibold text-fg-2" style={{ left: x(-sinceBackup), top: 70 }}>last backup</span>
        <span className="absolute -translate-x-1/2 text-[10px] font-semibold text-fg-2" style={{ left: x(restore), top: 70 }}>restored</span>
        <span className="absolute -translate-x-1/2 text-[10px] text-[#0891b2]" style={{ left: x(-rpo), top: 88 }}>RPO</span>
        <span className="absolute -translate-x-1/2 text-[10px] text-[#7c3aed]" style={{ left: x(rto), top: 88 }}>RTO</span>
        <span className="absolute -translate-x-1/2 text-[10px] text-muted" style={{ left: x(mtd), top: 88 }}>MTD</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <p className={cn('rounded-lg px-3 py-2 text-sm', rpoOk ? 'bg-ok/10' : 'bg-bad/10')}><strong>Data loss: {sinceBackup}h</strong> vs RPO {rpo}h → {rpoOk ? 'meets the RPO.' : 'violates the RPO — back up more often, add journaling or replication.'}</p>
        <p className={cn('rounded-lg px-3 py-2 text-sm', rtoOk ? 'bg-ok/10' : 'bg-bad/10')}><strong>Downtime: {restore}h</strong> vs RTO {rto}h → {rtoOk ? 'meets the RTO.' : 'violates the RTO — faster restore, warm/hot site, or failover.'}</p>
      </div>
      {rto > mtd && <p className="mt-2 rounded-lg bg-warn/10 px-3 py-2 text-sm">RTO is longer than the maximum tolerable downtime — the BIA says the business would fail before you recover. RTO must be ≤ MTD.</p>}
    </WidgetFrame>
  );
}
