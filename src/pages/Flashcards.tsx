import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Brain, CircleCheck, Layers, Play, RotateCcw, Shuffle, Sparkles } from 'lucide-react';
import type { DomainId } from '@/types/content';
import { CONCEPT_BY_ID, DOMAINS, OBJECTIVES, conceptPath, objectiveLabel } from '@/content';
import { FLASHCARDS, type Flashcard } from '@/content/flashcards';
import { useProgress } from '@/store/progress';
import { cardState, difficultyOf, isDue, previewLabel, type Grade } from '@/lib/srs';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, Card, EmptyState, Kbd, ProgressBar, Select, StatTile } from '@/components/ui/primitives';
import { FlipCard } from '@/components/lesson/FlipCard';
import { cn, isTypingTarget, shuffle } from '@/lib/utils';

const GRADES: { g: Grade; label: string; cls: string; key: string }[] = [
  { g: 'again', label: 'Again', cls: 'border-bad/40 hover:bg-bad/10 text-bad', key: '1' },
  { g: 'hard', label: 'Hard', cls: 'border-warn/40 hover:bg-warn/10 text-warn', key: '2' },
  { g: 'good', label: 'Good', cls: 'border-ok/40 hover:bg-ok/10 text-ok', key: '3' },
  { g: 'easy', label: 'Easy', cls: 'border-info/40 hover:bg-info/10 text-info', key: '4' },
];

export default function Flashcards() {
  const [params] = useSearchParams();
  const cards = useProgress((s) => s.cards);
  const newLimit = useProgress((s) => s.settings.newCardsPerDay);
  const [source, setSource] = useState<'all' | Flashcard['source']>('all');
  const [domain, setDomain] = useState<string>(params.get('domain') ?? 'all');
  const [objective, setObjective] = useState<string>(params.get('objective') ?? 'all');
  const conceptFilter = params.get('concept');
  const [session, setSession] = useState<{ queue: string[]; cram: boolean; done: number; total: number } | null>(null);

  const deck = useMemo(
    () =>
      FLASHCARDS.filter((f) => {
        if (conceptFilter && f.conceptId !== conceptFilter) return false;
        if (source !== 'all' && f.source !== source) return false;
        if (domain !== 'all' && f.domainId !== domain) return false;
        if (objective !== 'all' && f.objectiveId !== objective) return false;
        return true;
      }),
    [conceptFilter, source, domain, objective],
  );

  const now = Date.now();
  const stats = useMemo(() => {
    const s = { due: 0, new: 0, learning: 0, young: 0, mature: 0, easy: 0, medium: 0, hard: 0 };
    for (const f of deck) {
      const c = cards[f.id];
      s[cardState(c)]++;
      if (isDue(c, now)) s.due++;
      const d = difficultyOf(c);
      if (d !== 'unrated') s[d]++;
    }
    return s;
  }, [deck, cards, now]);

  const startReview = () => {
    const due = deck.filter((f) => isDue(cards[f.id], now)).sort((a, b) => cards[a.id].due - cards[b.id].due);
    const fresh = deck.filter((f) => !cards[f.id]).slice(0, newLimit);
    const queue = [...due, ...fresh].map((f) => f.id);
    setSession({ queue, cram: false, done: 0, total: queue.length });
  };
  const startCram = () => {
    const queue = shuffle(deck).map((f) => f.id);
    setSession({ queue, cram: true, done: 0, total: queue.length });
  };

  const concept = conceptFilter ? CONCEPT_BY_ID.get(conceptFilter) : undefined;

  if (session) {
    return <Session session={session} setSession={setSession} />;
  }

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Flashcards' }]}
        title="Flashcards"
        subtitle="Spaced repetition: rate how well you recalled each card and it comes back just before you would forget it. Cards come from every lesson, the glossary and the exam-English trainer."
      />
      {concept && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
          <Layers className="h-4 w-4 text-accent" /> Deck limited to lesson <Link to={conceptPath(concept)} className="font-semibold text-fg hover:text-accent">{concept.title}</Link>
          <Link to="/flashcards" className="ml-auto text-xs font-medium text-accent hover:underline">Show all cards</Link>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <Select label="Source" value={source} onChange={(v) => setSource(v as typeof source)} options={[
                { value: 'all', label: 'All cards' }, { value: 'concept', label: 'Lesson cards' }, { value: 'glossary', label: 'Acronyms & glossary' }, { value: 'vocab', label: 'Exam English' },
              ]} />
              <Select label="Domain" value={domain} onChange={(v) => { setDomain(v); setObjective('all'); }} options={[{ value: 'all', label: 'All domains' }, ...DOMAINS.map((d) => ({ value: d.id, label: `${d.number}.0 ${d.title}` }))]} />
              <Select label="Objective" value={objective} onChange={setObjective} options={[{ value: 'all', label: 'All objectives' }, ...OBJECTIVES.filter((o) => domain === 'all' || o.domainId === (domain as DomainId)).map((o) => ({ value: o.id, label: objectiveLabel(o.id) }))]} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" size="lg" onClick={startReview} disabled={stats.due + Math.min(stats.new, newLimit) === 0}>
                <Play className="h-4 w-4" /> Review {stats.due} due + {Math.min(stats.new, newLimit)} new
              </Button>
              <Button size="lg" onClick={startCram} disabled={!deck.length}><Shuffle className="h-4 w-4" /> Cram all {deck.length} (no scheduling)</Button>
            </div>
            <p className="mt-3 text-xs text-muted">New cards per session: {newLimit} (change in Settings). “Again” cards return later in the same session.</p>
          </Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Due now" value={stats.due} icon={<Brain className="h-3.5 w-3.5" />} />
            <StatTile label="New" value={stats.new} icon={<Sparkles className="h-3.5 w-3.5" />} tone="info" />
            <StatTile label="Learning / young" value={stats.learning + stats.young} tone="warn" />
            <StatTile label="Mature (21d+)" value={stats.mature} icon={<CircleCheck className="h-3.5 w-3.5" />} tone="ok" />
          </div>
        </div>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-fg">Difficulty ratings in this deck</h3>
          {(['hard', 'medium', 'easy'] as const).map((k) => (
            <div key={k} className="mb-2 flex items-center gap-2 text-sm">
              <span className="w-16 capitalize text-fg-2">{k}</span>
              <ProgressBar value={deck.length ? (stats[k] / deck.length) * 100 : 0} tone={k === 'hard' ? 'bad' : k === 'medium' ? 'warn' : 'ok'} className="flex-1" />
              <span className="w-8 text-right text-xs tabular-nums text-muted">{stats[k]}</span>
            </div>
          ))}
          <p className="mt-3 text-xs leading-relaxed text-muted">Difficulty comes from your own ratings: cards you often mark “Again” or “Hard” become hard and are shown more often.</p>
        </Card>
      </div>
    </div>
  );
}

function Session({ session, setSession }: {
  session: { queue: string[]; cram: boolean; done: number; total: number };
  setSession: (s: { queue: string[]; cram: boolean; done: number; total: number } | null) => void;
}) {
  const cards = useProgress((s) => s.cards);
  const reviewCard = useProgress((s) => s.reviewCard);
  const [flipped, setFlipped] = useState(false);
  const id = session.queue[0];
  const card = id ? FLASHCARDS.find((f) => f.id === id) : undefined;
  const now = Date.now();

  const rate = useCallback(
    (g: Grade) => {
      if (!card) return;
      if (!session.cram) reviewCard(card.id, g);
      const rest = session.queue.slice(1);
      const queue = g === 'again' ? [...rest, card.id] : rest;
      setSession({ ...session, queue, done: session.done + (g === 'again' ? 0 : 1) });
      setFlipped(false);
    },
    [card, session, reviewCard, setSession],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        rate(GRADES[Number(e.key) - 1].g);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, rate]);

  if (!card) {
    return (
      <div>
        <PageHeader crumbs={[{ label: 'Flashcards', to: '/flashcards' }, { label: 'Session complete' }]} title="Session complete" />
        <EmptyState icon={<CircleCheck className="h-10 w-10 text-ok" />} title={`You reviewed ${session.done} card${session.done === 1 ? '' : 's'}`} action={<Button variant="primary" onClick={() => setSession(null)}>Back to decks</Button>}>
          {session.cram ? 'Cram sessions don’t change your schedule.' : 'Your next reviews are scheduled. Come back when cards are due.'}
        </EmptyState>
      </div>
    );
  }

  const concept = card.conceptId ? CONCEPT_BY_ID.get(card.conceptId) : undefined;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setSession(null)}><RotateCcw className="h-4 w-4" /> End</Button>
        <ProgressBar value={(session.done / Math.max(1, session.total)) * 100} className="flex-1" label="Session progress" />
        <span className="text-xs tabular-nums text-muted">{session.done}/{session.total}</span>
        {session.cram && <Badge tone="warn">Cram</Badge>}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge tone="accent">{card.source === 'concept' ? 'Lesson' : card.source === 'glossary' ? 'Glossary' : 'Exam English'}</Badge>
        {card.objectiveId && <Badge>{card.objectiveId}</Badge>}
        <Badge>{cardState(cards[card.id])}</Badge>
        {difficultyOf(cards[card.id]) !== 'unrated' && <Badge tone={difficultyOf(cards[card.id]) === 'hard' ? 'bad' : difficultyOf(cards[card.id]) === 'medium' ? 'warn' : 'ok'}>{difficultyOf(cards[card.id])}</Badge>}
      </div>
      <FlipCard key={card.id} front={card.front} back={card.back} flipped={flipped} onFlip={setFlipped} large />
      {flipped && card.extra && <p className="mt-3 rounded-xl border border-line bg-surface-2/60 px-4 py-2.5 text-sm text-fg-2"><Sparkles className="mr-1.5 inline h-4 w-4 text-violet-500" />{card.extra}</p>}
      <div className="mt-4">
        {!flipped ? (
          <Button variant="primary" size="lg" className="w-full justify-center" onClick={() => setFlipped(true)}>Show answer <Kbd className="ml-2">Space</Kbd></Button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((x) => (
              <button
                key={x.g}
                type="button"
                onClick={() => rate(x.g)}
                className={cn('flex flex-col items-center rounded-xl border bg-surface px-2 py-2.5 text-sm font-semibold transition-colors', x.cls)}
              >
                {x.label}
                <span className="mt-0.5 text-[11px] font-normal text-muted">{session.cram ? `key ${x.key}` : previewLabel(cards[card.id], x.g, now)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {concept && <p className="mt-4 text-center text-xs text-muted">From lesson <Link className="font-medium text-accent hover:underline" to={conceptPath(concept)}>{concept.title}</Link></p>}
    </div>
  );
}
