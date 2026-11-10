/**
 * Aggregates all curriculum content into lookup tables.
 * Objective files live in ./objectives/o<domain>-<n>.ts and default-export ConceptInput[].
 */
import type { Concept, ConceptInput, DomainId, ObjectiveId, Question, QuestionInput, QuestionKind } from '@/types/content';
import { DOMAINS, DOMAIN_BY_ID, OBJECTIVES, OBJECTIVE_BY_ID } from './domains';
import { EXTRA_QUESTIONS } from './question-bank';

export { DOMAINS, OBJECTIVES, DOMAIN_BY_ID, OBJECTIVE_BY_ID };

const modules = import.meta.glob<{ default: ConceptInput[] }>('./objectives/o*.ts', { eager: true });

const RAW: Partial<Record<ObjectiveId, ConceptInput[]>> = {};
for (const [path, mod] of Object.entries(modules)) {
  const m = path.match(/o(\d)-(\d)\.ts$/);
  if (m) RAW[`${m[1]}.${m[2]}` as ObjectiveId] = mod.default;
}

function kindOf(q: QuestionInput): QuestionKind {
  if (q.exhibit) return 'log';
  if (q.answer.length > 1) return 'multi';
  return q.level === 1 ? 'concept' : q.level === 2 ? 'application' : 'scenario';
}

export const CONCEPTS: Concept[] = [];
{
  let order = 0;
  for (const obj of OBJECTIVES) {
    for (const c of RAW[obj.id] ?? []) {
      CONCEPTS.push({
        ...c,
        objectiveId: obj.id,
        domainId: obj.domainId,
        order: order++,
        questions: [...c.questions, ...(EXTRA_QUESTIONS[c.id] ?? [])].map<Question>((q) => ({
          ...q,
          objectiveId: obj.id,
          domainId: obj.domainId,
          conceptId: c.id,
          kind: kindOf(q),
        })),
      });
    }
  }
}

export const CONCEPT_BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]));
export const QUESTIONS: Question[] = CONCEPTS.flatMap((c) => c.questions);
export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

const byObjective = new Map<string, Concept[]>();
for (const c of CONCEPTS) {
  const list = byObjective.get(c.objectiveId) ?? [];
  list.push(c);
  byObjective.set(c.objectiveId, list);
}

export function conceptsOf(objectiveId: string): Concept[] {
  return byObjective.get(objectiveId) ?? [];
}

export function questionsOfObjective(objectiveId: string): Question[] {
  return conceptsOf(objectiveId).flatMap((c) => c.questions);
}

export function questionsOfDomain(domainId: DomainId): Question[] {
  return QUESTIONS.filter((q) => q.domainId === domainId);
}

export const domainPath = (domainId: string) => `/learn/${domainId}`;
export const objectivePath = (objectiveId: string) => `/learn/d${objectiveId.charAt(0)}/${objectiveId}`;
export const conceptPath = (c: Pick<Concept, 'id' | 'objectiveId'>) => `${objectivePath(c.objectiveId)}/${c.id}`;

export function neighbours(conceptId: string): { prev?: Concept; next?: Concept } {
  const c = CONCEPT_BY_ID.get(conceptId);
  if (!c) return {};
  return { prev: CONCEPTS[c.order - 1], next: CONCEPTS[c.order + 1] };
}

export function objectiveLabel(objectiveId: string): string {
  const o = OBJECTIVE_BY_ID[objectiveId as ObjectiveId];
  return o ? `${o.id} ${o.title}` : objectiveId;
}

export function domainLabel(domainId: DomainId): string {
  const d = DOMAIN_BY_ID[domainId];
  return `${d.number}.0 ${d.title}`;
}
