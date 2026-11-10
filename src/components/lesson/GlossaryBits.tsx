import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeftRight, BookA, ExternalLink } from 'lucide-react';
import type { GlossaryEntry } from '@/types/content';
import { GLOSSARY_BY_ID } from '@/content/glossary';
import { objectivePath } from '@/content';
import { Badge, Dialog } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

export function GlossaryCard({ g, onPick }: { g: GlossaryEntry; onPick?: (id: string) => void }) {
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 text-sm leading-relaxed text-fg-2">{children}</div>
    </div>
  );
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xl font-bold text-fg">{g.term}</div>
        {g.full && <div className="text-sm font-medium text-accent">{g.full}</div>}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {g.objectives.map((o) => (
            <Link key={o} to={objectivePath(o)} className="inline-flex items-center pointer-coarse:min-h-9"><Badge tone="accent">Objective {o}</Badge></Link>
          ))}
        </div>
      </div>
      <Row label="In plain English">{g.simple}</Row>
      <Row label="Technical definition">{g.tech}</Row>
      <Row label="Real example">{g.example}</Row>
      <Row label="Exam context">{g.exam}</Row>
      {g.confused && g.confused.length > 0 && (
        <Row label="Frequently confused with">
          <ul className="space-y-1">
            {g.confused.map(([id, note]) => {
              const other = GLOSSARY_BY_ID.get(id);
              return (
                <li key={id} className="flex gap-2">
                  <ArrowLeftRight className="mt-1 h-3.5 w-3.5 shrink-0 text-warn" />
                  <span>
                    {other && onPick ? (
                      <button type="button" className="font-semibold text-fg underline decoration-dotted underline-offset-2 hover:text-accent" onClick={() => onPick(other.id)}>{other.term}</button>
                    ) : (
                      <strong className="text-fg">{other?.term ?? id}</strong>
                    )}
                    {': '}{note}
                  </span>
                </li>
              );
            })}
          </ul>
        </Row>
      )}
      {g.related && g.related.length > 0 && (
        <Row label="Related terms">
          <div className="flex flex-wrap gap-1.5">
            {g.related.map((id) => {
              const r = GLOSSARY_BY_ID.get(id);
              if (!r) return null;
              return onPick ? (
                <button key={id} type="button" onClick={() => onPick(id)} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg hover:border-accent">
                  {r.term}
                </button>
              ) : (
                <span key={id} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg">{r.term}</span>
              );
            })}
          </div>
        </Row>
      )}
    </div>
  );
}

/** Inline chip that opens a glossary entry in a dialog (with navigation between related terms). */
export function GlossaryChips({ ids, className }: { ids: string[]; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const entries = ids.map((id) => GLOSSARY_BY_ID.get(id)).filter((g): g is GlossaryEntry => !!g);
  if (!entries.length) return null;
  const current = open ? GLOSSARY_BY_ID.get(open) : undefined;
  return (
    <>
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {entries.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setOpen(g.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs font-medium text-fg transition-colors hover:border-accent hover:text-accent"
            title={g.full ?? g.simple}
          >
            <BookA className="h-3.5 w-3.5 opacity-70" /> {g.term}
          </button>
        ))}
      </div>
      <Dialog open={!!current} onClose={() => setOpen(null)} title="Glossary">
        {current && (
          <>
            <GlossaryCard g={current} onPick={setOpen} />
            <Link to={`/vocabulary?tab=glossary&term=${current.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              Open in glossary <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </Dialog>
    </>
  );
}
