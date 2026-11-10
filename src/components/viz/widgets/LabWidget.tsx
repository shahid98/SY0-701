import { Suspense } from 'react';
import { Link } from 'react-router';
import { ExternalLink, FlaskConical } from 'lucide-react';
import { LAB_COMPONENTS } from '@/components/labs/registry';
import { LAB_BY_ID } from '@/content/labs';
import { useProgress } from '@/store/progress';

/** Embeds a full interactive lab inside a lesson; completion is recorded like the lab page. */
export default function LabWidget({ id }: { id: string }) {
  const C = LAB_COMPONENTS[id];
  const meta = LAB_BY_ID[id];
  const completeLab = useProgress((s) => s.completeLab);
  if (!C || !meta) return <p className="text-sm text-bad">Unknown lab “{id}”.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-sm">
        <FlaskConical className="h-4 w-4 text-accent" />
        <span className="flex-1 font-medium text-fg">Embedded lab: {meta.title}</span>
        <Link to={`/labs/${id}`} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">Open full page <ExternalLink className="h-3 w-3" /></Link>
      </div>
      <p className="text-xs text-muted">{meta.model}</p>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface-2" />}>
        <C onComplete={(score) => completeLab(id, score)} />
      </Suspense>
    </div>
  );
}
