/**
 * Content integrity checks. Run with `npm run validate`.
 * These guard the "no silent omissions" rule: every lesson must map to real
 * objective bullets, every question must be gradable, and every reference must resolve.
 */
import { describe, expect, it } from 'vitest';
import { CONCEPTS, CONCEPT_BY_ID, DOMAINS, OBJECTIVES, QUESTIONS, conceptsOf } from '@/content';
import { OUTLINE, OUTLINE_NODES, resolveCover } from '@/content/outline';
import { GLOSSARY, GLOSSARY_BY_ID } from '@/content/glossary';
import { VOCAB, DIRECTIVES } from '@/content/vocab';
import { COMPARISONS } from '@/content/comparisons';
import { SCENARIOS } from '@/content/scenarios';
import { PBQS } from '@/content/pbqs';
import { LABS } from '@/content/labs';
import { FLASHCARDS } from '@/content/flashcards';
import { EXTRA_QUESTIONS } from '@/content/question-bank';
import { ICONS } from '@/components/ui/icons';
import { WIDGETS } from '@/components/viz/widgets';
import { coverageReport } from '@/lib/coverage';
import type { Visual } from '@/types/content';

function visuals(v: Visual): Visual[] {
  return v.kind === 'multi' ? v.items : [v];
}

describe('curriculum structure', () => {
  it('has 5 domains whose weights sum to 100', () => {
    expect(DOMAINS).toHaveLength(5);
    expect(DOMAINS.reduce((s, d) => s + d.weight, 0)).toBe(100);
  });
  it('has 28 objectives matching the outline', () => {
    expect(OBJECTIVES).toHaveLength(28);
    expect(OUTLINE.map((o) => o.id)).toEqual(OBJECTIVES.map((o) => o.id));
  });
  it('every objective has at least one lesson', () => {
    const missing = OBJECTIVES.filter((o) => conceptsOf(o.id).length === 0).map((o) => o.id);
    expect(missing, `objectives without lessons: ${missing.join(', ')}`).toEqual([]);
  });
  it('lists 16 labs', () => expect(LABS).toHaveLength(16));
  it('special-lesson links point to real lessons or labs', () => {
    for (const o of OBJECTIVES) {
      for (const s of o.special ?? []) {
        const lesson = s.to.match(/^\/learn\/(d[1-5])\/(\d\.\d)\/([a-z0-9-]+)$/);
        if (lesson) {
          const c = CONCEPT_BY_ID.get(lesson[3]);
          expect(!!c && c.domainId === lesson[1] && c.objectiveId === lesson[2], `${o.id} → ${s.to}`).toBe(true);
          continue;
        }
        const lab = s.to.match(/^\/labs\/([a-z0-9-]+)$/);
        expect(!!lab && LABS.some((l) => l.id === lab[1]), `${o.id} → ${s.to}`).toBe(true);
      }
    }
  });
});

describe('concepts', () => {
  it('have unique ids', () => {
    const ids = CONCEPTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  for (const c of CONCEPTS) {
    describe(c.id, () => {
      it('covers only real outline bullets', () => {
        expect(c.covers.length).toBeGreaterThan(0);
        for (const ref of c.covers) expect(OUTLINE_NODES.has(resolveCover(c.objectiveId, ref)), `${c.id} → ${ref}`).toBe(true);
      });
      it('has all required teaching elements', () => {
        for (const k of ['what', 'why', 'how', 'where', 'analogy'] as const) expect(c.beginner[k].length, `beginner.${k}`).toBeGreaterThan(20);
        for (const k of ['what', 'how', 'scenario'] as const) expect(c.exam[k].length, `exam.${k}`).toBeGreaterThan(20);
        expect(c.example.body.length).toBeGreaterThan(40);
        expect(c.cues.length).toBeGreaterThan(0);
        expect(c.traps.length).toBeGreaterThan(0);
        expect(c.memory.length).toBeGreaterThan(5);
        expect(c.questions.length, 'knowledge check').toBeGreaterThan(0);
      });
      it('references existing prerequisites and glossary terms', () => {
        for (const p of c.prerequisites ?? []) expect(CONCEPT_BY_ID.has(p), `prerequisite ${p}`).toBe(true);
        for (const g of c.glossary ?? []) expect(GLOSSARY_BY_ID.has(g), `glossary ${g}`).toBe(true);
      });
      it('has valid visuals', () => {
        for (const v of visuals(c.visual)) {
          if (v.kind === 'widget') expect(WIDGETS[v.widget], `widget ${v.widget}`).toBeDefined();
          if (v.kind === 'sequence') {
            const ids = new Set(v.nodes.map((n) => n.id));
            expect(ids.size).toBe(v.nodes.length);
            for (const n of v.nodes) {
              expect(ICONS[n.icon], `icon ${n.icon}`).toBeDefined();
              expect(n.x >= 5 && n.x <= 95 && n.y >= 5 && n.y <= 95, `node ${n.id} position`).toBe(true);
            }
            for (const s of v.steps) {
              for (const ref of [s.from, s.to, ...(s.active ?? []), ...Object.keys(s.status ?? {})]) if (ref) expect(ids.has(ref), `step node ${ref}`).toBe(true);
            }
            for (const [a, b] of v.links ?? []) expect(ids.has(a) && ids.has(b)).toBe(true);
          }
          if (v.kind === 'sort') for (const it2 of v.items) expect(v.bins.includes(it2.bin), `bin ${it2.bin}`).toBe(true);
          if (v.kind === 'compare') for (const r of v.rows) expect(r.length, `compare row ${r[0]}`).toBe(v.columns.length + 1);
          if (v.kind === 'timeline' || v.kind === 'layers') {
            const list = v.kind === 'timeline' ? v.steps : v.layers;
            for (const s of list) if (s.icon) expect(ICONS[s.icon], `icon ${s.icon}`).toBeDefined();
          }
        }
      });
    });
  }
});

describe('questions', () => {
  it('supplementary questions attach to real lessons', () => {
    for (const id of Object.keys(EXTRA_QUESTIONS)) expect(CONCEPT_BY_ID.has(id), `question-bank key ${id}`).toBe(true);
  });
  it('every objective offers all five question kinds', () => {
    const kinds = ['concept', 'application', 'scenario', 'log', 'multi'] as const;
    for (const o of OBJECTIVES) {
      const qs = QUESTIONS.filter((q) => q.objectiveId === o.id);
      const missing = kinds.filter((k) => !qs.some((q) => q.kind === k));
      expect(missing, `${o.id} missing question kinds`).toEqual([]);
    }
  });
  it('have unique ids in <objective>-NN form', () => {
    const ids = QUESTIONS.map((q) => q.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dup, `duplicate ids ${dup.join(', ')}`).toEqual([]);
    for (const q of QUESTIONS) expect(q.id.startsWith(`${q.objectiveId}-`), `${q.id} belongs to ${q.objectiveId}`).toBe(true);
  });
  for (const q of QUESTIONS) {
    it(`${q.id} is gradable`, () => {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer.length).toBeGreaterThan(0);
      expect(q.answer.length).toBeLessThan(q.options.length);
      expect(new Set(q.answer).size).toBe(q.answer.length);
      for (const a of q.answer) expect(a >= 0 && a < q.options.length).toBe(true);
      for (const [text, why] of q.options) { expect(text.length).toBeGreaterThan(0); expect(why.length, `why for "${text}"`).toBeGreaterThan(5); }
      expect(q.explain.length).toBeGreaterThan(20);
      for (const clue of q.clues ?? []) expect(`${q.stem}\n${q.exhibit ?? ''}`.toLowerCase().includes(clue.toLowerCase()), `clue "${clue}" not in stem/exhibit`).toBe(true);
      if (q.answer.length > 1) expect(/\b(TWO|THREE|two|three)\b/.test(q.stem), 'multi-answer stem says how many').toBe(true);
    });
  }
});

describe('glossary, vocabulary and activities', () => {
  it('glossary ids are unique and cross-references resolve', () => {
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length);
    for (const g of GLOSSARY) {
      for (const r of g.related ?? []) expect(GLOSSARY_BY_ID.has(r), `${g.id} related ${r}`).toBe(true);
      for (const [id] of g.confused ?? []) expect(GLOSSARY_BY_ID.has(id), `${g.id} confused ${id}`).toBe(true);
      expect(g.objectives.length).toBeGreaterThan(0);
    }
  });
  it('glossary includes every acronym the specification requires', () => {
    const required = ['pki', 'ocsp', 'crl', 'hsm', 'siem', 'soar', 'edr', 'xdr', 'nac', 'saml', 'oauth', 'sle', 'aro', 'ale', 'rto', 'rpo', 'mttr', 'mtbf'];
    for (const id of required) expect(GLOSSARY_BY_ID.has(id), `glossary ${id}`).toBe(true);
    for (const g of GLOSSARY) for (const f of [g.simple, g.tech, g.example, g.exam]) expect(f.length, `${g.id} field`).toBeGreaterThan(10);
  });
  it('vocabulary words and directives are complete', () => {
    expect(new Set(VOCAB.map((v) => v.id)).size).toBe(VOCAB.length);
    const requiredWords = ['Mitigate', 'Exfiltrate', 'Repudiate', 'Attest', 'Remediate', 'Enumerate', 'Decommission', 'Obfuscate', 'Reconcile', 'Provision', 'Corroborate', 'Custodian', 'Deterrent', 'Compensating', 'Inherent', 'Residual', 'Proprietary'];
    for (const w of requiredWords) expect(VOCAB.some((v) => v.word === w), `vocab ${w}`).toBe(true);
    const requiredDirectives = ['most-likely', 'best', 'first', 'next', 'most-appropriate', 'least-privilege'];
    for (const d of requiredDirectives) expect(DIRECTIVES.some((x) => x.id === d), `directive ${d}`).toBe(true);
    for (const d of DIRECTIVES) expect(d.example.answer).toBeLessThan(d.example.options.length);
    // The trainer's gap-fill drill blanks the word in its example and needs 3+ words sharing a part of speech.
    for (const w of VOCAB) {
      const stem = w.word.replace(/[^a-z]/gi, '').slice(0, Math.max(4, w.word.length - 3));
      expect(new RegExp(`\\b${stem}\\w*`, 'i').test(w.example), `${w.id} example contains the word`).toBe(true);
      expect(VOCAB.filter((x) => x.pos === w.pos).length, `${w.id} part of speech`).toBeGreaterThanOrEqual(3);
    }
  });
  it('comparisons have consistent tables and real glossary terms', () => {
    expect(new Set(COMPARISONS.map((c) => c.id)).size).toBe(COMPARISONS.length);
    for (const c of COMPARISONS) {
      for (const r of c.rows) expect(r.length, `${c.id} row ${r[0]}`).toBe(c.items.length + 1);
      for (const t of c.terms) expect(GLOSSARY_BY_ID.has(t), `${c.id} term ${t}`).toBe(true);
      expect(c.objectives.length).toBeGreaterThan(0);
    }
  });
  it('scenarios have exactly one best option and valid lessons', () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
    for (const s of SCENARIOS) {
      expect(s.options.filter((o) => o.verdict === 'best').length, s.id).toBe(1);
      if (s.conceptId) expect(CONCEPT_BY_ID.has(s.conceptId), `${s.id} concept ${s.conceptId}`).toBe(true);
    }
    const covered = new Set(SCENARIOS.map((s) => s.objectiveId));
    expect(OBJECTIVES.filter((o) => !covered.has(o.id)).map((o) => o.id), 'objectives without a scenario').toEqual([]);
  });
  it('PBQs have valid answers', () => {
    for (const p of PBQS) {
      if (p.kind === 'table') for (const it2 of p.items) for (const f of it2.fields) for (const a of [f.answer].flat()) expect(a < f.options.length, `${p.id}: ${it2.prompt}`).toBe(true);
      if (p.kind === 'sort') for (const it2 of p.sort.items) expect(p.sort.bins.includes(it2.bin)).toBe(true);
    }
  });
  it('flashcard ids are unique', () => {
    const ids = FLASHCARDS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('coverage manifest', () => {
  it('has no references to unknown bullets', () => {
    expect(coverageReport().unknownRefs).toEqual([]);
  });
});
