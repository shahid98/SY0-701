import { Link } from 'react-router';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { DOMAINS, OBJECTIVES, conceptsOf, domainPath, objectivePath, questionsOfObjective } from '@/content';
import { domainStyle } from '@/content/domains';
import { useMastery } from '@/lib/mastery';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, ProgressBar, ProgressRing } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export default function LearningPath() {
  const mastery = useMastery();
  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Learning Path' }]}
        title="Learning Path"
        subtitle="Five domains, 28 objectives. Drill from a domain into an objective, then into individual concept lessons — each with an interactive visualization and a knowledge check."
      />
      <div className="space-y-6">
        {DOMAINS.map((d) => {
          const st = domainStyle(d.id);
          const dm = mastery.domain.get(d.id)!;
          return (
            <Card key={d.id} className="overflow-hidden">
              <div className={cn('h-1 bg-gradient-to-r', st.grad)} />
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-xl', st.soft)}>
                  <Icon name={d.icon} className={cn('h-6 w-6', st.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={domainPath(d.id)} className="group">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted">Domain {d.number}.0 · {d.weight}% of exam</div>
                    <h2 className="text-xl font-bold tracking-tight text-fg group-hover:text-accent">{d.title}</h2>
                  </Link>
                  <p className="mt-1 text-sm text-muted">{d.summary}</p>
                </div>
                <ProgressRing value={dm.score} size={64} color={st.hex} label={`Domain ${d.number} mastery ${dm.score}%`}>
                  <span className="text-sm font-bold text-fg">{dm.score}%</span>
                </ProgressRing>
              </div>
              <div className="grid gap-2 border-t border-line p-3 sm:grid-cols-2 lg:grid-cols-3">
                {OBJECTIVES.filter((o) => o.domainId === d.id).map((o) => {
                  const om = mastery.objective.get(o.id)!;
                  const nC = conceptsOf(o.id).length;
                  const nQ = questionsOfObjective(o.id).length;
                  return (
                    <Link key={o.id} to={objectivePath(o.id)} className="group rounded-xl border border-transparent p-3 transition-colors hover:border-line hover:bg-surface-2/60">
                      <div className="flex items-start gap-2">
                        <span className={cn('font-mono text-sm font-bold', st.text)}>{o.id}</span>
                        <span className="flex-1 text-sm font-semibold leading-snug text-fg group-hover:text-accent">{o.title}</span>
                        {o.special && <FlaskConical className="h-4 w-4 shrink-0 text-muted" aria-label="Has a special interactive lesson" />}
                      </div>
                      <ProgressBar value={om.score} size="sm" className="mt-2" label={`${o.id} mastery`} />
                      <div className="mt-1.5 flex justify-between text-[11px] text-muted">
                        <span>{nC} lessons · {nQ} questions</span>
                        <span>{om.mastered}/{om.total} mastered</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <Link to={domainPath(d.id)} className="flex items-center justify-end gap-1 border-t border-line px-5 py-2.5 text-sm font-medium text-accent hover:underline">
                Open domain {d.number} <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
