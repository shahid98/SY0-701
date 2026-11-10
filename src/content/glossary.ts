import type { GlossaryEntry } from '@/types/content';
import { D1_TERMS } from './glossary-terms/d1';
import { D2_TERMS } from './glossary-terms/d2';
import { D3_TERMS } from './glossary-terms/d3';
import { D4_TERMS } from './glossary-terms/d4';
import { D5_TERMS } from './glossary-terms/d5';

/**
 * Searchable glossary of acronyms and terms. Entries live in glossary-terms/d1–d5
 * (grouped by the domain where a term is first taught). `related` and `confused`
 * reference other glossary ids; tests/content.test.ts checks every reference.
 */
export const GLOSSARY: GlossaryEntry[] = [...D1_TERMS, ...D2_TERMS, ...D3_TERMS, ...D4_TERMS, ...D5_TERMS].sort((a, b) =>
  a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }),
);

export const GLOSSARY_BY_ID = new Map(GLOSSARY.map((g) => [g.id, g]));
