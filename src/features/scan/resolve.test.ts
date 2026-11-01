import { describe, expect, it } from 'vitest';
import { resolveScan } from './resolve';

const workout = (exerciseIds: string[], current = 0, done = exerciseIds.map(() => false)) => ({
  exerciseIds,
  done,
  current,
});

describe('resolveScan', () => {
  it('onbekende code → koppelen, ook tijdens een training', () => {
    expect(resolveScan({ code: 'X' })).toEqual({ type: 'link', code: 'X' });
    expect(resolveScan({ code: 'X', workout: workout(['leg-press']) })).toEqual({ type: 'link', code: 'X' });
  });

  it('gekoppeld zonder training → oefening openen', () => {
    expect(resolveScan({ code: 'X', linkedExerciseId: 'leg-press' })).toEqual({
      type: 'open-exercise',
      exerciseId: 'leg-press',
    });
  });

  it('gekoppeld en in de training → naar die positie', () => {
    const a = resolveScan({ code: 'X', linkedExerciseId: 'chest-press', workout: workout(['leg-press', 'chest-press']) });
    expect(a).toEqual({ type: 'goto-item', exerciseId: 'chest-press', index: 1 });
  });

  it('gekoppeld maar niet in de training', () => {
    const a = resolveScan({ code: 'X', linkedExerciseId: 'lat-pulldown', workout: workout(['leg-press']) });
    expect(a).toEqual({ type: 'not-in-workout', exerciseId: 'lat-pulldown' });
  });

  it('dubbele oefening: huidige als die past, anders eerste die nog niet af is', () => {
    const ids = ['treadmill', 'leg-press', 'treadmill'];
    expect(resolveScan({ code: 'X', linkedExerciseId: 'treadmill', workout: workout(ids, 2) })).toMatchObject({
      index: 2,
    });
    expect(
      resolveScan({ code: 'X', linkedExerciseId: 'treadmill', workout: workout(ids, 1, [true, false, false]) }),
    ).toMatchObject({ index: 2 });
    expect(
      resolveScan({ code: 'X', linkedExerciseId: 'treadmill', workout: workout(ids, 1, [true, false, true]) }),
    ).toMatchObject({ index: 0 });
  });
});
