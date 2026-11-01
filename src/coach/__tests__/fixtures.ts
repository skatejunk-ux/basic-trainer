// Testhulpen voor de coach.
import type {
  CardioLog,
  Exercise,
  Feel,
  MachineSettings,
  Session,
  SetLog,
  Template,
  TemplateItem,
} from '../../types';

export const DAY = 24 * 60 * 60 * 1000;
export const T0 = Date.UTC(2026, 9, 1);

export function exercise(over: Partial<Exercise> = {}): Exercise {
  return {
    id: 'leg-press',
    name: 'Leg Press',
    pattern: 'squat',
    muscles: ['quadriceps'],
    kind: 'strength',
    unilateral: false,
    bodyweightCapable: false,
    settingFields: [],
    setup: [],
    cues: [],
    mistakes: [],
    breathing: '',
    tempo: '',
    defaultIncrementKg: 5,
    animationId: 'leg-press',
    isCustom: false,
    ...over,
  };
}

export function item(over: Partial<TemplateItem> = {}): TemplateItem {
  return {
    id: 'A-leg-press',
    exerciseId: 'leg-press',
    sets: 3,
    repMin: 6,
    repMax: 8,
    restSec: 120,
    warmupSet: false,
    ...over,
  };
}

export function machine(values: Record<string, string> = {}, incrementKg = 0): MachineSettings {
  return { exerciseId: 'leg-press', values, incrementKg, updatedAt: T0 };
}

export interface SetSpec {
  w: number;
  r: number;
  feel?: Feel;
  side?: 'L' | 'R';
  warmup?: boolean;
}

/** Bouw set-logs voor één sessie. `day` = dag-offset t.o.v. T0. */
export function sessionSets(
  sessionId: string,
  day: number,
  sets: (SetSpec | [number, number])[],
  opts: { exerciseId?: string; templateItemId?: string } = {},
): SetLog[] {
  return sets.map((spec, i) => {
    const s: SetSpec = Array.isArray(spec) ? { w: spec[0], r: spec[1] } : spec;
    return {
      id: `${sessionId}-${opts.exerciseId ?? 'leg-press'}-${i}`,
      sessionId,
      exerciseId: opts.exerciseId ?? 'leg-press',
      templateItemId: opts.templateItemId ?? 'A-leg-press',
      setIndex: i,
      isWarmup: s.warmup ?? false,
      ...(s.side ? { side: s.side } : {}),
      weightKg: s.w,
      reps: s.r,
      ...(s.feel ? { feel: s.feel } : {}),
      completedAt: T0 + day * DAY + i * 60_000,
    };
  });
}

/** n gelijke sets. */
export const sets = (n: number, w: number, r: number): [number, number][] =>
  Array.from({ length: n }, () => [w, r] as [number, number]);

export function session(id: string, day: number, over: Partial<Session> = {}): Session {
  return {
    id,
    templateId: 'A',
    startedAt: T0 + day * DAY,
    endedAt: T0 + day * DAY + 3_600_000,
    status: 'done',
    itemOrder: [],
    ...over,
  };
}

export function template(id: string, order: number, items: TemplateItem[] = []): Template {
  return { id, name: id, order, items };
}

export function cardioLog(sessionId: string, day: number, minutes: number, exerciseId = 'treadmill'): CardioLog {
  return {
    id: `${sessionId}-${exerciseId}-${minutes}`,
    sessionId,
    exerciseId,
    minutes,
    inclinePct: 12,
    speedKmh: 4.8,
    completedAt: T0 + day * DAY,
  };
}
