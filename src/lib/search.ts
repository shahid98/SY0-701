import Fuse from 'fuse.js';
import { CONCEPTS, DOMAINS, OBJECTIVES, conceptPath, domainPath, objectivePath } from '@/content';
import { GLOSSARY } from '@/content/glossary';
import { VOCAB } from '@/content/vocab';
import { COMPARISONS } from '@/content/comparisons';
import { LABS } from '@/content/labs';
import { SCENARIOS } from '@/content/scenarios';

export type SearchKind = 'page' | 'domain' | 'objective' | 'concept' | 'term' | 'word' | 'lab' | 'compare' | 'scenario';

export interface SearchItem {
  kind: SearchKind;
  title: string;
  subtitle: string;
  to: string;
  keywords: string;
}

export const PAGES: SearchItem[] = [
  { kind: 'page', title: 'Dashboard', subtitle: 'Daily goal, streak and recommendations', to: '/', keywords: 'home overview start' },
  { kind: 'page', title: 'Learning Path', subtitle: 'All five domains and 28 objectives', to: '/learn', keywords: 'curriculum syllabus domains objectives' },
  { kind: 'page', title: 'Interactive Labs', subtitle: '16 browser-based simulations', to: '/labs', keywords: 'simulation lab hands-on' },
  { kind: 'page', title: 'Flashcards', subtitle: 'Spaced-repetition review', to: '/flashcards', keywords: 'srs memory recall cards deck' },
  { kind: 'page', title: 'Vocabulary & Acronyms', subtitle: 'Glossary, exam English and question directives', to: '/vocabulary', keywords: 'glossary acronyms terms words directives english' },
  { kind: 'page', title: 'Exam Vocabulary Trainer', subtitle: 'Quiz yourself on exam English', to: '/vocabulary?tab=trainer', keywords: 'words english trainer quiz' },
  { kind: 'page', title: 'Practice Questions', subtitle: 'Filtered question sessions with explanations', to: '/practice', keywords: 'quiz questions bank test' },
  { kind: 'page', title: 'PBQ Simulator', subtitle: 'Performance-based question simulations', to: '/pbq', keywords: 'performance based drag drop simulation' },
  { kind: 'page', title: 'Mock Exam', subtitle: 'Timed mixed-domain exam (up to 90 questions)', to: '/mock-exam', keywords: 'exam test timer full practice' },
  { kind: 'page', title: 'Scenario Decision Trainer', subtitle: 'Choose the best control for business situations', to: '/scenarios', keywords: 'decision scenario control choose' },
  { kind: 'page', title: 'Compare Concepts', subtitle: 'Side-by-side comparisons of confusing terms', to: '/compare', keywords: 'compare difference versus vs' },
  { kind: 'page', title: 'Revision Center', subtitle: 'Incorrect answers, weak topics, revision queue', to: '/revision', keywords: 'review mistakes weak missing queue' },
  { kind: 'page', title: 'What Am I Missing?', subtitle: 'Uncovered and weakly understood objectives', to: '/revision?tab=missing', keywords: 'gaps missing weak uncovered' },
  { kind: 'page', title: 'Progress & Analytics', subtitle: 'Domain progress, history and statistics', to: '/progress', keywords: 'stats analytics progress chart' },
  { kind: 'page', title: 'Coverage Manifest', subtitle: 'Every official bullet mapped to lessons', to: '/coverage', keywords: 'coverage manifest objectives official checklist' },
  { kind: 'page', title: 'Settings & Data', subtitle: 'Theme, motion, goals, export/import progress', to: '/settings', keywords: 'settings export import backup theme reset' },
];

let fuse: Fuse<SearchItem> | null = null;

export function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [...PAGES];
  for (const d of DOMAINS) {
    items.push({ kind: 'domain', title: `Domain ${d.number}.0 — ${d.title}`, subtitle: `${d.weight}% of the exam`, to: domainPath(d.id), keywords: d.summary });
  }
  for (const o of OBJECTIVES) {
    items.push({ kind: 'objective', title: `${o.id} ${o.title}`, subtitle: o.official, to: objectivePath(o.id), keywords: o.summary });
  }
  for (const c of CONCEPTS) {
    items.push({
      kind: 'concept',
      title: c.title,
      subtitle: `${c.objectiveId} · ${c.tagline}`,
      to: conceptPath(c),
      keywords: [c.terms?.map((t) => t.term).join(' '), c.breakdown?.map((b) => b.name).join(' '), c.glossary?.join(' ')].filter(Boolean).join(' '),
    });
  }
  for (const g of GLOSSARY) {
    items.push({ kind: 'term', title: g.full ? `${g.term} — ${g.full}` : g.term, subtitle: g.simple, to: `/vocabulary?tab=glossary&term=${g.id}`, keywords: g.related?.join(' ') ?? '' });
  }
  for (const w of VOCAB) {
    items.push({ kind: 'word', title: w.word, subtitle: w.meaning, to: `/vocabulary?tab=words&word=${w.id}`, keywords: 'exam english vocabulary' });
  }
  for (const l of LABS) {
    items.push({ kind: 'lab', title: l.title, subtitle: l.summary, to: `/labs/${l.id}`, keywords: `lab ${l.objectives.join(' ')}` });
  }
  for (const c of COMPARISONS) {
    items.push({ kind: 'compare', title: c.title, subtitle: `Compare: ${c.items.join(' vs ')}`, to: `/compare?id=${c.id}`, keywords: c.terms.join(' ') });
  }
  for (const s of SCENARIOS) {
    items.push({ kind: 'scenario', title: s.title, subtitle: `Scenario · ${s.objectiveId}`, to: `/scenarios?id=${s.id}`, keywords: s.situation.slice(0, 120) });
  }
  return items;
}

export function search(query: string, limit = 30): SearchItem[] {
  if (!fuse) {
    fuse = new Fuse(buildIndex(), {
      keys: [
        { name: 'title', weight: 3 },
        { name: 'keywords', weight: 1.2 },
        { name: 'subtitle', weight: 1 },
      ],
      threshold: 0.36,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }
  const q = query.trim();
  if (!q) return [];
  return fuse.search(q, { limit }).map((r) => r.item);
}

export const KIND_LABEL: Record<SearchKind, string> = {
  page: 'Page', domain: 'Domain', objective: 'Objective', concept: 'Lesson', term: 'Glossary', word: 'Exam English',
  lab: 'Lab', compare: 'Comparison', scenario: 'Scenario',
};
