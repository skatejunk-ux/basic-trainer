import { describe, expect, it } from 'vitest';
import { cardioKcal, sessionEnergy, strengthKcal } from '../energy';

describe('cardioKcal', () => {
  it('12-3-30 (4,8 km/u, 12%, 30 min, 80 kg) volgens ACSM-wandelformule', () => {
    // v = 80 m/min → VO₂ = 3,5 + 8 + 17,28 = 28,78 ml/kg/min → 28,78·80/1000·5·30
    expect(cardioKcal({ minutes: 30, speedKmh: 4.8, inclinePct: 12 }, 80)).toBeCloseTo(345.4, 1);
  });

  it('hardlopen vanaf 8 km/u gebruikt de loopformule', () => {
    // v = 166,67 m/min, vlak → VO₂ = 3,5 + 33,33 = 36,83 → ·70/1000·5·10
    expect(cardioKcal({ minutes: 10, speedKmh: 10, inclinePct: 0 }, 70)).toBeCloseTo(128.9, 1);
  });

  it('neemt de kcal van de loopband over als die er is', () => {
    expect(cardioKcal({ minutes: 30, speedKmh: 4.8, inclinePct: 12, kcal: 300 }, 80)).toBe(300);
  });
});

describe('strengthKcal', () => {
  it('MET naar gevoel, gemiddeld over de sets', () => {
    // MET (6 + 3,5) / 2 = 4,75 · 80 kg · 0,5 u
    expect(strengthKcal([{ feel: 'hard' }, { feel: 'easy' }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}], 30, 80)).toBeCloseTo(
      (((6 + 3.5 + 10 * 5) / 12) * 80 * 30) / 60,
      5,
    );
  });

  it('actieve tijd maximaal 2,5 min per set', () => {
    expect(strengthKcal([{}, {}], 60, 80)).toBeCloseTo((5 * 80 * 5) / 60, 5);
  });

  it('nul zonder sets of tijd', () => {
    expect(strengthKcal([], 30, 80)).toBe(0);
    expect(strengthKcal([{}], 0, 80)).toBe(0);
  });
});

describe('sessionEnergy', () => {
  it('null zonder lichaamsgewicht', () => {
    expect(sessionEnergy({ durationMin: 60, sets: [{}], cardio: [] })).toBeNull();
    expect(sessionEnergy({ bodyWeightKg: 0, durationMin: 60, sets: [{}], cardio: [] })).toBeNull();
  });

  it('cardio-minuten tellen niet mee als krachttijd', () => {
    const e = sessionEnergy({
      bodyWeightKg: 80,
      durationMin: 50,
      sets: Array.from({ length: 20 }, () => ({})),
      cardio: [{ minutes: 30, speedKmh: 4.8, inclinePct: 12 }],
    })!;
    expect(e.strength).toBe(Math.round((5 * 80 * 20) / 60));
    expect(e.cardio).toBe(345);
    expect(e.total).toBe(Math.round((5 * 80 * 20) / 60 + 345.36));
  });
});
