import { useState } from 'react';
import { Field, WidgetFrame, inputCls } from './WidgetFrame';
import { cn } from '@/lib/utils';

const money = (n: number) => n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** Quantitative risk: SLE = AV × EF, ALE = SLE × ARO, plus a control cost-benefit check. */
export default function RiskCalc({ av: av0 = 120000, ef: ef0 = 40, aro: aro0 = 0.5 }: { av?: number; ef?: number; aro?: number }) {
  const [av, setAv] = useState(av0);
  const [ef, setEf] = useState(ef0);
  const [aro, setAro] = useState(aro0);
  const [cost, setCost] = useState(8000);
  const [aro2, setAro2] = useState(0.1);
  const sle = av * (ef / 100);
  const ale = sle * aro;
  const ale2 = sle * aro2;
  const benefit = ale - ale2 - cost;
  const max = Math.max(ale, ale2 + cost, 1);
  return (
    <WidgetFrame title="Quantitative risk calculator (SLE · ARO · ALE)" badge="Calculator" note="Quantitative results are only as good as the estimates feeding them; real assessments combine them with qualitative judgement.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Asset value (AV), $"><input type="number" min={0} className={inputCls} value={av} onChange={(e) => setAv(Math.max(0, Number(e.target.value)))} /></Field>
        <Field label={`Exposure factor (EF): ${ef}% of value lost per incident`}><input type="range" min={1} max={100} value={ef} onChange={(e) => setEf(Number(e.target.value))} className="mt-2 accent-[var(--accent)]" /></Field>
        <Field label="Annualized rate of occurrence (ARO)"><input type="number" min={0} step={0.05} className={inputCls} value={aro} onChange={(e) => setAro(Math.max(0, Number(e.target.value)))} /></Field>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface-2/50 p-3">
          <div className="text-[11px] font-semibold uppercase text-muted">Single loss expectancy</div>
          <div className="font-mono text-sm text-fg-2">SLE = AV × EF = {money(av)} × {ef}%</div>
          <div className="text-2xl font-bold text-fg">{money(sle)}</div>
          <div className="text-xs text-muted">Loss from ONE occurrence.</div>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-3">
          <div className="text-[11px] font-semibold uppercase text-muted">Annualized loss expectancy</div>
          <div className="font-mono text-sm text-fg-2">ALE = SLE × ARO = {money(sle)} × {aro}</div>
          <div className="text-2xl font-bold text-fg">{money(ale)}</div>
          <div className="text-xs text-muted">Expected loss per YEAR. ARO 0.5 = once every two years.</div>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-line p-3">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Is a control worth it?</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Annual cost of the control, $"><input type="number" min={0} className={inputCls} value={cost} onChange={(e) => setCost(Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="ARO after the control"><input type="number" min={0} step={0.05} className={inputCls} value={aro2} onChange={(e) => setAro2(Math.max(0, Number(e.target.value)))} /></Field>
        </div>
        <div className="mt-3 space-y-2" role="img" aria-label={`ALE before ${money(ale)}; ALE after plus control cost ${money(ale2 + cost)}`}>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-28 text-fg-2">Without control</span>
            <div className="h-4 flex-1 rounded-r bg-surface-3"><div className="h-full rounded-r-[4px] bg-[#e11d48] dark:bg-[#f43f5e]" style={{ width: `${(ale / max) * 100}%` }} /></div>
            <span className="w-24 text-right font-semibold tabular-nums text-fg">{money(ale)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-28 text-fg-2">With control</span>
            <div className="flex h-4 flex-1 gap-[2px] rounded-r bg-surface-3">
              <div className="h-full bg-[#0891b2]" style={{ width: `${(ale2 / max) * 100}%` }} title="Residual ALE" />
              <div className="h-full rounded-r-[4px] bg-[#7c3aed] dark:bg-[#8b5cf6]" style={{ width: `${(cost / max) * 100}%` }} title="Control cost" />
            </div>
            <span className="w-24 text-right font-semibold tabular-nums text-fg">{money(ale2 + cost)}</span>
          </div>
          <div className="flex gap-4 pl-[7.5rem] text-[11px] text-muted"><span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[#0891b2]" />Residual ALE {money(ale2)}</span><span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-[#7c3aed]" />Control cost</span></div>
        </div>
        <p className={cn('mt-3 rounded-lg px-3 py-2 text-sm', benefit > 0 ? 'bg-ok/10 text-fg' : 'bg-warn/10 text-fg')}>
          Annual value = ALE before − ALE after − control cost = {money(ale)} − {money(ale2)} − {money(cost)} = <strong>{money(benefit)}</strong>.{' '}
          {benefit > 0 ? 'The control saves more than it costs → mitigate.' : 'The control costs more than the risk it removes → consider accepting, transferring, or a cheaper control.'}
        </p>
      </div>
    </WidgetFrame>
  );
}
