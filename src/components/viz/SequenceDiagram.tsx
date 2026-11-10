import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SequenceVisual, SeqNode, Tone } from '@/types/content';
import { Icon } from '@/components/ui/icons';
import { Badge, toneBg, toneText } from '@/components/ui/primitives';
import { StepCaption, StepFrame, StepList, useStepPlayer } from './StepPlayer';
import { inline } from '@/components/ui/RichText';
import { cn } from '@/lib/utils';

const packetCls: Record<Tone, string> = {
  ok: 'bg-ok text-white dark:text-black',
  bad: 'bg-bad text-white',
  warn: 'bg-warn text-black',
  info: 'bg-info text-white dark:text-black',
  neutral: 'bg-fg-2 text-bg',
  accent: 'bg-accent text-accent-fg',
};

const aspectCls = {
  wide: 'aspect-square min-[480px]:aspect-[4/3] sm:aspect-[2/1]',
  square: 'aspect-[4/3]',
  tall: 'aspect-[3/4] sm:aspect-[4/3]',
};

export function SequenceDiagram({ v, compact }: { v: SequenceVisual; compact?: boolean }) {
  const player = useStepPlayer(v.steps.length, { interval: 3600 });
  const step = v.steps[player.index];
  const nodes = useMemo(() => new Map(v.nodes.map((n) => [n.id, n])), [v.nodes]);

  const links = useMemo<[string, string][]>(() => {
    if (v.links) return v.links;
    const seen = new Set<string>();
    const out: [string, string][] = [];
    for (const s of v.steps) {
      if (!s.from || !s.to || s.from === s.to) continue;
      const k = [s.from, s.to].sort().join('|');
      if (!seen.has(k)) {
        seen.add(k);
        out.push([s.from, s.to]);
      }
    }
    return out;
  }, [v.links, v.steps]);

  // Node badges accumulate across steps so state (e.g. "port authorized") persists.
  const statuses = useMemo(() => {
    const acc: Record<string, [string, Tone]> = {};
    for (let i = 0; i <= player.index; i++) Object.assign(acc, v.steps[i].status ?? {});
    return acc;
  }, [player.index, v.steps]);

  const from = step.from ? nodes.get(step.from) : undefined;
  const to = step.to ? nodes.get(step.to) : undefined;
  const active = new Set([...(step.active ?? []), ...(step.from ? [step.from] : []), ...(step.to ? [step.to] : [])]);
  const tone: Tone = step.tone ?? 'accent';

  return (
    <StepFrame
      player={player}
      title={compact ? undefined : v.title}
      note={v.note}
      caption={<StepCaption index={player.index} title={step.title} text={inline(step.text)} />}
      listView={<StepList steps={v.steps.map((s) => ({ title: s.title, text: <>{s.msg && <code className="mr-1.5 rounded bg-surface-3 px-1 font-mono text-[11px]">{s.msg}</code>}{inline(s.text)}</> }))} />}
    >
      <div className={cn('relative w-full overflow-hidden rounded-xl border border-line bg-surface-2/40 diagram-grid', aspectCls[v.aspect ?? 'wide'])}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {links.map(([a, b]) => {
            const na = nodes.get(a);
            const nb = nodes.get(b);
            if (!na || !nb) return null;
            const isActive = from && to && ((from.id === a && to.id === b) || (from.id === b && to.id === a));
            return (
              <line
                key={`${a}-${b}`}
                x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                stroke={isActive ? 'var(--accent)' : 'var(--line-strong)'}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeDasharray={isActive ? '6 5' : '0'}
                vectorEffect="non-scaling-stroke"
                className={isActive ? 'animate-[dash_1s_linear_infinite]' : undefined}
                style={{ transition: 'stroke 300ms' }}
              />
            );
          })}
        </svg>

        {v.nodes.map((n) => (
          <DiagramNode key={n.id} n={n} active={active.has(n.id)} dim={active.size > 0 && !active.has(n.id)} status={statuses[n.id]} />
        ))}

        {from && to && step.msg && (
          <motion.div
            key={`${player.index}-${from.id}-${to.id}`}
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
            // The packet travels ~78% of the way so its label rests beside the receiving node.
            // With reduced motion it is simply drawn at the midpoint of the link.
            initial={player.reduced ? { left: `${lerp(from.x, to.x, 0.5)}%`, top: `${lerp(from.y, to.y, 0.5)}%` } : { left: `${from.x}%`, top: `${from.y}%`, opacity: 0, scale: 0.7 }}
            animate={player.reduced ? { left: `${lerp(from.x, to.x, 0.5)}%`, top: `${lerp(from.y, to.y, 0.5)}%` } : { left: `${lerp(from.x, to.x, 0.78)}%`, top: `${lerp(from.y, to.y, 0.78)}%`, opacity: 1, scale: 1 }}
            transition={{ duration: player.reduced ? 0 : 1.3, ease: [0.3, 0.7, 0.3, 1] }}
          >
            <span className={cn('flex max-w-[9rem] items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-lg sm:max-w-[13rem] sm:text-[11px]', packetCls[tone])}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
              <span className="truncate">{step.msg}</span>
            </span>
          </motion.div>
        )}
      </div>
      <style>{'@keyframes dash { to { stroke-dashoffset: -22; } }'}</style>
    </StepFrame>
  );
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function DiagramNode({ n, active, dim, status }: { n: SeqNode; active: boolean; dim: boolean; status?: [string, Tone] }) {
  return (
    <div
      className={cn('absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-opacity duration-300', dim && 'opacity-55')}
      style={{ left: `${n.x}%`, top: `${n.y}%` }}
    >
      <div
        className={cn(
          'grid h-10 w-10 place-items-center rounded-2xl border-2 bg-surface shadow-sm transition-all duration-300 sm:h-14 sm:w-14',
          active ? 'scale-105 border-accent shadow-lg shadow-accent/25' : 'border-line-strong',
        )}
      >
        <Icon name={n.icon} className={cn('h-5 w-5 sm:h-6 sm:w-6', toneText[n.tone ?? 'neutral'])} />
      </div>
      <div className="mt-1 w-[4.6rem] text-center text-[10.5px] font-semibold leading-tight text-fg sm:w-28 sm:text-xs">{n.label}</div>
      {n.sub && <div className="hidden w-28 text-center text-[10.5px] leading-tight text-muted sm:block">{n.sub}</div>}
      {status && (
        <Badge tone={status[1]} className="mt-1 max-w-[6rem] truncate !px-1.5 text-[9.5px] sm:max-w-none sm:text-[10px]">
          <span className={cn('h-1.5 w-1.5 rounded-full', toneBg[status[1]])} />
          {status[0]}
        </Badge>
      )}
    </div>
  );
}
