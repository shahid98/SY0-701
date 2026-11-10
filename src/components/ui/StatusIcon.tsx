import { Circle, CircleAlert, CircleCheck, CircleDot, Clock, CircleDashed } from 'lucide-react';
import type { ConceptStatus } from '@/lib/mastery';
import { STATUS_META } from '@/lib/mastery';
import { cn } from '@/lib/utils';

export function StatusIcon({ status, className }: { status: ConceptStatus; className?: string }) {
  const label = STATUS_META[status].label;
  const cls = cn('h-3.5 w-3.5 shrink-0', className);
  switch (status) {
    case 'mastered':
      return <CircleCheck className={cn(cls, 'text-ok')} aria-label={label} />;
    case 'review':
      return <Clock className={cn(cls, 'text-warn')} aria-label={label} />;
    case 'weak':
      return <CircleAlert className={cn(cls, 'text-bad')} aria-label={label} />;
    case 'practiced':
      return <CircleDot className={cn(cls, 'text-accent')} aria-label={label} />;
    case 'started':
      return <CircleDashed className={cn(cls, 'text-info')} aria-label={label} />;
    default:
      return <Circle className={cn(cls, 'text-line-strong')} aria-label={label} />;
  }
}
