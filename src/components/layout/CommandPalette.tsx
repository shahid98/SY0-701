import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpDown, CornerDownLeft, Search } from 'lucide-react';
import { KIND_LABEL, PAGES, search, type SearchItem } from '@/lib/search';
import { Kbd } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();

  const results: SearchItem[] = useMemo(() => (q.trim() ? search(q) : PAGES.slice(0, 10)), [q]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const go = (item: SearchItem | undefined) => {
    if (!item) return;
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-start justify-center p-3 pt-[10vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ y: -12, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search lessons, objectives, acronyms, labs…  e.g. “OCSP”, “802.1X”, “RPO”"
                className="h-14 w-full bg-transparent text-base text-fg placeholder:text-muted focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-results"
                aria-activedescendant={results[active] ? `palette-item-${active}` : undefined}
              />
              <Kbd>Esc</Kbd>
            </div>
            <ul id="palette-results" ref={listRef} role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
              {!q.trim() && <li className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Jump to</li>}
              {results.map((r, i) => (
                <li
                  key={`${r.kind}-${r.to}-${i}`}
                  id={`palette-item-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r)}
                  className={cn('flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5', i === active ? 'bg-accent/12' : 'hover:bg-surface-2')}
                >
                  <span className="mt-0.5 w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">{KIND_LABEL[r.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{r.title}</span>
                    <span className="block truncate text-xs text-muted">{r.subtitle}</span>
                  </span>
                  {i === active && <CornerDownLeft className="mt-1 h-3.5 w-3.5 shrink-0 text-muted" />}
                </li>
              ))}
              {q.trim() && results.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted">No results for “{q}”. Try an acronym or a shorter phrase.</li>
              )}
            </ul>
            <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-[11px] text-muted">
              <span className="flex items-center gap-1"><ArrowUpDown className="h-3 w-3" /> navigate</span>
              <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> open</span>
              <span className="ml-auto">Searches lessons, objectives, glossary, labs, comparisons and scenarios</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
