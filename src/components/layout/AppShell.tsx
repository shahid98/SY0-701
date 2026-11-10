import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import {
  BookOpen, Flame, GraduationCap, Keyboard, Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Sun, X, Zap,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { Button, Dialog, Kbd, Segmented } from '@/components/ui/primitives';
import { useProgress } from '@/store/progress';
import { useToday } from '@/lib/activity';
import { cn, isTypingTarget } from '@/lib/utils';

function useSystemDark() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = () => setDark(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return dark;
}

export function useIsDark() {
  const theme = useProgress((s) => s.settings.theme);
  const sys = useSystemDark();
  return theme === 'dark' || (theme === 'system' && sys);
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted" role="status">
      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" /> Loading…
    </div>
  );
}

const SHORTCUTS: [string, string][] = [
  ['Ctrl / ⌘ + K  or  /', 'Open search'],
  ['M', 'Toggle Beginner / Exam explanation mode'],
  ['F', 'Toggle distraction-free reading mode'],
  ['[  and  ]', 'Previous / next lesson (on a lesson page)'],
  ['← / → / Space', 'Step / play a focused visualization'],
  ['1–6 then Enter', 'Pick answers and submit a question'],
  ['Space, then 1–4', 'Flip a flashcard, then rate Again / Hard / Good / Easy'],
  ['?', 'Show this help'],
];

export function AppShell() {
  const settings = useProgress((s) => s.settings);
  const setSetting = useProgress((s) => s.setSetting);
  const dark = useIsDark();
  const { today, goal, streak } = useToday();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Theme + motion classes on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#060a13' : '#f4f6fb');
  }, [dark]);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('reduce-motion', settings.motion === 'reduce');
    el.classList.toggle('force-motion', settings.motion === 'full');
  }, [settings.motion]);
  useEffect(() => {
    document.documentElement.classList.toggle('reading-mode', settings.reading);
  }, [settings.reading]);

  // Scroll to top on navigation, close the mobile drawer
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setDrawerOpen(false);
  }, [location.pathname]);

  const toggleMode = useCallback(() => setSetting('mode', settings.mode === 'beginner' ? 'exam' : 'beginner'), [settings.mode, setSetting]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (isTypingTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === '/') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === '?') {
        setHelpOpen(true);
      } else if (e.key.toLowerCase() === 'm') {
        toggleMode();
      } else if (e.key.toLowerCase() === 'f') {
        setSetting('reading', !useProgress.getState().settings.reading);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleMode, setSetting]);

  const reading = settings.reading;
  const collapsed = settings.sidebarCollapsed;
  const motionMode = settings.motion === 'reduce' ? 'always' : settings.motion === 'full' ? 'never' : 'user';

  return (
    <MotionConfig reducedMotion={motionMode}>
      <div className="min-h-dvh">
        <a href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }} className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
          Skip to content
        </a>

        {!reading && (
          <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost" size="icon" className="max-lg:hidden"
                onClick={() => setSetting('sidebarCollapsed', !collapsed)}
                aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
                title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
              >
                {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>
              <Link to="/" className="flex items-center gap-2 rounded-lg pr-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 text-white shadow-md shadow-cyan-500/20">
                  <GraduationCap className="h-4.5 w-4.5" />
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-bold tracking-tight text-fg">Security+ Lab</span>
                  <span className="block text-[10px] font-medium uppercase tracking-widest text-muted">SY0-701 interactive</span>
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="mx-auto hidden h-9 w-full max-w-md items-center gap-2 rounded-lg border border-line bg-surface-2/70 px-3 text-sm text-muted transition-colors hover:border-line-strong md:flex"
                aria-label="Search (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search lessons, acronyms, labs…</span>
                <Kbd>Ctrl</Kbd><Kbd>K</Kbd>
              </button>

              <div className="ml-auto flex items-center gap-1 md:ml-0">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setPaletteOpen(true)} aria-label="Search">
                  <Search className="h-5 w-5" />
                </Button>
                <Segmented
                  label="Explanation mode"
                  size="sm"
                  className="max-sm:hidden"
                  value={settings.mode}
                  onChange={(v) => setSetting('mode', v)}
                  options={[
                    { value: 'beginner', label: 'Beginner', title: 'Everyday language and analogies (M)' },
                    { value: 'exam', label: 'Exam', title: 'CompTIA terminology and scenario language (M)' },
                  ]}
                />
                <Button variant="ghost" size="sm" className="sm:hidden" onClick={toggleMode} aria-label="Toggle explanation mode">
                  {settings.mode === 'beginner' ? 'Beg.' : 'Exam'}
                </Button>
                <Link
                  to="/progress"
                  className="hidden items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-fg-2 hover:bg-surface-2 sm:flex"
                  title={`${streak}-day streak · ${today.xp}/${goal} XP today`}
                >
                  <span className={cn('flex items-center gap-0.5', streak > 0 ? 'text-orange-500' : 'text-muted')}>
                    <Flame className="h-4 w-4" /> {streak}
                  </span>
                  <span className="flex items-center gap-0.5 text-accent">
                    <Zap className="h-4 w-4" /> {today.xp}/{goal}
                  </span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setSetting('reading', true)} aria-label="Distraction-free reading mode (F)" title="Reading mode (F)">
                  <BookOpen className="h-[18px] w-[18px]" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setSetting('theme', dark ? 'light' : 'dark')}
                  aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
                  title="Toggle theme"
                >
                  {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                </Button>
                <Button variant="ghost" size="icon" className="max-sm:hidden" onClick={() => setHelpOpen(true)} aria-label="Keyboard shortcuts (?)" title="Keyboard shortcuts (?)">
                  <Keyboard className="h-[18px] w-[18px]" />
                </Button>
              </div>
            </div>
          </header>
        )}

        <div className="flex">
          {!reading && !collapsed && (
            <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 border-r border-line bg-surface/40 lg:block">
              <Sidebar />
            </aside>
          )}

          <main id="main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
            <div className={cn('mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8', reading ? 'max-w-3xl' : 'max-w-6xl')}>
              <Suspense fallback={<PageFallback />}>
                <Outlet />
              </Suspense>
            </div>
          </main>
        </div>

        {reading && (
          <div className="fixed right-3 top-3 z-50 flex gap-2 no-print">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="shadow-md">Back</Button>
            <Button variant="primary" size="sm" onClick={() => setSetting('reading', false)} className="shadow-md">
              <X className="h-4 w-4" /> Exit reading mode
            </Button>
          </div>
        )}

        {/* Mobile drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
              <motion.aside
                initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                className="absolute inset-y-0 left-0 flex w-[86vw] max-w-80 flex-col border-r border-line bg-surface"
                role="dialog" aria-modal="true" aria-label="Navigation"
              >
                <div className="flex h-14 items-center justify-between border-b border-line px-4">
                  <span className="text-sm font-bold">Security+ Lab</span>
                  <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="min-h-0 flex-1">
                  <Sidebar onNavigate={() => setDrawerOpen(false)} />
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

        <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts">
          <ul className="divide-y divide-line">
            {SHORTCUTS.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-fg-2">{v}</span>
                <span className="shrink-0 font-mono text-xs text-fg">{k}</span>
              </li>
            ))}
          </ul>
        </Dialog>
      </div>
    </MotionConfig>
  );
}
