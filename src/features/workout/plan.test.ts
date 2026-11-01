import { describe, expect, it } from 'vitest';
import type { Exercise, Session, Template, TemplateItem } from '../../types';
import type { Suggestion } from '../../coach';
import { SEED_EXERCISES, SEED_TEMPLATES } from '../../content/seed.nl';
import {
  applyRemainingOrder,
  buildRows,
  displayName,
  estimateMinutes,
  formatClock,
  formatPrevious,
  summarizeSets,
  itemsInOrder,
  moveToEnd,
  restAfter,
  tonnage,
} from './plan';

const ex = (id: string) => SEED_EXERCISES.find((e) => e.id === id) as Exercise;
const item: TemplateItem = {
  id: 'x',
  exerciseId: 'leg-press',
  sets: 3,
  repMin: 6,
  repMax: 8,
  restSec: 120,
  warmupSet: true,
};
const sug = (s: Partial<Suggestion>): Suggestion => ({ kind: 'hold', weightKg: 60, repTarget: 7, reason: '', ...s });

describe('buildRows', () => {
  it('maakt opwarmset + werksets met suggestie', () => {
    const rows = buildRows(item, ex('leg-press'), sug({ warmup: { weightKg: 30, reps: 10 } }));
    expect(rows.map((r) => [r.key, r.weightKg, r.reps])).toEqual([
      ['w0', 30, 10],
      ['s1', 60, 7],
      ['s2', 60, 7],
      ['s3', 60, 7],
    ]);
  });

  it('gebruikt de onderkant van de range en laat gewicht leeg bij eerste keer', () => {
    const rows = buildRows(
      { ...item, warmupSet: false },
      ex('leg-press'),
      sug({ kind: 'first', weightKg: null, repTarget: { min: 6, max: 8 } }),
    );
    expect(rows[0]).toMatchObject({ weightKg: null, reps: 6 });
  });

  it('bank-variant start op 0 kg', () => {
    const rows = buildRows({ ...item, warmupSet: false }, ex('back-extension'), sug({ weightKg: null }), true);
    expect(rows[0].weightKg).toBe(0);
  });

  it('unilateraal: per set eerst het zwakke been', () => {
    const rows = buildRows(
      { ...item, sets: 2, warmupSet: false },
      ex('single-leg-press'),
      sug({
        startSide: 'R',
        perSide: {
          L: { kind: 'hold', weightKg: 40, repTarget: 11, reason: '' },
          R: { kind: 'hold', weightKg: 35, repTarget: 10, reason: '' },
        },
      }),
    );
    expect(rows.map((r) => `${r.key}:${r.weightKg}x${r.reps}`)).toEqual([
      's1R:35x10',
      's1L:40x11',
      's2R:35x10',
      's2L:40x11',
    ]);
  });
});

describe('volgorde', () => {
  it('machine bezet schuift naar het einde', () => {
    expect(moveToEnd(['a', 'b', 'c'], 'a')).toEqual(['b', 'c', 'a']);
  });
  it('resterende volgorde houdt afgeronde items vooraan', () => {
    expect(applyRemainingOrder(['a', 'b', 'c', 'd'], ['d', 'b', 'c'])).toEqual(['a', 'd', 'b', 'c']);
  });
  it('itemsInOrder volgt de sessie', () => {
    const t = SEED_TEMPLATES[0] as Template;
    const s = { itemOrder: [t.items[2].id, t.items[0].id] } as Session;
    expect(itemsInOrder(s, t).map((i) => i.id)).toEqual([t.items[2].id, t.items[0].id]);
  });
});

describe('rust en tekst', () => {
  it('rust: opwarmset 60 s, eerste been 60 s, anders template', () => {
    expect(restAfter(item, { key: 'w0', setIndex: 0, isWarmup: true, weightKg: 1, reps: 1 }, false)).toBe(60);
    expect(
      restAfter(item, { key: 's1L', setIndex: 1, isWarmup: false, side: 'L', weightKg: 1, reps: 1 }, true, 'L'),
    ).toBe(60);
    expect(
      restAfter(item, { key: 's1R', setIndex: 1, isWarmup: false, side: 'R', weightKg: 1, reps: 1 }, true, 'L'),
    ).toBe(120);
  });
  it('formatteert vorige keer, klok en tonnage', () => {
    expect(formatPrevious([{ weightKg: 62.5, reps: [8, 8, 8] }])).toBe('3×8 @ 62,5 kg');
    expect(formatPrevious([{ weightKg: 60, reps: [8, 7, 6] }])).toBe('8/7/6 @ 60 kg');
    expect(formatClock(65.2)).toBe('1:06');
    expect(
      tonnage([
        { weightKg: 50, reps: 10, isWarmup: false },
        { weightKg: 20, reps: 10, isWarmup: true },
      ] as never),
    ).toBe(500);
  });
  it('noemt de korte loopband "warming-up"', () => {
    const tread = ex('treadmill');
    expect(
      displayName(
        tread,
        { ...item, exerciseId: 'treadmill', cardio: { minutes: 5, inclinePct: 0, speedKmh: 4 } },
        'Warming-up',
      ),
    ).toBe('Loopband · Warming-up');
    expect(
      displayName(
        tread,
        { ...item, exerciseId: 'treadmill', cardio: { minutes: 30, inclinePct: 12, speedKmh: 4.8 } },
        'W',
      ),
    ).toBe('Loopband 12-3-30');
  });
});

describe('summarizeSets', () => {
  const l = (weightKg: number, reps: number, side?: 'L' | 'R', isWarmup = false, t = 0) =>
    ({ weightKg, reps, side, isWarmup, completedAt: t }) as never;
  it('groepeert per gewicht en per been, zonder opwarmsets', () => {
    expect(
      summarizeSets([
        l(30, 10, undefined, true),
        l(60, 8, undefined, false, 1),
        l(60, 7, undefined, false, 2),
        l(65, 6, undefined, false, 3),
      ]),
    ).toBe('60 kg: 8/7 · 65 kg: 6');
    expect(summarizeSets([l(38.5, 11, 'R', false, 1), l(36.5, 11, 'L', false, 2), l(36.5, 10, 'L', false, 3)])).toBe(
      'L 36,5 kg: 11/10 · R 38,5 kg: 11',
    );
  });
});

describe('estimateMinutes', () => {
  const byId = Object.fromEntries(SEED_EXERCISES.map((e) => [e.id, e]));
  it('telt sets, rust, omstellen en cardio mee', () => {
    const t: Template = { id: 't', name: 'T', order: 0, items: [item] };
    // 4 sets × 45 s + 3 × 120 s rust + 90 s omstellen = 630 s ≈ 10 min
    expect(estimateMinutes(t, byId)).toBe(10);
  });
  it('geeft voor de standaardtrainingen een realistische duur', () => {
    for (const t of SEED_TEMPLATES) {
      const min = estimateMinutes(t as Template, byId);
      expect(min).toBeGreaterThanOrEqual(45);
      expect(min).toBeLessThanOrEqual(110);
    }
  });
});
