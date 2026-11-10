import { useMemo } from 'react';
import { useProgress, type DayRecord } from '@/store/progress';
import { dayKey, shiftDay } from './utils';

/** Consecutive days (ending today, or yesterday if nothing yet today) with any study activity. */
export function streakOf(daily: Record<string, DayRecord>): number {
  let key = dayKey();
  if (!(daily[key]?.xp > 0)) key = shiftDay(key, -1);
  let n = 0;
  while (daily[key]?.xp > 0) {
    n++;
    key = shiftDay(key, -1);
  }
  return n;
}

export function useToday() {
  const daily = useProgress((s) => s.daily);
  const goal = useProgress((s) => s.settings.dailyGoal);
  return useMemo(() => {
    const today = daily[dayKey()] ?? { xp: 0, questions: 0, correct: 0, cards: 0, lessons: 0 };
    const goalDays = Object.values(daily).filter((d) => d.xp >= goal).length;
    return { today, goal, streak: streakOf(daily), goalDays, met: today.xp >= goal };
  }, [daily, goal]);
}

export function lastNDays(daily: Record<string, DayRecord>, n: number): { key: string; rec: DayRecord }[] {
  const out: { key: string; rec: DayRecord }[] = [];
  let key = dayKey();
  for (let i = 0; i < n; i++) {
    out.unshift({ key, rec: daily[key] ?? { xp: 0, questions: 0, correct: 0, cards: 0, lessons: 0 } });
    key = shiftDay(key, -1);
  }
  return out;
}
