import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

export function WidgetFrame({ title, badge = 'Interactive', children, note, className, toolbar }: {
  title: string; badge?: string; children: ReactNode; note?: ReactNode; className?: string; toolbar?: ReactNode;
}) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface', className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <h4 className="flex-1 text-sm font-semibold text-fg">{title}</h4>
        {toolbar}
        <Badge tone="accent">{badge}</Badge>
      </div>
      <div className="p-4">{children}</div>
      {note && <p className="border-t border-line px-4 py-2 text-[11px] leading-snug text-muted">{note}</p>}
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1 text-xs font-medium text-muted', className)}>
      {label}
      {children}
    </label>
  );
}

export const inputCls = 'h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-fg focus:border-accent focus:outline-none';
export const monoBox = 'rounded-lg border border-line bg-surface-2/70 px-3 py-2 font-mono text-[12px] leading-relaxed text-fg break-all';
