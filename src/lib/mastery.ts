/**
 * Mastery is measured from demonstrated recall (question answers), never from
 * merely opening a lesson. A concept is "mastered" when every one of its
 * questions has been answered and at least 80% of the latest answers are correct.
 */
import { useMemo } from 'react';
import type { Concept, DomainId, ObjectiveId } from '@/types/content';
import { CONCEPTS, DOMAINS, OBJECTIVES, conceptsOf } from '@/content';
import { useProgress, type AnswerRecord, type LessonRecord } from '@/store/progress';
import { DAY_MS } from './utils';

export type ConceptStatus = 'new' | 'started' | 'practiced' | 'weak' | 'mastered' | 'review';

export interface ConceptMastery {
  status: ConceptStatus;
  score: number; // 0-100 (share of the concept's questions whose latest answer is correct)
  answered: number;
  total: number;
  correctLatest: number;
  lastTs: number;
}

export interface GroupMastery {
  score: number; // average concept score
  mastered: number;
  weak: number;
  started: number; // touched in any way
  total: number;
}

const REVIEW_AFTER_DAYS = 21;

export function conceptMastery(
  c: Concept,
  answers: Record<string, AnswerRecord>,
  lessons: Record<string, LessonRecord>,
  now = Date.now(),
): ConceptMastery {
  const total = c.questions.length;
  let answered = 0;
  let correctLatest = 0;
  let lastTs = 0;
  for (const q of c.questions) {
    const a = answers[q.id];
    if (!a) continue;
    answered++;
    if (a.lastCorrect) correctLatest++;
    lastTs = Math.max(lastTs, a.lastTs);
  }
  const score = total ? Math.round((correctLatest / total) * 100) : 0;
  let status: ConceptStatus;
  if (answered === 0) status = lessons[c.id] ? 'started' : 'new';
  else if (answered === total && correctLatest / total >= 0.8) status = now - lastTs > REVIEW_AFTER_DAYS * DAY_MS ? 'review' : 'mastered';
  else if (correctLatest / answered < 0.6) status = 'weak';
  else status = 'practiced';
  return { status, score, answered, total, correctLatest, lastTs };
}

function group(list: ConceptMastery[]): GroupMastery {
  const total = list.length;
  return {
    score: total ? Math.round(list.reduce((s, m) => s + m.score, 0) / total) : 0,
    mastered: list.filter((m) => m.status === 'mastered' || m.status === 'review').length,
    weak: list.filter((m) => m.status === 'weak').length,
    started: list.filter((m) => m.status !== 'new').length,
    total,
  };
}

export interface MasteryIndex {
  concept: Map<string, ConceptMastery>;
  objective: Map<ObjectiveId, GroupMastery>;
  domain: Map<DomainId, GroupMastery>;
  readiness: number; // exam-weighted average of domain scores (0-100)
  overall: GroupMastery;
}

export function computeMastery(answers: Record<string, AnswerRecord>, lessons: Record<string, LessonRecord>): MasteryIndex {
  const now = Date.now();
  const concept = new Map<string, ConceptMastery>();
  for (const c of CONCEPTS) concept.set(c.id, conceptMastery(c, answers, lessons, now));
  const objective = new Map<ObjectiveId, GroupMastery>();
  for (const o of OBJECTIVES) objective.set(o.id, group(conceptsOf(o.id).map((c) => concept.get(c.id)!)));
  const domain = new Map<DomainId, GroupMastery>();
  for (const d of DOMAINS) domain.set(d.id, group(CONCEPTS.filter((c) => c.domainId === d.id).map((c) => concept.get(c.id)!)));
  const readiness = Math.round(DOMAINS.reduce((s, d) => s + (d.weight * (domain.get(d.id)?.score ?? 0)) / 100, 0));
  return { concept, objective, domain, readiness, overall: group([...concept.values()]) };
}

export function useMastery(): MasteryIndex {
  const answers = useProgress((s) => s.answers);
  const lessons = useProgress((s) => s.lessons);
  return useMemo(() => computeMastery(answers, lessons), [answers, lessons]);
}

export const STATUS_META: Record<ConceptStatus, { label: string; tone: 'neutral' | 'info' | 'accent' | 'bad' | 'ok' | 'warn' }> = {
  new: { label: 'Not started', tone: 'neutral' },
  started: { label: 'Reading', tone: 'info' },
  practiced: { label: 'Practising', tone: 'accent' },
  weak: { label: 'Needs work', tone: 'bad' },
  mastered: { label: 'Mastered', tone: 'ok' },
  review: { label: 'Review due', tone: 'warn' },
};
