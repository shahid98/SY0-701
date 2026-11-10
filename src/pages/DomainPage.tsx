import { Link, useParams } from 'react-router';
import { ArrowRight, FlaskConical, ListChecks } from 'lucide-react';
import type { DomainId } from '@/types/content';
import { DOMAIN_BY_ID, OBJECTIVES, conceptPath, conceptsOf, objectivePath, questionsOfDomain } from '@/content';
import { domainStyle } from '@/content/domains';
import { useMastery } from '@/lib/mastery';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink, Card, ProgressBar, ProgressRing } from '@/components/ui/primitives';
import { StatusIcon } from '@/components/ui/StatusIcon';
import { Icon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import NotFound from './NotFound';

export default function DomainPage() {
  const { domainId } = useParams();
  const d = DOMAIN_BY_ID[domainId as DomainId];
  const mastery = useMastery();
  if (!d) return <NotFound what="domain" />;
  const st = domainStyle(d.id);
  const dm = mastery.domain.get(d.id)!;
  const nQ = questionsOfDomain(d.id).length;
  const objectives = OBJECTIVES.filter((o) => o.domainId === d.id);
  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Learning Path', to: '/learn' }, { label: `Domain ${d.number}` }]}
        eyebrow={<span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', st.border, st.soft, st.text)}>{d.weight}% of the exam</span>}
        icon={<div className={cn('grid h-12 w-12 place-items-center rounded-xl', st.soft)}><Icon name={d.icon} className={cn('h-6 w-6', st.text)} /></div>}
        title={`${d.number}.0 ${d.title}`}
        subtitle={d.summary}
        actions={
          <>
            <ButtonLink to={`/practice?domain=${d.id}`} variant="primary"><ListChecks className="h-4 w-4" /> Practice domain ({nQ})</ButtonLink>
            <ProgressRing value={dm.score} size={56} color={st.hex}><span className="text-xs font-bold">{dm.score}%</span></ProgressRing>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {objectives.map((o) => {
          const om = mastery.objective.get(o.id)!;
          const concepts = conceptsOf(o.id);
          return (
            <Card key={o.id} className="flex min-w-0 flex-col p-5">
              <Link to={objectivePath(o.id)} className="group">
                <div className="flex items-baseline gap-2">
                  <span className={cn('font-mono text-lg font-bold', st.text)}>{o.id}</span>
                  <h2 className="text-lg font-semibold tracking-tight text-fg group-hover:text-accent">{o.title}</h2>
                </div>
                <p className="mt-1 text-sm italic text-muted">{o.official}</p>
              </Link>
              <ProgressBar value={om.score} className="mt-3" label={`${o.id} mastery`} />
              <div className="mt-1 text-[11px] text-muted">{om.mastered}/{om.total} lessons mastered · {om.score}% recall</div>
              <ul className="mt-3 flex-1 space-y-1">
                {concepts.map((c) => (
                  <li key={c.id}>
                    <Link to={conceptPath(c)} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-fg-2 hover:bg-surface-2 hover:text-fg">
                      <StatusIcon status={mastery.concept.get(c.id)!.status} />
                      <span className="truncate">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {o.special?.map((s) => (
                <Link key={s.to} to={s.to} className="mt-3 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-sm font-medium text-fg hover:border-accent">
                  <FlaskConical className="h-4 w-4 text-accent" /> <span className="flex-1">{s.title}</span> <ArrowRight className="h-4 w-4 text-accent" />
                </Link>
              ))}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
