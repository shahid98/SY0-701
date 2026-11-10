import type { DomainId, ObjectiveId } from '@/types/content';
import { CONCEPTS } from './index';
import { GLOSSARY } from './glossary';
import { VOCAB } from './vocab';
import { hashString } from '@/lib/utils';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  source: 'concept' | 'glossary' | 'vocab';
  conceptId?: string;
  objectiveId?: ObjectiveId;
  domainId?: DomainId;
  extra?: string;
}

export const conceptCardId = (conceptId: string, front: string) => `c:${conceptId}:${hashString(front)}`;

export const FLASHCARDS: Flashcard[] = [
  ...CONCEPTS.flatMap((c) =>
    (c.flashcards ?? []).map<Flashcard>(([front, back]) => ({
      id: conceptCardId(c.id, front),
      front,
      back,
      source: 'concept',
      conceptId: c.id,
      objectiveId: c.objectiveId,
      domainId: c.domainId,
      extra: c.memory,
    })),
  ),
  ...GLOSSARY.map<Flashcard>((g) => ({
    id: `g:${g.id}`,
    front: g.full ? `${g.term} — what does it stand for and do?` : `${g.term} — define it.`,
    back: g.full ? `${g.full}. ${g.simple}` : g.simple,
    source: 'glossary',
    objectiveId: g.objectives[0],
    domainId: g.objectives[0] ? (`d${g.objectives[0].charAt(0)}` as DomainId) : undefined,
    extra: g.exam,
  })),
  ...VOCAB.map<Flashcard>((w) => ({
    id: `v:${w.id}`,
    front: `Exam English: “${w.word}”`,
    back: `${w.meaning} In security: ${w.security}`,
    source: 'vocab',
    extra: w.effect,
  })),
];

export const FLASHCARD_BY_ID = new Map(FLASHCARDS.map((f) => [f.id, f]));
