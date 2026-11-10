/**
 * Unit tests for the app's core logic: spaced repetition, firewall rule
 * evaluation, CVSS v3.1 scoring, mock-exam allocation and mastery rules.
 */
import { describe, expect, it } from 'vitest';
import { schedule, newCard, isDue, cardState } from '@/lib/srs';
import { evaluate, inAddr, inPort, ruleError, type FwRule } from '@/lib/firewall';
import { allocate, pickExamQuestions } from '@/lib/quiz';
import { conceptMastery } from '@/lib/mastery';
import { cvss31 } from '@/components/viz/widgets/CvssCalc';
import { DOMAINS, QUESTIONS, CONCEPTS } from '@/content';
import { DAY_MS, mulberry32 } from '@/lib/utils';
import type { AnswerRecord } from '@/store/progress';

describe('spaced repetition (SM-2 variant)', () => {
  const t0 = Date.UTC(2026, 0, 1);
  it('grows intervals on successive “good” reviews', () => {
    const a = schedule(undefined, 'good', t0);
    expect(a.interval).toBe(1);
    expect(a.due).toBe(t0 + DAY_MS);
    const b = schedule(a, 'good', a.due);
    expect(b.interval).toBe(3);
    const c = schedule(b, 'good', b.due);
    expect(c.interval).toBe(8); // max(3 + 1, round(3 × 2.5))
    expect(c.reps).toBe(3);
  });
  it('“again” relearns in 10 minutes, counts a lapse and lowers ease (never below 1.3)', () => {
    let card = schedule(schedule(undefined, 'good', t0), 'good', t0 + DAY_MS);
    card = schedule(card, 'again', t0 + 4 * DAY_MS);
    expect(card.interval).toBe(0);
    expect(card.lapses).toBe(1);
    expect(card.due).toBe(t0 + 4 * DAY_MS + 10 * 60_000);
    expect(card.ease).toBeCloseTo(2.3);
    for (let i = 0; i < 20; i++) card = schedule(card, 'again', t0);
    expect(card.ease).toBeGreaterThanOrEqual(1.3);
  });
  it('“easy” on a new card jumps to 4 days and raises ease', () => {
    const e = schedule(undefined, 'easy', t0);
    expect(e.interval).toBe(4);
    expect(e.ease).toBeCloseTo(2.65);
  });
  it('reports due state and card state (new cards are queued separately, not “due”)', () => {
    expect(isDue(undefined, t0)).toBe(false);
    expect(cardState(undefined)).toBe('new');
    const a = schedule(newCard(t0), 'good', t0);
    expect(isDue(a, t0 + 1000)).toBe(false);
    expect(isDue(a, t0 + DAY_MS)).toBe(true);
  });
});

describe('firewall ACL engine', () => {
  const rules: FwRule[] = [
    { id: 'r1', action: 'allow', proto: 'tcp', src: 'any', dst: '10.0.0.5', port: '443' },
    { id: 'r2', action: 'deny', proto: 'tcp', src: 'any', dst: '10.0.0.0/24', port: 'any' },
    { id: 'r3', action: 'allow', proto: 'udp', src: '10.0.0.0/24', dst: 'any', port: '53' },
  ];
  it('uses first match', () => {
    expect(evaluate(rules, { proto: 'tcp', src: '203.0.113.9', dst: '10.0.0.5', port: 443 })).toMatchObject({ action: 'allow', index: 0 });
    expect(evaluate(rules, { proto: 'tcp', src: '203.0.113.9', dst: '10.0.0.5', port: 22 })).toMatchObject({ action: 'deny', index: 1 });
    expect(evaluate(rules, { proto: 'udp', src: '10.0.0.7', dst: '8.8.8.8', port: 53 })).toMatchObject({ action: 'allow', index: 2 });
  });
  it('ends with an implicit deny', () => {
    const r = evaluate(rules, { proto: 'icmp', src: '10.0.0.7', dst: '10.0.0.5', port: 0 });
    expect(r.action).toBe('deny');
    expect(r.index).toBe(-1);
    expect(r.trace.at(-1)?.reason).toMatch(/implicit deny/);
  });
  it('a broad rule placed first shadows later rules', () => {
    const shadow: FwRule[] = [{ id: 'x', action: 'deny', proto: 'any', src: 'any', dst: 'any', port: 'any' }, ...rules];
    expect(evaluate(shadow, { proto: 'tcp', src: '203.0.113.9', dst: '10.0.0.5', port: 443 })).toMatchObject({ action: 'deny', index: 0 });
  });
  it('matches CIDR ranges and port lists/ranges', () => {
    expect(inAddr('10.0.1.5', '10.0.0.0/23')).toBe(true);
    expect(inAddr('10.0.2.5', '10.0.0.0/23')).toBe(false);
    expect(inAddr('192.0.2.1', 'any')).toBe(true);
    expect(inPort(1500, '1000-2000')).toBe(true);
    expect(inPort(443, '80,443')).toBe(true);
    expect(inPort(8080, '80,443')).toBe(false);
  });
  it('rejects malformed rules', () => {
    expect(ruleError({ id: 'bad', action: 'allow', proto: 'tcp', src: '10.0.0.300', dst: 'any', port: '443' })).not.toBeNull();
    expect(ruleError(rules[0])).toBeNull();
  });
});

describe('CVSS v3.1 base score', () => {
  const v = (s: string) => Object.fromEntries(s.split('/').map((p) => p.split(':'))) as Parameters<typeof cvss31>[0];
  it.each([
    ['AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8],
    ['AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', 10.0],
    ['AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N', 6.1],
    ['AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 7.8],
    ['AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N', 5.9],
    ['AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N', 4.6],
    ['AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H', 7.5],
    ['AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N', 0],
  ])('%s → %d', (vector, expected) => {
    expect(cvss31(v(vector))).toBe(expected);
  });
});

describe('mock exam allocation', () => {
  it('allocates exactly the requested total in proportion to domain weights', () => {
    const a = allocate(90, DOMAINS.map((d) => d.weight));
    expect(a.reduce((s, n) => s + n, 0)).toBe(90);
    expect(a).toEqual([11, 20, 16, 25, 18]);
  });
  it('draws unique questions weighted by domain', () => {
    const qs = pickExamQuestions(90, mulberry32(42));
    expect(qs).toHaveLength(90);
    expect(new Set(qs.map((q) => q.id)).size).toBe(90);
    const counts = DOMAINS.map((d) => qs.filter((q) => q.domainId === d.id).length);
    expect(counts).toEqual(allocate(90, DOMAINS.map((d) => d.weight)));
  });
  it('never asks for more questions than exist', () => {
    expect(pickExamQuestions(QUESTIONS.length + 50, mulberry32(1))).toHaveLength(QUESTIONS.length);
  });
});

describe('mastery is earned by answers, not page views', () => {
  const concept = CONCEPTS.find((c) => c.questions.length >= 3)!;
  const rec = (ok: boolean, ts: number): AnswerRecord => ({ attempts: 1, correct: ok ? 1 : 0, lastCorrect: ok, lastSelected: [0], lastTs: ts, firstTs: ts, history: [ok] });
  const now = Date.UTC(2026, 5, 1);
  it('viewing a lesson only marks it started', () => {
    const lessons = { [concept.id]: { firstOpened: now, lastOpened: now, opens: 3, sectionsSeen: 13, sectionsTotal: 13, finished: true } };
    expect(conceptMastery(concept, {}, lessons, now).status).toBe('started');
  });
  it('all questions answered with ≥80% correct → mastered; old mastery → review', () => {
    const all = Object.fromEntries(concept.questions.map((q) => [q.id, rec(true, now)]));
    expect(conceptMastery(concept, all, {}, now).status).toBe('mastered');
    expect(conceptMastery(concept, all, {}, now + 30 * DAY_MS).status).toBe('review');
  });
  it('mostly wrong answers → weak', () => {
    const wrong = Object.fromEntries(concept.questions.map((q) => [q.id, rec(false, now)]));
    expect(conceptMastery(concept, wrong, {}, now).status).toBe('weak');
  });
});
