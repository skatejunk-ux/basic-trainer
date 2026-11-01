import { describe, expect, it } from 'vitest';
import * as coach from '../index';

describe('publieke API van src/coach', () => {
  it('exporteert de kernfuncties en constanten', () => {
    expect(typeof coach.suggestNext).toBe('function');
    expect(typeof coach.nextTemplate).toBe('function');
    expect(typeof coach.compareToPrevious).toBe('function');
    expect(typeof coach.estimate1RM).toBe('function');
    expect(typeof coach.roundToIncrement).toBe('function');
    expect(coach.DEFAULT_CARDIO_PLAN).toEqual({ minutes: 30, inclinePct: 12, speedKmh: 4.8 });
    expect(coach.BIJSCHUIFGEWICHT_KG).toBe(2.5);
    expect(coach.BODYWEIGHT_EXTRA_REPS).toBe(3);
    expect(coach.WARMUP_REPS).toBe(10);
    expect(coach.IMBALANCE_THRESHOLD).toBe(0.1);
  });
});
