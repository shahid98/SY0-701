/**
 * Prints the coverage manifest: which official bullets are covered and which are missing.
 * Run with `npm run coverage-report`. It fails if any official bullet is not covered.
 */
import { it, expect } from 'vitest';
import { OUTLINE, type OutlineNode } from '@/content/outline';
import { coverageReport } from '@/lib/coverage';
import { CONCEPTS, QUESTIONS, conceptsOf } from '@/content';

it('every official objective bullet is covered by at least one lesson', () => {
  const cov = coverageReport();
  const missing: string[] = [];
  const walk = (n: OutlineNode) => {
    const c = cov.byNode.get(n.id)!;
    if (n.children.length === 0 && c.status === 'missing') missing.push(n.id);
    n.children.forEach(walk);
  };
  OUTLINE.forEach((o) => o.nodes.forEach(walk));
  const lines = OUTLINE.map((o) => {
    const b = cov.byObjective.get(o.id)!;
    return `${o.id}  ${String(b.covered).padStart(3)}/${String(b.leaves).padEnd(3)} bullets  ${String(conceptsOf(o.id).length).padStart(2)} lessons  ${String(QUESTIONS.filter((q) => q.objectiveId === o.id).length).padStart(3)} questions`;
  });
  console.log(`\nCOVERAGE MANIFEST — ${cov.coveredLeaves}/${cov.leaves} leaf bullets covered · ${CONCEPTS.length} lessons · ${QUESTIONS.length} questions\n${lines.join('\n')}`);
  if (missing.length) console.log(`\nMissing bullets (${missing.length}):\n${missing.join('\n')}`);
  expect(missing).toEqual([]);
});
