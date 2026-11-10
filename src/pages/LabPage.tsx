import { Suspense } from 'react';
import { Link, useParams } from 'react-router';
import { CircleCheck, FlaskConical, Info } from 'lucide-react';
import { LAB_BY_ID, LABS } from '@/content/labs';
import { objectivePath } from '@/content';
import { useProgress } from '@/store/progress';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Callout } from '@/components/ui/primitives';
import NotFound from './NotFound';
import { LAB_COMPONENTS } from '@/components/labs/registry';

export type { LabProps } from '@/components/labs/registry';

export default function LabPage() {
  const { labId } = useParams();
  const meta = labId ? LAB_BY_ID[labId] : undefined;
  const rec = useProgress((s) => (labId ? s.labs[labId] : undefined));
  const completeLab = useProgress((s) => s.completeLab);
  if (!meta || !LAB_COMPONENTS[meta.id]) return <NotFound what="lab" />;
  const C = LAB_COMPONENTS[meta.id];
  const idx = LABS.findIndex((l) => l.id === meta.id);
  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Interactive Labs', to: '/labs' }, { label: meta.title }]}
        eyebrow={
          <>
            <Badge tone="accent"><FlaskConical className="h-3 w-3" /> Lab {idx + 1} of {LABS.length}</Badge>
            {meta.objectives.map((o) => <Link key={o} to={objectivePath(o)} className="inline-flex items-center pointer-coarse:min-h-9"><Badge>Objective {o}</Badge></Link>)}
            {rec?.completed && <Badge tone="ok"><CircleCheck className="h-3 w-3" /> Completed · best {rec.best}%</Badge>}
          </>
        }
        title={meta.title}
        subtitle={meta.summary}
      />
      <Callout kind="note" icon={<Info className="h-4 w-4 text-muted" />} title="Learning model vs. production reality" className="mb-6">
        {meta.model}
      </Callout>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-line bg-surface-2" />}>
        <C onComplete={(score) => completeLab(meta.id, score)} />
      </Suspense>
    </div>
  );
}
