export type ClassValue = string | false | null | undefined | 0;

/** Join class names, skipping falsy values. */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ');
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const DAY_MS = 86_400_000;

/** Local calendar date key, e.g. 2026-11-04. */
export function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta, 12);
  return dayKey(date.getTime());
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function relativeTime(ts: number, now = Date.now()): string {
  const diff = ts - now;
  const abs = Math.abs(diff);
  const fmt = (v: number, u: string) => `${v} ${u}${v === 1 ? '' : 's'}`;
  let out: string;
  if (abs < 60_000) out = 'moments';
  else if (abs < 3_600_000) out = fmt(Math.round(abs / 60_000), 'minute');
  else if (abs < DAY_MS) out = fmt(Math.round(abs / 3_600_000), 'hour');
  else out = fmt(Math.round(abs / DAY_MS), 'day');
  if (out === 'moments') return diff < 0 ? 'just now' : 'now';
  return diff < 0 ? `${out} ago` : `in ${out}`;
}

export function pct(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}

/** Small, fast, stable string hash (FNV-1a) -> base36. */
export function hashString(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Deterministic PRNG so shuffles are reproducible within a session. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function seedFrom(s: string): number {
  return parseInt(hashString(s), 36) >>> 0;
}

export function groupBy<T, K extends string>(arr: readonly T[], key: (t: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of arr) {
    const k = key(item);
    (out[k] ||= []).push(item);
  }
  return out;
}

export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function downloadText(filename: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function sameSet(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}
