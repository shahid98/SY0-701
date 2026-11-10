import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, CircleCheck, CircleDashed, CircleX, FlaskConical, ListChecks, Workflow } from 'lucide-react';
import type { ObjectiveId } from '@/types/content';
import { CONCEPT_BY_ID, DOMAIN_BY_ID, OBJECTIVES, OBJECTIVE_BY_ID, conceptPath, conceptsOf, domainPath, objectivePath, questionsOfObjective } from '@/content';
import { domainStyle } from '@/content/domains';
import { STATUS_META, useMastery } from '@/lib/mastery';
import { coverageReport, objectiveOutline } from '@/lib/coverage';
import type { OutlineNode } from '@/content/outline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, ButtonLink, Card, ProgressBar, SectionTitle } from '@/components/ui/primitives';
import { StatusIcon } from '@/components/ui/StatusIcon';
import { cn } from '@/lib/utils';
import NotFound from './NotFound';

const VISUAL_NAME: Record<string, string> = {
  sequence: 'Animated flow', timeline: 'Interactive timeline', layers: 'Layer walkthrough', compare: 'Side-by-side comparison',
  sort: 'Drag-and-drop sorting', beforeAfter: 'Before / after demo', widget: 'Interactive simulator', multi: 'Multiple visuals',
};

export default function ObjectivePage() {
  const { objectiveId } = useParams();
  const o = OBJECTIVE_BY_ID[objectiveId as ObjectiveId];
  const mastery = useMastery();
  const [showOutline, setShowOutline] = useState(true);
  if (!o) return <NotFound what="objective" />;
  const d = DOMAIN_BY_ID[o.domainId];
  const st = domainStyle(o.domainId);
  const concepts = conceptsOf(o.id);
  const om = mastery.objective.get(o.id)!;
  const nQ = questionsOfObjective(o.id).length;
  const idx = OBJECTIVES.findIndex((x) => x.id === o.id);
  const prev = OBJECTIVES[idx - 1];
  const next = OBJECTIVES[idx + 1];
  const cov = coverageReport();
  const objCov = cov.byObjective.get(o.id) ?? { leaves: 0, covered: 0 };

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Learning Path', to: '/learn' }, { label: `Domain ${d.number}`, to: domainPath(d.id) }, { label: `${o.id} ${o.title}` }]}
        eyebrow={<span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', st.border, st.soft, st.text)}>Domain {d.number}.0 · {d.title}</span>}
        title={<><span className={cn('font-mono', st.text)}>{o.id}</span> {o.title}</>}
        subtitle={<><span className="italic">“{o.official}”</span> <span className="block pt-1">{o.summary}</span></>}
        actions={<ButtonLink to={`/practice?objective=${o.id}`} variant="primary"><ListChecks className="h-4 w-4" /> Practice {o.id} ({nQ})</ButtonLink>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Recall mastery</div>
          <div className="mt-1 text-2xl font-bold text-fg">{om.score}%</div>
          <ProgressBar value={om.score} className="mt-2" />
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Lessons mastered</div>
          <div className="mt-1 text-2xl font-bold text-fg">{om.mastered}/{om.total}</div>
          <div className="mt-1 text-xs text-muted">{om.weak > 0 ? `${om.weak} need work` : 'Mastery = all lesson questions answered, ≥80% correct'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Official bullets covered</div>
          <div className="mt-1 text-2xl font-bold text-fg">{objCov.covered}/{objCov.leaves}</div>
          <div className="mt-1 text-xs text-muted"><Link to="/coverage" className="text-accent hover:underline">Open coverage manifest</Link></div>
        </Card>
      </div>

      {o.special && (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {o.special.map((s) => (
            <Link key={s.to} to={s.to} className="group flex items-start gap-3 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-4 transition-colors hover:border-accent">
              <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wide text-accent">Special interactive lesson</div>
                <div className="font-semibold text-fg">{s.title}</div>
                <div className="text-sm text-muted">{s.description}</div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}

      <SectionTitle sub="Each lesson: concept explanation · interactive visualization · practice">Concept lessons</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        {concepts.map((c, i) => {
          const cm = mastery.concept.get(c.id)!;
          return (
            <Link key={c.id} to={conceptPath(c)} className="group">
              <Card interactive className="flex h-full flex-col p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-sm font-bold text-fg-2">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-snug text-fg group-hover:text-accent">{c.title}</h3>
                    <p className="mt-0.5 text-sm leading-snug text-muted">{c.tagline}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-11">
                  <Badge tone={STATUS_META[cm.status].tone}><StatusIcon status={cm.status} className="h-3 w-3" />{STATUS_META[cm.status].label}</Badge>
                  <Badge><Workflow className="h-3 w-3" />{VISUAL_NAME[c.visual.kind]}</Badge>
                  <Badge>{c.questions.length} Q</Badge>
                  {c.supplementary && <Badge tone="info">Supplementary</Badge>}
                </div>
              </Card>
            </Link>
          );
        })}
        {concepts.length === 0 && (
          <Card className="p-6 text-sm text-muted md:col-span-2">No lessons have been written for this objective yet — it is marked incomplete in the coverage manifest.</Card>
        )}
      </div>

      <div className="mt-8">
        <SectionTitle
          sub="The official bullet list for this objective, and which lesson teaches each item."
          action={<button type="button" onClick={() => setShowOutline((s) => !s)} className="text-sm font-medium text-accent hover:underline">{showOutline ? 'Hide' : 'Show'}</button>}
        >
          Official objective checklist
        </SectionTitle>
        {showOutline && (
          <Card className="p-4">
            <OutlineTree nodes={objectiveOutline(o.id)} />
          </Card>
        )}
      </div>

      <nav className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Objective navigation">
        {prev ? (
          <Link to={objectivePath(prev.id)} className="rounded-2xl border border-line bg-surface p-4 hover:border-accent/50">
            <div className="flex items-center gap-1 text-xs text-muted"><ArrowLeft className="h-3.5 w-3.5" /> Previous objective</div>
            <div className="mt-1 font-semibold text-fg">{prev.id} {prev.title}</div>
          </Link>
        ) : <span />}
        {next && (
          <Link to={objectivePath(next.id)} className="rounded-2xl border border-line bg-surface p-4 text-right hover:border-accent/50">
            <div className="flex items-center justify-end gap-1 text-xs text-muted">Next objective <ArrowRight className="h-3.5 w-3.5" /></div>
            <div className="mt-1 font-semibold text-fg">{next.id} {next.title}</div>
          </Link>
        )}
      </nav>
    </div>
  );
}

export function OutlineTree({ nodes, onlyMissing }: { nodes: OutlineNode[]; onlyMissing?: boolean }) {
  const cov = coverageReport();
  return (
    <ul className="space-y-0.5">
      {nodes.map((n) => {
        const nc = cov.byNode.get(n.id)!;
        if (onlyMissing && nc.status === 'covered') return null;
        const concepts = [...nc.direct, ...nc.inherited].map((id) => CONCEPT_BY_ID.get(id)).filter(Boolean);
        return (
          <li key={n.id}>
            <div className="flex flex-wrap items-start gap-x-2 gap-y-1 rounded-md px-1.5 py-1 hover:bg-surface-2/60" style={{ paddingLeft: `${n.depth * 1.1 + 0.4}rem` }}>
              {nc.status === 'covered' ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="Covered" />
                : nc.status === 'partial' ? <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-label="Partially covered" />
                  : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-label="Missing" />}
              <span className={cn('text-sm', n.children.length ? 'font-semibold text-fg' : 'text-fg-2')}>{n.label}</span>
              {nc.direct.length > 0 && (
                <span className="flex flex-wrap gap-1">
                  {concepts.slice(0, nc.direct.length).map((c) => (
                    <Link key={c!.id} to={conceptPath(c!)} className="rounded border border-line bg-surface-2 px-1.5 text-[11px] text-accent hover:border-accent">{c!.title}</Link>
                  ))}
                </span>
              )}
              {nc.status === 'missing' && <Badge tone="bad">incomplete</Badge>}
            </div>
            {n.children.length > 0 && <OutlineTree nodes={n.children} onlyMissing={onlyMissing} />}
          </li>
        );
      })}
    </ul>
  );
}
