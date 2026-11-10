/**
 * Learner progress, persisted to localStorage (key "sy0701-progress").
 * Everything here can be exported/imported as JSON from Settings.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DomainId } from '@/types/content';
import { schedule, type Grade, type SrsCard } from '@/lib/srs';
import { dayKey } from '@/lib/utils';

export const STORAGE_KEY = 'sy0701-progress';
export const SCHEMA_VERSION = 1;

export type ThemeSetting = 'system' | 'light' | 'dark';
export type ExplainMode = 'beginner' | 'exam';
export type MotionSetting = 'system' | 'reduce' | 'full';

export interface Settings {
  theme: ThemeSetting;
  mode: ExplainMode;
  reading: boolean;
  motion: MotionSetting;
  dailyGoal: number; // XP per day
  newCardsPerDay: number;
  sidebarCollapsed: boolean;
  guided: boolean; // reveal lesson sections one at a time
}

export interface LessonRecord {
  firstOpened: number;
  lastOpened: number;
  opens: number;
  sectionsSeen: number;
  sectionsTotal: number;
  finished: boolean;
}

export interface AnswerRecord {
  attempts: number;
  correct: number;
  lastCorrect: boolean;
  lastSelected: number[];
  lastTs: number;
  firstTs: number;
  history: boolean[]; // most recent last, capped at 8
}

export interface DayRecord {
  xp: number;
  questions: number;
  correct: number;
  cards: number;
  lessons: number;
}

export interface ExamAnswer {
  qid: string;
  selected: number[];
  correct: boolean;
  flagged: boolean;
}

export interface ExamResult {
  id: string;
  ts: number;
  total: number;
  correct: number;
  durationSec: number;
  timeLimitSec: number | null;
  byDomain: Partial<Record<DomainId, [number, number]>>; // [correct, total]
  byObjective: Record<string, [number, number]>;
  answers: ExamAnswer[];
}

export interface ActiveExam {
  id: string;
  questionIds: string[];
  answers: Record<string, number[]>;
  flagged: string[];
  current: number;
  startedAt: number;
  timeLimitSec: number | null;
}

export interface ProgressData {
  settings: Settings;
  lessons: Record<string, LessonRecord>;
  answers: Record<string, AnswerRecord>;
  cards: Record<string, SrsCard>;
  labs: Record<string, { completed: boolean; best: number; ts: number; runs: number }>;
  pbqs: Record<string, { best: number; last: number; attempts: number; ts: number }>;
  scenarios: Record<string, { verdict: 'best' | 'acceptable' | 'poor'; attempts: number; ts: number }>;
  exams: ExamResult[];
  activeExam: ActiveExam | null;
  daily: Record<string, DayRecord>;
  xp: number;
  last: { path: string; title: string; ts: number } | null;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  mode: 'beginner',
  reading: false,
  motion: 'system',
  dailyGoal: 60,
  newCardsPerDay: 20,
  sidebarCollapsed: false,
  guided: true,
};

export const emptyProgress = (): ProgressData => ({
  settings: { ...DEFAULT_SETTINGS },
  lessons: {},
  answers: {},
  cards: {},
  labs: {},
  pbqs: {},
  scenarios: {},
  exams: [],
  activeExam: null,
  daily: {},
  xp: 0,
  last: null,
});

export const XP = { correct: 10, wrong: 2, card: 2, lesson: 15, lab: 30, pbq: 25, scenario: 8 };

interface Actions {
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  visitLesson: (conceptId: string) => void;
  setLessonSections: (conceptId: string, seen: number, total: number) => void;
  recordAnswer: (qid: string, selected: number[], correct: boolean) => void;
  reviewCard: (cardId: string, grade: Grade) => void;
  completeLab: (labId: string, score: number) => void;
  recordPbq: (pbqId: string, score: number) => void;
  recordScenario: (id: string, verdict: 'best' | 'acceptable' | 'poor') => void;
  startExam: (exam: ActiveExam) => void;
  updateExam: (patch: Partial<ActiveExam>) => void;
  finishExam: (result: ExamResult) => void;
  abandonExam: () => void;
  setLast: (path: string, title: string) => void;
  importData: (data: ProgressData, mode: 'replace' | 'merge') => void;
  resetAll: () => void;
}

export type ProgressStore = ProgressData & Actions;

function bumpDay(daily: Record<string, DayRecord>, patch: Partial<DayRecord>): Record<string, DayRecord> {
  const key = dayKey();
  const cur = daily[key] ?? { xp: 0, questions: 0, correct: 0, cards: 0, lessons: 0 };
  const next: DayRecord = { ...cur };
  (Object.keys(patch) as (keyof DayRecord)[]).forEach((k) => {
    next[k] = (next[k] ?? 0) + (patch[k] ?? 0);
  });
  return { ...daily, [key]: next };
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),

      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

      visitLesson: (conceptId) =>
        set((s) => {
          const now = Date.now();
          const cur = s.lessons[conceptId];
          const rec: LessonRecord = cur
            ? { ...cur, lastOpened: now, opens: cur.opens + 1 }
            : { firstOpened: now, lastOpened: now, opens: 1, sectionsSeen: 0, sectionsTotal: 0, finished: false };
          return { lessons: { ...s.lessons, [conceptId]: rec } };
        }),

      setLessonSections: (conceptId, seen, total) =>
        set((s) => {
          const now = Date.now();
          const cur = s.lessons[conceptId] ?? { firstOpened: now, lastOpened: now, opens: 1, sectionsSeen: 0, sectionsTotal: total, finished: false };
          const sectionsSeen = Math.max(cur.sectionsSeen, seen);
          const finished = cur.finished || sectionsSeen >= total;
          const firstFinish = finished && !cur.finished;
          return {
            lessons: { ...s.lessons, [conceptId]: { ...cur, sectionsSeen, sectionsTotal: total, finished } },
            xp: s.xp + (firstFinish ? XP.lesson : 0),
            daily: firstFinish ? bumpDay(s.daily, { xp: XP.lesson, lessons: 1 }) : s.daily,
          };
        }),

      recordAnswer: (qid, selected, correct) =>
        set((s) => {
          const now = Date.now();
          const cur = s.answers[qid];
          const rec: AnswerRecord = {
            attempts: (cur?.attempts ?? 0) + 1,
            correct: (cur?.correct ?? 0) + (correct ? 1 : 0),
            lastCorrect: correct,
            lastSelected: selected,
            lastTs: now,
            firstTs: cur?.firstTs ?? now,
            history: [...(cur?.history ?? []), correct].slice(-8),
          };
          const gained = correct ? XP.correct : XP.wrong;
          return {
            answers: { ...s.answers, [qid]: rec },
            xp: s.xp + gained,
            daily: bumpDay(s.daily, { xp: gained, questions: 1, correct: correct ? 1 : 0 }),
          };
        }),

      reviewCard: (cardId, grade) =>
        set((s) => {
          const now = Date.now();
          const next = schedule(s.cards[cardId], grade, now);
          return {
            cards: { ...s.cards, [cardId]: next },
            xp: s.xp + XP.card,
            daily: bumpDay(s.daily, { xp: XP.card, cards: 1 }),
          };
        }),

      completeLab: (labId, score) =>
        set((s) => {
          const cur = s.labs[labId];
          const first = !cur?.completed;
          return {
            labs: {
              ...s.labs,
              [labId]: { completed: true, best: Math.max(cur?.best ?? 0, score), ts: Date.now(), runs: (cur?.runs ?? 0) + 1 },
            },
            xp: s.xp + (first ? XP.lab : 5),
            daily: bumpDay(s.daily, { xp: first ? XP.lab : 5 }),
          };
        }),

      recordPbq: (pbqId, score) =>
        set((s) => {
          const cur = s.pbqs[pbqId];
          const gained = Math.round((XP.pbq * score) / 100);
          return {
            pbqs: { ...s.pbqs, [pbqId]: { best: Math.max(cur?.best ?? 0, score), last: score, attempts: (cur?.attempts ?? 0) + 1, ts: Date.now() } },
            xp: s.xp + gained,
            daily: bumpDay(s.daily, { xp: gained }),
          };
        }),

      recordScenario: (id, verdict) =>
        set((s) => {
          const cur = s.scenarios[id];
          const gained = verdict === 'best' ? XP.scenario : verdict === 'acceptable' ? 3 : 1;
          return {
            scenarios: { ...s.scenarios, [id]: { verdict, attempts: (cur?.attempts ?? 0) + 1, ts: Date.now() } },
            xp: s.xp + gained,
            daily: bumpDay(s.daily, { xp: gained }),
          };
        }),

      startExam: (exam) => set({ activeExam: exam }),
      updateExam: (patch) => set((s) => (s.activeExam ? { activeExam: { ...s.activeExam, ...patch } } : {})),
      finishExam: (result) =>
        set((s) => ({
          exams: [...s.exams, result].slice(-50),
          activeExam: null,
        })),
      abandonExam: () => set({ activeExam: null }),

      setLast: (path, title) => set({ last: { path, title, ts: Date.now() } }),

      importData: (data, mode) => {
        if (mode === 'replace') {
          set({ ...emptyProgress(), ...data, settings: { ...DEFAULT_SETTINGS, ...data.settings } });
          return;
        }
        const s = get();
        const newer = <T extends { lastTs?: number; last?: number; lastOpened?: number; ts?: number }>(a: T | undefined, b: T): T => {
          if (!a) return b;
          const ta = a.lastTs ?? a.last ?? a.lastOpened ?? a.ts ?? 0;
          const tb = b.lastTs ?? b.last ?? b.lastOpened ?? b.ts ?? 0;
          return tb > ta ? b : a;
        };
        const mergeRec = <T extends object>(cur: Record<string, T>, inc: Record<string, T>) => {
          const out: Record<string, T> = { ...cur };
          for (const [k, v] of Object.entries(inc ?? {})) out[k] = newer(out[k] as never, v as never) as T;
          return out;
        };
        const daily = { ...s.daily };
        for (const [k, v] of Object.entries(data.daily ?? {})) {
          const c = daily[k];
          daily[k] = c
            ? { xp: Math.max(c.xp, v.xp), questions: Math.max(c.questions, v.questions), correct: Math.max(c.correct, v.correct), cards: Math.max(c.cards, v.cards), lessons: Math.max(c.lessons, v.lessons) }
            : v;
        }
        const examIds = new Set(s.exams.map((e) => e.id));
        set({
          lessons: mergeRec(s.lessons, data.lessons),
          answers: mergeRec(s.answers, data.answers),
          cards: mergeRec(s.cards, data.cards),
          labs: mergeRec(s.labs, data.labs),
          pbqs: mergeRec(s.pbqs, data.pbqs),
          scenarios: mergeRec(s.scenarios, data.scenarios),
          exams: [...s.exams, ...(data.exams ?? []).filter((e) => !examIds.has(e.id))].sort((a, b) => a.ts - b.ts).slice(-50),
          daily,
          xp: Math.max(s.xp, data.xp ?? 0),
        });
      },

      resetAll: () => set({ ...emptyProgress(), settings: get().settings }),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        const { settings, lessons, answers, cards, labs, pbqs, scenarios, exams, activeExam, daily, xp, last } = s;
        return { settings, lessons, answers, cards, labs, pbqs, scenarios, exams, activeExam, daily, xp, last };
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProgressData>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) } };
      },
    },
  ),
);

/* ---------- Export / import ---------- */

export interface ExportFile {
  app: 'sy0-701-interactive';
  schema: number;
  exportedAt: string;
  data: ProgressData;
}

export function exportProgress(): string {
  const s = useProgress.getState();
  const { settings, lessons, answers, cards, labs, pbqs, scenarios, exams, activeExam, daily, xp, last } = s;
  const file: ExportFile = {
    app: 'sy0-701-interactive',
    schema: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { settings, lessons, answers, cards, labs, pbqs, scenarios, exams, activeExam, daily, xp, last },
  };
  return JSON.stringify(file, null, 2);
}

/** Validates an export file. Returns the data or an error message. */
export function parseImport(text: string): { ok: true; data: ProgressData; summary: string } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' };
  }
  if (!json || typeof json !== 'object') return { ok: false, error: 'Unexpected file contents.' };
  const f = json as Partial<ExportFile>;
  if (f.app !== 'sy0-701-interactive' || !f.data) return { ok: false, error: 'This is not a progress export from this app.' };
  if (typeof f.schema !== 'number' || f.schema > SCHEMA_VERSION) return { ok: false, error: `Unsupported schema version (${String(f.schema)}).` };
  const d = f.data as Partial<ProgressData>;
  const isRec = (v: unknown) => v === undefined || (typeof v === 'object' && v !== null && !Array.isArray(v));
  if (![d.lessons, d.answers, d.cards, d.labs, d.pbqs, d.scenarios, d.daily].every(isRec)) return { ok: false, error: 'Some progress sections are malformed.' };
  if (d.exams !== undefined && !Array.isArray(d.exams)) return { ok: false, error: 'Exam history is malformed.' };
  const data: ProgressData = { ...emptyProgress(), ...d, settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) } } as ProgressData;
  const summary = `${Object.keys(data.answers).length} answered questions, ${Object.keys(data.cards).length} flashcards, ${Object.keys(data.lessons).length} lessons, ${data.exams.length} mock exams, ${data.xp} XP (exported ${f.exportedAt ?? 'unknown date'})`;
  return { ok: true, data, summary };
}
