import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CircleCheck, CircleX, RotateCcw, Trophy } from 'lucide-react';
import type { Question } from '@/types/content';
import { CONCEPT_BY_ID, conceptPath, objectiveLabel } from '@/content';
import { QuestionCard } from './QuestionCard';
import { Badge, Button, Card, ProgressBar } from '@/components/ui/primitives';
import { cn, pct } from '@/lib/utils';

export function QuizSession({ questions, onExit, title, seed = 's' }: {
  questions: Question[]; onExit?: () => void; title?: string; seed?: string;
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);
  const [retry, setRetry] = useState<Question[] | null>(null);
  const [round, setRound] = useState(0);

  const list = retry ?? questions;
  const q = list[index];
  const correctCount = Object.values(results).filter(Boolean).length;

  const byObjective = useMemo(() => {
    const m = new Map<string, [number, number]>();
    for (const item of list) {
      if (results[item.id] === undefined) continue;
      const cur = m.get(item.objectiveId) ?? [0, 0];
      m.set(item.objectiveId, [cur[0] + (results[item.id] ? 1 : 0), cur[1] + 1]);
    }
    return [...m.entries()].sort();
  }, [list, results]);

  if (!list.length) return null;

  if (done) {
    const total = list.length;
    const score = pct(correctCount, total);
    const wrong = list.filter((x) => results[x.id] === false);
    return (
      <Card className="p-5 sm:p-7">
        <div className="flex flex-col items-center text-center">
          <Trophy className={cn('h-10 w-10', score >= 80 ? 'text-ok' : score >= 60 ? 'text-warn' : 'text-bad')} />
          <h2 className="mt-2 text-2xl font-bold text-fg">{correctCount} / {total} correct ({score}%)</h2>
          <p className="mt-1 text-sm text-muted">{score >= 80 ? 'Strong recall — these topics move toward mastery.' : 'Review the lessons linked below, then retry the misses.'}</p>
        </div>
        {byObjective.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold text-fg">By objective</h3>
            {byObjective.map(([oid, [c, t]]) => (
              <div key={oid} className="flex items-center gap-3 text-sm">
                <span className="w-56 truncate text-fg-2">{objectiveLabel(oid)}</span>
                <ProgressBar value={pct(c, t)} tone={pct(c, t) >= 80 ? 'ok' : pct(c, t) >= 60 ? 'warn' : 'bad'} className="flex-1" />
                <span className="w-12 text-right tabular-nums text-muted">{c}/{t}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 space-y-1.5">
          <h3 className="text-sm font-semibold text-fg">Questions</h3>
          {list.map((x, i) => {
            const c = CONCEPT_BY_ID.get(x.conceptId);
            return (
              <div key={x.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                {results[x.id] ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" />}
                <span className="flex-1 text-fg-2"><span className="font-semibold text-fg">Q{i + 1}.</span> {x.stem.length > 140 ? `${x.stem.slice(0, 140)}…` : x.stem}</span>
                {c && <Link to={conceptPath(c)} className="shrink-0 text-xs font-medium text-accent hover:underline">Lesson</Link>}
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {wrong.length > 0 && (
            <Button variant="primary" onClick={() => { setRetry(wrong); setIndex(0); setResults({}); setAnswered(false); setDone(false); setRound((r) => r + 1); }}>
              <RotateCcw className="h-4 w-4" /> Retry {wrong.length} incorrect
            </Button>
          )}
          <Button onClick={() => { setRetry(null); setIndex(0); setResults({}); setAnswered(false); setDone(false); setRound((r) => r + 1); }}>
            Restart session
          </Button>
          {onExit && <Button variant="ghost" onClick={onExit}>Back to setup</Button>}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {title && <h2 className="hidden text-sm font-semibold text-fg sm:block">{title}</h2>}
        {retry && <Badge tone="warn">Retry round</Badge>}
        <ProgressBar value={pct(index + (answered ? 1 : 0), list.length)} className="flex-1" label="Session progress" />
        <span className="text-xs tabular-nums text-muted">{index + 1}/{list.length}</span>
        <span className="text-xs font-semibold tabular-nums text-ok">{correctCount} ✓</span>
      </div>
      <QuestionCard
        key={`${q.id}-${round}`}
        q={q}
        hotkeys
        seed={`${seed}-${round}`}
        number={index + 1}
        onAnswered={(ok) => { setResults((r) => ({ ...r, [q.id]: ok })); setAnswered(true); }}
        footer={
          answered && (
            <div className="mt-5 flex justify-end">
              <Button
                variant="primary"
                data-autofocus
                onClick={() => {
                  if (index + 1 >= list.length) setDone(true);
                  else { setIndex((i) => i + 1); setAnswered(false); }
                }}
              >
                {index + 1 >= list.length ? 'See results' : 'Next question'} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )
        }
      />
      {onExit && (
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onExit}>End session</Button>
        </div>
      )}
    </div>
  );
}
