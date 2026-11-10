import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { BookA, Check, ChevronDown, CircleCheck, CircleX, Dumbbell, Languages, MessageSquareQuote, RotateCcw, Search, Signpost } from 'lucide-react';
import type { Directive, GlossaryEntry, VocabWord } from '@/types/content';
import { GLOSSARY } from '@/content/glossary';
import { DIRECTIVES, VOCAB } from '@/content/vocab';
import { DOMAINS } from '@/content';
import { useProgress } from '@/store/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, Callout, Card, Select, Tab, TabList, TabPanel, Tabs } from '@/components/ui/primitives';
import { GlossaryCard } from '@/components/lesson/GlossaryBits';
import { inline } from '@/components/ui/RichText';
import { cn, shuffle } from '@/lib/utils';

export default function Vocabulary() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'glossary';
  const setTab = (t: string) => setParams({ tab: t });
  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Vocabulary & Acronyms' }]}
        title="Vocabulary & Acronyms"
        subtitle="The exam is written in precise technical English. Learn the acronyms, the verbs that change what a question asks, and the directives (MOST, BEST, FIRST…) that decide which plausible answer is right."
      />
      <Tabs value={tab} onChange={setTab}>
        <TabList label="Vocabulary sections" className="mb-5">
          <Tab value="glossary"><BookA className="h-4 w-4" /> Acronyms & glossary ({GLOSSARY.length})</Tab>
          <Tab value="words"><Languages className="h-4 w-4" /> Exam English ({VOCAB.length})</Tab>
          <Tab value="directives"><Signpost className="h-4 w-4" /> Question directives ({DIRECTIVES.length})</Tab>
          <Tab value="trainer"><Dumbbell className="h-4 w-4" /> Vocabulary trainer</Tab>
        </TabList>
        <TabPanel value="glossary"><GlossaryTab initial={params.get('term')} /></TabPanel>
        <TabPanel value="words"><WordsTab initial={params.get('word')} /></TabPanel>
        <TabPanel value="directives"><DirectivesTab /></TabPanel>
        <TabPanel value="trainer"><Trainer /></TabPanel>
      </Tabs>
    </div>
  );
}

/* ---------- Glossary ---------- */

function GlossaryTab({ initial }: { initial: string | null }) {
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState('all');
  const [letter, setLetter] = useState('all');
  const [open, setOpen] = useState<string | null>(initial);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (initial) setTimeout(() => refs.current[initial]?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
  }, [initial]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...GLOSSARY]
      .sort((a, b) => a.term.localeCompare(b.term))
      .filter((g) => {
        if (domain !== 'all' && !g.objectives.some((o) => o.startsWith(domain.slice(1)))) return false;
        if (letter !== 'all' && g.term.charAt(0).toUpperCase() !== letter) return false;
        if (!s) return true;
        return `${g.term} ${g.full ?? ''} ${g.simple} ${g.tech}`.toLowerCase().includes(s);
      });
  }, [q, domain, letter]);

  const letters = useMemo(() => [...new Set(GLOSSARY.map((g) => g.term.charAt(0).toUpperCase()))].sort(), []);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="relative flex-1">
          <span className="sr-only">Search glossary</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search acronyms, expansions and definitions…" className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none" />
        </label>
        <Select label="Domain" value={domain} onChange={setDomain} className="sm:w-56" options={[{ value: 'all', label: 'All domains' }, ...DOMAINS.map((d) => ({ value: d.id, label: `${d.number}.0 ${d.title}` }))]} />
      </div>
      <div className="mb-4 flex flex-wrap gap-1">
        {['all', ...letters].map((l) => (
          <button key={l} type="button" onClick={() => setLetter(l)} className={cn('h-7 min-w-7 rounded-md px-1.5 text-xs font-semibold pointer-coarse:h-9 pointer-coarse:min-w-9', letter === l ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-fg-2 hover:bg-surface-3')}>
            {l === 'all' ? 'All' : l}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-muted">{list.length} entries</p>
      <div className="space-y-2">
        {list.map((g) => (
          <div key={g.id} ref={(el) => { refs.current[g.id] = el; }}>
            <GlossaryRow g={g} open={open === g.id} onToggle={() => setOpen(open === g.id ? null : g.id)} onPick={(id) => { setOpen(id); setTimeout(() => refs.current[id]?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50); }} />
          </div>
        ))}
        {list.length === 0 && <p className="py-8 text-center text-sm text-muted">No glossary entries match.</p>}
      </div>
    </div>
  );
}

function GlossaryRow({ g, open, onToggle, onPick }: { g: GlossaryEntry; open: boolean; onToggle: () => void; onPick: (id: string) => void }) {
  return (
    <Card className={cn('overflow-hidden transition-colors', open && 'border-accent/40')}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        <span className="min-w-[5.5rem] font-mono text-sm font-bold text-accent">{g.term}</span>
        <span className="min-w-0 flex-1">
          {g.full && <span className="block text-sm font-semibold text-fg">{g.full}</span>}
          <span className="block text-sm text-muted">{g.simple}</span>
        </span>
        <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-line px-4 py-4">
          <GlossaryCard g={g} onPick={onPick} />
        </div>
      )}
    </Card>
  );
}

/* ---------- Exam English ---------- */

function WordsTab({ initial }: { initial: string | null }) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (initial) setTimeout(() => refs.current[initial]?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 150);
  }, [initial]);
  return (
    <div>
      <Callout kind="tip" title="Why exam English matters" className="mb-4">
        A single verb can change the correct answer. “Which control would <strong>mitigate</strong> the risk?” wants something that <em>reduces</em> it; “<strong>remediate</strong>” wants the root cause <em>fixed</em>; “<strong>transfer</strong>” wants someone else (an insurer) to carry it.
      </Callout>
      <div className="grid gap-3 md:grid-cols-2">
        {VOCAB.map((w) => (
          <div key={w.id} ref={(el) => { refs.current[w.id] = el; }}>
            <WordCard w={w} highlight={initial === w.id} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WordCard({ w, highlight }: { w: VocabWord; highlight?: boolean }) {
  return (
    <Card className={cn('h-full p-4', highlight && 'border-accent ring-2 ring-accent/30')}>
      <div className="flex items-baseline gap-2">
        <h3 className="text-lg font-bold text-fg">{w.word}</h3>
        <span className="text-xs italic text-muted">{w.pos}</span>
      </div>
      <p className="mt-1 text-sm text-fg-2">{w.meaning}</p>
      <p className="mt-2 text-sm text-fg-2"><span className="font-semibold text-fg">In security: </span>{w.security}</p>
      <p className="mt-2 rounded-lg bg-surface-2/70 px-3 py-2 text-sm italic text-fg">“{inline(w.example)}”</p>
      <p className="mt-2 text-[13px] text-indigo-600 dark:text-indigo-300"><span className="font-semibold">How it changes the question: </span>{w.effect}</p>
      {w.confusedWith && <p className="mt-1.5 text-[13px] text-warn"><span className="font-semibold">Don’t confuse: </span>{w.confusedWith}</p>}
    </Card>
  );
}

/* ---------- Directives ---------- */

function DirectivesTab() {
  return (
    <div className="space-y-4">
      <Callout kind="exam" title="Read the directive before the options">
        Most Security+ questions have several technically true options. The directive word tells you which <em>one</em> to choose: the most probable cause, the best overall solution, or the action that must happen first.
      </Callout>
      {DIRECTIVES.map((d) => <DirectiveCard key={d.id} d={d} />)}
    </div>
  );
}

function DirectiveCard({ d }: { d: Directive }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-mono text-lg font-bold text-accent">{d.phrase}</h3>
      </div>
      <p className="mt-1 text-sm text-fg-2">{d.meaning}</p>
      <p className="mt-2 text-sm text-fg-2"><span className="font-semibold text-fg">Strategy: </span>{d.strategy}</p>
      <div className="mt-4 rounded-xl border border-line bg-surface-2/50 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted"><MessageSquareQuote className="h-3.5 w-3.5" /> Try it</div>
        <p className="text-sm font-medium text-fg">{inline(d.example.stem)}</p>
        <div className="mt-3 grid gap-2">
          {d.example.options.map((o, i) => {
            const state = pick === null ? 'idle' : i === d.example.answer ? 'right' : i === pick ? 'wrong' : 'idle';
            return (
              <button
                key={o}
                type="button"
                disabled={pick !== null}
                onClick={() => setPick(i)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  state === 'idle' && 'border-line bg-surface hover:border-line-strong',
                  state === 'right' && 'border-ok/50 bg-ok/10',
                  state === 'wrong' && 'border-bad/50 bg-bad/10',
                )}
              >
                {state === 'right' ? <CircleCheck className="h-4 w-4 text-ok" /> : state === 'wrong' ? <CircleX className="h-4 w-4 text-bad" /> : <span className="h-4 w-4 rounded-full border border-line-strong" />}
                {o}
              </button>
            );
          })}
        </div>
        {pick !== null && (
          <div className="mt-3 flex items-start gap-2">
            <p className="flex-1 text-sm text-fg-2">{inline(d.example.why)}</p>
            <Button size="xs" variant="ghost" onClick={() => setPick(null)}><RotateCcw className="h-3.5 w-3.5" /> Retry</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- Trainer ---------- */

type Drill = { kind: 'meaning' | 'context' | 'directive'; prompt: string; options: string[]; answer: number; why: string; wordId?: string };

function buildDrills(): Drill[] {
  const drills: Drill[] = [];
  for (const w of VOCAB) {
    const others = shuffle(VOCAB.filter((x) => x.id !== w.id)).slice(0, 3);
    const opts = shuffle([w, ...others]);
    drills.push({
      kind: 'meaning',
      prompt: `What does **${w.word}** mean in a security question?`,
      options: opts.map((o) => o.meaning),
      answer: opts.indexOf(w),
      why: `${w.word}: ${w.meaning} ${w.effect}`,
      wordId: w.id,
    });
    const re = new RegExp(`\\b${w.word.replace(/[^a-z]/gi, '').slice(0, Math.max(4, w.word.length - 3))}\\w*`, 'i');
    if (re.test(w.example)) {
      const blanked = w.example.replace(re, '_____');
      const opts2 = shuffle([w, ...shuffle(VOCAB.filter((x) => x.id !== w.id && x.pos === w.pos)).slice(0, 3)]);
      if (opts2.length >= 3) {
        drills.push({
          kind: 'context',
          prompt: `Fill the gap: “${blanked}”`,
          options: opts2.map((o) => o.word),
          answer: opts2.indexOf(w),
          why: `“${w.word}” fits: ${w.security}`,
          wordId: w.id,
        });
      }
    }
  }
  for (const d of DIRECTIVES) {
    drills.push({ kind: 'directive', prompt: d.example.stem, options: d.example.options, answer: d.example.answer, why: d.example.why });
  }
  return drills;
}

function Trainer() {
  const reviewCard = useProgress((s) => s.reviewCard);
  const [mode, setMode] = useState<'mixed' | Drill['kind']>('mixed');
  const [round, setRound] = useState(0);
  const drills = useMemo(() => {
    const all = buildDrills();
    return shuffle(mode === 'mixed' ? all : all.filter((d) => d.kind === mode)).slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, round]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const d = drills[i];

  useEffect(() => { setI(0); setPick(null); setScore(0); }, [drills]);

  if (!VOCAB.length && !DIRECTIVES.length) return <p className="text-sm text-muted">Vocabulary content is not loaded.</p>;

  const answer = (k: number) => {
    if (pick !== null) return;
    setPick(k);
    const ok = k === d.answer;
    if (ok) setScore((s) => s + 1);
    if (d.wordId) reviewCard(`v:${d.wordId}`, ok ? 'good' : 'again');
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select label="Drill type" value={mode} onChange={(v) => setMode(v as typeof mode)} className="w-56" options={[
          { value: 'mixed', label: 'Mixed drills' }, { value: 'meaning', label: 'Word → meaning' }, { value: 'context', label: 'Fill the gap' }, { value: 'directive', label: 'Directive decisions' },
        ]} />
        <div className="ml-auto text-sm text-fg-2">Score <strong className="text-fg">{score}</strong> / {Math.min(i + (pick !== null ? 1 : 0), drills.length)}</div>
      </div>
      {d ? (
        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="accent">{d.kind === 'meaning' ? 'Meaning' : d.kind === 'context' ? 'Context' : 'Directive'}</Badge>
            <span className="text-xs text-muted">{i + 1} / {drills.length}</span>
          </div>
          <p className="text-base font-medium leading-relaxed text-fg">{inline(d.prompt)}</p>
          <div className="mt-4 grid gap-2">
            {d.options.map((o, k) => {
              const state = pick === null ? 'idle' : k === d.answer ? 'right' : k === pick ? 'wrong' : 'idle';
              return (
                <button key={k} type="button" onClick={() => answer(k)} disabled={pick !== null}
                  className={cn('flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm',
                    state === 'idle' && 'border-line bg-surface-2/40 hover:border-line-strong',
                    state === 'right' && 'border-ok/50 bg-ok/10', state === 'wrong' && 'border-bad/50 bg-bad/10')}>
                  {state === 'right' ? <Check className="mt-0.5 h-4 w-4 text-ok" /> : state === 'wrong' ? <CircleX className="mt-0.5 h-4 w-4 text-bad" /> : <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full border border-line-strong text-[9px] text-muted">{k + 1}</span>}
                  <span className="flex-1">{o}</span>
                </button>
              );
            })}
          </div>
          {pick !== null && (
            <div className="mt-4 space-y-3">
              <p className={cn('rounded-lg px-3 py-2 text-sm', pick === d.answer ? 'bg-ok/10 text-fg' : 'bg-bad/10 text-fg')}>{inline(d.why)}</p>
              <div className="flex justify-end">
                {i + 1 < drills.length
                  ? <Button variant="primary" onClick={() => { setI(i + 1); setPick(null); }}>Next</Button>
                  : <Button variant="primary" onClick={() => setRound((r) => r + 1)}><RotateCcw className="h-4 w-4" /> New round ({score}/{drills.length})</Button>}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <p className="text-sm text-muted">No drills available for this type.</p>
      )}
      <p className="mt-3 text-center text-xs text-muted">Word drills update the matching “Exam English” flashcards in your spaced-repetition deck.</p>
    </div>
  );
}

