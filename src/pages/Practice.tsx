import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Info, ListChecks, Play } from 'lucide-react';
import type { DomainId, Question } from '@/types/content';
import { DOMAINS, OBJECTIVES, QUESTIONS, QUESTION_BY_ID, objectiveLabel } from '@/content';
import { useProgress } from '@/store/progress';
import { filterQuestions, type QuestionFilter } from '@/lib/quiz';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Callout, Card, Select } from '@/components/ui/primitives';
import { QuizSession } from '@/components/quiz/QuizSession';
import { cn, shuffle } from '@/lib/utils';

const COUNTS = ['5', '10', '20', '40', 'all'];

export default function Practice() {
  const [params, setParams] = useSearchParams();
  const answers = useProgress((s) => s.answers);
  const [filter, setFilter] = useState<QuestionFilter>(() => ({
    domain: (params.get('domain') as DomainId) ?? 'all',
    objective: params.get('objective') ?? 'all',
    level: 'all',
    kind: 'all',
    status: 'all',
  }));
  const [count, setCount] = useState('10');
  const [order, setOrder] = useState<'random' | 'curriculum'>('random');
  const [session, setSession] = useState<Question[] | null>(null);
  const [seed, setSeed] = useState('s0');

  // Deep links: ?quick=10 starts a random session; ?ids=a,b,c starts a specific list.
  useEffect(() => {
    const quick = params.get('quick');
    const ids = params.get('ids');
    if (ids) {
      const list = ids.split(',').map((id) => QUESTION_BY_ID.get(id)).filter((q): q is Question => !!q);
      if (list.length) setSession(list);
    } else if (quick) {
      setSession(shuffle(QUESTIONS).slice(0, Number(quick) || 10));
    }
    setSeed(`s${Date.now()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matching = useMemo(() => filterQuestions(filter, answers), [filter, answers]);
  const objectives = OBJECTIVES.filter((o) => filter.domain === 'all' || o.domainId === filter.domain);

  const stats = useMemo(() => {
    const answered = matching.filter((q) => answers[q.id]).length;
    const correct = matching.filter((q) => answers[q.id]?.lastCorrect).length;
    return { answered, correct };
  }, [matching, answers]);

  const start = () => {
    const base = order === 'random' ? shuffle(matching) : matching;
    setSession(count === 'all' ? base : base.slice(0, Number(count)));
    setSeed(`s${Date.now()}`);
  };

  const update = (patch: Partial<QuestionFilter>) => {
    setFilter((f) => {
      const n = { ...f, ...patch };
      if (patch.domain && patch.domain !== 'all' && n.objective !== 'all' && !n.objective?.startsWith(patch.domain.slice(1))) n.objective = 'all';
      return n;
    });
  };

  if (session) {
    return (
      <div>
        <PageHeader crumbs={[{ label: 'Practice Questions', to: '/practice' }, { label: 'Session' }]} title="Practice session" subtitle="Answers stay hidden until you submit. Every answer updates your mastery and revision queue." />
        <QuizSession questions={session} seed={seed} onExit={() => { setSession(null); setParams({}); }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Practice Questions' }]}
        title="Practice Questions"
        subtitle={`An original, exam-inspired question bank: ${QUESTIONS.length} questions across all 28 objectives, from beginner concept checks to log-analysis and multiple-response scenarios.`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-fg"><ListChecks className="h-4 w-4 text-accent" /> Build a session</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Domain" value={filter.domain ?? 'all'} onChange={(v) => update({ domain: v as DomainId | 'all' })}
              options={[{ value: 'all', label: 'All domains' }, ...DOMAINS.map((d) => ({ value: d.id, label: `${d.number}.0 ${d.title}` }))]} />
            <Select label="Objective" value={filter.objective ?? 'all'} onChange={(v) => update({ objective: v })}
              options={[{ value: 'all', label: 'All objectives' }, ...objectives.map((o) => ({ value: o.id, label: objectiveLabel(o.id) }))]} />
            <Select label="Difficulty" value={filter.level ?? 'all'} onChange={(v) => update({ level: v as QuestionFilter['level'] })}
              options={[{ value: 'all', label: 'All levels' }, { value: '1', label: 'Beginner (concept)' }, { value: '2', label: 'Intermediate (application)' }, { value: '3', label: 'Difficult (scenario)' }]} />
            <Select label="Question type" value={filter.kind ?? 'all'} onChange={(v) => update({ kind: v as QuestionFilter['kind'] })}
              options={[{ value: 'all', label: 'All types' }, { value: 'concept', label: 'Conceptual' }, { value: 'application', label: 'Application' }, { value: 'scenario', label: 'Scenario' }, { value: 'log', label: 'Log-based' }, { value: 'multi', label: 'Multiple response' }]} />
            <Select label="Status" value={filter.status ?? 'all'} onChange={(v) => update({ status: v as QuestionFilter['status'] })}
              options={[{ value: 'all', label: 'Any' }, { value: 'unanswered', label: 'Never answered' }, { value: 'incorrect', label: 'Latest answer incorrect' }, { value: 'notmastered', label: 'Not yet answered correctly' }]} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="How many" value={count} onChange={setCount} options={COUNTS.map((c) => ({ value: c, label: c === 'all' ? 'All matching' : c }))} />
              <Select label="Order" value={order} onChange={(v) => setOrder(v as 'random' | 'curriculum')} options={[{ value: 'random', label: 'Shuffled' }, { value: 'curriculum', label: 'Curriculum order' }]} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" onClick={start} disabled={!matching.length}>
              <Play className="h-4 w-4" /> Start {count === 'all' ? matching.length : Math.min(Number(count), matching.length)} questions
            </Button>
            <span className="text-sm text-muted">{matching.length} match · {stats.answered} answered · {stats.correct} latest-correct</span>
          </div>
        </Card>

        <div className="space-y-3">
          <Callout kind="info" icon={<Info className="h-4 w-4 text-info" />} title="How feedback works">
            After you submit you’ll see the correct answer, why it is right, why each other option is wrong, the decisive clues highlighted in the question, difficult vocabulary, and a link to the lesson.
          </Callout>
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-fg">Bank by domain</h3>
            <ul className="space-y-1.5">
              {DOMAINS.map((d) => {
                const qs = QUESTIONS.filter((q) => q.domainId === d.id);
                const ok = qs.filter((q) => answers[q.id]?.lastCorrect).length;
                return (
                  <li key={d.id}>
                    <button type="button" onClick={() => update({ domain: d.id, objective: 'all' })} className={cn('flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-surface-2', filter.domain === d.id && 'bg-accent/10')}>
                      <span className="text-fg-2">{d.number}.0 {d.title.split(',')[0]}</span>
                      <span className="text-xs tabular-nums text-muted">{ok}/{qs.length}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
