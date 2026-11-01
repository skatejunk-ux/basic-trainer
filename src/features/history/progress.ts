// Voortgangsdata per oefening (PLAN.md §6.5): zwaarste werkset per training, per been bij unilateraal,
// minuten bij cardio. Puur, zodat het los te testen is.
import type { CardioLog, Exercise, Session, SetLog } from '../../types';
import { estimate1RM } from '../../coach';

export interface ProgressPoint {
  sessionId: string;
  at: number;
  value: number; // kg (kracht) of minuten (cardio)
  reps?: number;
  e1rm?: number;
}

export interface ProgressSeries {
  key: 'all' | 'L' | 'R';
  points: ProgressPoint[];
}

/** Warming-up-loopband (≤10 min) telt niet mee in de cardio-voortgang. */
const WARMUP_MAX_MIN = 10;

export function buildProgress(
  exercise: Exercise,
  setLogs: SetLog[],
  cardioLogs: CardioLog[],
  sessions: Session[],
): ProgressSeries[] {
  const valid = new Set(sessions.filter((s) => s.status !== 'abandoned').map((s) => s.id));
  if (exercise.kind === 'cardio') {
    const per = new Map<string, ProgressPoint>();
    for (const l of cardioLogs) {
      if (l.exerciseId !== exercise.id || !valid.has(l.sessionId) || l.minutes <= WARMUP_MAX_MIN) continue;
      const cur = per.get(l.sessionId);
      if (!cur || l.minutes > cur.value)
        per.set(l.sessionId, { sessionId: l.sessionId, at: l.completedAt, value: l.minutes });
    }
    return [{ key: 'all', points: sortByTime([...per.values()]) }];
  }

  const work = setLogs.filter((l) => l.exerciseId === exercise.id && !l.isWarmup && valid.has(l.sessionId));
  const sides: ProgressSeries['key'][] = exercise.unilateral ? ['L', 'R'] : ['all'];
  return sides.map((key) => {
    const per = new Map<string, ProgressPoint>();
    for (const l of work) {
      if (key !== 'all' && l.side && l.side !== key) continue;
      const cur = per.get(l.sessionId);
      if (!cur || l.weightKg > cur.value || (l.weightKg === cur.value && l.reps > (cur.reps ?? 0))) {
        per.set(l.sessionId, {
          sessionId: l.sessionId,
          at: cur ? Math.min(cur.at, l.completedAt) : l.completedAt,
          value: l.weightKg,
          reps: l.reps,
          e1rm: Math.round(estimate1RM(l.weightKg, l.reps) * 10) / 10,
        });
      }
    }
    return { key, points: sortByTime([...per.values()]) };
  });
}

const sortByTime = (p: ProgressPoint[]) => p.sort((a, b) => a.at - b.at);

/** Nette as-grenzen met een rond stapje. */
export function niceScale(min: number, max: number, ticks = 4): { lo: number; hi: number; step: number } {
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.1);
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return { lo: Math.floor(min / step) * step, hi: Math.ceil(max / step) * step, step };
}
