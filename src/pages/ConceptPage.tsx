import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, BookOpen, Brain, ChevronDown, CircleQuestionMark as CircleHelp, Compass, GitCompareArrows, GraduationCap, Layers,
  Lightbulb, ListChecks, MapPin, Search, Shuffle, Sparkles, Target, TriangleAlert, Workflow, Wrench,
} from 'lucide-react';
import type { Concept } from '@/types/content';
import { CONCEPT_BY_ID, DOMAIN_BY_ID, OBJECTIVE_BY_ID, conceptPath, domainPath, neighbours, objectivePath } from '@/content';
import { domainStyle } from '@/content/domains';
import { conceptCardId } from '@/content/flashcards';
import { useProgress } from '@/store/progress';
import { STATUS_META, useMastery } from '@/lib/mastery';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, ButtonLink, Callout, Card, Dialog, Disclosure, Segmented } from '@/components/ui/primitives';
import { RichText, inline } from '@/components/ui/RichText';
import { VisualRenderer } from '@/components/viz/Visuals';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { GlossaryChips } from '@/components/lesson/GlossaryBits';
import { FlipCard } from '@/components/lesson/FlipCard';
import { StatusIcon } from '@/components/ui/StatusIcon';
import { cn, isTypingTarget } from '@/lib/utils';
import NotFound from './NotFound';

export default function ConceptPage() {
  const { conceptId } = useParams();
  const c = conceptId ? CONCEPT_BY_ID.get(conceptId) : undefined;
  if (!c) return <NotFound what="lesson" />;
  return <ConceptView key={c.id} c={c} />;
}

interface SectionDef {
  id: string;
  label: string;
  icon: typeof Lightbulb;
}

function ConceptView({ c }: { c: Concept }) {
  const navigate = useNavigate();
  const mode = useProgress((s) => s.settings.mode);
  const guided = useProgress((s) => s.settings.guided);
  const setSetting = useProgress((s) => s.setSetting);
  const visitLesson = useProgress((s) => s.visitLesson);
  const setLessonSections = useProgress((s) => s.setLessonSections);
  const setLast = useProgress((s) => s.setLast);
  const lesson = useProgress((s) => s.lessons[c.id]);
  const mastery = useMastery();
  const m = mastery.concept.get(c.id)!;
  const objective = OBJECTIVE_BY_ID[c.objectiveId];
  const domain = DOMAIN_BY_ID[c.domainId];
  const st = domainStyle(c.domainId);
  const { prev, next } = neighbours(c.id);

  const sections = useMemo<SectionDef[]>(() => {
    const s: SectionDef[] = [
      { id: 'learn', label: 'Understand', icon: Lightbulb },
      { id: 'visual', label: 'See it work', icon: Workflow },
    ];
    if (c.breakdown?.length) s.push({ id: 'breakdown', label: c.breakdownTitle ?? 'Break it down', icon: Layers });
    s.push(
      { id: 'example', label: 'Real example', icon: Target },
      { id: 'exam', label: 'Exam lens', icon: GraduationCap },
      { id: 'remember', label: 'Remember', icon: Brain },
      { id: 'check', label: 'Check yourself', icon: ListChecks },
    );
    return s;
  }, [c]);

  const [revealed, setRevealed] = useState(() => (guided ? Math.min(sections.length, Math.max(1, lesson?.sectionsSeen ?? 1)) : sections.length));
  const [altIdx, setAltIdx] = useState(-1);
  const [flowOpen, setFlowOpen] = useState(false);
  const seenRef = useRef(0);
  const sectionEls = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    visitLesson(c.id);
    setLast(conceptPath(c), c.title);
  }, [c, visitLesson, setLast]);

  useEffect(() => {
    if (!guided) setRevealed(sections.length);
  }, [guided, sections.length]);

  // Track which sections have actually been scrolled into view.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = Number((e.target as HTMLElement).dataset.index);
          if (idx + 1 > seenRef.current) {
            seenRef.current = idx + 1;
            setLessonSections(c.id, seenRef.current, sections.length);
          }
        }
      },
      { rootMargin: '0px 0px -25% 0px', threshold: 0.15 },
    );
    Object.values(sectionEls.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [revealed, c.id, sections.length, setLessonSections]);

  const reveal = (i: number) => {
    setRevealed((r) => Math.max(r, i + 1));
    setTimeout(() => sectionEls.current[sections[i]?.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const jump = (i: number) => {
    if (i >= revealed) setRevealed(i + 1);
    setTimeout(() => sectionEls.current[sections[i].id]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('[role="dialog"]')) return;
      if (e.key === '[' && prev) navigate(conceptPath(prev));
      if (e.key === ']' && next) navigate(conceptPath(next));
    },
    [prev, next, navigate],
  );
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  const prereqs = (c.prerequisites ?? []).map((id) => CONCEPT_BY_ID.get(id)).filter((p): p is Concept => !!p);
  const weakPrereqs = prereqs.filter((p) => {
    const s = mastery.concept.get(p.id)?.status;
    return s !== 'mastered' && s !== 'review';
  });

  const renderSection = (s: SectionDef): ReactNode => {
    switch (s.id) {
      case 'learn':
        return <LearnSection c={c} mode={mode} altIdx={altIdx} />;
      case 'visual':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted">Step through it yourself — use Play, or the arrow keys when the diagram is focused.</p>
            <VisualRenderer v={c.visual} />
          </div>
        );
      case 'breakdown':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {c.breakdown!.map((b) => (
              <div key={b.name} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                <div className="font-semibold text-fg">{b.name}</div>
                <div className="mt-1 text-sm leading-relaxed text-fg-2">{inline(b.desc)}</div>
                {b.example && <div className="mt-2 text-[13px] text-muted"><span className="font-semibold text-fg-2">Example: </span>{inline(b.example)}</div>}
                {b.cue && <div className="mt-1.5 flex gap-1.5 text-[13px] text-accent"><Search className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{inline(b.cue)}</span></div>}
              </div>
            ))}
          </div>
        );
      case 'example':
        return (
          <div className="space-y-3">
            <div className="rounded-xl border border-line bg-gradient-to-br from-surface-2/80 to-surface p-4">
              <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-fg"><MapPin className="h-4 w-4 text-accent" />{c.example.title}</div>
              <RichText text={c.example.body} className="text-sm leading-relaxed text-fg-2" />
            </div>
            {mode === 'exam' && (
              <Callout kind="tip" icon={<Lightbulb className="h-4 w-4 text-accent" />} title="Beginner analogy">{inline(c.beginner.analogy)}</Callout>
            )}
          </div>
        );
      case 'exam':
        return <ExamLens c={c} mode={mode} />;
      case 'remember':
        return (
          <div className="space-y-4">
            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-5">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300"><Sparkles className="h-4 w-4" /> Memory hook</div>
              <div className="text-lg font-semibold leading-snug text-fg">{inline(c.memory)}</div>
            </div>
            {c.flashcards && c.flashcards.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-fg">Active recall — answer before you flip</h4>
                  <Link to={`/flashcards?concept=${c.id}`} className="text-xs font-medium text-accent hover:underline">Review with spaced repetition →</Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {c.flashcards.map(([f, b]) => <FlipCard key={conceptCardId(c.id, f)} front={f} back={b} />)}
                </div>
              </div>
            )}
            {c.glossary && c.glossary.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-fg">Glossary terms in this lesson</h4>
                <GlossaryChips ids={c.glossary} />
              </div>
            )}
          </div>
        );
      case 'check':
        return <KnowledgeCheck c={c} />;
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader
        crumbs={[
          { label: 'Learning Path', to: '/learn' },
          { label: `Domain ${domain.number}`, to: domainPath(domain.id) },
          { label: `${objective.id} ${objective.title}`, to: objectivePath(objective.id) },
          { label: c.title },
        ]}
        eyebrow={
          <>
            <Link to={objectivePath(objective.id)} className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', st.border, st.soft, st.text)}>
              Objective {objective.id}
            </Link>
            <Badge tone={STATUS_META[m.status].tone}><StatusIcon status={m.status} className="h-3 w-3" />{STATUS_META[m.status].label}</Badge>
            {c.supplementary && <Badge tone="info">Supplementary bridge lesson</Badge>}
          </>
        }
        title={c.title}
        subtitle={c.tagline}
        actions={
          <Segmented
            label="Explanation mode"
            value={mode}
            onChange={(v) => setSetting('mode', v)}
            options={[{ value: 'beginner', label: 'Beginner' }, { value: 'exam', label: 'Exam' }]}
          />
        }
      />

      {/* Feature actions */}
      <div className="mb-5 flex flex-wrap gap-2">
        {c.alt && c.alt.length > 0 && (
          <Button size="sm" onClick={() => { setAltIdx((i) => (i + 1) % c.alt!.length); jump(0); }}>
            <Shuffle className="h-4 w-4" /> Explain differently
          </Button>
        )}
        <Button size="sm" onClick={() => setFlowOpen(true)}>
          <Workflow className="h-4 w-4" /> Show the flow
        </Button>
        {c.differs && c.differs.length > 0 && (
          <ButtonLink size="sm" to={`/compare?concept=${c.id}`}>
            <GitCompareArrows className="h-4 w-4" /> Compare concepts
          </ButtonLink>
        )}
        <Button size="sm" variant="ghost" onClick={() => setSetting('guided', !guided)} aria-pressed={guided}>
          <Compass className="h-4 w-4" /> {guided ? 'Guided: one section at a time' : 'Showing all sections'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSetting('reading', true)}>
          <BookOpen className="h-4 w-4" /> Reading mode
        </Button>
      </div>

      {weakPrereqs.length > 0 && (
        <Callout kind="info" icon={<CircleHelp className="h-4 w-4 text-info" />} title="Teach me the prerequisite" className="mb-5">
          <p className="mb-2">This lesson builds on {weakPrereqs.length === 1 ? 'a topic' : 'topics'} you haven’t mastered yet:</p>
          <ul className="space-y-1.5">
            {weakPrereqs.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                <Link to={conceptPath(p)} className="font-semibold text-fg underline decoration-info/50 underline-offset-2 hover:text-info">{p.title}</Link>
                <span className="text-[13px] text-muted">— {p.tagline}</span>
              </li>
            ))}
          </ul>
        </Callout>
      )}
      {prereqs.length > 0 && weakPrereqs.length === 0 && (
        <p className="mb-5 text-xs text-muted">Builds on: {prereqs.map((p, i) => <span key={p.id}>{i > 0 && ', '}<Link className="font-medium text-fg-2 hover:text-accent" to={conceptPath(p)}>{p.title}</Link></span>)} (mastered ✓)</p>
      )}

      {/* Section navigator */}
      <div className="sticky top-14 z-20 -mx-4 mb-5 border-y border-line bg-bg/85 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jump(i)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors pointer-coarse:min-h-10 pointer-coarse:px-3',
                i < revealed ? 'text-fg-2 hover:bg-surface-2 hover:text-fg' : 'text-muted/70 hover:text-fg-2',
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        {sections.slice(0, revealed).map((s, i) => (
          <motion.section
            key={s.id}
            ref={(el: HTMLElement | null) => { sectionEls.current[s.id] = el; }}
            data-index={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            aria-labelledby={`sec-${s.id}`}
            className="scroll-mt-32"
          >
            <Card className="p-4 sm:p-6">
              <h2 id={`sec-${s.id}`} className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-fg">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/12 text-accent"><s.icon className="h-4 w-4" /></span>
                {s.label}
                <span className="ml-auto text-xs font-normal text-muted">{i + 1}/{sections.length}</span>
              </h2>
              {renderSection(s)}
            </Card>
            {guided && i === revealed - 1 && i < sections.length - 1 && (
              <div className="mt-4 flex justify-center">
                <Button variant="primary" className="max-w-full" onClick={() => reveal(i + 1)}>
                  <span className="truncate">Continue: {sections[i + 1].label}</span> <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
              </div>
            )}
          </motion.section>
        ))}
      </div>

      {/* Lesson navigation */}
      <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Lesson navigation">
        {prev ? (
          <Link to={conceptPath(prev)} className="group rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent/50">
            <div className="flex items-center gap-1 text-xs text-muted"><ArrowLeft className="h-3.5 w-3.5" /> Previous <span className="ml-1 hidden sm:inline">( [ )</span></div>
            <div className="mt-1 font-semibold text-fg group-hover:text-accent">{prev.title}</div>
            <div className="text-xs text-muted">{prev.objectiveId}</div>
          </Link>
        ) : <span />}
        {next && (
          <Link to={conceptPath(next)} className="group rounded-2xl border border-line bg-surface p-4 text-right transition-colors hover:border-accent/50">
            <div className="flex items-center justify-end gap-1 text-xs text-muted"><span className="mr-1 hidden sm:inline">( ] )</span> Next <ArrowRight className="h-3.5 w-3.5" /></div>
            <div className="mt-1 font-semibold text-fg group-hover:text-accent">{next.title}</div>
            <div className="text-xs text-muted">{next.objectiveId}</div>
          </Link>
        )}
      </nav>

      <Dialog open={flowOpen} onClose={() => setFlowOpen(false)} title={`Show the flow: ${c.title}`} wide="full">
        <VisualRenderer v={c.visual} />
      </Dialog>
    </div>
  );
}

function InfoTile({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">{icon}{label}</div>
      <RichText text={text} className="text-[14.5px] leading-relaxed text-fg-2" />
    </div>
  );
}

function LearnSection({ c, mode, altIdx }: { c: Concept; mode: 'beginner' | 'exam'; altIdx: number }) {
  const alt = altIdx >= 0 ? c.alt?.[altIdx] : undefined;
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {alt && (
          <motion.div key={altIdx} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Callout kind="memory" icon={<Shuffle className="h-4 w-4 text-violet-500" />} title={`Explained differently: ${alt.label}`}>
              <RichText text={alt.text} />
            </Callout>
          </motion.div>
        )}
      </AnimatePresence>
      {mode === 'beginner' ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <InfoTile icon={<Lightbulb className="h-3.5 w-3.5" />} label="What it is" text={c.beginner.what} />
            <InfoTile icon={<CircleHelp className="h-3.5 w-3.5" />} label="Why it exists" text={c.beginner.why} />
            <InfoTile icon={<Wrench className="h-3.5 w-3.5" />} label="How it works" text={c.beginner.how} />
            <InfoTile icon={<MapPin className="h-3.5 w-3.5" />} label="Where it’s used" text={c.beginner.where} />
          </div>
          <Callout kind="tip" icon={<Sparkles className="h-4 w-4 text-accent" />} title="Analogy">
            <RichText text={c.beginner.analogy} />
          </Callout>
          {c.terms && c.terms.length > 0 && (
            <Disclosure title={`New words in this lesson (${c.terms.length})`} icon={<BookOpen className="h-4 w-4 text-accent" />}>
              <dl className="space-y-2">
                {c.terms.map((t) => (
                  <div key={t.term}><dt className="font-semibold text-fg">{t.term}</dt><dd>{inline(t.def)}</dd></div>
                ))}
              </dl>
            </Disclosure>
          )}
        </>
      ) : (
        <>
          <InfoTile icon={<GraduationCap className="h-3.5 w-3.5" />} label="Exam definition" text={c.exam.what} />
          <InfoTile icon={<Wrench className="h-3.5 w-3.5" />} label="Technical detail" text={c.exam.how} />
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/[0.06] p-3.5">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">How a question might phrase it</div>
            <p className="text-[14.5px] italic leading-relaxed text-fg">“{inline(c.exam.scenario)}”</p>
          </div>
          {c.terms && c.terms.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-fg">Vocabulary breakdown</h4>
              <dl className="grid gap-2 sm:grid-cols-2">
                {c.terms.map((t) => (
                  <div key={t.term} className="rounded-lg border border-line bg-surface-2/40 px-3 py-2">
                    <dt className="text-sm font-semibold text-fg">{t.term}</dt>
                    <dd className="text-[13px] leading-relaxed text-fg-2">{inline(t.def)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExamLens({ c, mode }: { c: Concept; mode: 'beginner' | 'exam' }) {
  return (
    <div className="space-y-4">
      {c.differs && c.differs.length > 0 && (
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-fg"><GitCompareArrows className="h-4 w-4 text-accent" /> How it differs from similar concepts</h4>
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {c.differs.map((d) => (
              <div key={d.vs} className="grid gap-1 px-3.5 py-2.5 text-sm sm:grid-cols-[11rem_1fr] sm:gap-3">
                <div className="font-semibold text-fg">vs. {d.vs}</div>
                <div className="leading-relaxed text-fg-2">{inline(d.diff)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <Callout kind="exam" icon={<Search className="h-4 w-4 text-indigo-500" />} title="Spot it in a scenario question">
          <ul className="list-disc space-y-1 pl-4">{c.cues.map((x) => <li key={x}>{inline(x)}</li>)}</ul>
        </Callout>
        <Callout kind="trap" icon={<TriangleAlert className="h-4 w-4 text-bad" />} title="Misconceptions & exam traps">
          <ul className="list-disc space-y-1 pl-4">{c.traps.map((x) => <li key={x}>{inline(x)}</li>)}</ul>
        </Callout>
      </div>
      {mode === 'beginner' && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/[0.06] p-3.5">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">How CompTIA might phrase it</div>
          <p className="text-[14.5px] italic leading-relaxed text-fg">“{inline(c.exam.scenario)}”</p>
          <p className="mt-2 text-xs text-muted">Switch to <strong>Exam</strong> mode for the precise technical definition and vocabulary breakdown.</p>
        </div>
      )}
      {c.advanced && (
        <Disclosure title={`Advanced: ${c.advanced.title}`} icon={<Layers className="h-4 w-4 text-violet-500" />}>
          <RichText text={c.advanced.body} />
        </Disclosure>
      )}
    </div>
  );
}

function KnowledgeCheck({ c }: { c: Concept }) {
  const [i, setI] = useState(0);
  const [answered, setAnswered] = useState(false);
  const mastery = useMastery();
  const m = mastery.concept.get(c.id)!;
  const q = c.questions[i];
  if (!q) return <p className="text-sm text-muted">No questions for this concept yet.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-fg-2">Question {i + 1} of {c.questions.length}</span>
        <span className="text-muted">·</span>
        <span className="text-muted">Mastery needs every question answered with ≥80% correct on your latest attempts.</span>
        <Badge tone={STATUS_META[m.status].tone} className="ml-auto">{m.correctLatest}/{m.total} correct · {STATUS_META[m.status].label}</Badge>
      </div>
      <QuestionCard
        key={q.id}
        q={q}
        seed={`check-${c.id}`}
        hotkeys
        compact
        onAnswered={() => setAnswered(true)}
        footer={
          answered && (
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {i + 1 < c.questions.length ? (
                <Button variant="primary" onClick={() => { setI(i + 1); setAnswered(false); }}>Next question <ArrowRight className="h-4 w-4" /></Button>
              ) : (
                <>
                  <Button onClick={() => { setI(0); setAnswered(false); }}>Try again</Button>
                  <ButtonLink variant="primary" to={`/practice?objective=${c.objectiveId}`}>More {c.objectiveId} practice <ArrowRight className="h-4 w-4" /></ButtonLink>
                </>
              )}
            </div>
          )
        }
      />
    </div>
  );
}
