import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tiny formatter for lesson strings:
 *   **bold**, *italic*, `code`, paragraphs (blank line) and "- " bullet lists.
 */
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;

export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(<Fragment key={i++}>{text.slice(last, idx)}</Fragment>);
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={i++} className="font-semibold text-fg">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={i++} className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[0.86em] text-fg">{tok.slice(1, -1)}</code>);
    else out.push(<em key={i++}>{tok.slice(1, -1)}</em>);
    last = idx + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return out;
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/\n\s*\n/);
  return (
    <div className={cn('space-y-2.5', className)}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        if (lines.every((l) => /^\s*-\s+/.test(l))) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-5 marker:text-accent">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*-\s+/, ''))}</li>
              ))}
            </ul>
          );
        }
        if (/^\s*\d+\.\s+/.test(lines[0]) && lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
          return (
            <ol key={bi} className="list-decimal space-y-1 pl-5 marker:font-semibold marker:text-accent">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*\d+\.\s+/, ''))}</li>
              ))}
            </ol>
          );
        }
        return <p key={bi}>{inline(block.replace(/\n/g, ' '))}</p>;
      })}
    </div>
  );
}
