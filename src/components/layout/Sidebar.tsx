import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  BookOpenCheck, Brain, ChevronRight, ClipboardCheck, Crosshair, FileCheckCorner, FlaskConical, GitCompareArrows, Languages,
  LayoutDashboard, ListChecks, Map as MapIcon, Puzzle, Settings, Timer, TrendingUp, X,
} from 'lucide-react';
import { CONCEPTS, DOMAINS, OBJECTIVES, conceptPath, conceptsOf, domainPath, objectivePath } from '@/content';
import { domainStyle } from '@/content/domains';
import { useMastery } from '@/lib/mastery';
import { useProgress } from '@/store/progress';
import { isDue } from '@/lib/srs';
import { StatusIcon } from '@/components/ui/StatusIcon';
import { cn } from '@/lib/utils';
import type { DomainId } from '@/types/content';

const TOOLS = [
  { to: '/labs', label: 'Interactive Labs', icon: FlaskConical },
  { to: '/flashcards', label: 'Flashcards', icon: Brain, badge: 'due' as const },
  { to: '/vocabulary', label: 'Vocabulary & Acronyms', icon: Languages },
  { to: '/practice', label: 'Practice Questions', icon: ListChecks },
  { to: '/pbq', label: 'PBQ Simulator', icon: Puzzle },
  { to: '/mock-exam', label: 'Mock Exam', icon: Timer },
  { to: '/scenarios', label: 'Scenario Trainer', icon: Crosshair },
  { to: '/compare', label: 'Compare Concepts', icon: GitCompareArrows },
];

const REVIEW = [
  { to: '/revision', label: 'Revision Center', icon: ClipboardCheck, badge: 'wrong' as const },
  { to: '/progress', label: 'Progress & Analytics', icon: TrendingUp },
  { to: '/coverage', label: 'Coverage Manifest', icon: FileCheckCorner },
  { to: '/settings', label: 'Settings & Data', icon: Settings },
];

function linkCls({ isActive }: { isActive: boolean }) {
  return cn(
    'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
    isActive ? 'bg-accent/12 text-fg font-medium' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
  );
}

export function Sidebar({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const location = useLocation();
  const mastery = useMastery();
  const cards = useProgress((s) => s.cards);
  const answers = useProgress((s) => s.answers);
  const [filter, setFilter] = useState('');
  const [openDomains, setOpenDomains] = useState<Set<string>>(new Set());
  const [openObjectives, setOpenObjectives] = useState<Set<string>>(new Set());

  // Auto-expand the branch that contains the current route.
  useEffect(() => {
    const m = location.pathname.match(/^\/learn\/(d\d)(?:\/(\d\.\d))?/);
    if (!m) return;
    setOpenDomains((s) => (s.has(m[1]) ? s : new Set(s).add(m[1])));
    if (m[2]) setOpenObjectives((s) => (s.has(m[2]) ? s : new Set(s).add(m[2])));
  }, [location.pathname]);

  const now = Date.now();
  const dueCount = useMemo(() => Object.values(cards).filter((c) => isDue(c, now)).length, [cards, now]);
  const wrongCount = useMemo(() => Object.values(answers).filter((a) => !a.lastCorrect).length, [answers]);

  const q = filter.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    const concepts = new Set<string>();
    const objectives = new Set<string>();
    const domains = new Set<string>();
    for (const c of CONCEPTS) {
      const hay = `${c.title} ${c.tagline} ${c.objectiveId}`.toLowerCase();
      if (hay.includes(q)) {
        concepts.add(c.id);
        objectives.add(c.objectiveId);
        domains.add(c.domainId);
      }
    }
    for (const o of OBJECTIVES) {
      if (`${o.id} ${o.title} ${o.official}`.toLowerCase().includes(q)) {
        objectives.add(o.id);
        domains.add(o.domainId);
      }
    }
    return { concepts, objectives, domains };
  }, [q]);

  const toggle = (set: Set<string>, id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  return (
    <nav aria-label="Main navigation" className={cn('flex h-full flex-col', className)}>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        <div>
          <NavLink to="/" end className={linkCls} onClick={onNavigate}>
            <LayoutDashboard className="h-4 w-4 text-muted group-hover:text-fg" /> Dashboard
          </NavLink>
          <NavLink to="/learn" end className={linkCls} onClick={onNavigate}>
            <MapIcon className="h-4 w-4 text-muted group-hover:text-fg" /> Learning Path
          </NavLink>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Curriculum</span>
            <span className="text-[11px] text-muted tabular-nums">{mastery.overall.mastered}/{mastery.overall.total}</span>
          </div>
          <div className="relative mb-2 px-1">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter domains, objectives, topics…"
              aria-label="Filter curriculum"
              className="h-8 w-full rounded-lg border border-line bg-surface-2 px-2.5 pr-7 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none"
            />
            {filter && (
              <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg" onClick={() => setFilter('')} aria-label="Clear filter">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <ul className="space-y-0.5">
            {DOMAINS.map((d) => {
              if (matches && !matches.domains.has(d.id)) return null;
              const st = domainStyle(d.id as DomainId);
              const dm = mastery.domain.get(d.id)!;
              const open = matches ? true : openDomains.has(d.id);
              return (
                <li key={d.id}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setOpenDomains((s) => toggle(s, d.id))}
                      className="grid h-7 w-6 place-items-center text-muted hover:text-fg"
                      aria-label={`${open ? 'Collapse' : 'Expand'} domain ${d.number}`}
                      aria-expanded={open}
                    >
                      <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
                    </button>
                    <NavLink
                      to={domainPath(d.id)}
                      end
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn('flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-[13px] transition-colors', isActive ? 'bg-accent/12 font-semibold text-fg' : 'text-fg hover:bg-surface-2')
                      }
                    >
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', st.dot)} />
                      <span className="truncate font-medium">{d.number}.0 {d.title}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted tabular-nums">{dm.score}%</span>
                    </NavLink>
                  </div>
                  {open && (
                    <ul className="ml-3 border-l border-line pl-1.5">
                      {OBJECTIVES.filter((o) => o.domainId === d.id).map((o) => {
                        if (matches && !matches.objectives.has(o.id)) return null;
                        const om = mastery.objective.get(o.id)!;
                        const oOpen = matches ? true : openObjectives.has(o.id);
                        const concepts = conceptsOf(o.id).filter((c) => !matches || matches.concepts.has(c.id) || !matches.concepts.size || `${o.id} ${o.title}`.toLowerCase().includes(q));
                        return (
                          <li key={o.id}>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => setOpenObjectives((s) => toggle(s, o.id))}
                                className="grid h-7 w-5 place-items-center text-muted hover:text-fg"
                                aria-label={`${oOpen ? 'Collapse' : 'Expand'} objective ${o.id}`}
                                aria-expanded={oOpen}
                              >
                                <ChevronRight className={cn('h-3 w-3 transition-transform', oOpen && 'rotate-90')} />
                              </button>
                              <NavLink
                                to={objectivePath(o.id)}
                                end
                                onClick={onNavigate}
                                className={({ isActive }) =>
                                  cn('flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] transition-colors', isActive ? 'bg-accent/12 font-semibold text-fg' : 'text-fg-2 hover:bg-surface-2 hover:text-fg')
                                }
                              >
                                <span className={cn('shrink-0 font-mono text-[11px]', st.text)}>{o.id}</span>
                                <span className="truncate">{o.title}</span>
                                <span className="ml-auto flex shrink-0 items-center gap-1">
                                  <span className="h-1 w-8 overflow-hidden rounded-full bg-surface-3">
                                    <span className={cn('block h-full rounded-full', st.bg)} style={{ width: `${om.score}%` }} />
                                  </span>
                                </span>
                              </NavLink>
                            </div>
                            {oOpen && (
                              <ul className="mb-1 ml-2.5 border-l border-line pl-1.5">
                                {concepts.map((c) => (
                                  <li key={c.id}>
                                    <NavLink
                                      to={conceptPath(c)}
                                      onClick={onNavigate}
                                      className={({ isActive }) =>
                                        cn('flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] leading-snug transition-colors', isActive ? 'bg-accent/12 font-medium text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg')
                                      }
                                    >
                                      <StatusIcon status={mastery.concept.get(c.id)!.status} className="h-3 w-3" />
                                      <span className="line-clamp-2">{c.title}</span>
                                    </NavLink>
                                  </li>
                                ))}
                                {concepts.length === 0 && <li className="px-1.5 py-1 text-[11px] italic text-muted">No lessons yet</li>}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
            {matches && matches.domains.size === 0 && <li className="px-2.5 py-2 text-xs text-muted">No curriculum matches “{filter}”.</li>}
          </ul>
        </div>

        <div>
          <div className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Study tools</div>
          {TOOLS.map((t) => (
            <NavLink key={t.to} to={t.to} className={linkCls} onClick={onNavigate}>
              <t.icon className="h-4 w-4 text-muted group-hover:text-fg" />
              <span className="flex-1">{t.label}</span>
              {t.badge === 'due' && dueCount > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-fg tabular-nums">{dueCount}</span>
              )}
            </NavLink>
          ))}
        </div>

        <div>
          <div className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Review</div>
          {REVIEW.map((t) => (
            <NavLink key={t.to} to={t.to} className={linkCls} onClick={onNavigate}>
              <t.icon className="h-4 w-4 text-muted group-hover:text-fg" />
              <span className="flex-1">{t.label}</span>
              {t.badge === 'wrong' && wrongCount > 0 && (
                <span className="rounded-full bg-bad/15 px-1.5 text-[10px] font-bold text-bad tabular-nums">{wrongCount}</span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="border-t border-line px-4 py-3 text-[10.5px] leading-snug text-muted">
        <BookOpenCheck className="mb-1 h-3.5 w-3.5" />
        Independent study tool. Not affiliated with or endorsed by CompTIA. Security+ is a trademark of CompTIA, Inc.
      </div>
    </nav>
  );
}
