import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlarmClock, ArrowLeft, ArrowRight, Flag, Grid3x3, History, Info, Play, Send, Timer, Trash2 } from 'lucide-react';
import type { DomainId } from '@/types/content';
import { DOMAINS, DOMAIN_BY_ID, OBJECTIVE_BY_ID, QUESTIONS, QUESTION_BY_ID } from '@/content';
import { domainStyle } from '@/content/domains';
import { useProgress, type ActiveExam, type ExamResult } from '@/store/progress';
import { allocate, pickExamQuestions } from '@/lib/quiz';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, Callout, Card, Dialog, ProgressBar, Switch } from '@/components/ui/primitives';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { cn, formatDuration, pct, sameSet } from '@/lib/utils';

const LENGTHS = [10, 30, 60, 90];

export default function MockExam() {
  const active = useProgress((s) => s.activeExam);
  const exams = useProgress((s) => s.exams);
  const [params, setParams] = useSearchParams();
  const resultId = params.get('result');
  const result = resultId ? exams.find((e) => e.id === resultId) : undefined;

  if (active) return <ExamRunner exam={active} onFinished={(id) => setParams({ result: id })} />;
  if (result) return <ExamResults result={result} onBack={() => setParams({})} />;
  return <ExamSetup />;
}

function ExamSetup() {
  const startExam = useProgress((s) => s.startExam);
  const exams = useProgress((s) => s.exams);
  const [, setParams] = useSearchParams();
  const [count, setCount] = useState(90);
  const [timed, setTimed] = useState(true);
  const [minutes, setMinutes] = useState(90);
  const available = QUESTIONS.length;
  const n = Math.min(count, available);
  const alloc = allocate(n, DOMAINS.map((d) => d.weight));

  useEffect(() => setMinutes(Math.max(5, Math.round(count))), [count]);

  const start = () => {
    const qs = pickExamQuestions(n);
    const exam: ActiveExam = {
      id: `exam-${Date.now()}`,
      questionIds: qs.map((q) => q.id),
      answers: {},
      flagged: [],
      current: 0,
      startedAt: Date.now(),
      timeLimitSec: timed ? minutes * 60 : null,
    };
    startExam(exam);
  };

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Mock Exam' }]}
        title="Mock Exam"
        subtitle="A mixed-domain exam drawn from the question bank and weighted by the official domain percentages. No feedback until you submit — just like the real thing."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 font-semibold text-fg">Configure your exam</h2>
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Number of questions</div>
              <div className="flex flex-wrap gap-2">
                {LENGTHS.map((l) => (
                  <Button key={l} variant={count === l ? 'primary' : 'secondary'} onClick={() => setCount(l)} disabled={l > available && l !== LENGTHS[0]}>
                    {l}
                  </Button>
                ))}
              </div>
              {available < count && <p className="mt-2 text-xs text-warn">Only {available} questions exist in the bank so far; the exam will use all of them.</p>}
            </div>
            <div className="space-y-3">
              <Switch checked={timed} onChange={setTimed} label="Timed exam" description="Auto-submits when time runs out. The real exam allows 90 minutes for up to 90 questions." />
              {timed && (
                <label className="flex items-center gap-3 text-sm">
                  <span className="text-fg-2">Time limit</span>
                  <input type="range" min={5} max={180} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" aria-label="Time limit in minutes" />
                  <span className="w-20 text-right font-semibold tabular-nums text-fg">{minutes} min</span>
                </label>
              )}
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Domain mix for {n} questions</div>
              <div className="space-y-1.5">
                {DOMAINS.map((d, i) => (
                  <div key={d.id} className="flex items-center gap-3 text-sm">
                    <span className={cn('h-2.5 w-2.5 rounded-full', domainStyle(d.id).dot)} />
                    <span className="flex-1 text-fg-2">{d.number}.0 {d.title}</span>
                    <span className="text-xs text-muted">{d.weight}%</span>
                    <span className="w-8 text-right font-semibold tabular-nums text-fg">{alloc[i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="primary" size="lg" onClick={start}><Play className="h-4 w-4" /> Start {n}-question exam</Button>
          </div>
        </Card>
        <div className="space-y-3">
          <Callout kind="info" icon={<Info className="h-4 w-4 text-info" />} title="Scoring">
            You get a <strong>raw score</strong> plus per-domain and per-objective breakdowns. CompTIA reports a scaled score (100–900, pass = 750) using a method that isn’t public, so this app does not pretend to convert. Aim for consistent 85%+ raw scores across domains.
          </Callout>
          <Callout kind="note" title="Real exam note">
            The real exam also contains performance-based questions (PBQs). Practise those separately in the <Link to="/pbq" className="font-medium text-accent hover:underline">PBQ simulator</Link>.
          </Callout>
          {exams.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg"><History className="h-4 w-4" /> Previous exams</h3>
              <ul className="space-y-1">
                {[...exams].reverse().slice(0, 8).map((e) => (
                  <li key={e.id}>
                    <button type="button" onClick={() => setParams({ result: e.id })} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                      <span className="text-fg-2">{new Date(e.ts).toLocaleDateString()} · {e.total} Q</span>
                      <span className={cn('font-semibold tabular-nums', pct(e.correct, e.total) >= 80 ? 'text-ok' : pct(e.correct, e.total) >= 65 ? 'text-warn' : 'text-bad')}>{pct(e.correct, e.total)}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ExamRunner({ exam, onFinished }: { exam: ActiveExam; onFinished: (id: string) => void }) {
  const updateExam = useProgress((s) => s.updateExam);
  const finishExam = useProgress((s) => s.finishExam);
  const abandonExam = useProgress((s) => s.abandonExam);
  const recordAnswer = useProgress((s) => s.recordAnswer);
  const [now, setNow] = useState(Date.now());
  const [gridOpen, setGridOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [quit, setQuit] = useState(false);
  const questions = useMemo(() => exam.questionIds.map((id) => QUESTION_BY_ID.get(id)).filter((q): q is NonNullable<typeof q> => !!q), [exam.questionIds]);
  const q = questions[exam.current];
  const elapsed = Math.floor((now - exam.startedAt) / 1000);
  const remaining = exam.timeLimitSec !== null ? exam.timeLimitSec - elapsed : null;
  const answeredCount = questions.filter((x) => (exam.answers[x.id] ?? []).length > 0).length;

  const submit = () => {
    const byDomain: ExamResult['byDomain'] = {};
    const byObjective: ExamResult['byObjective'] = {};
    let correct = 0;
    const answers = questions.map((x) => {
      const sel = exam.answers[x.id] ?? [];
      const ok = sameSet(sel, x.answer);
      if (ok) correct++;
      const d = byDomain[x.domainId] ?? [0, 0];
      byDomain[x.domainId] = [d[0] + (ok ? 1 : 0), d[1] + 1];
      const o = byObjective[x.objectiveId] ?? [0, 0];
      byObjective[x.objectiveId] = [o[0] + (ok ? 1 : 0), o[1] + 1];
      if (sel.length) recordAnswer(x.id, sel, ok);
      return { qid: x.id, selected: sel, correct: ok, flagged: exam.flagged.includes(x.id) };
    });
    const result: ExamResult = {
      id: exam.id, ts: Date.now(), total: questions.length, correct,
      durationSec: Math.min(elapsed, exam.timeLimitSec ?? elapsed), timeLimitSec: exam.timeLimitSec, byDomain, byObjective, answers,
    };
    finishExam(result);
    onFinished(result.id);
  };

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (remaining !== null && remaining <= 0) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  if (!q) return null;
  const flagged = exam.flagged.includes(q.id);
  const go = (i: number) => updateExam({ current: Math.max(0, Math.min(questions.length - 1, i)) });

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <span className="text-sm font-semibold text-fg">Question {exam.current + 1} / {questions.length}</span>
        <ProgressBar value={pct(answeredCount, questions.length)} className="max-w-48 flex-1" label="Answered" />
        <span className="text-xs text-muted">{answeredCount} answered</span>
        <div className="ml-auto flex items-center gap-2">
          {remaining !== null && (
            <span className={cn('flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-sm font-semibold tabular-nums', remaining < 300 ? 'bg-bad/15 text-bad' : remaining < 600 ? 'bg-warn/15 text-warn' : 'bg-surface-2 text-fg')} role="timer" aria-label="Time remaining">
              <AlarmClock className="h-4 w-4" /> {formatDuration(Math.max(0, remaining))}
            </span>
          )}
          {remaining === null && <span className="flex items-center gap-1 text-sm text-muted"><Timer className="h-4 w-4" /> {formatDuration(elapsed)}</span>}
          <Button size="sm" onClick={() => setGridOpen(true)}><Grid3x3 className="h-4 w-4" /> <span className="max-sm:hidden">Navigator</span></Button>
          <Button size="sm" variant="primary" onClick={() => setConfirm(true)}><Send className="h-4 w-4" /> <span className="max-sm:hidden">Submit</span></Button>
        </div>
      </div>

      <QuestionCard
        key={q.id}
        q={q}
        mode="exam"
        record={false}
        seed={exam.id}
        hotkeys
        number={exam.current + 1}
        selected={exam.answers[q.id] ?? []}
        onSelect={(sel) => updateExam({ answers: { ...exam.answers, [q.id]: sel } })}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => go(exam.current - 1)} disabled={exam.current === 0}><ArrowLeft className="h-4 w-4" /> Previous</Button>
        <Button
          variant={flagged ? 'primary' : 'outline'}
          onClick={() => updateExam({ flagged: flagged ? exam.flagged.filter((id) => id !== q.id) : [...exam.flagged, q.id] })}
          aria-pressed={flagged}
        >
          <Flag className="h-4 w-4" /> {flagged ? 'Flagged' : 'Flag for review'}
        </Button>
        <Button variant="primary" className="ml-auto" onClick={() => (exam.current + 1 < questions.length ? go(exam.current + 1) : setConfirm(true))}>
          {exam.current + 1 < questions.length ? <>Next <ArrowRight className="h-4 w-4" /></> : <>Review & submit <Send className="h-4 w-4" /></>}
        </Button>
      </div>
      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={() => setQuit(true)}><Trash2 className="h-4 w-4" /> Abandon exam</Button>
      </div>

      <Dialog open={gridOpen} onClose={() => setGridOpen(false)} title="Question navigator" wide>
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-accent" /> answered</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-line-strong" /> unanswered</span>
          <span className="flex items-center gap-1"><Flag className="h-3 w-3 text-warn" /> flagged</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
          {questions.map((x, i) => {
            const ans = (exam.answers[x.id] ?? []).length > 0;
            const fl = exam.flagged.includes(x.id);
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => { go(i); setGridOpen(false); }}
                className={cn(
                  'relative h-10 rounded-lg text-sm font-semibold tabular-nums transition-colors',
                  ans ? 'bg-accent text-accent-fg' : 'border border-line-strong text-fg-2 hover:bg-surface-2',
                  i === exam.current && 'ring-2 ring-fg',
                )}
                aria-label={`Question ${i + 1}${ans ? ', answered' : ''}${fl ? ', flagged' : ''}`}
              >
                {i + 1}
                {fl && <Flag className="absolute -right-1 -top-1 h-3.5 w-3.5 fill-warn text-warn" />}
              </button>
            );
          })}
        </div>
      </Dialog>

      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Submit exam?"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirm(false)}>Keep working</Button>
            <Button variant="primary" onClick={submit}><Send className="h-4 w-4" /> Submit now</Button>
          </div>
        }
      >
        <p className="text-sm text-fg-2">
          You answered <strong>{answeredCount}</strong> of {questions.length} questions.
          {questions.length - answeredCount > 0 && <> <strong className="text-bad">{questions.length - answeredCount} unanswered</strong> will be marked incorrect.</>}
          {exam.flagged.length > 0 && <> You flagged <strong className="text-warn">{exam.flagged.length}</strong> for review.</>}
        </p>
      </Dialog>

      <Dialog
        open={quit}
        onClose={() => setQuit(false)}
        title="Abandon this exam?"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setQuit(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => abandonExam()}>Abandon without scoring</Button>
          </div>
        }
      >
        <p className="text-sm text-fg-2">Your answers in this exam will be discarded and won’t count toward mastery.</p>
      </Dialog>
    </div>
  );
}

function ExamResults({ result, onBack }: { result: ExamResult; onBack: () => void }) {
  const [filter, setFilter] = useState<'all' | 'wrong' | 'flagged'>('wrong');
  const score = pct(result.correct, result.total);
  const list = result.answers.filter((a) => filter === 'all' || (filter === 'wrong' ? !a.correct : a.flagged));
  const objectives = Object.entries(result.byObjective).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Mock Exam', to: '/mock-exam' }, { label: 'Results' }]}
        title="Exam results"
        subtitle={`${new Date(result.ts).toLocaleString()} · ${result.total} questions · time used ${formatDuration(result.durationSec)}${result.timeLimitSec ? ` of ${formatDuration(result.timeLimitSec)}` : ''}`}
        actions={<Button onClick={onBack}><ArrowLeft className="h-4 w-4" /> New exam</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className={cn('text-5xl font-bold tabular-nums', score >= 85 ? 'text-ok' : score >= 70 ? 'text-warn' : 'text-bad')}>{score}%</div>
          <div className="mt-1 text-sm text-fg-2">{result.correct} of {result.total} correct (raw score)</div>
          <div className="mt-3 text-xs text-muted">{score >= 85 ? 'Exam-ready pace — keep it consistent.' : score >= 70 ? 'Close. Target the weakest objectives below.' : 'Rebuild foundations with the linked lessons.'}</div>
          <div className="mt-2 text-[11px] text-muted">Not converted to CompTIA’s 100–900 scaled score.</div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-fg">By domain</h2>
          <div className="space-y-2.5">
            {DOMAINS.map((d) => {
              const v = result.byDomain[d.id as DomainId];
              if (!v) return null;
              const p = pct(v[0], v[1]);
              return (
                <div key={d.id} className="flex items-center gap-3 text-sm">
                  <span className="w-48 truncate text-fg-2 sm:w-64">{d.number}.0 {DOMAIN_BY_ID[d.id].title}</span>
                  <ProgressBar value={p} tone={p >= 80 ? 'ok' : p >= 65 ? 'warn' : 'bad'} className="flex-1" />
                  <span className="w-16 text-right tabular-nums text-muted">{v[0]}/{v[1]}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <h2 className="mb-3 text-sm font-semibold text-fg">By objective (weakest first)</h2>
        <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
          {objectives.sort((a, b) => pct(a[1][0], a[1][1]) - pct(b[1][0], b[1][1])).map(([oid, [c, t]]) => (
            <Link key={oid} to={`/learn/d${oid.charAt(0)}/${oid}`} className="flex items-center gap-3 rounded-lg px-1 py-0.5 text-sm hover:bg-surface-2">
              <span className="w-10 font-mono text-xs font-semibold text-fg">{oid}</span>
              <span className="flex-1 truncate text-fg-2">{OBJECTIVE_BY_ID[oid as keyof typeof OBJECTIVE_BY_ID]?.title}</span>
              <Badge tone={pct(c, t) >= 80 ? 'ok' : pct(c, t) >= 60 ? 'warn' : 'bad'}>{c}/{t}</Badge>
            </Link>
          ))}
        </div>
      </Card>
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="flex-1 text-lg font-semibold text-fg">Review answers</h2>
          {(['wrong', 'flagged', 'all'] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'primary' : 'secondary'} onClick={() => setFilter(f)}>
              {f === 'wrong' ? `Incorrect (${result.answers.filter((a) => !a.correct).length})` : f === 'flagged' ? `Flagged (${result.answers.filter((a) => a.flagged).length})` : `All (${result.total})`}
            </Button>
          ))}
        </div>
        <div className="space-y-4">
          {list.map((a) => {
            const q = QUESTION_BY_ID.get(a.qid);
            if (!q) return null;
            const idx = result.answers.findIndex((x) => x.qid === a.qid);
            return (
              <div key={a.qid}>
                {a.selected.length === 0 && <Badge tone="bad" className="mb-1">Not answered</Badge>}
                <QuestionCard q={q} mode="review" selected={a.selected} record={false} seed={result.id} number={idx + 1} />
              </div>
            );
          })}
          {list.length === 0 && <p className="text-sm text-muted">Nothing to show for this filter.</p>}
        </div>
      </div>
    </div>
  );
}
