import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { inline } from '@/components/ui/RichText';
import { cn } from '@/lib/utils';

export function FlipCard({ front, back, className, flipped: fProp, onFlip, large }: {
  front: string; back: string; className?: string; flipped?: boolean; onFlip?: (f: boolean) => void; large?: boolean;
}) {
  const [local, setLocal] = useState(false);
  const flipped = fProp ?? local;
  const flip = () => {
    const n = !flipped;
    if (fProp === undefined) setLocal(n);
    onFlip?.(n);
  };
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={flipped ? 'Show question side' : 'Reveal answer'}
      aria-pressed={flipped}
      className={cn('flip-scene block w-full text-left', className)}
    >
      <div className={cn('flip-card relative w-full', large ? 'min-h-72' : 'min-h-36', flipped && 'is-flipped')}>
        <div className={cn('flip-face absolute inset-0 flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm', large && 'p-6 sm:p-8')}>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">Question</span>
          <span className={cn('mt-2 flex flex-1 items-center font-semibold leading-snug text-fg', large ? 'text-xl sm:text-2xl' : 'text-sm')}>{inline(front)}</span>
          <span className="mt-2 flex items-center gap-1 text-[11px] text-muted"><RotateCcw className="h-3 w-3" /> Tap to flip</span>
        </div>
        <div className={cn('flip-face flip-back absolute inset-0 flex flex-col overflow-y-auto rounded-2xl border border-accent/40 bg-accent/[0.06] p-4 shadow-sm', large && 'p-6 sm:p-8')}>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">Answer</span>
          <span className={cn('mt-2 flex flex-1 items-center leading-relaxed text-fg', large ? 'text-base sm:text-lg' : 'text-[13px]')}>{inline(back)}</span>
        </div>
      </div>
    </button>
  );
}
