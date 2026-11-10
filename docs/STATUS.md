# Implementation status & authoring conventions

What is implemented, what is limited, and the conventions to follow when adding content. Known limitations are also listed in the [README](../README.md#limitations-and-unfinished-items).

## Conventions (for contributors)

- **Content** lives in `src/content/objectives/o<D>-<N>.ts` (e.g. `o1-4.ts` for objective 1.4), each default-exporting `ConceptInput[]` (see `src/types/content.ts`). Files are picked up automatically via `import.meta.glob`.
- **Concept ids** are globally unique slugs. **Question ids** are `<objective>-<NN>` (e.g. `1.4-07`) and must never be reused, because progress is stored by id. Supplementary questions in `src/content/question-bank.ts` continue each objective’s numbering.
- `covers` lists outline bullet ids **relative to the concept’s objective** (`'encryption/symmetric'`) or absolute (`'5.2/business-impact-analysis/rto'`). Ids come from `src/content/outline.ts` (acronym in parentheses → key, else slug, `{key}` overrides). `npm run validate` fails on unknown ids.
- **Questions**: options are `[text, why]` pairs; multi-answer stems must say TWO/THREE; every `clues` phrase must appear verbatim (case-insensitive) in the stem or exhibit. A question’s kind is derived: exhibit → log, 2+ answers → multi, otherwise level 1/2/3 → concept/application/scenario. Every objective must offer all five kinds.
- **Glossary** entries live in `src/content/glossary-terms/d1–d5.ts` and are plain text (no markdown). `related` and `confused` must reference existing glossary ids; lesson `glossary` lists and comparison `terms` must too.
- **Vocabulary**: each word’s `example` must contain the word (or an inflection) and each part of speech needs at least three words, so the trainer’s gap-fill drill works.
- **Visuals**: `sequence` node coordinates are percentages; keep `x` within 10–90 and `y` within 12–85 so labels don’t clip. Compare rows need one value per column plus the aspect label. Widgets are registered in `src/components/viz/widgets/index.ts`; embed a lab in a lesson with `{ kind: 'widget', widget: 'lab', props: { id: '<labId>' } }`.
- Inline text supports `**bold**`, `*italic*`, `` `code` ``, blank-line paragraphs and `- ` bullet lists.
- Tailwind v4: don’t combine `hidden` with a component’s base `inline-flex`; use `max-sm:hidden` / `max-lg:hidden`. Grid children that contain `truncate` text need `min-w-0`; native selects need `w-full min-w-0` to avoid mobile overflow.
- **Mobile**: enlarge small controls on touch screens with Tailwind’s `pointer-coarse:` variant (aim for ≥ 36–40 px) rather than changing desktop sizes. Form fields are forced to 16 px on touch devices by an unlayered rule at the end of `src/index.css` (prevents iOS zoom-on-focus). Never rely on hover alone — touch screens have none. Buttons with dynamic text need `max-w-full` and a `truncate` span, because buttons don’t wrap. Wide tables need a phone layout below `sm` (see `CompareViz` and the firewall rule editor). Check changes with `npm run smoke` (emulated touch phone; `SMOKE_MOBILE_WIDTH=360` for small Android screens).
- Lucide (0.577) renamed icons: use `CircleQuestionMark` (not CircleHelp), `FingerprintPattern`, `Funnel`, `FileExclamationPoint`, `FileCheckCorner`, `House`. Icons referenced by content must be in `src/components/ui/icons.tsx`.

## Feature checklist

| Area | Status |
| --- | --- |
| App shell, hierarchical sidebar, breadcrumbs, search palette, themes, reading mode, keyboard shortcuts, reduced motion | done |
| Concept lesson page (Beginner/Exam modes, 13 teaching elements, Explain Differently, Show the Flow, Teach Me the Prerequisite, knowledge check) | done |
| Visual framework (sequence, timeline, layers, compare, sort, before/after, widgets, multi) with play/pause, step controls and static fallback | done |
| Quiz engine (hidden answers until submit, per-option explanations, highlighted clues, vocabulary, “Why this answer?”) | done |
| Dashboard, Learning Path, Domain, Objective pages | done |
| Practice, Mock exam (≤90 questions, configurable timer, raw score), Flashcards (SRS), Vocabulary trainer, Compare, Scenarios, Revision, Progress, Coverage, Settings (export/import) | done |
| 16 labs (`src/components/labs/*Lab.tsx`) and the PBQ simulator (10 PBQs in `src/content/pbqs.ts`) | done |
| Widgets: toy-cipher, aes-gcm, rsa-toy, hash-demo, dh-exchange, cert-chain, risk-calc, availability, recovery-timeline, buffer-overflow, sqli, xss, l4-l7, cvss, ports, email-auth, password-strength, lab | done |
| Glossary (379), exam vocabulary (28), directives (12), comparisons (55), scenarios (36) | done |
| Tests: content integrity, coverage manifest, core logic (SRS, firewall engine, CVSS, exam allocation, mastery); headless smoke test | done |

## Content checklist (objectives)

Every objective has lessons, and all five question kinds (beginner, intermediate, scenario, log/exhibit, multiple-response). `npm run coverage-report` shows 655/655 leaf bullets covered.

| Objective | Lessons | Questions | Objective | Lessons | Questions |
| --- | --- | --- | --- | --- | --- |
| 1.1 | 3 | 9 | 4.1 | 6 | 12 |
| 1.2 | 9 | 17 | 4.2 | 3 | 8 |
| 1.3 | 3 | 9 | 4.3 | 4 | 9 |
| 1.4 | 14 | 28 | 4.4 | 3 | 8 |
| 2.1 | 3 | 9 | 4.5 | 8 | 13 |
| 2.2 | 6 | 14 | 4.6 | 6 | 21 |
| 2.3 | 9 | 18 | 4.7 | 2 | 8 |
| 2.4 | 10 | 18 | 4.8 | 3 | 15 |
| 2.5 | 7 | 12 | 4.9 | 2 | 11 |
| 3.1 | 6 | 12 | 5.1 | 5 | 17 |
| 3.2 | 7 | 15 | 5.2 | 5 | 18 |
| 3.3 | 5 | 9 | 5.3 | 3 | 13 |
| 3.4 | 8 (1 supplementary) | 13 | 5.4 | 3 | 13 |
| | | | 5.5 | 2 | 11 |
| | | | 5.6 | 4 | 14 |

## Known limitations

- The outline was transcribed without the official PDF; verify it against the current CompTIA SY0-701 objectives document (procedure in the README).
- Some bullets are taught within broader lessons rather than dedicated ones; question banks range from 8 to 28 per objective.
- Not every objective has a PBQ (10 PBQs in total).
- No screen-reader audit has been performed yet.
