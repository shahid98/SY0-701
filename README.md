# Security+ SY0-701 Interactive

An interactive, fully local learning site for the CompTIA Security+ SY0-701 exam. It teaches every domain and objective with step-by-step visuals, hands-on labs, performance-based questions (PBQs), spaced-repetition flashcards and a timed mock exam. There is no backend, no account and no paid or AI API; progress stays in your browser.

> **Not affiliated with CompTIA.** All lessons and questions are original and exam-inspired, not real exam questions. Mock exams report raw percentages only, because CompTIA’s scaled scoring is proprietary and not reproduced here.

## Quick start

Requirements: **Node.js 20.19+ or 22.12+** (developed on Node 24) and npm.

```bash
npm install        # install dependencies
npm run dev        # start the dev server → http://localhost:5173
```

Production build:

```bash
npm run build      # typecheck + build into dist/
npm run preview    # serve the build → http://localhost:4173
```

`dist/` is a static site that uses hash-based routes, so any static web server can host it (for example `npx serve dist`). Opening `dist/index.html` straight from disk won’t work in most browsers, because they block module scripts on `file://` pages.

## Quality checks

| Command | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript strict-mode check |
| `npm test` | All unit and content tests (about 1,000) |
| `npm run validate` | Content integrity only: every lesson maps to real objective bullets, every question is gradable, every cross-reference resolves |
| `npm run coverage-report` | Prints the coverage manifest and fails if any official bullet has no lesson |
| `npm run smoke` | Serves the existing `dist/` build (run `npm run build` first) in headless Chrome at desktop size and on an emulated touch phone, fails on console errors, horizontal overflow or controls cut off past the screen edge, and saves screenshots to `scripts/screenshots/` |

`npm run smoke` needs Google Chrome or Chromium installed (`/usr/bin/google-chrome`, `/usr/bin/chromium` or `/usr/bin/chromium-browser`), or a path set in the `CHROME` environment variable. Pass routes to check specific pages, e.g. `npm run smoke -- '#/labs' '#/learn/d4/4.9'`, and set `SMOKE_MOBILE_WIDTH=360` to test a narrower phone than the default 390 px.

## What’s inside

| Content | Amount |
| --- | --- |
| Domains / objectives | 5 / 28, with exam weightings |
| Official outline bullets mapped | 655 of 655 leaf bullets covered (see `#/coverage`) |
| Lessons | 149 (one supplementary bridge lesson linking 3.4 to 5.2) |
| Practice questions | 374: 85 beginner, 195 intermediate, 35 scenario, 31 log/exhibit-based, 28 multiple-response. Every objective has all five kinds |
| PBQs | 10 (log analysis, appliance placement, firewall rules, incident ordering, wireless, certificates, controls, risk register, hardening, least privilege) |
| Labs | 16 |
| Glossary | 379 terms, each with expansion, plain and technical definitions, example, exam context, related and easily confused terms |
| Exam vocabulary / directives | 28 words (including all 17 the brief requires) / 12 directives (MOST likely, BEST, FIRST, NEXT, MOST appropriate, LEAST privilege, …) |
| Comparisons / scenarios | 55 side-by-side comparisons / 36 decision scenarios |
| Flashcards | 812 (lesson, glossary and vocabulary cards) |

Each lesson covers what the concept is, why it matters, how it works, where it’s used, an analogy, a realistic example, an interactive visual, CompTIA terminology, how it differs from similar concepts, exam cues and traps, a memory aid and a graded knowledge check. Every lesson can be read in **Beginner** or **Exam** mode.

### Main pages

| Route | Page |
| --- | --- |
| `#/` | Dashboard: domain progress, daily goal, streak, revision queue, weak-topic recommendations (“What am I missing?”) |
| `#/learn` → `#/learn/d4` → `#/learn/d4/4.9` → `…/4.9/log-data-sources` | Domain → objective → lesson, with sidebar, breadcrumbs, previous/next and completion indicators |
| `#/labs` | 16 labs: CIA and controls, zero trust, crypto and certificate chains, phishing, attack mitigation, network builder, 802.1X, shared responsibility, data states, backup/DR, firewall ACLs, SOC/SIEM, IAM and MFA, incident response, risk and BIA, vendor and compliance |
| `#/practice` | Question bank with filters by domain, objective, level and kind; incorrect-answer review |
| `#/pbq` | Performance-based question simulator |
| `#/mock-exam` | Up to 90 questions weighted by domain, configurable timer (default 90 minutes), raw score report |
| `#/flashcards` | Spaced-repetition flashcards (SM-2 style) with difficulty ratings |
| `#/vocabulary` | Exam English, question directives, glossary and a vocabulary trainer |
| `#/revision` | Revision queue, weak topics and review of wrong answers |
| `#/compare` | “Compare concepts” for confusable terms |
| `#/scenarios` | Scenario Decision Trainer |
| `#/progress`, `#/coverage`, `#/settings` | Progress statistics, coverage manifest, settings (theme, reduced motion, reading mode, daily goal, export/import) |

Search with **Ctrl/⌘ K** or **/**. Press **?** (or the keyboard button in the header) to see every keyboard shortcut.

### Phones and tablets

The site is responsive and touch-friendly. Every page is tested on an emulated touch phone at 390 px and 360 px wide. On touch screens:

- the sidebar becomes a slide-out menu, and tap targets grow (breadcrumbs, section tabs, chips, reorder buttons);
- form fields use 16 px text, so iPhones don’t zoom in when you tap them;
- comparison tables switch to a per-aspect layout, firewall rules become one card per rule, and long log lines wrap;
- in the phishing lab, tapping a link shows its real destination (there is no hover on a phone);
- drag interactions (sorting, ordering, the network builder) all have tap or dropdown alternatives.

Measured on an emulated mid-range phone (4× slower CPU): content appears in about 1 s over Wi-Fi. On slow 4G it takes about 5 s the first time — a loading screen shows within a second — and about 1.6 s on later visits, when files come from the browser cache.

### Progress and privacy

Progress, flashcard schedules and settings are stored in `localStorage` under the key `sy0701-progress`. Use **Settings → Export progress** to download a JSON backup, and **Import** to merge it or replace current progress on another browser or device. Clearing site data erases progress.

Mastery comes from answers, not page views: a lesson counts as mastered when all of its questions have been answered and at least 80% of the latest answers are correct. It is flagged for review after 21 days, and as weak below 60%.

## Project structure

```
src/
  App.tsx                 routes (HashRouter, lazy-loaded pages)
  main.tsx, index.css     entry point, design tokens (light/dark), reduced-motion rules
  types/content.ts        data model: concepts, questions, visuals, glossary, vocabulary, scenarios
  content/
    outline.ts            official objective outline (source of the coverage manifest)
    domains.ts            domains, objectives, weightings, special-lesson links
    objectives/o<D>-<N>.ts  lessons and their questions, one file per objective (auto-loaded)
    question-bank.ts      supplementary questions so every objective has all five question kinds
    glossary.ts           glossary index → glossary-terms/d1.ts … d5.ts
    vocab.ts              exam vocabulary and question directives
    comparisons.ts, scenarios.ts, pbqs.ts, labs.ts, flashcards.ts
  components/
    layout/               app shell, sidebar, command palette, page header
    lesson/, quiz/, pbq/  lesson building blocks, question engine, PBQ simulator
    viz/                  step player, sequence diagrams, visual renderers, widgets/ (interactive demos)
    labs/                 the 16 labs plus shared lab kit
    ui/                   primitives, icons, charts, rich text
  lib/                    SRS scheduler, mastery, quiz selection, search, coverage, firewall engine, utilities
  store/progress.ts       persisted progress store (zustand) with export/import
  pages/                  one file per route
tests/
  content.test.ts         content integrity and coverage checks
  coverage-report.test.ts coverage manifest
  logic.test.ts           SRS, firewall engine, CVSS v3.1, exam allocation, mastery rules
scripts/smoke.mjs         headless-browser smoke test
docs/STATUS.md            authoring conventions and implementation status
```

## Editing content

Lessons live in `src/content/objectives/o<D>-<N>.ts`. Each file default-exports an array of `ConceptInput` (see `src/types/content.ts`) and is picked up automatically. Run `npm run validate` after editing; it catches unknown outline bullets, missing glossary terms, malformed questions (e.g. clue phrases that don’t appear in the stem), broken visuals and dangling references. Authoring conventions — ID formats, visual coordinates, inline formatting — are in [docs/STATUS.md](docs/STATUS.md).

### Updating the outline from the official objectives PDF

The outline in `src/content/outline.ts` was transcribed from the published SY0-701 objectives, because the official PDF was not provided while building this. **Check it against the current official CompTIA SY0-701 exam objectives PDF before relying on it.** To update it:

1. Edit `OUTLINE_TEXT` in `src/content/outline.ts`. Indentation sets the hierarchy; a node’s ID is the acronym in its last parentheses, otherwise a slug of its text, and `{key}` overrides either.
2. Run `npm run coverage-report`. Any new bullet with no lesson is listed as missing, and the test fails until a lesson’s `covers` list includes it.
3. Run `npm run validate`. Renamed or removed bullets show up as unknown references in lessons.
4. The `#/coverage` page reflects the result immediately.

## Limitations and unfinished items

- **Outline not verified against the official PDF.** See the section above. Coverage is complete against the transcribed outline (655/655 bullets), but bullet wording or structure may differ slightly from the current official document.
- **Depth varies by bullet.** Every bullet maps to at least one lesson, but many are taught as part of a broader lesson rather than in a dedicated one. For example, objective 4.7 has two lessons covering 21 bullets.
- **Question bank size.** 374 questions in total, between 8 (objectives 4.2, 4.4 and 4.7) and 28 (1.4) per objective. Repeated 90-question mock exams will reuse questions.
- **PBQs.** There are 10 PBQs; not every objective has one, although labs and interactive visuals cover the hands-on skills for the others.
- **Simplified simulations.** Labs and widgets are teaching models with realistic but invented data, not live security tools; each one notes where it differs from production behavior. Cryptography demos use the browser’s real WebCrypto, apart from the clearly labelled toy cipher and toy RSA.
- **Accessibility.** Keyboard navigation, focus styles, ARIA labels, reduced motion, a static fallback for every animated step-through and button alternatives for drag interactions are built in. The site hasn’t been audited with screen readers.
- **Single-browser storage.** No sync or accounts by design; use export/import to move progress between devices.
- **First load on slow mobile networks.** All curriculum data (about 1.7 MB, 554 kB gzipped) loads up front, because search, progress and the revision queue need it; pages, labs and widgets are lazy-loaded. On slow 4G the first visit takes about 5 s. Loading lesson text per objective on demand would cut that by roughly a third, but isn’t implemented.
- **No offline mode or home-screen install.** There is no service worker or web app manifest, so the site needs its server to be reachable when you open it.
