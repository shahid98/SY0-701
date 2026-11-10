import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight, House } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4 overflow-x-auto [scrollbar-width:none]', className)}>
      <ol className="flex min-w-max items-center gap-1 text-xs text-muted">
        <li>
          <Link to="/" className="flex items-center gap-1 rounded px-1 py-0.5 hover:text-fg pointer-coarse:min-h-9 pointer-coarse:min-w-9 pointer-coarse:justify-center" aria-label="Home">
            <House className="h-3.5 w-3.5" />
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 opacity-60" />
            {c.to && i < items.length - 1 ? (
              <Link to={c.to} className="rounded px-1 py-0.5 hover:text-fg pointer-coarse:inline-flex pointer-coarse:min-h-9 pointer-coarse:items-center pointer-coarse:px-1.5">{c.label}</Link>
            ) : (
              <span className="px-1 py-0.5 font-medium text-fg-2 pointer-coarse:inline-flex pointer-coarse:min-h-9 pointer-coarse:items-center" aria-current={i === items.length - 1 ? 'page' : undefined}>{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({ title, subtitle, crumbs, actions, eyebrow, icon }: {
  title: ReactNode; subtitle?: ReactNode; crumbs?: Crumb[]; actions?: ReactNode; eyebrow?: ReactNode; icon?: ReactNode;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && <div className="mt-1 shrink-0">{icon}</div>}
          <div className="min-w-0">
            {eyebrow && <div className="mb-1.5 flex flex-wrap items-center gap-2">{eyebrow}</div>}
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1.5 max-w-3xl text-[15px] leading-relaxed text-muted">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
