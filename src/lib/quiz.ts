import type { DomainId, Question } from '@/types/content';
import { DOMAINS, QUESTIONS } from '@/content';
import type { AnswerRecord } from '@/store/progress';
import { shuffle } from './utils';

export interface QuestionFilter {
  domain?: DomainId | 'all';
  objective?: string | 'all';
  level?: '1' | '2' | '3' | 'all';
  kind?: 'concept' | 'application' | 'scenario' | 'log' | 'multi' | 'all';
  status?: 'all' | 'unanswered' | 'incorrect' | 'notmastered';
  conceptId?: string;
}

export function filterQuestions(f: QuestionFilter, answers: Record<string, AnswerRecord>, pool: Question[] = QUESTIONS): Question[] {
  return pool.filter((q) => {
    if (f.domain && f.domain !== 'all' && q.domainId !== f.domain) return false;
    if (f.objective && f.objective !== 'all' && q.objectiveId !== f.objective) return false;
    if (f.level && f.level !== 'all' && String(q.level) !== f.level) return false;
    if (f.kind && f.kind !== 'all' && q.kind !== f.kind) return false;
    if (f.conceptId && q.conceptId !== f.conceptId) return false;
    const a = answers[q.id];
    if (f.status === 'unanswered' && a) return false;
    if (f.status === 'incorrect' && (!a || a.lastCorrect)) return false;
    if (f.status === 'notmastered' && a?.lastCorrect) return false;
    return true;
  });
}

/** Largest-remainder allocation of `total` items across weights. */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left <= 0) break;
    out[i]++;
    left--;
  }
  return out;
}

/** Spread picks across objectives (round-robin) so a domain's share isn't dominated by one objective. */
function spread(qs: Question[], n: number, rand: () => number): Question[] {
  const byObj = new Map<string, Question[]>();
  for (const q of shuffle(qs, rand)) {
    const l = byObj.get(q.objectiveId) ?? [];
    l.push(q);
    byObj.set(q.objectiveId, l);
  }
  const lists = shuffle([...byObj.values()], rand);
  const out: Question[] = [];
  while (out.length < n && lists.some((l) => l.length)) {
    for (const l of lists) {
      if (out.length >= n) break;
      const q = l.shift();
      if (q) out.push(q);
    }
  }
  return out;
}

/** Draw a mock exam weighted by the official domain percentages. */
export function pickExamQuestions(count: number, rand: () => number = Math.random, pool: Question[] = QUESTIONS): Question[] {
  const n = Math.min(count, pool.length);
  const alloc = allocate(n, DOMAINS.map((d) => d.weight));
  const chosen: Question[] = [];
  DOMAINS.forEach((d, i) => {
    chosen.push(...spread(pool.filter((q) => q.domainId === d.id), alloc[i], rand));
  });
  // Top up from any domain if one ran short.
  if (chosen.length < n) {
    const ids = new Set(chosen.map((q) => q.id));
    chosen.push(...shuffle(pool.filter((q) => !ids.has(q.id)), rand).slice(0, n - chosen.length));
  }
  return shuffle(chosen, rand);
}
