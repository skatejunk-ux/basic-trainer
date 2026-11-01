import { describe, expect, it } from 'vitest';
import {
  clamp,
  deloadWeight,
  estimate1RM,
  formatKg,
  roundKg,
  roundToIncrement,
  warmupWeight,
  weightForReps,
} from '../math';

describe('estimate1RM (Epley)', () => {
  it('rekent gewicht × (1 + reps/30)', () => {
    expect(estimate1RM(60, 8)).toBeCloseTo(76);
    expect(estimate1RM(100, 10)).toBeCloseTo(133.333, 2);
  });
  it('1 rep = het gewicht zelf', () => {
    expect(estimate1RM(80, 1)).toBe(80);
  });
  it('0 reps, 0 kg of negatief geeft 0', () => {
    expect(estimate1RM(0, 10)).toBe(0);
    expect(estimate1RM(60, 0)).toBe(0);
    expect(estimate1RM(-5, 5)).toBe(0);
    expect(estimate1RM(Number.NaN, 5)).toBe(0);
  });
});

describe('weightForReps (omgekeerde Epley)', () => {
  it('is de inverse van estimate1RM', () => {
    expect(weightForReps(estimate1RM(60, 8), 8)).toBeCloseTo(60);
  });
  it('1 rep of minder = 1RM, 0 1RM = 0', () => {
    expect(weightForReps(90, 1)).toBe(90);
    expect(weightForReps(90, 0)).toBe(90);
    expect(weightForReps(0, 8)).toBe(0);
  });
});

describe('roundToIncrement', () => {
  it('rondt standaard af op dichtstbijzijnde stap', () => {
    expect(roundToIncrement(62, 5)).toBe(60);
    expect(roundToIncrement(62.5, 5)).toBe(65);
    expect(roundToIncrement(63.7, 2.5)).toBe(62.5);
    expect(roundToIncrement(64, 2.5)).toBe(65);
  });
  it('kan omlaag of omhoog afronden', () => {
    expect(roundToIncrement(64.9, 5, 'down')).toBe(60);
    expect(roundToIncrement(60.1, 5, 'up')).toBe(65);
    expect(roundToIncrement(60, 5, 'up')).toBe(60);
    expect(roundToIncrement(60, 5, 'down')).toBe(60);
  });
  it('heeft geen last van float-ruis', () => {
    expect(roundToIncrement(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundToIncrement(7.5, 2.5, 'down')).toBe(7.5);
  });
  it('stap 0 of negatief → alleen afronden op 2 decimalen', () => {
    expect(roundToIncrement(61.234, 0)).toBe(61.23);
    expect(roundToIncrement(61.234, -1)).toBe(61.23);
  });
});

describe('deloadWeight', () => {
  it('−10% afgerond op de stap', () => {
    expect(deloadWeight(100, 5)).toBe(90);
    expect(deloadWeight(60, 2.5)).toBe(55); // 54 → 55
    expect(deloadWeight(62.5, 2.5)).toBe(57.5); // 56.25 → 57.5
  });
  it('altijd minstens één stap lager', () => {
    expect(deloadWeight(20, 5)).toBe(15); // 18 → 20 zou gelijk blijven
    expect(deloadWeight(5, 5)).toBe(0);
  });
  it('nooit onder 0', () => {
    expect(deloadWeight(0, 5)).toBe(0);
    expect(deloadWeight(2.5, 5)).toBe(0);
  });
});

describe('warmupWeight', () => {
  it('~50% afgerond op de stap', () => {
    expect(warmupWeight(60, 5)).toBe(30);
    expect(warmupWeight(65, 5)).toBe(35); // 32.5 → 35
    expect(warmupWeight(62.5, 2.5)).toBe(32.5); // 31.25 → 32.5
  });
  it('minstens één stap', () => {
    expect(warmupWeight(5, 5)).toBe(5);
    expect(warmupWeight(2.5, 5)).toBe(5);
  });
  it('stap 0 → gewoon de helft', () => {
    expect(warmupWeight(41, 0)).toBe(20.5);
  });
});

describe('formatKg / roundKg / clamp', () => {
  it('gebruikt een komma', () => {
    expect(formatKg(62.5)).toBe('62,5');
    expect(formatKg(60)).toBe('60');
    expect(formatKg(4.8)).toBe('4,8');
  });
  it('roundKg rondt op 2 decimalen', () => {
    expect(roundKg(62.500000001)).toBe(62.5);
  });
  it('clamp', () => {
    expect(clamp(5, 6, 8)).toBe(6);
    expect(clamp(9, 6, 8)).toBe(8);
    expect(clamp(7, 6, 8)).toBe(7);
  });
});
