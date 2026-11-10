import { useState } from 'react';
import { Field, WidgetFrame, inputCls } from './WidgetFrame';

/** Availability from MTBF and MTTR, with downtime per year and "nines". */
export default function AvailabilityCalc() {
  const [mtbf, setMtbf] = useState(2000);
  const [mttr, setMttr] = useState(4);
  const a = mtbf / (mtbf + mttr || 1);
  const downH = (1 - a) * 8760;
  const nines = a >= 0.99999 ? 'five nines' : a >= 0.9999 ? 'four nines' : a >= 0.999 ? 'three nines' : a >= 0.99 ? 'two nines' : 'below 99%';
  return (
    <WidgetFrame title="Availability calculator (MTBF & MTTR)" badge="Calculator" note="Assumes failures and repairs average out over time. MTBF applies to repairable systems; MTTF is used for items that are replaced rather than repaired.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mean time between failures (MTBF), hours"><input type="number" min={1} className={inputCls} value={mtbf} onChange={(e) => setMtbf(Math.max(1, Number(e.target.value)))} /></Field>
        <Field label="Mean time to repair (MTTR), hours"><input type="number" min={0} step={0.5} className={inputCls} value={mttr} onChange={(e) => setMttr(Math.max(0, Number(e.target.value)))} /></Field>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface-2/50 p-3"><div className="text-[11px] font-semibold uppercase text-muted">Availability</div><div className="text-2xl font-bold text-fg">{(a * 100).toFixed(3)}%</div><div className="text-xs text-muted">MTBF ÷ (MTBF + MTTR) · {nines}</div></div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-3"><div className="text-[11px] font-semibold uppercase text-muted">Expected downtime / year</div><div className="text-2xl font-bold text-fg">{downH < 1 ? `${(downH * 60).toFixed(0)} min` : `${downH.toFixed(1)} h`}</div></div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-3"><div className="text-[11px] font-semibold uppercase text-muted">Failures / year</div><div className="text-2xl font-bold text-fg">{(8760 / mtbf).toFixed(1)}</div><div className="text-xs text-muted">8,760 h ÷ MTBF</div></div>
      </div>
      <p className="mt-3 text-sm text-fg-2">To raise availability, either <strong>increase MTBF</strong> (better components, redundancy) or <strong>reduce MTTR</strong> (spares on site, automation, practised runbooks). Redundancy usually wins: a failover partner turns a repair into a non-event.</p>
    </WidgetFrame>
  );
}
