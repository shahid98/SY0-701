import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Reorder } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, Clock, GripVertical, RotateCcw } from 'lucide-react';
import { PBQS, PBQ_BY_ID, type PBQ } from '@/content/pbqs';
import { objectivePath } from '@/content';
import { useProgress } from '@/store/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, Callout } from '@/components/ui/primitives';
import { ClassifyTable, ResultBanner } from '@/components/labs/kit';
import { FirewallTaskEditor } from '@/components/labs/FirewallLab';
import { SortGame } from '@/components/viz/Visuals';
import { cn, mulberry32, seedFrom, shuffle } from '@/lib/utils';
import NotFound from './NotFound';

function OrderTask({ p, onScore }: { p: Extract<PBQ, { kind: 'order' }>; onScore: (s: number) => void }) {
  const [order, setOrder] = useState(() => shuffle(p.steps.map((s) => s.text), mulberry32(seedFrom(p.id))));
  const [checked, setChecked] = useState(false);
  const right = order.filter((t, i) => t === p.steps[i].text).length;
  const move = (i: number, d: -1 | 1) => setOrder((o) => {
    const j = i + d;
    if (j < 0 || j >= o.length) return o;
    const n = o.slice();
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  return (
    <div className="space-y-3">
      <Reorder.Group axis="y" values={order} onReorder={(v) => !checked && setOrder(v)} className="space-y-1.5">
        {order.map((t, i) => {
          const correctIdx = p.steps.findIndex((s) => s.text === t);
          return (
            <Reorder.Item key={t} value={t} className={cn('flex cursor-grab items-start gap-2 rounded-xl border bg-surface px-3 py-2.5 active:cursor-grabbing', checked ? (correctIdx === i ? 'border-ok/50 bg-ok/5' : 'border-bad/50 bg-bad/5') : 'border-line')}>
              <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <span className="w-5 text-xs font-bold text-muted">{i + 1}</span>
              <span className="flex-1 text-sm text-fg">
                {t}
                {checked && <span className={cn('mt-0.5 block text-xs', correctIdx === i ? 'text-ok' : 'text-bad')}>{correctIdx === i ? '✓ ' : `Should be step ${correctIdx + 1}. `}{p.steps[correctIdx].why}</span>}
              </span>
              {!checked && (
                <span className="flex gap-0.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 pointer-coarse:h-10 pointer-coarse:w-10" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                </span>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {!checked ? (
        <Button variant="primary" onClick={() => { setChecked(true); onScore(Math.round((right / p.steps.length) * 100)); }}><Check className="h-4 w-4" /> Submit order</Button>
      ) : (
        <ResultBanner score={right} total={p.steps.length} onRetry={() => { setChecked(false); setOrder(shuffle(p.steps.map((s) => s.text))); }} message="steps in the correct position" />
      )}
    </div>
  );
}

export default function PbqPage() {
  const { pbqId } = useParams();
  const p = pbqId ? PBQ_BY_ID[pbqId] : undefined;
  const record = useProgress((s) => s.recordPbq);
  const rec = useProgress((s) => (pbqId ? s.pbqs[pbqId] : undefined));
  const [round, setRound] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  if (!p) return <NotFound what="PBQ" />;
  const idx = PBQS.findIndex((x) => x.id === p.id);
  const next = PBQS[idx + 1];
  const score = (s: number) => { setLast(s); record(p.id, s); };

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'PBQ Simulator', to: '/pbq' }, { label: p.title }]}
        eyebrow={
          <>
            <Badge tone="warn">PBQ {idx + 1}/{PBQS.length}</Badge>
            {p.objectives.map((o) => <Link key={o} to={objectivePath(o)} className="inline-flex items-center pointer-coarse:min-h-9"><Badge tone="accent">Objective {o}</Badge></Link>)}
            <Badge><Clock className="h-3 w-3" />~{p.minutes} min</Badge>
            {rec && <Badge tone={rec.best >= 80 ? 'ok' : 'warn'}>Best {rec.best}% · {rec.attempts} attempt{rec.attempts === 1 ? '' : 's'}</Badge>}
          </>
        }
        title={p.title}
        subtitle={p.brief}
        actions={<Button onClick={() => { setRound((r) => r + 1); setLast(null); }}><RotateCcw className="h-4 w-4" /> Reset</Button>}
      />
      <div key={round}>
        {p.kind === 'table' && <ClassifyTable items={p.items} checkLabel="Submit PBQ" onScored={(c, t) => score(Math.round((c / t) * 100))} />}
        {p.kind === 'sort' && <SortGame v={p.sort} onComplete={score} />}
        {p.kind === 'order' && <OrderTask p={p} onScore={score} />}
        {p.kind === 'firewall' && (
          <FirewallTaskEditor task={p.task} onResult={(out) => score(Math.round((out.filter(Boolean).length / out.length) * 100))} />
        )}
      </div>
      {last !== null && (
        <div className="mt-6 space-y-3">
          <Callout kind={last >= 80 ? 'ok' : 'warn'} title={`PBQ score: ${last}%`}>
            {last >= 80 ? 'Strong result. ' : 'Review the explanations above, then reset and try again. '}Partial credit is per item, as on the real exam.
          </Callout>
          {next && <Link to={`/pbq/${next.id}`} className="inline-block text-sm font-medium text-accent hover:underline">Next PBQ: {next.title} →</Link>}
        </div>
      )}
    </div>
  );
}
