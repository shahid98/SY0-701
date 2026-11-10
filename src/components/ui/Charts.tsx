/**
 * Minimal SVG charts following the dataviz mark specs: columns <=24px with 4px rounded
 * data-ends anchored to a single baseline, 2px surface gaps, 2px lines, >=8px markers with
 * a surface ring, hairline recessive grid, hover/focus tooltips (value first) and a table view.
 */
import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Datum {
  label: string; // x category (short)
  value: number;
  detail?: string; // tooltip secondary line
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}

function ChartFrame({ title, sub, children, table, className }: { title: string; sub?: string; children: ReactNode; table: ReactNode; className?: string }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <figure className={cn('rounded-2xl border border-line bg-surface p-4', className)}>
      <figcaption className="mb-3 flex items-start gap-2">
        <div className="flex-1">
          <div className="text-sm font-semibold text-fg">{title}</div>
          {sub && <div className="text-xs text-muted">{sub}</div>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          aria-pressed={showTable}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
        >
          <Table2 className="h-3.5 w-3.5" /> {showTable ? 'Chart' : 'Table'}
        </button>
      </figcaption>
      {showTable ? <div className="max-h-72 overflow-auto">{table}</div> : children}
    </figure>
  );
}

function DataTable({ rows, valueLabel, format }: { rows: Datum[]; valueLabel: string; format: (v: number) => string }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-muted"><th className="py-1 font-medium">Label</th><th className="py-1 text-right font-medium">{valueLabel}</th></tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.label}-${i}`} className="border-t border-line">
            <td className="py-1 text-fg-2">{r.detail ?? r.label}</td>
            <td className="py-1 text-right font-semibold tabular-nums text-fg">{format(r.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Vertical column chart for a single series. */
export function ColumnChart({ title, sub, data, color = 'var(--accent)', format = (v) => String(v), valueLabel = 'Value', height = 160, labelEvery = 1, max }: {
  title: string; sub?: string; data: Datum[]; color?: string; format?: (v: number) => string; valueLabel?: string; height?: number; labelEvery?: number; max?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const top = max ?? niceMax(Math.max(...data.map((d) => d.value), 0));
  const W = Math.max(280, data.length * 26);
  const H = height;
  const padL = 34;
  const padB = 20;
  const plotW = W - padL - 4;
  const plotH = H - padB - 8;
  const band = plotW / Math.max(1, data.length);
  const barW = Math.min(24, band - 2); // 2px surface gap between adjacent columns
  const ticks = [0, top / 2, top];
  const y = (v: number) => 8 + plotH - (v / top) * plotH;

  return (
    <ChartFrame title={title} sub={sub} table={<DataTable rows={data} valueLabel={valueLabel} format={format} />}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${title}. ${data.length} values.`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - 4} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--muted)">{format(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = padL + i * band + (band - barW) / 2;
            const h = Math.max(0, (d.value / top) * plotH);
            const r = Math.min(4, h, barW / 2);
            const yTop = 8 + plotH - h;
            // Rounded data-end, square at the baseline.
            const path = h <= 0 ? '' : `M${x},${8 + plotH} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${8 + plotH} Z`;
            return (
              <g key={i}>
                {path && <path d={path} fill={color} opacity={hover === null || hover === i ? 1 : 0.55} />}
                <rect
                  x={padL + i * band} y={8} width={band} height={plotH}
                  fill="transparent" tabIndex={0} role="graphics-symbol" aria-label={`${d.detail ?? d.label}: ${format(d.value)}`}
                  onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                  className="cursor-default outline-none"
                />
                {i % labelEvery === 0 && (
                  <text x={padL + i * band + band / 2} y={H - 6} textAnchor="middle" fontSize="9.5" fill="var(--muted)">{d.label}</text>
                )}
              </g>
            );
          })}
          <line x1={padL} x2={W - 4} y1={8 + plotH} y2={8 + plotH} stroke="var(--line-strong)" strokeWidth={1} />
        </svg>
        {hover !== null && data[hover] && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `${((padL + hover * band + band / 2) / W) * 100}%` }}
          >
            <div className="font-bold tabular-nums text-fg">{format(data[hover].value)}</div>
            <div className="text-muted">{data[hover].detail ?? data[hover].label}</div>
          </div>
        )}
      </div>
    </ChartFrame>
  );
}

/** Single-series line chart with a crosshair tooltip (0-100 scale for percentages). */
export function LineChart({ title, sub, data, color = 'var(--accent)', format = (v) => `${v}%`, valueLabel = 'Score', max = 100, refLine }: {
  title: string; sub?: string; data: Datum[]; color?: string; format?: (v: number) => string; valueLabel?: string; max?: number; refLine?: { value: number; label: string };
}) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const id = useId();
  const W = 520;
  const H = 180;
  const padL = 34;
  const padR = 12;
  const plotW = W - padL - padR;
  const plotH = H - 30;
  const x = (i: number) => padL + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => 8 + plotH - (v / max) * plotH;
  const path = useMemo(() => data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`).join(' '), [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMove = (e: React.PointerEvent) => {
    const svg = ref.current;
    if (!svg || !data.length) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 1; i < data.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHover(best);
  };

  return (
    <ChartFrame title={title} sub={sub} table={<DataTable rows={data} valueLabel={valueLabel} format={format} />}>
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none" role="img" aria-labelledby={id}
          onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <title id={id}>{title}</title>
          {[0, max / 2, max].map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="var(--muted)">{format(t)}</text>
            </g>
          ))}
          {refLine && (
            <g>
              <line x1={padL} x2={W - padR} y1={y(refLine.value)} y2={y(refLine.value)} stroke="var(--muted)" strokeWidth={1} opacity={0.6} />
              <text x={W - padR} y={y(refLine.value) - 4} textAnchor="end" fontSize="9.5" fill="var(--muted)">{refLine.label}</text>
            </g>
          )}
          {data.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={8} y2={8 + plotH} stroke="var(--line-strong)" strokeWidth={1} />}
          {data.map((d, i) => (
            <circle key={i} cx={x(i)} cy={y(d.value)} r={hover === i ? 5.5 : 4} fill={color} stroke="var(--surface)" strokeWidth={2} />
          ))}
          {data.length > 0 && (
            <text x={x(data.length - 1)} y={y(data[data.length - 1].value) - 10} textAnchor="end" fontSize="10.5" fontWeight="600" fill="var(--fg)">
              {format(data[data.length - 1].value)}
            </text>
          )}
          {data.map((d, i) => (
            <text key={`l${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="var(--muted)">{data.length > 12 && i % 2 ? '' : d.label}</text>
          ))}
        </svg>
        {hover !== null && data[hover] && (
          <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-lg" style={{ left: `${(x(hover) / W) * 100}%` }}>
            <div className="font-bold tabular-nums text-fg">{format(data[hover].value)}</div>
            <div className="text-muted">{data[hover].detail ?? data[hover].label}</div>
          </div>
        )}
      </div>
    </ChartFrame>
  );
}

/** Sequential single-hue fill for a 0-100 value (monotonic lightness via mixing with the surface). */
export function seqFill(v: number | null): { bg: string; fg: string } {
  if (v === null) return { bg: 'var(--surface-2)', fg: 'var(--muted)' };
  const steps = [12, 28, 46, 66, 86];
  const s = steps[Math.min(4, Math.floor(v / 20.0001))];
  return { bg: `color-mix(in oklab, var(--accent) ${s}%, var(--surface-2))`, fg: s >= 66 ? 'var(--accent-fg)' : 'var(--fg)' };
}
