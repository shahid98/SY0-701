/**
 * Design-system primitives: buttons, cards, badges, progress, callouts, tabs,
 * disclosures, segmented controls and dialogs. Everything else composes these.
 */
import {
  createContext, forwardRef, useCallback, useContext, useEffect, useId, useRef, useState,
  type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { Link } from 'react-router';
import type { Tone } from '@/types/content';
import { cn } from '@/lib/utils';

/* ---------- Button ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

const variantCls: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg hover:brightness-110 shadow-sm shadow-accent/20 border border-transparent',
  secondary: 'bg-surface-2 text-fg hover:bg-surface-3 border border-line',
  ghost: 'text-fg-2 hover:bg-surface-2 hover:text-fg border border-transparent',
  outline: 'border border-line-strong text-fg hover:bg-surface-2',
  danger: 'bg-bad text-white hover:brightness-110 border border-transparent',
  success: 'bg-ok text-white dark:text-black hover:brightness-110 border border-transparent',
};

const sizeCls: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-md',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  icon: 'h-9 w-9 justify-center rounded-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center font-medium transition-all duration-150 select-none whitespace-nowrap',
        'disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98]',
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...props}
    />
  );
});

export function ButtonLink({
  to, variant = 'secondary', size = 'md', className, children, ...rest
}: { to: string; variant?: ButtonVariant; size?: ButtonSize; className?: string; children: ReactNode; title?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center font-medium transition-all duration-150 select-none whitespace-nowrap active:scale-[0.98]',
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

/* ---------- Card ---------- */

export function Card({
  className, interactive, children, ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface/90 backdrop-blur-sm',
        interactive &&
          'transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon, action, className }: {
  title: ReactNode; subtitle?: ReactNode; icon?: ReactNode; action?: ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3 p-4 sm:p-5 pb-0 sm:pb-0', className)}>
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold tracking-tight text-fg">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badge ---------- */

const toneCls: Record<Tone, string> = {
  ok: 'bg-ok/12 text-ok border-ok/25',
  bad: 'bg-bad/12 text-bad border-bad/25',
  warn: 'bg-warn/12 text-warn border-warn/25',
  info: 'bg-info/12 text-info border-info/25',
  neutral: 'bg-surface-2 text-fg-2 border-line',
  accent: 'bg-accent/12 text-accent border-accent/25',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap', toneCls[tone], className)}>
      {children}
    </span>
  );
}

export const toneText: Record<Tone, string> = {
  ok: 'text-ok', bad: 'text-bad', warn: 'text-warn', info: 'text-info', neutral: 'text-fg-2', accent: 'text-accent',
};
export const toneBg: Record<Tone, string> = {
  ok: 'bg-ok', bad: 'bg-bad', warn: 'bg-warn', info: 'bg-info', neutral: 'bg-muted', accent: 'bg-accent',
};
export const toneBorder: Record<Tone, string> = {
  ok: 'border-ok/40', bad: 'border-bad/40', warn: 'border-warn/40', info: 'border-info/40', neutral: 'border-line-strong', accent: 'border-accent/40',
};
export const toneSoft: Record<Tone, string> = {
  ok: 'bg-ok/10', bad: 'bg-bad/10', warn: 'bg-warn/10', info: 'bg-info/10', neutral: 'bg-surface-2', accent: 'bg-accent/10',
};

/* ---------- Progress ---------- */

export function ProgressBar({ value, className, tone = 'accent', label, size = 'md' }: {
  value: number; className?: string; tone?: Tone; label?: string; size?: 'sm' | 'md';
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-surface-3', size === 'sm' ? 'h-1.5' : 'h-2', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', toneBg[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

export function ProgressRing({ value, size = 64, stroke = 6, color, children, label }: {
  value: number; size?: number; stroke?: number; color?: string; children?: ReactNode; label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(v)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color ?? 'var(--accent)'} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* ---------- Callout ---------- */

export type CalloutKind = 'info' | 'tip' | 'warn' | 'trap' | 'memory' | 'exam' | 'ok' | 'bad' | 'note';

const calloutCls: Record<CalloutKind, string> = {
  info: 'border-info/30 bg-info/[0.06]',
  tip: 'border-accent/30 bg-accent/[0.06]',
  warn: 'border-warn/35 bg-warn/[0.07]',
  trap: 'border-bad/30 bg-bad/[0.06]',
  memory: 'border-violet-500/30 bg-violet-500/[0.07]',
  exam: 'border-indigo-500/30 bg-indigo-500/[0.06]',
  ok: 'border-ok/30 bg-ok/[0.07]',
  bad: 'border-bad/30 bg-bad/[0.07]',
  note: 'border-line bg-surface-2/60',
};

export function Callout({ kind = 'info', title, icon, children, className }: {
  kind?: CalloutKind; title?: ReactNode; icon?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={cn('rounded-xl border p-3.5 sm:p-4 text-sm leading-relaxed', calloutCls[kind], className)}>
      {(title || icon) && (
        <div className="mb-1.5 flex items-center gap-2 font-semibold text-fg">
          {icon}
          {title}
        </div>
      )}
      <div className="text-fg-2">{children}</div>
    </div>
  );
}

/* ---------- Disclosure ---------- */

export function Disclosure({ title, children, defaultOpen = false, className, icon }: {
  title: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string; icon?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={cn('rounded-xl border border-line bg-surface-2/40', className)}>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-fg"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        {icon}
        <span className="flex-1">{title}</span>
        <ChevronDown className={cn('h-4 w-4 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-sm leading-relaxed text-fg-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({ value, onChange, options, size = 'md', className, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; title?: string }[];
  size?: 'sm' | 'md'; className?: string; label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-lg border border-line bg-surface-2 p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative rounded-md font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              active ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Tabs ---------- */

interface TabsCtx { value: string; setValue: (v: string) => void; baseId: string }
const TabsContext = createContext<TabsCtx | null>(null);

export function Tabs({ value, onChange, children, className }: {
  value: string; onChange: (v: string) => void; children: ReactNode; className?: string;
}) {
  const baseId = useId();
  return (
    <TabsContext.Provider value={{ value, setValue: onChange, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const tabs = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
    const idx = tabs.findIndex((t) => t === document.activeElement);
    if (idx < 0) return;
    e.preventDefault();
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    tabs[next].focus();
    tabs[next].click();
  };
  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn('flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]', className)}
    >
      {children}
    </div>
  );
}

export function Tab({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext)!;
  const active = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-selected={active}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'relative -mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
        active ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const ctx = useContext(TabsContext)!;
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" id={`${ctx.baseId}-panel-${value}`} aria-labelledby={`${ctx.baseId}-tab-${value}`} className={className}>
      {children}
    </div>
  );
}

/* ---------- Dialog ---------- */

export function Dialog({ open, onClose, title, children, wide, className, footer }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean | 'full'; className?: string; footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', onKey, true);
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLElement>('[data-autofocus], input, button')?.focus(), 30);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      clearTimeout(t);
      document.body.style.overflow = prev;
      lastFocus.current?.focus?.();
    };
  }, [open, onKey]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl',
              wide === 'full' ? 'sm:max-w-6xl' : wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
              className,
            )}
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
              <h2 className="flex-1 text-base font-semibold text-fg">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto p-5">{children}</div>
            {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------- Misc ---------- */

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface-2 px-1 font-mono text-[10px] font-medium text-muted', className)}>
      {children}
    </kbd>
  );
}

export function EmptyState({ icon, title, children, action, as: Heading = 'h3' }: {
  icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode;
  /** Heading level for the title; use 'h1' when the empty state is the whole page. */
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
      {icon && <div className="mb-3 text-muted">{icon}</div>}
      <Heading className="font-semibold text-fg">{title}</Heading>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatTile({ label, value, sub, icon, tone = 'accent' }: {
  label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: Tone;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        {icon && <span className={toneText[tone]}>{icon}</span>}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tracking-tight text-fg tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </Card>
  );
}

export function SectionTitle({ children, sub, action, id }: { children: ReactNode; sub?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-lg font-semibold tracking-tight text-fg">{children}</h2>
        {sub && <p className="text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Select({ value, onChange, options, label, className }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string; className?: string;
}) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1 text-xs font-medium text-muted', className)}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 text-sm text-fg focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function Switch({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-surface-3 ring-1 ring-line-strong',
        )}
      >
        <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
      <span className="text-sm">
        <span className="font-medium text-fg">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}
