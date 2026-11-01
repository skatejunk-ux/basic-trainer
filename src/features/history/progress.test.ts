import { describe, expect, it } from 'vitest';
import type { CardioLog, Exercise, Session, SetLog } from '../../types';
import { SEED_EXERCISES } from '../../content/seed.nl';
import { buildProgress, niceScale } from './progress';

const ex = (id: string) => SEED_EXERCISES.find((e) => e.id === id) as Exercise;
const session = (id: string, status: Session['status'] = 'done'): Session => ({
  id,
  templateId: 't',
  startedAt: 0,
  status,
  itemOrder: [],
});
let n = 0;
const set = (sessionId: string, weightKg: number, reps: number, extra: Partial<SetLog> = {}): SetLog => ({
  id: String(n++),
  sessionId,
  exerciseId: 'leg-press',
  templateItemId: 'i',
  setIndex: 1,
  isWarmup: false,
  weightKg,
  reps,
  completedAt: n * 1000,
  ...extra,
});

describe('buildProgress', () => {
  it('neemt per training de zwaarste werkset, zonder opwarmsets en afgebroken trainingen', () => {
    const logs = [
      set('s1', 60, 8),
      set('s1', 60, 6),
      set('s1', 100, 10, { isWarmup: true }),
      set('s2', 65, 7),
      set('s3', 200, 1),
    ];
    const [series] = buildProgress(
      ex('leg-press'),
      logs,
      [],
      [session('s1'), session('s2'), session('s3', 'abandoned')],
    );
    expect(series.points.map((p) => [p.sessionId, p.value, p.reps])).toEqual([
      ['s1', 60, 8],
      ['s2', 65, 7],
    ]);
    expect(series.points[0].e1rm).toBe(76);
  });

  it('unilateraal: aparte reeksen per been', () => {
    const logs = [
      set('s1', 40, 10, { side: 'L', exerciseId: 'single-leg-press' }),
      set('s1', 35, 10, { side: 'R', exerciseId: 'single-leg-press' }),
    ];
    const series = buildProgress(ex('single-leg-press'), logs, [], [session('s1')]);
    expect(series.map((s) => [s.key, s.points[0]?.value])).toEqual([
      ['L', 40],
      ['R', 35],
    ]);
  });

  it('cardio: minuten, warming-up telt niet mee', () => {
    const cardio: CardioLog[] = [
      { id: 'a', sessionId: 's1', exerciseId: 'treadmill', minutes: 5, inclinePct: 0, speedKmh: 4, completedAt: 1 },
      { id: 'b', sessionId: 's1', exerciseId: 'treadmill', minutes: 30, inclinePct: 12, speedKmh: 4.8, completedAt: 2 },
    ];
    const [series] = buildProgress(ex('treadmill'), [], cardio, [session('s1')]);
    expect(series.points.map((p) => p.value)).toEqual([30]);
  });
});

describe('niceScale', () => {
  it('rondt af op nette stappen', () => {
    expect(niceScale(58, 72)).toEqual({ lo: 55, hi: 75, step: 5 });
    expect(niceScale(60, 60).lo).toBeLessThan(60);
  });
});
