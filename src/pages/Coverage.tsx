import { useState } from 'react';
import { Link } from 'react-router';
import { CircleCheck, CircleDashed, CircleX, FileCheck, TriangleAlert } from 'lucide-react';
import { CONCEPTS, OBJECTIVES, QUESTIONS, conceptsOf, objectivePath, questionsOfObjective } from '@/content';
import { OUTLINE, OUTLINE_SOURCE } from '@/content/outline';
import { coverageReport } from '@/lib/coverage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge, Callout, Card, ProgressBar, Switch } from '@/components/ui/primitives';
import { OutlineTree } from './ObjectivePage';
import { cn, pct } from '@/lib/utils';

export default function Coverage() {
  const cov = coverageReport();
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const total = pct(cov.coveredLeaves, cov.leaves);
  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Coverage Manifest' }]}
        title="Coverage Manifest"
        subtitle="Every official SY0-701 objective bullet and the lessons that teach it. Anything not mapped to a lesson is flagged as incomplete — nothing is silently omitted."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Card className="p-4 sm:col-span-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted">Official bullets covered</div>
          <div className="mt-1 text-3xl font-bold text-fg">{cov.coveredLeaves}<span className="text-lg text-muted">/{cov.leaves}</span> <span className="text-lg">({total}%)</span></div>
          <ProgressBar value={total} tone={total === 100 ? 'ok' : 'warn'} className="mt-2" />
        </Card>
        <Card className="p-4"><div className="text-xs font-medium uppercase tracking-wide text-muted">Lessons</div><div className="mt-1 text-3xl font-bold text-fg">{CONCEPTS.length}</div></Card>
        <Card className="p-4"><div className="text-xs font-medium uppercase tracking-wide text-muted">Questions</div><div className="mt-1 text-3xl font-bold text-fg">{QUESTIONS.length}</div></Card>
      </div>

      <Callout kind="note" icon={<FileCheck className="h-4 w-4 text-muted" />} title="Source" className="mb-4">
        Checklist transcribed from: {OUTLINE_SOURCE}. When you have the official PDF, compare it with <code>src/content/outline.ts</code>; the manifest, validation test and every page update automatically.
      </Callout>
      {cov.unknownRefs.length > 0 && (
        <Callout kind="trap" icon={<TriangleAlert className="h-4 w-4 text-bad" />} title="Lessons that reference unknown bullets" className="mb-4">
          {cov.unknownRefs.map((u) => <div key={u.conceptId + u.ref}><code>{u.conceptId}</code> → <code>{u.ref}</code></div>)}
        </Callout>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><CircleCheck className="h-3.5 w-3.5 text-ok" /> covered</span>
          <span className="flex items-center gap-1"><CircleDashed className="h-3.5 w-3.5 text-warn" /> partially covered</span>
          <span className="flex items-center gap-1"><CircleX className="h-3.5 w-3.5 text-bad" /> missing (incomplete)</span>
        </div>
        <Switch checked={onlyMissing} onChange={setOnlyMissing} label="Only show gaps" />
      </div>

      <div className="space-y-2">
        {OUTLINE.map((o) => {
          const meta = OBJECTIVES.find((x) => x.id === o.id)!;
          const c = cov.byObjective.get(o.id) ?? { leaves: 0, covered: 0 };
          const p = pct(c.covered, c.leaves);
          const isOpen = open === o.id || onlyMissing;
          if (onlyMissing && c.covered === c.leaves) return null;
          return (
            <Card key={o.id} className="overflow-hidden">
              <button type="button" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={isOpen} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left">
                <span className="w-9 font-mono text-sm font-bold text-accent">{o.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{meta.title}</span>
                  <span className="block truncate text-xs italic text-muted">{o.statement}</span>
                </span>
                <span className="flex w-full items-center gap-2 pl-12 sm:w-auto sm:pl-0">
                  <Badge>{conceptsOf(o.id).length} lessons</Badge>
                  <Badge>{questionsOfObjective(o.id).length} Q</Badge>
                  <Badge tone={p === 100 ? 'ok' : p > 0 ? 'warn' : 'bad'}>{c.covered}/{c.leaves}</Badge>
                </span>
              </button>
              {isOpen && (
                <div className={cn('border-t border-line px-3 py-3')}>
                  <OutlineTree nodes={o.nodes} onlyMissing={onlyMissing} />
                  <Link to={objectivePath(o.id)} className="mt-2 inline-block px-2 text-sm font-medium text-accent hover:underline">Open objective {o.id} →</Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
