/**
 * Spaced repetition scheduler (a compact SM-2 variant, similar to Anki).
 * Each review grade moves the card's next due date; "again" sends it back
 * into a short relearning step and lowers its ease.
 */
import { DAY_MS } from './utils';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface SrsCard {
  due: number; // epoch ms
  interval: number; // days
  ease: number; // multiplier, min 1.3
  reps: number; // consecutive successful reviews
  lapses: number; // times forgotten after learning
  last: number; // last review epoch ms
  lastGrade?: Grade;
  reviews: number; // total reviews
}

const MIN_MS = 60_000;

export function newCard(now: number): SrsCard {
  return { due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0, last: 0, reviews: 0 };
}

export function schedule(card: SrsCard | undefined, grade: Grade, now: number): SrsCard {
  const c = card ?? newCard(now);
  let { interval, ease, reps, lapses } = c;
  const reviews = (c.reviews ?? 0) + 1;

  if (grade === 'again') {
    if (reps > 0) lapses += 1;
    return {
      due: now + 10 * MIN_MS,
      interval: 0,
      ease: Math.max(1.3, ease - 0.2),
      reps: 0,
      lapses,
      last: now,
      lastGrade: grade,
      reviews,
    };
  }

  if (grade === 'hard') {
    interval = reps === 0 ? 1 : Math.max(interval + 1, Math.round(interval * 1.2));
    ease = Math.max(1.3, ease - 0.15);
  } else if (grade === 'good') {
    interval = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(interval + 1, Math.round(interval * ease));
  } else {
    interval = reps === 0 ? 4 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
    ease = ease + 0.15;
  }
  reps += 1;
  return { due: now + interval * DAY_MS, interval, ease, reps, lapses, last: now, lastGrade: grade, reviews };
}

export function previewLabel(card: SrsCard | undefined, grade: Grade, now: number): string {
  const next = schedule(card, grade, now);
  const ms = next.due - now;
  if (ms < 60 * MIN_MS) return `${Math.round(ms / MIN_MS)}m`;
  const days = Math.round(ms / DAY_MS);
  if (days < 30) return `${days}d`;
  return `${(days / 30).toFixed(1)}mo`;
}

export type CardState = 'new' | 'learning' | 'young' | 'mature';

export function cardState(card: SrsCard | undefined): CardState {
  if (!card || card.reviews === 0) return 'new';
  if (card.reps === 0 || card.interval < 1) return 'learning';
  if (card.interval < 21) return 'young';
  return 'mature';
}

/** Difficulty label shown to the learner, derived from ease and lapses. */
export function difficultyOf(card: SrsCard | undefined): 'unrated' | 'easy' | 'medium' | 'hard' {
  if (!card || card.reviews === 0) return 'unrated';
  if (card.ease < 2.0 || card.lapses >= 3) return 'hard';
  if (card.ease < 2.45 || card.lapses >= 1) return 'medium';
  return 'easy';
}

export function isDue(card: SrsCard | undefined, now: number): boolean {
  return !!card && card.reviews > 0 && card.due <= now;
}
