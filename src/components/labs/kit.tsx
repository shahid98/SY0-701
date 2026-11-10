import { useMemo, useState, type ReactNode } from 'react';
import { Check, CircleCheck, CircleX, RotateCcw, Trophy } from 'lucide-react';
import { Button, Card } from '@/components/ui/primitives';
import { inline } from '@/components/ui/RichText';
import { cn } from '@/lib/utils';

export function LabStep({ n, title, sub, children, done, className }: {
  n: number | string; title: string; sub?: ReactNode; children: ReactNode; done?: boolean; className?: string;
}) {
  return (
    <Card className={cn('p-4 sm:p-5', className)}>
      <div className="mb-4 flex items-start gap-3">
        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold', done ? 'bg-ok/15 text-ok' : 'bg-accent/12 text-accent')}>
          {done ? <Check className="h-4 w-4" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-fg">{title}</h2>
          {sub && <div className="mt-0.5 text-sm text-muted">{sub}</div>}
        </div>
      </div>
      {children}
    </Card>
  );
}

export function ResultBanner({ score, total, onRetry, message }: { score: number; total: number; onRetry?: () => void; message?: ReactNode }) {
  const p = total ? Math.round((score / total) * 100) : 0;
  return (
    <div className={cn('flex flex-wrap items-center gap-3 rounded-xl border p-3.5', p >= 80 ? 'border-ok/40 bg-ok/10' : p >= 50 ? 'border-warn/40 bg-warn/10' : 'border-bad/40 bg-bad/10')} aria-live="polite">
      <Trophy className={cn('h-5 w-5', p >= 80 ? 'text-ok' : p >= 50 ? 'text-warn' : 'text-bad')} />
      <div className="flex-1 text-sm">
        <span className="font-bold text-fg">{score}/{total} correct ({p}%)</span>
        {message && <span className="ml-2 text-fg-2">{message}</span>}
      </div>
      {onRetry && <Button size="sm" onClick={onRetry}><RotateCcw className="h-4 w-4" /> Try again</Button>}
    </div>
  );
}

export interface ClassifyItem {
  prompt: string;
  detail?: string;
  exhibit?: string; // monospace log/config excerpt
  fields: { label: string; options: string[]; answer: number | number[] }[]; // answer may accept several options
  explain: string;
}

/** A graded table: each row has one or more dropdowns; "Check" scores every field. */
export function ClassifyTable({ items, onScored, checkLabel = 'Check answers' }: {
  items: ClassifyItem[]; onScored?: (correct: number, total: number) => void; checkLabel?: string;
}) {
  const [sel, setSel] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const totalFields = useMemo(() => items.reduce((s, it) => s + it.fields.length, 0), [items]);
  const isOk = (i: number, f: number) => {
    const a = items[i].fields[f].answer;
    const v = sel[`${i}-${f}`];
    return Array.isArray(a) ? a.includes(v) : a === v;
  };
  const correct = checked ? items.reduce((s, it, i) => s + it.fields.filter((_, f) => isOk(i, f)).length, 0) : 0;
  const complete = Object.keys(sel).length === totalFields;

  return (
    <div className="space-y-3">
      <ol className="space-y-2.5">
        {items.map((it, i) => {
          const allOk = checked && it.fields.every((_, f) => isOk(i, f));
          return (
            <li key={i} className={cn('rounded-xl border p-3', !checked ? 'border-line bg-surface-2/40' : allOk ? 'border-ok/40 bg-ok/5' : 'border-bad/40 bg-bad/5')}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-xs font-bold text-muted">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-fg">{inline(it.prompt)}</div>
                  {it.detail && <div className="mt-0.5 text-[13px] text-muted">{inline(it.detail)}</div>}
                  {it.exhibit && <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg border border-line bg-[#0a0f1a] p-2.5 font-mono text-[11.5px] leading-relaxed text-emerald-200 wrap-anywhere sm:whitespace-pre sm:wrap-normal">{it.exhibit}</pre>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {it.fields.map((f, fi) => {
                      const key = `${i}-${fi}`;
                      const ok = checked && isOk(i, fi);
                      return (
                        <label key={fi} className="flex w-full min-w-0 flex-col gap-0.5 text-[11px] font-medium text-muted sm:w-auto">
                          {f.label}
                          <select
                            value={sel[key] ?? ''}
                            disabled={checked}
                            onChange={(e) => setSel((s) => ({ ...s, [key]: Number(e.target.value) }))}
                            className={cn(
                              'h-8 w-full max-w-full rounded-lg border bg-surface px-2 text-sm text-fg focus:border-accent focus:outline-none sm:w-auto sm:min-w-36',
                              !checked ? 'border-line' : ok ? 'border-ok' : 'border-bad',
                            )}
                          >
                            <option value="" disabled>Choose…</option>
                            {f.options.map((o, oi) => <option key={o} value={oi}>{o}</option>)}
                          </select>
                          {checked && !ok && (
                            <span className="text-[11px] text-bad">
                              Answer: {Array.isArray(f.answer) ? f.answer.map((a) => f.options[a]).join(' or ') : f.options[f.answer]}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {checked && (
                    <p className="mt-2 flex gap-1.5 text-[13px] text-fg-2">
                      {allOk ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" />}
                      <span>{inline(it.explain)}</span>
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {!checked ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" disabled={!complete} onClick={() => { setChecked(true); const c = items.reduce((s, it, i) => s + it.fields.filter((_, f) => isOk(i, f)).length, 0); onScored?.(c, totalFields); }}>
            <Check className="h-4 w-4" /> {checkLabel}
          </Button>
          {!complete && <span className="text-xs text-muted">{totalFields - Object.keys(sel).length} selection{totalFields - Object.keys(sel).length === 1 ? '' : 's'} left</span>}
        </div>
      ) : (
        <ResultBanner score={correct} total={totalFields} onRetry={() => { setSel({}); setChecked(false); }} />
      )}
    </div>
  );
}
