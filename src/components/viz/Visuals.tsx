import { Fragment, Suspense, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, CircleCheck, CircleX, RefreshCw, RotateCcw, Undo2 } from 'lucide-react';
import type {
  BeforeAfterVisual, CompareVisual, LayersVisual, SortVisual, TimelineVisual, Visual,
} from '@/types/content';
import { Icon } from '@/components/ui/icons';
import { Badge, Button, Switch, Tab, TabList, Tabs, toneSoft, toneText } from '@/components/ui/primitives';
import { inline } from '@/components/ui/RichText';
import { SequenceDiagram } from './SequenceDiagram';
import { StepCaption, StepFrame, StepList, useStepPlayer } from './StepPlayer';
import { WIDGETS } from './widgets';
import { cn, mulberry32, seedFrom, shuffle } from '@/lib/utils';

/* ---------- Timeline (ordered procedures) ---------- */

export function TimelineViz({ v }: { v: TimelineVisual }) {
  const player = useStepPlayer(v.steps.length, { interval: 3000, loop: false });
  const step = v.steps[player.index];
  return (
    <StepFrame
      player={player}
      title={v.title}
      note={v.note}
      caption={<StepCaption index={player.index} title={step.label} text={inline(step.detail)} />}
      listView={<StepList steps={v.steps.map((s) => ({ title: s.label, text: inline(s.detail) }))} />}
    >
      <ol className="relative flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
        {v.steps.map((s, i) => {
          const state = i < player.index ? 'done' : i === player.index ? 'current' : 'todo';
          return (
            <li key={i} className="relative flex flex-1 items-center gap-3 sm:flex-col sm:gap-2 sm:text-center">
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute left-[1.05rem] -top-2 h-2 w-0.5 sm:left-auto sm:right-1/2 sm:top-[1.05rem] sm:h-0.5 sm:w-full',
                    i <= player.index ? 'bg-accent' : 'bg-line-strong',
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => player.goTo(i)}
                className={cn(
                  'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition-all',
                  state === 'current' && 'scale-110 border-accent bg-accent text-accent-fg shadow-lg shadow-accent/30',
                  state === 'done' && 'border-accent bg-accent/15 text-accent',
                  state === 'todo' && 'border-line-strong bg-surface text-muted',
                )}
                aria-label={`Step ${i + 1}: ${s.label}`}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                {s.icon ? <Icon name={s.icon} className="h-4 w-4" /> : i + 1}
              </button>
              <span className={cn('text-xs font-semibold leading-tight sm:px-1', state === 'todo' ? 'text-muted' : 'text-fg')}>{s.label}</span>
            </li>
          );
        })}
      </ol>
      {v.cyclic && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <RefreshCw className="h-3 w-3" /> The final stage feeds back into the first — it is a continuous cycle.
        </div>
      )}
    </StepFrame>
  );
}

/* ---------- Layers (stacks, defence in depth) ---------- */

export function LayersViz({ v }: { v: LayersVisual }) {
  const player = useStepPlayer(v.layers.length, { interval: 2800 });
  const layer = v.layers[player.index];
  return (
    <StepFrame
      player={player}
      title={v.title}
      note={v.note}
      caption={<StepCaption index={player.index} title={layer.label} text={inline(layer.detail)} />}
      listView={<StepList steps={v.layers.map((l) => ({ title: l.label, text: inline(l.detail) }))} />}
    >
      <div className="mx-auto flex max-w-xl flex-col gap-1.5">
        {v.layers.map((l, i) => {
          const tone = l.tone ?? 'accent';
          const on = i === player.index;
          return (
            <button
              key={i}
              type="button"
              onClick={() => player.goTo(i)}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-300',
                on ? cn('border-accent shadow-md', toneSoft[tone]) : 'border-line bg-surface-2/50 hover:border-line-strong',
              )}
              style={{ marginInline: `${Math.min(i, 6) * (on ? 0.4 : 0.6)}rem` }}
            >
              {l.icon && <Icon name={l.icon} className={cn('h-4 w-4 shrink-0', on ? toneText[tone] : 'text-muted')} />}
              <span className={cn('font-semibold', on ? 'text-fg' : 'text-fg-2')}>{l.label}</span>
            </button>
          );
        })}
      </div>
    </StepFrame>
  );
}

/* ---------- Side-by-side comparison ---------- */

export function CompareViz({ v }: { v: CompareVisual }) {
  const [hl, setHl] = useState<number | null>(null);
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-2.5 text-sm font-semibold text-fg">{v.title}</div>
      {/* Phones: one block per aspect, listing every item's value, so no column is hidden off-screen. */}
      <div className="divide-y divide-line sm:hidden">
        {v.rows.map((r, i) => (
          <div key={i} className="px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{r[0]}</div>
            <dl className="mt-1.5 grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm leading-relaxed">
              {v.columns.map((c, j) => (
                <Fragment key={c}>
                  <dt className="font-semibold text-fg">{c}</dt>
                  <dd className="text-fg-2">{inline(r[j + 1])}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2/60">
              <th className="sticky left-0 w-36 bg-surface-2 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">Aspect</th>
              {v.columns.map((c) => (
                <th key={c} className="px-3 py-2 text-left font-semibold text-fg">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {v.rows.map((r, i) => (
              <tr
                key={i}
                onMouseEnter={() => setHl(i)}
                onMouseLeave={() => setHl(null)}
                className={cn('border-t border-line align-top transition-colors', hl === i && 'bg-accent/5')}
              >
                <th scope="row" className="sticky left-0 bg-surface px-3 py-2.5 text-left text-xs font-semibold text-fg-2">{r[0]}</th>
                {r.slice(1).map((cell, j) => (
                  <td key={j} className="px-3 py-2.5 leading-relaxed text-fg-2">{inline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {v.note && <p className="border-t border-line px-4 py-2 text-[11px] text-muted">{v.note}</p>}
    </div>
  );
}

/* ---------- Sorting / classification game ---------- */

export function SortGame({ v, onComplete }: { v: SortVisual; onComplete?: (score: number) => void }) {
  const order = useMemo(() => shuffle(v.items.map((_, i) => i), mulberry32(seedFrom(v.title))), [v.items, v.title]);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const pool = order.filter((i) => placed[i] === undefined);
  const correct = v.items.filter((it, i) => placed[i] === it.bin).length;

  const place = (bin: string, idx = picked) => {
    if (idx === null || checked) return;
    setPlaced((p) => ({ ...p, [idx]: bin }));
    setPicked(null);
  };
  const unplace = (idx: number) => {
    if (checked) return;
    setPlaced((p) => {
      const n = { ...p };
      delete n[idx];
      return n;
    });
  };
  const check = () => {
    setChecked(true);
    onComplete?.(Math.round((correct / v.items.length) * 100));
  };
  const reset = () => {
    setPlaced({});
    setPicked(null);
    setChecked(false);
  };

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <h4 className="flex-1 text-sm font-semibold text-fg">{v.title}</h4>
        <Badge tone="accent">Interactive</Badge>
      </div>
      <div className="space-y-4 p-4">
        <p className="text-sm text-fg-2">
          {v.prompt ?? 'Sort each item into the correct group.'}{' '}
          <span className="text-muted">Tap an item, then tap a group — or drag it.</span>
        </p>

        <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-dashed border-line-strong p-2.5" aria-label="Unsorted items">
          {pool.length === 0 && <span className="self-center px-1 text-xs text-muted">All items placed{checked ? '' : ' — check your answers'}.</span>}
          {pool.map((i) => (
            <button
              key={i}
              type="button"
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', String(i))}
              onClick={() => setPicked(picked === i ? null : i)}
              aria-pressed={picked === i}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-left text-[13px] leading-snug transition-all',
                picked === i ? 'border-accent bg-accent/15 text-fg ring-2 ring-accent/40' : 'border-line bg-surface-2 text-fg-2 hover:border-line-strong',
              )}
            >
              {v.items[i].text}
            </button>
          ))}
        </div>

        <div className={cn('grid gap-3', v.bins.length <= 2 ? 'sm:grid-cols-2' : v.bins.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3')}>
          {v.bins.map((bin) => {
            const inBin = order.filter((i) => placed[i] === bin);
            return (
              <div
                key={bin}
                role="button"
                tabIndex={0}
                onClick={() => place(bin)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(bin); } }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); place(bin, Number(e.dataTransfer.getData('text/plain'))); }}
                aria-label={`Group: ${bin}${picked !== null ? ' (press to place selected item)' : ''}`}
                className={cn(
                  'min-h-24 rounded-xl border-2 p-2.5 transition-colors',
                  picked !== null && !checked ? 'cursor-pointer border-accent/50 bg-accent/5 hover:bg-accent/10' : 'border-line bg-surface-2/40',
                )}
              >
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-fg">{bin}</div>
                <div className="space-y-1.5">
                  {inBin.map((i) => {
                    const ok = v.items[i].bin === bin;
                    return (
                      <div
                        key={i}
                        className={cn(
                          'rounded-lg border px-2 py-1.5 text-[12.5px] leading-snug',
                          !checked && 'border-line bg-surface text-fg-2',
                          checked && ok && 'border-ok/40 bg-ok/10 text-fg',
                          checked && !ok && 'border-bad/40 bg-bad/10 text-fg',
                        )}
                      >
                        <div className="flex items-start gap-1.5">
                          {checked && (ok ? <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" /> : <CircleX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bad" />)}
                          <span className="flex-1">{v.items[i].text}</span>
                          {!checked && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); unplace(i); }} className="text-muted hover:text-fg" aria-label="Move back to unsorted">
                              <Undo2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {checked && (
                          <p className="mt-1 text-[11.5px] text-muted">
                            {!ok && <span className="font-semibold text-bad">Belongs in “{v.items[i].bin}”. </span>}
                            {v.items[i].why}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!checked ? (
            <Button variant="primary" size="sm" onClick={check} disabled={pool.length > 0}>
              <Check className="h-4 w-4" /> Check answers
            </Button>
          ) : (
            <>
              <span className={cn('text-sm font-semibold', correct === v.items.length ? 'text-ok' : 'text-fg')}>
                {correct}/{v.items.length} correct
              </span>
              <Button size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Try again
              </Button>
            </>
          )}
          {!checked && pool.length > 0 && <span className="text-xs text-muted">{pool.length} item{pool.length === 1 ? '' : 's'} left to place</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Before / after ---------- */

export function BeforeAfterViz({ v }: { v: BeforeAfterVisual }) {
  const [on, setOn] = useState(false);
  const side = on ? v.after : v.before;
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
        <h4 className="flex-1 text-sm font-semibold text-fg">{v.title}</h4>
        <Switch checked={on} onChange={setOn} label={v.toggle} />
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <SidePanel label={v.before.label} points={v.before.points} active={!on} kind="before" />
        <div className="hidden justify-center md:flex">
          <ArrowRight className={cn('h-6 w-6 transition-colors', on ? 'text-ok' : 'text-muted')} />
        </div>
        <SidePanel label={v.after.label} points={v.after.points} active={on} kind="after" />
      </div>
      <div className="px-4 pb-4" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={on ? 'a' : 'b'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn('rounded-lg px-3 py-2 text-sm', on ? 'bg-ok/10 text-fg' : 'bg-bad/10 text-fg')}
          >
            Showing: <strong>{side.label}</strong> — toggle “{v.toggle}” to compare.
          </motion.p>
        </AnimatePresence>
      </div>
      {v.note && <p className="border-t border-line px-4 py-2 text-[11px] text-muted">{v.note}</p>}
    </div>
  );
}

function SidePanel({ label, points, active, kind }: { label: string; points: string[]; active: boolean; kind: 'before' | 'after' }) {
  return (
    <div
      className={cn(
        'rounded-xl border-2 p-3.5 transition-all duration-300',
        active ? (kind === 'before' ? 'border-bad/50 bg-bad/5 shadow-md' : 'border-ok/50 bg-ok/5 shadow-md') : 'border-line opacity-55',
      )}
    >
      <div className={cn('mb-2 text-xs font-bold uppercase tracking-wide', kind === 'before' ? 'text-bad' : 'text-ok')}>{label}</div>
      <ul className="space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm text-fg-2">
            {kind === 'before' ? <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" /> : <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />}
            <span>{inline(p)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Dispatcher ---------- */

function visualLabel(v: Visual): string {
  switch (v.kind) {
    case 'sequence': return 'Flow';
    case 'timeline': return 'Timeline';
    case 'layers': return 'Layers';
    case 'compare': return 'Compare';
    case 'sort': return 'Sort it';
    case 'beforeAfter': return 'Before / after';
    case 'widget': return v.title ?? 'Interactive';
    default: return 'Visual';
  }
}

export function VisualRenderer({ v }: { v: Visual }) {
  const [tab, setTab] = useState('0');
  switch (v.kind) {
    case 'sequence': return <SequenceDiagram v={v} />;
    case 'timeline': return <TimelineViz v={v} />;
    case 'layers': return <LayersViz v={v} />;
    case 'compare': return <CompareViz v={v} />;
    case 'sort': return <SortGame v={v} />;
    case 'beforeAfter': return <BeforeAfterViz v={v} />;
    case 'widget': {
      const W = WIDGETS[v.widget];
      if (!W) return <div className="rounded-xl border border-bad/40 p-4 text-sm text-bad">Unknown widget “{v.widget}”.</div>;
      return (
        <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl border border-line bg-surface-2" />}>
          <W {...(v.props ?? {})} />
        </Suspense>
      );
    }
    case 'multi':
      return (
        <Tabs value={tab} onChange={setTab}>
          <TabList label="Visualizations" className="mb-3">
            {v.items.map((item, i) => (
              <Tab key={i} value={String(i)}>{'title' in item && item.title ? item.title : visualLabel(item)}</Tab>
            ))}
          </TabList>
          {v.items.map((item, i) => (
            tab === String(i) && <VisualRenderer key={i} v={item} />
          ))}
        </Tabs>
      );
  }
}
