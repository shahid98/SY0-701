import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, BookOpen, Briefcase, CircleCheck, CircleDashed, CircleX, Crosshair, Shuffle, Sparkles } from 'lucide-react';
import type { Scenario } from '@/types/content';
import { SCENARIOS } from '@/content/scenarios';
import { CONCEPT_BY_ID, DOMAINS, conceptPath, objectiveLabel } from '@/content';
import { useProgress } from '@/store/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Button, Callout, Card, EmptyState, Select } from '@/components/ui/primitives';
import { inline } from '@/components/ui/RichText';
import { cn, mulberry32, seedFrom, shuffle } from '@/lib/utils';

const VERDICT = {
  best: { label: 'Best choice', tone: 'ok' as const, icon: CircleCheck, cls: 'border-ok/50 bg-ok/10', text: 'text-ok' },
  acceptable: { label: 'Acceptable, not best', tone: 'warn' as const, icon: CircleDashed, cls: 'border-warn/50 bg-warn/10', text: 'text-warn' },
  poor: { label: 'Poor choice', tone: 'bad' as const, icon: CircleX, cls: 'border-bad/50 bg-bad/10', text: 'text-bad' },
};

export default function Scenarios() {
  const [params, setParams] = useSearchParams();
  const results = useProgress((s) => s.scenarios);
  const [domain, setDomain] = useState('all');
  const id = params.get('id');
  const list = useMemo(() => SCENARIOS.filter((s) => domain === 'all' || s.objectiveId.startsWith(domain.slice(1))), [domain]);
  const current = id ? SCENARIOS.find((s) => s.id === id) : undefined;

  if (current) {
    const idx = list.findIndex((s) => s.id === current.id);
    const next = list[idx + 1] ?? list[0];
    return (
      <div>
        <PageHeader crumbs={[{ label: 'Scenario Trainer', to: '/scenarios' }, { label: current.title }]} title="Scenario Decision Trainer" subtitle="Read the business situation, then choose the control you would recommend. Some options are acceptable but not best — just like the exam." />
        <ScenarioCard key={current.id} s={current} onNext={() => setParams({ id: next.id })} onBack={() => setParams({})} />
      </div>
    );
  }

  const done = Object.keys(results).length;
  const best = Object.values(results).filter((r) => r.verdict === 'best').length;
  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Scenario Trainer' }]}
        title="Scenario Decision Trainer"
        subtitle="Realistic business situations where you must pick the most appropriate security control. Feedback explains why the best option beats the merely acceptable ones."
        actions={list.length > 0 && <Button variant="primary" onClick={() => setParams({ id: shuffle(list)[0].id })}><Shuffle className="h-4 w-4" /> Random scenario</Button>}
      />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select label="Domain" value={domain} onChange={setDomain} className="w-64" options={[{ value: 'all', label: 'All domains' }, ...DOMAINS.map((d) => ({ value: d.id, label: `${d.number}.0 ${d.title}` }))]} />
        <p className="text-sm text-muted">{done} attempted · {best} best choices</p>
      </div>
      {list.length === 0 ? <EmptyState icon={<Crosshair className="h-8 w-8" />} title="No scenarios for this filter" /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((s) => {
            const r = results[s.id];
            const V = r ? VERDICT[r.verdict] : null;
            return (
              <button key={s.id} type="button" className="text-left" onClick={() => setParams({ id: s.id })}>
                <Card interactive className="h-full p-4">
                  <div className="flex items-start gap-2">
                    <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div className="flex-1">
                      <div className="font-semibold text-fg">{s.title}</div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{s.situation}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-6">
                    <Badge tone="accent">{s.objectiveId}</Badge>
                    {V && <Badge tone={V.tone}><V.icon className="h-3 w-3" />{V.label}</Badge>}
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScenarioCard({ s, onNext, onBack }: { s: Scenario; onNext: () => void; onBack: () => void }) {
  const record = useProgress((st) => st.recordScenario);
  const [pick, setPick] = useState<number | null>(null);
  const order = useMemo(() => shuffle(s.options.map((_, i) => i), mulberry32(seedFrom(s.id))), [s]);
  const concept = s.conceptId ? CONCEPT_BY_ID.get(s.conceptId) : undefined;
  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i);
    record(s.id, s.options[i].verdict);
  };
  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="accent">{objectiveLabel(s.objectiveId)}</Badge>
        </div>
        <h2 className="text-xl font-bold text-fg">{s.title}</h2>
        <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-4 text-[15px] leading-relaxed text-fg-2">{inline(s.situation)}</div>
        <p className="mt-4 font-semibold text-fg">{inline(s.ask)}</p>
        <div className="mt-3 space-y-2">
          {order.map((i) => {
            const o = s.options[i];
            const V = VERDICT[o.verdict];
            const revealed = pick !== null;
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  disabled={revealed}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors',
                    !revealed && 'border-line bg-surface-2/40 hover:border-line-strong',
                    revealed && V.cls,
                    revealed && pick !== i && 'opacity-80',
                    pick === i && 'ring-2 ring-fg/30',
                  )}
                >
                  {revealed ? <V.icon className={cn('mt-0.5 h-5 w-5 shrink-0', V.text)} /> : <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-line-strong" />}
                  <span className="flex-1">
                    <span className="text-fg">{inline(o.text)}</span>
                    {revealed && <span className="mt-1 block text-[13px] text-fg-2"><strong>{V.label}{pick === i ? ' (your pick)' : ''}: </strong>{inline(o.why)}</span>}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        {pick !== null && (
          <div className="mt-4 space-y-3">
            <Callout kind="memory" icon={<Sparkles className="h-4 w-4 text-violet-500" />} title="Takeaway">{inline(s.takeaway)}</Callout>
            {concept && (
              <Link to={conceptPath(concept)} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"><BookOpen className="h-4 w-4" /> Lesson: {concept.title}</Link>
            )}
          </div>
        )}
      </Card>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /> All scenarios</Button>
        <Button variant="primary" onClick={onNext}>Next scenario <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
