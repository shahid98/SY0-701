import { Link } from 'react-router';
import { CircleCheck, Clock, FlaskConical } from 'lucide-react';
import { LABS } from '@/content/labs';
import { useProgress } from '@/store/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Callout, Card } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/icons';

export default function LabsIndex() {
  const labs = useProgress((s) => s.labs);
  const done = LABS.filter((l) => labs[l.id]?.completed).length;
  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Interactive Labs' }]}
        title="Interactive Labs"
        subtitle={`Browser-based simulations of the systems you’ll be tested on. ${done}/${LABS.length} completed.`}
      />
      <Callout kind="note" icon={<FlaskConical className="h-4 w-4 text-muted" />} title="Educational simulations" className="mb-6">
        Every lab is a simplified learning model with realistic but synthetic data — not a live tool. Each one states what it simplifies compared with real production systems.
      </Callout>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {LABS.map((l, i) => {
          const rec = labs[l.id];
          return (
            <Link key={l.id} to={`/labs/${l.id}`} className="block">
              <Card interactive className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-accent/20 to-indigo-500/15 text-accent">
                    <Icon name={l.icon} className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-muted">Lab {i + 1}</span>
                </div>
                <h2 className="mt-3 font-semibold leading-snug text-fg">{l.title}</h2>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{l.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {l.objectives.map((o) => <Badge key={o} tone="accent">{o}</Badge>)}
                  <Badge><Clock className="h-3 w-3" />~{l.minutes} min</Badge>
                  {rec?.completed && <Badge tone="ok"><CircleCheck className="h-3 w-3" />Best {rec.best}%</Badge>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
