import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, Brain, CircleAlert, CircleCheck, CircleX, Clock, Eye, ListChecks, Map as MapIcon, RotateCcw, Telescope } from 'lucide-react';
import { CONCEPTS, OBJECTIVES, QUESTIONS, conceptPath, objectiveLabel, objectivePath } from '@/content';
import { FLASHCARDS } from '@/content/flashcards';
import { useProgress } from '@/store/progress';
import { STATUS_META, useMastery } from '@/lib/mastery';
import { coverageReport } from '@/lib/coverage';
import { isDue } from '@/lib/srs';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, ButtonLink, Card, EmptyState, ProgressBar, Tab, TabList, TabPanel, Tabs } from '@/components/ui/primitives';
import { StatusIcon } from '@/components/ui/StatusIcon';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { cn, groupBy } from '@/lib/utils';

export default function Revision() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'queue';
  const answers = useProgress((s) => s.answers);
  const cards = useProgress((s) => s.cards);
  const lessons = useProgress((s) => s.lessons);
  const mastery = useMastery();
  const now = Date.now();

  const wrong = useMemo(() => QUESTIONS.filter((q) => answers[q.id] && !answers[q.id].lastCorrect), [answers]);
  const due = useMemo(() => FLASHCARDS.filter((f) => isDue(cards[f.id], now)), [cards, now]);
  const weak = useMemo(() => CONCEPTS.filter((c) => mastery.concept.get(c.id)!.status === 'weak'), [mastery]);
  const reviewDue = useMemo(() => CONCEPTS.filter((c) => mastery.concept.get(c.id)!.status === 'review'), [mastery]);
  const practicing = useMemo(() => CONCEPTS.filter((c) => mastery.concept.get(c.id)!.status === 'practiced'), [mastery]);
  const readNotPracticed = useMemo(() => CONCEPTS.filter((c) => mastery.concept.get(c.id)!.status === 'started'), [mastery]);
  const untouchedObjectives = useMemo(() => OBJECTIVES.filter((o) => mastery.objective.get(o.id)!.started === 0), [mastery]);
  const weakObjectives = useMemo(
    () => OBJECTIVES.filter((o) => { const m = mastery.objective.get(o.id)!; return m.started > 0 && m.score < 70; }).sort((a, b) => mastery.objective.get(a.id)!.score - mastery.objective.get(b.id)!.score),
    [mastery],
  );

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Revision Center' }]}
        title="Revision Center"
        subtitle="Your mistakes, weak topics and gaps — prioritised. Work the queue top to bottom for the most efficient revision."
      />
      <Tabs value={tab} onChange={(t) => setParams({ tab: t })}>
        <TabList label="Revision sections" className="mb-5">
          <Tab value="queue"><ListChecks className="h-4 w-4" /> Revision queue</Tab>
          <Tab value="wrong"><CircleX className="h-4 w-4" /> Incorrect answers ({wrong.length})</Tab>
          <Tab value="weak"><CircleAlert className="h-4 w-4" /> Weak topics ({weak.length + reviewDue.length})</Tab>
          <Tab value="missing"><Telescope className="h-4 w-4" /> What am I missing?</Tab>
        </TabList>

        <TabPanel value="queue">
          <ol className="space-y-3">
            <QueueStep n={1} icon={<Brain className="h-5 w-5" />} title={`Review ${due.length} due flashcard${due.length === 1 ? '' : 's'}`} text="Spaced repetition works best when you review cards on the day they are due." done={due.length === 0} action={<ButtonLink to="/flashcards" variant={due.length ? 'primary' : 'secondary'} size="sm">Open flashcards</ButtonLink>} />
            <QueueStep n={2} icon={<RotateCcw className="h-5 w-5" />} title={`Re-attempt ${wrong.length} incorrect question${wrong.length === 1 ? '' : 's'}`} text="Questions whose latest answer was wrong. Read the explanation, then answer again." done={wrong.length === 0} action={wrong.length > 0 && <ButtonLink to={`/practice?ids=${wrong.slice(0, 40).map((q) => q.id).join(',')}`} variant="primary" size="sm">Retry {Math.min(40, wrong.length)}</ButtonLink>} />
            <QueueStep n={3} icon={<CircleAlert className="h-5 w-5" />} title={`Relearn ${weak.length} weak lesson${weak.length === 1 ? '' : 's'}`} text="Lessons where fewer than 60% of your latest answers are correct." done={weak.length === 0} action={weak[0] && <ButtonLink to={conceptPath(weak[0])} size="sm" className="max-w-full" title={weak[0].title}><span className="truncate">Start: {weak[0].title}</span></ButtonLink>} />
            <QueueStep n={4} icon={<Clock className="h-5 w-5" />} title={`Refresh ${reviewDue.length} mastered lesson${reviewDue.length === 1 ? '' : 's'} not practised for 3+ weeks`} text="Mastery decays. A quick knowledge check keeps it." done={reviewDue.length === 0} action={reviewDue[0] && <ButtonLink to={conceptPath(reviewDue[0])} size="sm">Refresh first</ButtonLink>} />
            <QueueStep n={5} icon={<Eye className="h-5 w-5" />} title={`Finish ${readNotPracticed.length} lesson${readNotPracticed.length === 1 ? '' : 's'} you read but never practised`} text="Reading isn’t mastery — answer the knowledge check to prove recall." done={readNotPracticed.length === 0} action={readNotPracticed[0] && <ButtonLink to={conceptPath(readNotPracticed[0])} size="sm">Continue</ButtonLink>} />
            <QueueStep n={6} icon={<MapIcon className="h-5 w-5" />} title={`Start ${untouchedObjectives.length} untouched objective${untouchedObjectives.length === 1 ? '' : 's'}`} text="Objectives where you haven’t opened a single lesson yet." done={untouchedObjectives.length === 0} action={untouchedObjectives[0] && <ButtonLink to={objectivePath(untouchedObjectives[0].id)} size="sm">Open {untouchedObjectives[0].id}</ButtonLink>} />
          </ol>
        </TabPanel>

        <TabPanel value="wrong">
          {wrong.length === 0 ? (
            <EmptyState icon={<CircleCheck className="h-8 w-8 text-ok" />} title="No incorrect answers right now">Every question you have answered is currently correct. Keep practising new questions.</EmptyState>
          ) : (
            <WrongList ids={wrong.map((q) => q.id)} />
          )}
        </TabPanel>

        <TabPanel value="weak">
          <div className="grid gap-4 lg:grid-cols-2">
            <ConceptList title="Needs work (<60% latest-correct)" items={weak} empty="No weak lessons — nice." />
            <ConceptList title="Review due (mastered 3+ weeks ago)" items={reviewDue} empty="Nothing has decayed yet." />
            <ConceptList title="In progress (practised, not yet mastered)" items={practicing} empty="No lessons in progress." />
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-fg">Weakest objectives (started, under 70%)</h3>
              {weakObjectives.length === 0 ? <p className="text-sm text-muted">None.</p> : (
                <ul className="space-y-2">
                  {weakObjectives.map((o) => {
                    const m = mastery.objective.get(o.id)!;
                    return (
                      <li key={o.id}>
                        <Link to={objectivePath(o.id)} className="block rounded-lg px-2 py-1 hover:bg-surface-2">
                          <div className="flex justify-between text-sm"><span className="text-fg-2">{objectiveLabel(o.id)}</span><span className="font-semibold tabular-nums text-fg">{m.score}%</span></div>
                          <ProgressBar value={m.score} size="sm" tone={m.score < 50 ? 'bad' : 'warn'} className="mt-1" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="missing">
          <MissingReport untouched={untouchedObjectives.map((o) => o.id)} lessonsOpened={Object.keys(lessons).length} />
        </TabPanel>
      </Tabs>
    </div>
  );
}

function QueueStep({ n, icon, title, text, done, action }: { n: number; icon: React.ReactNode; title: string; text: string; done: boolean; action?: React.ReactNode }) {
  return (
    <li>
      <Card className={cn('flex flex-col gap-3 p-4 sm:flex-row sm:items-center', done && 'opacity-60')}>
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', done ? 'bg-ok/12 text-ok' : 'bg-accent/12 text-accent')}>{done ? <CircleCheck className="h-5 w-5" /> : icon}</div>
        <div className="flex-1">
          <div className="font-semibold text-fg"><span className="mr-1.5 text-muted">{n}.</span>{title}</div>
          <div className="text-sm text-muted">{text}</div>
        </div>
        {!done && action}
      </Card>
    </li>
  );
}

function ConceptList({ title, items, empty }: { title: string; items: typeof CONCEPTS; empty: string }) {
  const mastery = useMastery();
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-fg">{title}</h3>
      {items.length === 0 ? <p className="text-sm text-muted">{empty}</p> : (
        <ul className="space-y-1">
          {items.map((c) => {
            const m = mastery.concept.get(c.id)!;
            return (
              <li key={c.id}>
                <Link to={conceptPath(c)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                  <StatusIcon status={m.status} />
                  <span className="flex-1 truncate text-fg-2">{c.title}</span>
                  <Badge tone={STATUS_META[m.status].tone}>{m.correctLatest}/{m.total}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function WrongList({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const qs = QUESTIONS.filter((q) => ids.includes(q.id));
  const groups = groupBy(qs, (q) => q.objectiveId);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 text-sm text-muted">Re-answer any question below; a correct answer removes it from this list.</p>
        <ButtonLink to={`/practice?ids=${ids.slice(0, 40).join(',')}`} variant="primary" size="sm"><RotateCcw className="h-4 w-4" /> Retry as a session</ButtonLink>
      </div>
      {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([oid, list]) => (
        <div key={oid}>
          <h3 className="mb-2 text-sm font-semibold text-fg">{objectiveLabel(oid)}</h3>
          <div className="space-y-2">
            {list.map((q) => (
              <div key={q.id}>
                {open === q.id ? (
                  <QuestionCard q={q} seed="revise" compact hotkeys footer={<div className="mt-3 text-right"><button type="button" onClick={() => setOpen(null)} className="text-sm text-muted hover:text-fg">Close</button></div>} />
                ) : (
                  <button type="button" onClick={() => setOpen(q.id)} className="flex w-full items-start gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm hover:border-accent/50">
                    <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" />
                    <span className="flex-1 text-fg-2">{q.stem.length > 160 ? `${q.stem.slice(0, 160)}…` : q.stem}</span>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MissingReport({ untouched, lessonsOpened }: { untouched: string[]; lessonsOpened: number }) {
  const mastery = useMastery();
  const cov = coverageReport();
  const contentGaps = OBJECTIVES.map((o) => ({ o, c: cov.byObjective.get(o.id) ?? { leaves: 0, covered: 0 } })).filter((x) => x.c.covered < x.c.leaves);
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="mb-1 font-semibold text-fg">Your learning gaps</h3>
        <p className="mb-4 text-sm text-muted">Based on your activity: {lessonsOpened} lessons opened, {mastery.overall.mastered} mastered of {mastery.overall.total}.</p>
        <div className="space-y-2">
          {OBJECTIVES.map((o) => {
            const m = mastery.objective.get(o.id)!;
            const state = m.started === 0 ? 'untouched' : m.mastered === m.total && m.total > 0 ? 'mastered' : m.score < 60 ? 'weak' : 'partial';
            return (
              <Link key={o.id} to={objectivePath(o.id)} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                <span className="w-10 font-mono text-xs font-semibold text-fg">{o.id}</span>
                <span className="w-44 truncate text-sm text-fg-2 sm:w-72">{o.title}</span>
                <ProgressBar value={m.score} size="sm" tone={state === 'mastered' ? 'ok' : state === 'weak' ? 'bad' : 'accent'} className="flex-1" />
                <Badge tone={state === 'untouched' ? 'neutral' : state === 'mastered' ? 'ok' : state === 'weak' ? 'bad' : 'accent'}>{state === 'untouched' ? 'not started' : state}</Badge>
              </Link>
            );
          })}
        </div>
        {untouched.length > 0 && <p className="mt-4 text-sm text-fg-2"><strong>{untouched.length}</strong> objectives untouched: {untouched.join(', ')}.</p>}
      </Card>
      <Card className="p-5">
        <h3 className="mb-1 font-semibold text-fg">Content gaps in this app</h3>
        <p className="mb-3 text-sm text-muted">Official objective bullets that no lesson teaches yet (from the coverage manifest). {cov.coveredLeaves}/{cov.leaves} bullets covered.</p>
        {contentGaps.length === 0 ? <p className="text-sm text-ok">Every official bullet is mapped to at least one lesson.</p> : (
          <ul className="space-y-1 text-sm">
            {contentGaps.map(({ o, c }) => (
              <li key={o.id}><Link to="/coverage" className="text-fg-2 hover:text-accent"><span className="font-mono text-xs font-semibold text-fg">{o.id}</span> {o.title} — {c.leaves - c.covered} bullet{c.leaves - c.covered === 1 ? '' : 's'} not covered</Link></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
