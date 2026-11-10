import { Link } from 'react-router';
import { CircleCheck, Clock, Puzzle } from 'lucide-react';
import { PBQS } from '@/content/pbqs';
import { useProgress } from '@/store/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Callout, Card } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/icons';

const KIND: Record<string, string> = { table: 'Configuration / matching', sort: 'Drag and drop', order: 'Ordering', firewall: 'Firewall rule builder' };

export default function PbqIndex() {
  const pbqs = useProgress((s) => s.pbqs);
  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'PBQ Simulator' }]}
        title="PBQ Simulator"
        subtitle="Performance-based questions test what you can do, not just what you know: configure, match, order and troubleshoot. Partial credit is awarded per item."
      />
      <Callout kind="tip" icon={<Puzzle className="h-4 w-4 text-accent" />} title="Exam strategy" className="mb-6">
        PBQs usually appear first on the real exam and take longer. Many candidates flag them and return after the multiple-choice questions, so they don’t eat the clock. Practise them here until the formats feel familiar.
      </Callout>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PBQS.map((p) => {
          const rec = pbqs[p.id];
          return (
            <Link key={p.id} to={`/pbq/${p.id}`} className="block">
              <Card interactive className="flex h-full flex-col p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-warn/12 text-warn"><Icon name={p.icon} className="h-5 w-5" /></div>
                <h2 className="mt-3 font-semibold leading-snug text-fg">{p.title}</h2>
                <p className="mt-1 flex-1 text-sm text-muted">{p.brief}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge>{KIND[p.kind]}</Badge>
                  {p.objectives.map((o) => <Badge key={o} tone="accent">{o}</Badge>)}
                  <Badge><Clock className="h-3 w-3" />~{p.minutes} min</Badge>
                  {rec && <Badge tone={rec.best >= 80 ? 'ok' : 'warn'}><CircleCheck className="h-3 w-3" />Best {rec.best}%</Badge>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
