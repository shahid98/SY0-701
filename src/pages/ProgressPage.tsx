import { useMemo } from 'react';
import { Link } from 'react-router';
import { Brain, CircleCheck, Flame, FlaskConical, ListChecks, Puzzle, Target, Timer, Trophy, Zap } from 'lucide-react';
import { DOMAINS, OBJECTIVES, QUESTIONS, objectivePath } from '@/content';
import { FLASHCARDS } from '@/content/flashcards';
import { LABS } from '@/content/labs';
import { useProgress } from '@/store/progress';
import { useMastery } from '@/lib/mastery';
import { lastNDays, useToday } from '@/lib/activity';
import { cardState } from '@/lib/srs';
import { useIsDark } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink, Card, SectionTitle, StatTile } from '@/components/ui/primitives';
import { ColumnChart, LineChart, seqFill } from '@/components/ui/Charts';
import { pct } from '@/lib/utils';

// Validated with the dataviz palette checker (light: surface #fff, dark: surface #0b1220).
const DOMAIN_CHART = {
  light: ['#0891b2', '#e11d48', '#7c3aed', '#059669', '#d97706'],
  dark: ['#0891b2', '#f43f5e', '#8b5cf6', '#059669', '#d97706'],
};

export default function ProgressPage() {
  const mastery = useMastery();
  const dark = useIsDark();
  const { streak, goalDays, goal } = useToday();
  const daily = useProgress((s) => s.daily);
  const xp = useProgress((s) => s.xp);
  const answers = useProgress((s) => s.answers);
  const cards = useProgress((s) => s.cards);
  const exams = useProgress((s) => s.exams);
  const labs = useProgress((s) => s.labs);
  const pbqs = useProgress((s) => s.pbqs);

  const days = useMemo(() => lastNDays(daily, 30), [daily]);
  const answered = Object.keys(answers).length;
  const latestCorrect = Object.values(answers).filter((a) => a.lastCorrect).length;
  const attempts = Object.values(answers).reduce((s, a) => s + a.attempts, 0);
  const correctAttempts = Object.values(answers).reduce((s, a) => s + a.correct, 0);

  const cardStates = useMemo(() => {
    const s = { new: 0, learning: 0, young: 0, mature: 0 };
    for (const f of FLASHCARDS) s[cardState(cards[f.id])]++;
    return s;
  }, [cards]);

  const palette = dark ? DOMAIN_CHART.dark : DOMAIN_CHART.light;

  return (
    <div className="space-y-8">
      <PageHeader
        crumbs={[{ label: 'Progress & Analytics' }]}
        title="Progress & Analytics"
        subtitle="Everything here is measured from demonstrated recall — question answers, flashcard ratings, labs and exams — never from pages opened."
        actions={<ButtonLink to="/settings">Export / import progress</ButtonLink>}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Exam-weighted readiness" value={`${mastery.readiness}%`} sub="Weighted by domain %, raw recall" icon={<Target className="h-3.5 w-3.5" />} />
        <StatTile label="Total XP" value={xp.toLocaleString()} sub={`${goalDays} days met the ${goal} XP goal`} icon={<Zap className="h-3.5 w-3.5" />} tone="info" />
        <StatTile label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} sub="Days in a row with study activity" icon={<Flame className="h-3.5 w-3.5" />} tone="warn" />
        <StatTile label="Question accuracy" value={`${pct(correctAttempts, attempts)}%`} sub={`${attempts} attempts · ${answered}/${QUESTIONS.length} questions seen`} icon={<ListChecks className="h-3.5 w-3.5" />} tone="ok" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ColumnChart
          title="Daily XP, last 30 days"
          sub={`Goal: ${goal} XP per day`}
          data={days.map((d) => ({ label: d.key.slice(8), value: d.rec.xp, detail: `${new Date(d.key + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${d.rec.questions} questions, ${d.rec.cards} cards` }))}
          valueLabel="XP"
          labelEvery={5}
        />
        <LineChart
          title="Mock exam raw scores"
          sub={exams.length ? `${exams.length} exam${exams.length === 1 ? '' : 's'} taken` : 'Take a mock exam to start the trend'}
          data={exams.map((e, i) => ({ label: `#${i + 1}`, value: pct(e.correct, e.total), detail: `${new Date(e.ts).toLocaleDateString()} · ${e.correct}/${e.total}` }))}
          refLine={{ value: 85, label: '85% target' }}
        />
      </section>

      <section>
        <SectionTitle sub="Share of each domain’s lesson questions whose latest answer is correct.">Domain mastery</SectionTitle>
        <Card className="p-5">
          <div className="space-y-3.5">
            {DOMAINS.map((d, i) => {
              const m = mastery.domain.get(d.id)!;
              return (
                <div key={d.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[16rem_1fr_6rem]">
                  <Link to={`/learn/${d.id}`} className="text-sm font-medium text-fg hover:text-accent">{d.number}.0 {d.title}</Link>
                  <span className="text-right text-sm font-semibold tabular-nums text-fg sm:order-last">{m.score}%</span>
                  <div className="col-span-2 h-3 overflow-hidden rounded-r-[4px] bg-surface-3 sm:col-span-1" role="img" aria-label={`${d.title}: ${m.score}% mastery, weight ${d.weight}%`}>
                    <div className="h-full rounded-r-[4px] transition-[width] duration-700" style={{ width: `${m.score}%`, background: palette[i] }} />
                  </div>
                  <span className="col-span-2 text-xs text-muted sm:col-span-3 sm:-mt-1 sm:pl-[17rem]">{m.mastered}/{m.total} lessons mastered · exam weight {d.weight}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle sub="Each cell is one objective; darker = higher recall. Select a cell to open it.">Objective heatmap</SectionTitle>
        <Card className="p-5">
          <div className="space-y-2">
            {DOMAINS.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-2">
                <span className="w-14 shrink-0 text-xs font-semibold text-muted">D{d.number}</span>
                {OBJECTIVES.filter((o) => o.domainId === d.id).map((o) => {
                  const om = mastery.objective.get(o.id)!;
                  const f = seqFill(om.started ? om.score : null);
                  return (
                    <Link
                      key={o.id}
                      to={objectivePath(o.id)}
                      title={`${o.id} ${o.title}: ${om.started ? `${om.score}% recall` : 'not started'}`}
                      aria-label={`${o.id} ${o.title}: ${om.started ? `${om.score}% recall` : 'not started'}`}
                      className="grid h-12 w-[4.25rem] place-items-center rounded-lg border-2 border-surface text-center transition-transform hover:scale-105 focus-visible:scale-105"
                      style={{ background: f.bg, color: f.fg }}
                    >
                      <span className="font-mono text-xs font-bold leading-none">{o.id}</span>
                      <span className="text-[10px] leading-none opacity-90">{om.started ? `${om.score}%` : '—'}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-muted">
            <span>Not started</span>
            <span className="h-3 w-5 rounded" style={{ background: seqFill(null).bg }} />
            <span className="ml-2">0%</span>
            {[10, 30, 50, 70, 90].map((v) => <span key={v} className="h-3 w-5 rounded" style={{ background: seqFill(v).bg }} />)}
            <span>100%</span>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg"><Brain className="h-4 w-4 text-violet-500" /> Flashcards</h3>
          {([['new', 'New'], ['learning', 'Learning'], ['young', 'Young (<21d)'], ['mature', 'Mature (21d+)']] as const).map(([k, l]) => (
            <div key={k} className="flex justify-between border-b border-line py-1.5 text-sm last:border-0">
              <span className="text-fg-2">{l}</span><span className="font-semibold tabular-nums text-fg">{cardStates[k]}</span>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg"><FlaskConical className="h-4 w-4 text-accent" /> Labs completed</h3>
          <div className="text-2xl font-bold text-fg">{Object.values(labs).filter((l) => l.completed).length}<span className="text-base text-muted">/{LABS.length}</span></div>
          <ul className="mt-2 space-y-1 text-xs text-fg-2">
            {LABS.filter((l) => labs[l.id]?.completed).slice(0, 6).map((l) => <li key={l.id} className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-ok" />{l.title}</li>)}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg"><Puzzle className="h-4 w-4 text-warn" /> PBQs & exams</h3>
          <div className="flex justify-between border-b border-line py-1.5 text-sm"><span className="text-fg-2">PBQs attempted</span><span className="font-semibold text-fg">{Object.keys(pbqs).length}</span></div>
          <div className="flex justify-between border-b border-line py-1.5 text-sm"><span className="text-fg-2">Best PBQ average</span><span className="font-semibold text-fg">{Object.keys(pbqs).length ? Math.round(Object.values(pbqs).reduce((s, p) => s + p.best, 0) / Object.keys(pbqs).length) : 0}%</span></div>
          <div className="flex justify-between border-b border-line py-1.5 text-sm"><span className="text-fg-2"><Timer className="mr-1 inline h-3.5 w-3.5" />Mock exams</span><span className="font-semibold text-fg">{exams.length}</span></div>
          <div className="flex justify-between py-1.5 text-sm"><span className="text-fg-2"><Trophy className="mr-1 inline h-3.5 w-3.5" />Best raw score</span><span className="font-semibold text-fg">{exams.length ? Math.max(...exams.map((e) => pct(e.correct, e.total))) : 0}%</span></div>
          <p className="mt-2 text-[11px] text-muted">{latestCorrect} questions currently answered correctly.</p>
        </Card>
      </section>
    </div>
  );
}
