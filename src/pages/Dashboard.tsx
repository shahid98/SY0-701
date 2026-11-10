import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight, Brain, CircleAlert, Clock, Crosshair, Flame, FlaskConical, Info, ListChecks, Map as MapIcon, Play, Target, Timer, Trophy, Zap,
} from 'lucide-react';
import { CONCEPTS, DOMAINS, OBJECTIVES, conceptPath, objectivePath } from '@/content';
import { domainStyle } from '@/content/domains';
import { FLASHCARDS } from '@/content/flashcards';
import { useMastery } from '@/lib/mastery';
import { useToday } from '@/lib/activity';
import { isDue } from '@/lib/srs';
import { useProgress } from '@/store/progress';
import { ButtonLink, Card, ProgressBar, ProgressRing, SectionTitle } from '@/components/ui/primitives';
import { StatusIcon } from '@/components/ui/StatusIcon';
import { Icon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const mastery = useMastery();
  const { today, goal, streak, met } = useToday();
  const cards = useProgress((s) => s.cards);
  const last = useProgress((s) => s.last);
  const answers = useProgress((s) => s.answers);
  const now = Date.now();

  const due = useMemo(() => FLASHCARDS.filter((f) => isDue(cards[f.id], now)).length, [cards, now]);
  const newCards = useMemo(() => FLASHCARDS.filter((f) => !cards[f.id]).length, [cards]);
  const wrong = useMemo(() => Object.values(answers).filter((a) => !a.lastCorrect).length, [answers]);

  const nextUp = useMemo(() => CONCEPTS.find((c) => {
    const s = mastery.concept.get(c.id)!.status;
    return s !== 'mastered' && s !== 'review';
  }), [mastery]);

  const weak = useMemo(
    () => CONCEPTS.filter((c) => ['weak', 'review'].includes(mastery.concept.get(c.id)!.status)).slice(0, 5),
    [mastery],
  );

  const untouched = useMemo(
    () => OBJECTIVES.filter((o) => (mastery.objective.get(o.id)?.started ?? 0) === 0),
    [mastery],
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-cyan-500/10 via-surface to-indigo-500/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-accent">{greeting} 👋</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg sm:text-4xl">Your Security+ SY0-701 study hub</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
              Learn each objective through interactive explanations, prove it with questions, and let spaced repetition bring back what you are about to forget.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {last ? (
                <ButtonLink to={last.path} variant="primary" size="lg" className="max-w-full" title={`Continue: ${last.title}`}><Play className="h-4 w-4 shrink-0" /><span className="truncate">Continue: {last.title}</span></ButtonLink>
              ) : (
                <ButtonLink to={nextUp ? conceptPath(nextUp) : '/learn'} variant="primary" size="lg"><Play className="h-4 w-4" /> Start with the first lesson</ButtonLink>
              )}
              <ButtonLink to="/learn" size="lg"><MapIcon className="h-4 w-4" /> Learning path</ButtonLink>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing value={Math.min(100, (today.xp / goal) * 100)} size={112} stroke={9} label={`Daily goal ${today.xp} of ${goal} XP`}>
              <div>
                <div className="text-2xl font-bold text-fg tabular-nums">{today.xp}</div>
                <div className="text-[10px] font-medium uppercase tracking-wide text-muted">/ {goal} XP</div>
              </div>
            </ProgressRing>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Flame className={cn('h-4 w-4', streak ? 'text-orange-500' : 'text-muted')} /><span className="font-semibold text-fg">{streak}-day streak</span></div>
              <div className="flex items-center gap-2"><Target className="h-4 w-4 text-accent" /><span className="text-fg-2">{met ? 'Daily goal met!' : `${Math.max(0, goal - today.xp)} XP to today’s goal`}</span></div>
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-indigo-500" /><span className="text-fg-2">{today.questions} questions · {today.cards} cards today</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Exam-weighted readiness</div>
          <div className="mt-1 text-2xl font-bold text-fg">{mastery.readiness}%</div>
          <ProgressBar value={mastery.readiness} className="mt-2" />
          <div className="mt-1.5 text-[11px] text-muted">Recall weighted by domain %. Not a scaled score.</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Lessons mastered</div>
          <div className="mt-1 text-2xl font-bold text-fg">{mastery.overall.mastered}<span className="text-base text-muted">/{mastery.overall.total}</span></div>
          <div className="mt-1.5 text-[11px] text-muted">{mastery.overall.started} started · {mastery.overall.weak} need work</div>
        </Card>
        <Link to="/flashcards" className="block">
          <Card interactive className="h-full p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">Flashcards due</div>
            <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-fg"><Brain className="h-5 w-5 text-violet-500" />{due}</div>
            <div className="mt-1.5 text-[11px] text-muted">{newCards} new cards available</div>
          </Card>
        </Link>
        <Link to="/revision" className="block">
          <Card interactive className="h-full p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">Incorrect to review</div>
            <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-fg"><CircleAlert className="h-5 w-5 text-bad" />{wrong}</div>
            <div className="mt-1.5 text-[11px] text-muted">Questions whose latest answer was wrong</div>
          </Card>
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommendations */}
        <section className="min-w-0 space-y-3 lg:col-span-2">
          <SectionTitle sub="Based on your demonstrated recall, not on pages opened.">Recommended next</SectionTitle>
          {nextUp && (
            <Link to={conceptPath(nextUp)} className="block">
              <Card interactive className="flex items-center gap-4 p-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent"><Play className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">Next in the learning path · {nextUp.objectiveId}</div>
                  <div className="truncate font-semibold text-fg">{nextUp.title}</div>
                  <div className="truncate text-sm text-muted">{nextUp.tagline}</div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted" />
              </Card>
            </Link>
          )}
          {weak.length > 0 && (
            <Card className="p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg"><CircleAlert className="h-4 w-4 text-bad" /> Weak or due for review</div>
              <ul className="space-y-1">
                {weak.map((c) => (
                  <li key={c.id}>
                    <Link to={conceptPath(c)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                      <StatusIcon status={mastery.concept.get(c.id)!.status} />
                      <span className="flex-1 truncate text-fg-2">{c.title}</span>
                      <span className="text-xs text-muted">{c.objectiveId}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction to="/flashcards" icon={<Brain className="h-5 w-5" />} title="Daily review" text={due ? `${due} cards are due now` : 'Learn new cards with spaced repetition'} />
            <QuickAction to="/practice?quick=10" icon={<ListChecks className="h-5 w-5" />} title="Quick 10" text="Ten mixed questions with full explanations" />
            <QuickAction to="/mock-exam" icon={<Timer className="h-5 w-5" />} title="Mock exam" text="Up to 90 questions, 90-minute timer" />
            <QuickAction to="/scenarios" icon={<Crosshair className="h-5 w-5" />} title="Scenario trainer" text="Pick the best control for a business situation" />
          </div>
        </section>

        {/* What am I missing */}
        <section className="min-w-0 space-y-3">
          <SectionTitle>What am I missing?</SectionTitle>
          <Card className="p-4">
            {untouched.length === 0 ? (
              <p className="text-sm text-fg-2"><Trophy className="mr-1 inline h-4 w-4 text-ok" /> You have practised every objective at least once. Focus on weak lessons.</p>
            ) : (
              <>
                <p className="mb-2 text-sm text-fg-2">{untouched.length} of 28 objectives have no lessons started yet:</p>
                <div className="flex flex-wrap gap-1.5">
                  {untouched.map((o) => {
                    const st = domainStyle(o.domainId);
                    return (
                      <Link key={o.id} to={objectivePath(o.id)} title={o.title} className={cn('rounded-md border px-1.5 py-0.5 font-mono text-xs font-semibold hover:brightness-110 pointer-coarse:px-2.5 pointer-coarse:py-2', st.border, st.soft, st.text)}>
                        {o.id}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
            <Link to="/revision?tab=missing" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline pointer-coarse:min-h-10">Full gap report <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Card>
          <Card className="p-4">
            <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-fg"><Info className="h-4 w-4 text-info" /> About the real exam</div>
            <ul className="space-y-1 text-[13px] leading-relaxed text-fg-2">
              <li>• Up to 90 questions in 90 minutes, including performance-based questions.</li>
              <li>• Scored on a 100–900 scale; 750 is the published passing score.</li>
              <li>• This app reports <strong>raw</strong> percentages only — CompTIA’s scaling method is not public.</li>
            </ul>
          </Card>
          <Link to="/labs" className="block">
            <Card interactive className="flex items-center gap-3 p-4">
              <FlaskConical className="h-5 w-5 text-accent" />
              <div className="flex-1">
                <div className="font-semibold text-fg">16 interactive labs</div>
                <div className="text-xs text-muted">SOC investigation, firewall rules, network builder, crypto…</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Card>
          </Link>
        </section>
      </div>

      {/* Domains */}
      <section>
        <SectionTitle sub="Mastery = share of lesson questions whose latest answer is correct.">Domain progress</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DOMAINS.map((d) => {
            const st = domainStyle(d.id);
            const dm = mastery.domain.get(d.id)!;
            return (
              <Link key={d.id} to={`/learn/${d.id}`} className="block">
                <Card interactive className="h-full p-4">
                  <div className="flex items-center justify-between">
                    <div className={cn('grid h-9 w-9 place-items-center rounded-lg', st.soft)}><Icon name={d.icon} className={cn('h-4.5 w-4.5', st.text)} /></div>
                    <span className="text-xs font-semibold text-muted">{d.weight}%</span>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-muted">Domain {d.number}.0</div>
                  <div className="text-sm font-semibold leading-snug text-fg">{d.title}</div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className={cn('h-full rounded-full', st.bg)} style={{ width: `${dm.score}%` }} /></div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-muted"><span>{dm.score}% recall</span><span>{dm.mastered}/{dm.total}</span></div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="flex items-center gap-1.5 text-xs text-muted"><Clock className="h-3.5 w-3.5" /> Progress is saved in this browser. Export a backup from <Link className="text-accent hover:underline" to="/settings">Settings & Data</Link>.</p>
    </div>
  );
}

function QuickAction({ to, icon, title, text }: { to: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link to={to} className="block">
      <Card interactive className="flex h-full items-start gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent">{icon}</div>
        <div>
          <div className="font-semibold text-fg">{title}</div>
          <div className="text-sm text-muted">{text}</div>
        </div>
      </Card>
    </Link>
  );
}
