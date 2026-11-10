import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { List, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { usePrefersReducedMotion } from '@/lib/motion';
import { cn, isTypingTarget } from '@/lib/utils';

export interface StepPlayerState {
  index: number;
  playing: boolean;
  count: number;
  next: () => void;
  prev: () => void;
  restart: () => void;
  toggle: () => void;
  goTo: (i: number) => void;
  reduced: boolean;
}

export function useStepPlayer(count: number, { interval = 3200, loop = false }: { interval?: number; loop?: boolean } = {}): StepPlayerState {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      setIndex((i) => {
        if (i + 1 < count) return i + 1;
        if (loop) return 0;
        setPlaying(false);
        return i;
      });
    }, interval);
    return () => clearTimeout(t);
  }, [playing, index, count, interval, loop]);

  const next = useCallback(() => setIndex((i) => Math.min(count - 1, i + 1)), [count]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const restart = useCallback(() => {
    setIndex(0);
    setPlaying(false);
  }, []);
  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && index >= count - 1) setIndex(0);
      return !p;
    });
  }, [index, count]);
  const goTo = useCallback((i: number) => {
    setIndex(Math.max(0, Math.min(count - 1, i)));
  }, [count]);

  return { index, playing, count, next, prev, restart, toggle, goTo, reduced };
}

/** Controls bar + keyboard handling. Wrap the visual in this. */
export function StepFrame({
  player, title, children, caption, note, listView, className, toolbar,
}: {
  player: StepPlayerState;
  title?: ReactNode;
  children: ReactNode;
  caption: ReactNode; // explanation of the current step
  note?: ReactNode; // simplified model disclaimer
  listView?: ReactNode; // static fallback rendering of every step
  className?: string;
  toolbar?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showList, setShowList] = useState(false);
  const reduced = player.reduced;

  useEffect(() => {
    if (reduced && listView) setShowList(true);
  }, [reduced, listView]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); player.next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); player.prev(); }
    else if (e.key === ' ' && e.target === ref.current) { e.preventDefault(); player.toggle(); }
    else if (e.key === 'Home') { e.preventDefault(); player.restart(); }
  };

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-roledescription="step-by-step visualization"
      className={cn('rounded-2xl border border-line bg-surface focus-visible:outline-2', className)}
    >
      {(title || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
          {title && <h4 className="flex-1 text-sm font-semibold text-fg">{title}</h4>}
          {toolbar}
        </div>
      )}

      {showList && listView ? (
        <div className="p-4">{listView}</div>
      ) : (
        <>
          <div className="p-3 sm:p-4">{children}</div>
          <div className="mx-3 mb-3 min-h-[5.5rem] rounded-xl border border-line bg-surface-2/60 p-3.5 sm:mx-4 sm:mb-4" aria-live="polite">
            {caption}
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2.5 sm:px-4">
        {!showList && (
          <>
            <Button size="sm" variant="primary" onClick={player.toggle} aria-label={player.playing ? 'Pause' : 'Play'}>
              {player.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="hidden sm:inline">{player.playing ? 'Pause' : 'Play'}</span>
            </Button>
            <Button size="icon" variant="ghost" onClick={player.prev} disabled={player.index === 0} aria-label="Previous step">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={player.next} disabled={player.index >= player.count - 1} aria-label="Next step">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={player.restart} aria-label="Restart">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="mx-1 flex flex-1 items-center gap-1 overflow-hidden" role="group" aria-label="Steps">
              {Array.from({ length: player.count }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => player.goTo(i)}
                  aria-label={`Go to step ${i + 1}`}
                  aria-current={i === player.index ? 'step' : undefined}
                  className={cn(
                    'h-1.5 min-w-2 flex-1 rounded-full transition-colors',
                    i === player.index ? 'bg-accent' : i < player.index ? 'bg-accent/40' : 'bg-surface-3 hover:bg-line-strong',
                  )}
                />
              ))}
            </div>
            <span className="text-xs tabular-nums text-muted">{player.index + 1}/{player.count}</span>
          </>
        )}
        {listView && (
          <Button size="sm" variant={showList ? 'secondary' : 'ghost'} onClick={() => setShowList((s) => !s)} className={cn(showList && 'ml-auto')} aria-pressed={showList}>
            <List className="h-4 w-4" /> {showList ? 'Back to animation' : 'All steps'}
          </Button>
        )}
      </div>
      {note && <p className="border-t border-line px-4 py-2 text-[11px] leading-snug text-muted">{note}</p>}
    </div>
  );
}

/** Standard step caption block. */
export function StepCaption({ index, title, text, tone }: { index: number; title: string; text: ReactNode; tone?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <span className={cn('grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-fg', tone)}>{index + 1}</span>
        <span className="text-sm font-semibold text-fg">{title}</span>
      </div>
      <div className="text-sm leading-relaxed text-fg-2">{text}</div>
    </div>
  );
}

export function StepList({ steps }: { steps: { title: string; text: ReactNode }[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">{i + 1}</span>
          <div>
            <div className="text-sm font-semibold text-fg">{s.title}</div>
            <div className="text-sm leading-relaxed text-fg-2">{s.text}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
