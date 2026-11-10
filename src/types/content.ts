/**
 * Curriculum data model.
 *
 * Every lesson, question, flashcard and visual is plain structured data, so the
 * whole curriculum can be validated, searched and mapped to the official
 * objectives (see src/content/outline.ts and tests/content.test.ts).
 */

export type DomainId = 'd1' | 'd2' | 'd3' | 'd4' | 'd5';

export type ObjectiveId =
  | '1.1' | '1.2' | '1.3' | '1.4'
  | '2.1' | '2.2' | '2.3' | '2.4' | '2.5'
  | '3.1' | '3.2' | '3.3' | '3.4'
  | '4.1' | '4.2' | '4.3' | '4.4' | '4.5' | '4.6' | '4.7' | '4.8' | '4.9'
  | '5.1' | '5.2' | '5.3' | '5.4' | '5.5' | '5.6';

export type Tone = 'ok' | 'bad' | 'warn' | 'info' | 'neutral' | 'accent';

export type DomainColor = 'cyan' | 'rose' | 'violet' | 'emerald' | 'amber';

export interface Domain {
  id: DomainId;
  number: number;
  title: string;
  weight: number; // official exam weighting (%)
  summary: string;
  color: DomainColor;
  icon: string; // icon registry key
}

export interface SpecialLesson {
  title: string;
  description: string;
  to: string; // route
}

export interface Objective {
  id: ObjectiveId;
  domainId: DomainId;
  title: string; // short navigation title
  official: string; // the official objective statement
  summary: string;
  special?: SpecialLesson[];
}

/* ---------- Visual lesson configuration ---------- */

export interface SeqNode {
  id: string;
  label: string;
  sub?: string;
  icon: string;
  x: number; // 0-100 (% of canvas width)
  y: number; // 0-100 (% of canvas height)
  tone?: Tone;
}

export interface SeqStep {
  title: string;
  text: string;
  from?: string;
  to?: string;
  msg?: string; // label carried by the moving packet
  tone?: Tone; // packet / outcome colour
  active?: string[]; // nodes to highlight
  status?: Record<string, [string, Tone]>; // badges under nodes
}

export interface SequenceVisual {
  kind: 'sequence';
  title: string;
  nodes: SeqNode[];
  steps: SeqStep[];
  links?: [string, string][];
  note?: string; // simplification disclaimer
  aspect?: 'wide' | 'square' | 'tall';
}

export interface TimelineVisual {
  kind: 'timeline';
  title: string;
  steps: { label: string; detail: string; icon?: string }[];
  cyclic?: boolean;
  note?: string;
}

export interface LayersVisual {
  kind: 'layers';
  title: string;
  layers: { label: string; detail: string; tone?: Tone; icon?: string }[];
  note?: string;
}

export interface CompareVisual {
  kind: 'compare';
  title: string;
  columns: string[]; // heading for each compared item
  rows: string[][]; // [aspect, value for column 1, value for column 2, ...]
  note?: string;
}

export interface SortVisual {
  kind: 'sort';
  title: string;
  prompt?: string;
  bins: string[];
  items: { text: string; bin: string; why: string }[];
}

export interface BeforeAfterVisual {
  kind: 'beforeAfter';
  title: string;
  toggle: string; // label for the switch, e.g. "Enable salting"
  before: { label: string; points: string[] };
  after: { label: string; points: string[] };
  note?: string;
}

export interface WidgetVisual {
  kind: 'widget';
  widget: string; // registry key in components/viz/widgets
  title?: string;
  props?: Record<string, unknown>;
}

export interface MultiVisual {
  kind: 'multi';
  items: Exclude<Visual, MultiVisual>[];
}

export type Visual =
  | SequenceVisual
  | TimelineVisual
  | LayersVisual
  | CompareVisual
  | SortVisual
  | BeforeAfterVisual
  | WidgetVisual
  | MultiVisual;

/* ---------- Questions ---------- */

export type QuestionLevel = 1 | 2 | 3; // 1 beginner concept · 2 intermediate application · 3 difficult scenario

export interface QuestionInput {
  id: string; // stable id, e.g. "1.1-01"
  level: QuestionLevel;
  stem: string;
  exhibit?: string; // log excerpt / config shown in monospace
  options: [string, string][]; // [option text, why it is right or wrong]
  answer: number[]; // indexes of correct options (2+ = multiple response)
  explain: string;
  clues?: string[]; // decisive phrases from the stem, highlighted after submission
  vocab?: [string, string][]; // [difficult word, plain meaning]
}

export type QuestionKind = 'concept' | 'application' | 'scenario' | 'log' | 'multi';

export interface Question extends QuestionInput {
  objectiveId: ObjectiveId;
  domainId: DomainId;
  conceptId: string;
  kind: QuestionKind;
}

/* ---------- Concepts (lessons) ---------- */

export interface Term {
  term: string;
  def: string;
}

export interface BreakdownItem {
  name: string;
  desc: string;
  example?: string;
  cue?: string; // how it shows up in an exam scenario
}

export interface ConceptInput {
  id: string;
  title: string;
  tagline: string;
  /** Outline bullet ids this lesson teaches (relative to its objective, or absolute "5.2/...") */
  covers: string[];
  prerequisites?: string[];
  glossary?: string[];
  beginner: { what: string; why: string; how: string; where: string; analogy: string };
  exam: { what: string; how: string; scenario: string };
  terms?: Term[];
  breakdownTitle?: string;
  breakdown?: BreakdownItem[];
  example: { title: string; body: string };
  differs?: { vs: string; diff: string }[];
  cues: string[];
  traps: string[];
  memory: string;
  alt?: { label: string; text: string }[];
  visual: Visual;
  advanced?: { title: string; body: string };
  flashcards?: [string, string][];
  questions: QuestionInput[];
  supplementary?: boolean; // useful bridge content beyond the objective's own bullets
  status?: 'complete' | 'draft';
}

export interface Concept extends Omit<ConceptInput, 'questions'> {
  objectiveId: ObjectiveId;
  domainId: DomainId;
  order: number; // global curriculum order
  questions: Question[];
}

/* ---------- Glossary / vocabulary ---------- */

export interface GlossaryEntry {
  id: string;
  term: string; // acronym or term as written in the objectives
  full?: string; // full expansion for acronyms
  simple: string;
  tech: string;
  example: string;
  exam: string;
  related?: string[]; // glossary ids
  confused?: [string, string][]; // [glossary id or term, how they differ]
  objectives: ObjectiveId[];
}

export interface VocabWord {
  id: string;
  word: string;
  pos: string;
  meaning: string;
  security: string; // meaning in a security context
  example: string; // exam-style sentence
  effect: string; // how it changes what a question is asking
  confusedWith?: string;
}

export interface Directive {
  id: string;
  phrase: string;
  meaning: string;
  strategy: string;
  example: { stem: string; options: string[]; answer: number; why: string };
}

/* ---------- Other learning activities ---------- */

export interface Comparison {
  id: string;
  title: string;
  items: string[]; // headings, e.g. ["IDS", "IPS"]
  rows: string[][]; // [aspect, ...values]
  example: string;
  rule: string; // memory rule
  objectives: ObjectiveId[];
  terms: string[]; // glossary ids / names used to match the compare picker
}

export interface Scenario {
  id: string;
  objectiveId: ObjectiveId;
  title: string;
  situation: string;
  ask: string;
  options: { text: string; verdict: 'best' | 'acceptable' | 'poor'; why: string }[];
  takeaway: string;
  conceptId?: string;
}
