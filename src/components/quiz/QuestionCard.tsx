import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { BookOpen, Check, CircleCheck, CircleX, Lightbulb, Search, Sparkles, X } from 'lucide-react';
import type { Question } from '@/types/content';
import { CONCEPT_BY_ID, conceptPath } from '@/content';
import { useProgress } from '@/store/progress';
import { Badge, Button, Callout } from '@/components/ui/primitives';
import { inline } from '@/components/ui/RichText';
import { cn, isTypingTarget, mulberry32, sameSet, seedFrom, shuffle } from '@/lib/utils';

export const LEVEL_LABEL = { 1: 'Beginner', 2: 'Intermediate', 3: 'Scenario' } as const;
export const KIND_LABEL = { concept: 'Concept', application: 'Application', scenario: 'Scenario', log: 'Log analysis', multi: 'Multiple response' } as const;

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wrap decisive clue phrases in <mark>. */
export function highlight(text: string, clues: string[] | undefined, on: boolean): ReactNode {
  if (!on || !clues?.length) return inline(text);
  const re = new RegExp(`(${clues.map(escapeRe).join('|')})`, 'gi');
  const parts = text.split(re);
  return parts.map((p, i) =>
    i % 2 === 1 ? <mark key={i} className="clue">{p}</mark> : <Fragment key={i}>{inline(p)}</Fragment>,
  );
}

/** Highlight clues in raw text (exhibits) without applying inline formatting. */
export function highlightPlain(text: string, clues: string[] | undefined, on: boolean): ReactNode {
  if (!on || !clues?.length) return text;
  const re = new RegExp(`(${clues.map(escapeRe).join('|')})`, 'gi');
  return text.split(re).map((p, i) => (i % 2 === 1 ? <mark key={i} className="clue">{p}</mark> : <Fragment key={i}>{p}</Fragment>));
}

export function useOptionOrder(q: Question, seed: string) {
  return useMemo(() => shuffle(q.options.map((_, i) => i), mulberry32(seedFrom(q.id + seed))), [q, seed]);
}

export interface QuestionCardProps {
  q: Question;
  mode?: 'practice' | 'exam' | 'review';
  selected?: number[];
  onSelect?: (sel: number[]) => void;
  onAnswered?: (correct: boolean, selected: number[]) => void;
  record?: boolean;
  seed?: string;
  hotkeys?: boolean;
  number?: number;
  footer?: ReactNode;
  compact?: boolean;
}

export function QuestionCard({
  q, mode = 'practice', selected: selProp, onSelect, onAnswered, record = true, seed = 'p', hotkeys = false, number, footer, compact,
}: QuestionCardProps) {
  const recordAnswer = useProgress((s) => s.recordAnswer);
  const [localSel, setLocalSel] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(mode === 'review');
  const selected = selProp ?? localSel;
  const order = useOptionOrder(q, seed);
  const multi = q.answer.length > 1;
  const correct = sameSet(selected, q.answer);
  const showFeedback = submitted && mode !== 'exam';
  const concept = CONCEPT_BY_ID.get(q.conceptId);

  useEffect(() => {
    if (mode !== 'review') {
      setSubmitted(false);
      if (!selProp) setLocalSel([]);
    }
  }, [q.id, mode, selProp]);

  const toggle = (idx: number) => {
    if (showFeedback) return;
    let next: number[];
    if (multi) {
      next = selected.includes(idx) ? selected.filter((i) => i !== idx) : [...selected, idx];
    } else {
      next = [idx];
    }
    if (!selProp) setLocalSel(next);
    onSelect?.(next);
  };

  const canSubmit = multi ? selected.length === q.answer.length : selected.length === 1;

  const submit = () => {
    if (!canSubmit || submitted) return;
    setSubmitted(true);
    const ok = sameSet(selected, q.answer);
    if (record) recordAnswer(q.id, selected, ok);
    onAnswered?.(ok, selected);
  };

  useEffect(() => {
    if (!hotkeys) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('[role="dialog"]')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= order.length) {
        e.preventDefault();
        toggle(order[n - 1]);
      } else if (e.key === 'Enter' && mode === 'practice' && !submitted && canSubmit) {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className={cn('rounded-2xl border border-line bg-surface', compact ? 'p-4' : 'p-4 sm:p-6')}>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {number !== undefined && <span className="mr-1 text-sm font-bold text-fg">Q{number}</span>}
        <Badge tone="accent">{q.objectiveId}</Badge>
        <Badge>{LEVEL_LABEL[q.level]}</Badge>
        {q.kind === 'log' && <Badge tone="info">Log analysis</Badge>}
        {multi && <Badge tone="warn">Choose {q.answer.length}</Badge>}
      </div>

      <div className="text-[15px] leading-relaxed text-fg sm:text-base">{highlight(q.stem, q.clues, showFeedback)}</div>

      {q.exhibit && (
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-[#0a0f1a] p-3 font-mono text-[11.5px] leading-relaxed text-emerald-200 wrap-anywhere sm:whitespace-pre sm:text-xs sm:wrap-normal">
          {highlightPlain(q.exhibit, q.clues, showFeedback)}
        </pre>
      )}

      <div className="mt-4 space-y-2" role={multi ? 'group' : 'radiogroup'} aria-label="Answer options">
        {order.map((idx, pos) => {
          const isSel = selected.includes(idx);
          const isAns = q.answer.includes(idx);
          const letter = String.fromCharCode(65 + pos);
          let state: 'idle' | 'sel' | 'right' | 'wrong' | 'missed' = isSel ? 'sel' : 'idle';
          if (showFeedback) state = isAns ? (isSel ? 'right' : 'missed') : isSel ? 'wrong' : 'idle';
          return (
            <div key={idx}>
              <button
                type="button"
                role={multi ? 'checkbox' : 'radio'}
                aria-checked={isSel}
                onClick={() => toggle(idx)}
                disabled={showFeedback}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm leading-relaxed transition-all',
                  state === 'idle' && 'border-line bg-surface-2/40 hover:border-line-strong hover:bg-surface-2',
                  state === 'sel' && 'border-accent bg-accent/10 ring-1 ring-accent/30',
                  state === 'right' && 'border-ok/60 bg-ok/10',
                  state === 'missed' && 'border-ok/60 border-dashed bg-ok/5',
                  state === 'wrong' && 'border-bad/60 bg-bad/10',
                  showFeedback && state === 'idle' && 'opacity-80',
                  'disabled:cursor-default',
                )}
              >
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center text-xs font-bold',
                    multi ? 'rounded-md' : 'rounded-full',
                    state === 'idle' && 'border border-line-strong text-muted',
                    state === 'sel' && 'bg-accent text-accent-fg',
                    (state === 'right' || state === 'missed') && 'bg-ok text-white dark:text-black',
                    state === 'wrong' && 'bg-bad text-white',
                  )}
                >
                  {state === 'right' || state === 'missed' ? <Check className="h-3.5 w-3.5" /> : state === 'wrong' ? <X className="h-3.5 w-3.5" /> : letter}
                </span>
                <span className="flex-1 text-fg">{inline(q.options[idx][0])}</span>
              </button>
              {showFeedback && (
                <p className={cn('ml-9 mt-1 text-[13px] leading-relaxed', isAns ? 'text-ok' : isSel ? 'text-bad' : 'text-muted')}>
                  <span className="font-semibold">{isAns ? (isSel ? 'Correct — ' : 'Also correct — ') : isSel ? 'Not this one — ' : 'Why not — '}</span>
                  {inline(q.options[idx][1])}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {mode === 'practice' && !submitted && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={submit} disabled={!canSubmit}>
            Submit answer
          </Button>
          <span className="text-xs text-muted">
            {multi ? `Select ${q.answer.length} answers.` : 'Select one answer.'} {hotkeys && 'Keys 1–6 select, Enter submits.'}
          </span>
        </div>
      )}

      {showFeedback && (
        <div className="mt-5 space-y-3">
          <div className={cn('flex items-center gap-2 text-base font-bold', correct ? 'text-ok' : 'text-bad')} aria-live="polite">
            {correct ? <CircleCheck className="h-5 w-5" /> : <CircleX className="h-5 w-5" />}
            {correct ? 'Correct!' : 'Not quite.'}
          </div>
          <Callout kind="exam" icon={<Lightbulb className="h-4 w-4 text-indigo-500" />} title="Explanation">
            {inline(q.explain)}
          </Callout>
          {q.clues && q.clues.length > 0 && (
            <Callout kind="warn" icon={<Search className="h-4 w-4 text-warn" />} title="Decisive clues (highlighted above)">
              <ul className="list-disc space-y-0.5 pl-5">
                {q.clues.map((c) => <li key={c}>“{c}”</li>)}
              </ul>
            </Callout>
          )}
          {q.vocab && q.vocab.length > 0 && (
            <Callout kind="note" title="Vocabulary">
              <dl className="grid gap-1.5 sm:grid-cols-[auto_1fr] sm:gap-x-4">
                {q.vocab.map(([w, m]) => (
                  <Fragment key={w}>
                    <dt className="font-semibold text-fg">{w}</dt>
                    <dd className="text-fg-2">{m}</dd>
                  </Fragment>
                ))}
              </dl>
            </Callout>
          )}
          {concept && (
            <div className="flex flex-col gap-3 rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-3.5 sm:flex-row sm:items-center">
              <Sparkles className="h-5 w-5 shrink-0 text-violet-500" />
              <div className="flex-1 text-sm">
                <div className="font-semibold text-fg">Why this answer? → {concept.title}</div>
                <div className="text-fg-2">{concept.tagline} <span className="text-muted">Memory aid: {concept.memory}</span></div>
              </div>
              <Link to={conceptPath(concept)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-fg hover:border-accent">
                <BookOpen className="h-4 w-4" /> Open lesson
              </Link>
            </div>
          )}
        </div>
      )}
      {footer}
    </div>
  );
}
