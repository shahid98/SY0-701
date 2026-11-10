import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LogLine {
  ts: string; // HH:MM:SS
  src: string; // source system, e.g. "auth", "firewall"
  text: string;
  sev?: 'info' | 'warn' | 'crit';
}

/** Mini SIEM-style log viewer: filter by source, free-text search, click a token to pivot. */
export function LogExplorer({ logs, sources, query, setQuery, height = 'max-h-96' }: {
  logs: LogLine[]; sources: Record<string, string>; query: string; setQuery: (q: string) => void; height?: string;
}) {
  const [active, setActive] = useState<Set<string>>(new Set(Object.keys(sources)));
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = useMemo(
    () => logs.filter((l) => active.has(l.src) && terms.every((t) => `${l.ts} ${l.src} ${l.text}`.toLowerCase().includes(t))),
    [logs, active, terms],
  );
  const toggle = (s: string) => setActive((a) => {
    const n = new Set(a);
    if (n.has(s)) n.delete(s);
    else n.add(s);
    return n;
  });

  const tokenize = (text: string) =>
    text.split(/(\s+)/).map((tok, i) => {
      const t = tok.replace(/[,;]$/, '');
      const pivot = /^(user|src|dst|host|domain|proc|parent|account)=/.test(t) ? t.split('=')[1] : /^\d+\.\d+\.\d+\.\d+$/.test(t) ? t : null;
      if (!pivot) return <span key={i}>{tok}</span>;
      return (
        <button key={i} type="button" onClick={() => setQuery(pivot)} className="rounded text-sky-300 underline decoration-dotted underline-offset-2 hover:bg-sky-400/20" title={`Pivot: filter on ${pivot}`}>
          {tok}
        </button>
      );
    });

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#0a0f1a]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search logs… (click any underlined value to pivot)"
            className="h-8 w-full rounded-md border border-white/10 bg-white/5 pl-7 pr-7 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            aria-label="Search logs"
          />
          {query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}
        </div>
        {Object.entries(sources).map(([k, label]) => (
          <button key={k} type="button" onClick={() => toggle(k)} aria-pressed={active.has(k)}
            className={cn('rounded-md border px-2 py-1 text-[11px] font-semibold', active.has(k) ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-200' : 'border-white/10 text-slate-500')}>
            {label}
          </button>
        ))}
      </div>
      <div className={cn('overflow-auto font-mono text-[11.5px] leading-relaxed', height)} role="log" aria-label="Log results">
        {shown.length === 0 && <div className="px-3 py-6 text-center text-slate-500">No matching events.</div>}
        {shown.map((l, i) => (
          <div key={i} className={cn('flex gap-3 border-b border-white/5 px-3 py-1', l.sev === 'crit' ? 'bg-rose-500/10' : l.sev === 'warn' ? 'bg-amber-400/5' : '')}>
            <span className="shrink-0 text-slate-500">{l.ts}</span>
            <span className="w-16 shrink-0 font-semibold uppercase text-violet-300">{l.src}</span>
            <span className={cn('min-w-0 break-all', l.sev === 'crit' ? 'text-rose-200' : l.sev === 'warn' ? 'text-amber-100' : 'text-emerald-100')}>{tokenize(l.text)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-3 py-1.5 text-[10.5px] text-slate-500">{shown.length} of {logs.length} events</div>
    </div>
  );
}
