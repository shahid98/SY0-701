import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeftRight, GitCompareArrows, Lightbulb, Sparkles } from 'lucide-react';
import type { Comparison, GlossaryEntry } from '@/types/content';
import { COMPARISONS } from '@/content/comparisons';
import { GLOSSARY, GLOSSARY_BY_ID } from '@/content/glossary';
import { CONCEPT_BY_ID, conceptPath, objectivePath } from '@/content';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, Callout, Card, SectionTitle } from '@/components/ui/primitives';
import { CompareViz } from '@/components/viz/Visuals';
import { inline } from '@/components/ui/RichText';
import { cn } from '@/lib/utils';

function findCurated(a: string, b: string): Comparison | undefined {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return COMPARISONS.find((c) => {
    const t = c.terms.map((s) => s.toLowerCase());
    return t.includes(x) && t.includes(y);
  });
}

function TermPicker({ label, value, onChange }: { label: string; value: string; onChange: (id: string) => void }) {
  const [text, setText] = useState(() => GLOSSARY_BY_ID.get(value)?.term ?? '');
  const listId = `terms-${label.replace(/\s/g, '')}`;
  return (
    <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-muted">
      {label}
      <input
        list={listId}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const hit = GLOSSARY.find((g) => g.term.toLowerCase() === e.target.value.toLowerCase() || `${g.term} — ${g.full ?? ''}`.toLowerCase() === e.target.value.toLowerCase());
          if (hit) onChange(hit.id);
        }}
        placeholder="Type an acronym or term, e.g. IDS"
        className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <datalist id={listId}>
        {GLOSSARY.map((g) => <option key={g.id} value={g.term}>{g.full ?? g.simple}</option>)}
      </datalist>
    </label>
  );
}

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const curatedId = params.get('id');
  const conceptId = params.get('concept');
  const [a, setA] = useState(params.get('a') ?? '');
  const [b, setB] = useState(params.get('b') ?? '');
  const concept = conceptId ? CONCEPT_BY_ID.get(conceptId) : undefined;

  const selected = curatedId ? COMPARISONS.find((c) => c.id === curatedId) : undefined;
  const ga = GLOSSARY_BY_ID.get(a);
  const gb = GLOSSARY_BY_ID.get(b);
  const curatedPair = ga && gb ? findCurated(ga.id, gb.id) ?? findCurated(ga.term, gb.term) : undefined;

  const related = useMemo(() => {
    if (!concept) return [];
    const ids = new Set([...(concept.glossary ?? [])].map((s) => s.toLowerCase()));
    return COMPARISONS.filter((c) => c.objectives.includes(concept.objectiveId) || c.terms.some((t) => ids.has(t.toLowerCase())));
  }, [concept]);

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Compare Concepts' }]}
        title="Compare Concepts"
        subtitle="Pick two terms that are easy to confuse and get a side-by-side comparison, a worked example and a rule of thumb for the exam."
      />

      {concept && (
        <Card className="mb-6 p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-accent" />
            <h2 className="font-semibold text-fg">How “{concept.title}” differs</h2>
            <Link to={conceptPath(concept)} className="ml-auto text-sm font-medium text-accent hover:underline">Back to lesson</Link>
          </div>
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {concept.differs?.map((d) => (
              <div key={d.vs} className="grid gap-1 px-3.5 py-2.5 text-sm sm:grid-cols-[12rem_1fr] sm:gap-3">
                <div className="font-semibold text-fg">vs. {d.vs}</div>
                <div className="text-fg-2">{inline(d.diff)}</div>
              </div>
            ))}
          </div>
          {related.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Detailed comparisons for this topic</div>
              <div className="flex flex-wrap gap-2">
                {related.map((c) => (
                  <Button key={c.id} size="sm" onClick={() => setParams({ id: c.id })}>{c.title}</Button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {selected ? (
        <CuratedView c={selected} onBack={() => setParams({})} />
      ) : (
        <>
          <Card className="mb-6 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <TermPicker label="First term" value={a} onChange={setA} />
              <ArrowLeftRight className="mx-auto h-5 w-5 text-muted sm:mb-2.5" />
              <TermPicker label="Second term" value={b} onChange={setB} />
            </div>
            {ga && gb && ga.id === gb.id && <p className="mt-3 text-sm text-warn">Pick two different terms.</p>}
          </Card>

          {ga && gb && ga.id !== gb.id && (curatedPair ? <CuratedView c={curatedPair} /> : <GeneratedView a={ga} b={gb} />)}

          <SectionTitle sub="Prepared comparisons of the pairs and groups learners mix up most.">Commonly confused</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMPARISONS.map((c) => (
              <button key={c.id} type="button" onClick={() => setParams({ id: c.id })} className="text-left">
                <Card interactive className="h-full p-4">
                  <div className="font-semibold text-fg">{c.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.objectives.map((o) => <Badge key={o} tone="accent">{o}</Badge>)}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted">{c.rule}</p>
                </Card>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CuratedView({ c, onBack }: { c: Comparison; onBack?: () => void }) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="w-full text-xl font-bold text-fg sm:w-auto sm:flex-1">{c.title}</h2>
        {c.objectives.map((o) => <Link key={o} to={objectivePath(o)} className="inline-flex items-center pointer-coarse:min-h-9"><Badge tone="accent">Objective {o}</Badge></Link>)}
        {onBack && <Button size="sm" variant="ghost" onClick={onBack}>All comparisons</Button>}
      </div>
      <CompareViz v={{ kind: 'compare', title: c.items.join('  vs  '), columns: c.items, rows: c.rows }} />
      <div className="grid gap-3 md:grid-cols-2">
        <Callout kind="tip" icon={<Lightbulb className="h-4 w-4 text-accent" />} title="Worked example">{inline(c.example)}</Callout>
        <Callout kind="memory" icon={<Sparkles className="h-4 w-4 text-violet-500" />} title="Rule of thumb">{inline(c.rule)}</Callout>
      </div>
    </div>
  );
}

function GeneratedView({ a, b }: { a: GlossaryEntry; b: GlossaryEntry }) {
  const note = a.confused?.find(([id]) => id === b.id)?.[1] ?? b.confused?.find(([id]) => id === a.id)?.[1];
  const rows: string[][] = [
    ['Stands for', a.full ?? '—', b.full ?? '—'],
    ['Plain English', a.simple, b.simple],
    ['Technical definition', a.tech, b.tech],
    ['Real example', a.example, b.example],
    ['Exam context', a.exam, b.exam],
    ['Objectives', a.objectives.join(', '), b.objectives.join(', ')],
  ];
  return (
    <div className="mb-8 space-y-4">
      <h2 className="text-xl font-bold text-fg">{a.term} vs {b.term}</h2>
      <CompareViz v={{ kind: 'compare', title: `${a.term} vs ${b.term}`, columns: [a.term, b.term], rows, note: 'Generated from glossary entries. Curated comparisons (below) add scenario examples and exam rules.' }} />
      {note ? (
        <Callout kind="memory" icon={<Sparkles className="h-4 w-4 text-violet-500" />} title="Key difference">{inline(note)}</Callout>
      ) : (
        <p className={cn('text-sm text-muted')}>These two terms are not usually confused with each other — compare their exam context rows to see where each one shows up.</p>
      )}
    </div>
  );
}
