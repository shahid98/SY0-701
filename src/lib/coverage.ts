/**
 * Coverage manifest: maps every official objective bullet to the lessons that teach it.
 * A bullet is covered when a lesson lists it (or an ancestor bullet) in `covers`.
 * A parent bullet is covered when it is listed directly or all of its children are covered.
 */
import { OUTLINE, OUTLINE_NODES, resolveCover, type OutlineNode } from '@/content/outline';
import { CONCEPTS } from '@/content';

export type CoverageStatus = 'covered' | 'partial' | 'missing';

export interface NodeCoverage {
  node: OutlineNode;
  direct: string[]; // concept ids listing this node
  inherited: string[]; // concept ids listing an ancestor
  status: CoverageStatus;
}

export interface CoverageReport {
  byNode: Map<string, NodeCoverage>;
  unknownRefs: { conceptId: string; ref: string }[];
  leaves: number;
  coveredLeaves: number;
  byObjective: Map<string, { leaves: number; covered: number }>;
}

let cached: CoverageReport | null = null;

export function coverageReport(): CoverageReport {
  if (cached) return cached;
  const direct = new Map<string, Set<string>>();
  const unknownRefs: { conceptId: string; ref: string }[] = [];
  for (const c of CONCEPTS) {
    for (const ref of c.covers) {
      const id = resolveCover(c.objectiveId, ref);
      if (!OUTLINE_NODES.has(id)) {
        unknownRefs.push({ conceptId: c.id, ref: id });
        continue;
      }
      if (!direct.has(id)) direct.set(id, new Set());
      direct.get(id)!.add(c.id);
    }
  }

  const byNode = new Map<string, NodeCoverage>();
  const byObjective = new Map<string, { leaves: number; covered: number }>();
  let leaves = 0;
  let coveredLeaves = 0;

  const walk = (n: OutlineNode, inheritedFrom: string[]): CoverageStatus => {
    const d = [...(direct.get(n.id) ?? [])];
    const inh = [...new Set(inheritedFrom)];
    const passDown = [...inheritedFrom, ...d];
    let status: CoverageStatus;
    if (n.children.length === 0) {
      status = d.length || inh.length ? 'covered' : 'missing';
      leaves++;
      const o = byObjective.get(n.objectiveId) ?? { leaves: 0, covered: 0 };
      o.leaves++;
      if (status === 'covered') {
        coveredLeaves++;
        o.covered++;
      }
      byObjective.set(n.objectiveId, o);
    } else {
      const kids = n.children.map((k) => walk(k, passDown));
      if (d.length || inh.length || kids.every((k) => k === 'covered')) status = kids.every((k) => k === 'covered') ? 'covered' : 'partial';
      else status = kids.some((k) => k !== 'missing') ? 'partial' : 'missing';
    }
    byNode.set(n.id, { node: n, direct: d, inherited: inh, status });
    return status;
  };

  for (const o of OUTLINE) for (const n of o.nodes) walk(n, []);
  cached = { byNode, unknownRefs, leaves, coveredLeaves, byObjective };
  return cached;
}

export function objectiveOutline(objectiveId: string): OutlineNode[] {
  return OUTLINE.find((o) => o.id === objectiveId)?.nodes ?? [];
}
