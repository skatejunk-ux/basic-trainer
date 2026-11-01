import { describe, expect, it } from 'vitest';
import { compareToPrevious } from '../celebrate';
import { suggestNext } from '../suggest';
import { cardioLog, exercise, item, sessionSets, sets } from './fixtures';

const lp = exercise({ name: 'Leg Press' });

describe('compareToPrevious', () => {
  it('suggestie (+5 kg) gehaald → "Nieuw: +5 kg op de Leg Press 💪"', () => {
    const previousSets = sessionSets('s1', 0, sets(3, 60, 8));
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: previousSets });
    const currentSets = sessionSets('s2', 2, sets(3, 65, 6));
    expect(compareToPrevious({ exercise: lp, suggestion, currentSets, previousSets })).toBe(
      'Nieuw: +5 kg op de Leg Press 💪',
    );
  });

  it('overtroffen (meer gewicht dan voorgesteld) → werkelijke kg-winst', () => {
    const previousSets = sessionSets('s1', 0, sets(3, 60, 8));
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: previousSets });
    const currentSets = sessionSets('s2', 2, sets(3, 67.5, 6));
    expect(compareToPrevious({ exercise: lp, suggestion, currentSets, previousSets })).toBe(
      'Nieuw: +7,5 kg op de Leg Press 💪',
    );
  });

  it('niet gehaald (te weinig reps) → null', () => {
    const previousSets = sessionSets('s1', 0, sets(3, 60, 8));
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: previousSets });
    const currentSets = sessionSets('s2', 2, [[65, 6], [65, 5], [65, 5]]);
    expect(compareToPrevious({ exercise: lp, suggestion, currentSets, previousSets })).toBeNull();
  });

  it('niet gehaald (lichter gewicht) → null', () => {
    const previousSets = sessionSets('s1', 0, sets(3, 60, 8));
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: previousSets });
    const currentSets = sessionSets('s2', 2, sets(3, 60, 8));
    expect(compareToPrevious({ exercise: lp, suggestion, currentSets, previousSets })).toBeNull();
  });

  it('hold gehaald → "+N reps"', () => {
    const previousSets = sessionSets('s1', 0, [[60, 7], [60, 7], [60, 6]]);
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: previousSets });
    const currentSets = sessionSets('s2', 2, [[60, 8], [60, 7], [60, 7]]);
    expect(compareToPrevious({ exercise: lp, suggestion, currentSets, previousSets })).toBe(
      'Nieuw: +2 reps op de Leg Press 💪',
    );
  });

  it('enkelvoud bij +1 rep', () => {
    const previousSets = sessionSets('s1', 0, [[60, 7], [60, 7], [60, 7]]);
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: previousSets });
    const currentSets = sessionSets('s2', 2, [[60, 8], [60, 8], [60, 8]]);
    expect(compareToPrevious({ exercise: lp, suggestion, currentSets, previousSets })).toBe(
      'Nieuw: +3 reps op de Leg Press 💪',
    );
    const prev2 = sessionSets('s1', 0, [[60, 7], [60, 7], [60, 6]]);
    const sugg2 = suggestNext({ exercise: lp, templateItem: item(), setLogs: prev2 });
    const one = sessionSets('s3', 2, [[60, 7], [60, 7], [60, 7]]);
    expect(compareToPrevious({ exercise: lp, suggestion: sugg2, currentSets: one, previousSets: prev2 })).toBe(
      'Nieuw: +1 rep op de Leg Press 💪',
    );
  });

  it('gehaald maar niet beter dan vorige keer (bv. na deload) → "Doel gehaald"', () => {
    const previousSets = [...sessionSets('s0', 0, sets(3, 70, 5)), ...sessionSets('s1', 1, sets(3, 70, 5))];
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: previousSets });
    expect(suggestion.kind).toBe('deload');
    const currentSets = sessionSets('s2', 2, sets(3, 65, 6));
    expect(
      compareToPrevious({ exercise: lp, suggestion, currentSets, previousSets: previousSets.slice(3) }),
    ).toBe('Doel gehaald op de Leg Press 💪');
  });

  it('opwarmsets tellen niet mee', () => {
    const previousSets = sessionSets('s1', 0, sets(3, 60, 8));
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: previousSets });
    const currentSets = sessionSets('s2', 2, [{ w: 30, r: 3, warmup: true }, ...sets(3, 65, 6)]);
    expect(compareToPrevious({ exercise: lp, suggestion, currentSets, previousSets })).toBe(
      'Nieuw: +5 kg op de Leg Press 💪',
    );
  });

  it('eerste keer → startgewicht', () => {
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: [] });
    const currentSets = sessionSets('s1', 0, sets(3, 60, 7));
    expect(compareToPrevious({ exercise: lp, suggestion, currentSets })).toBe(
      'Startgewicht 60 kg op de Leg Press 💪',
    );
  });

  it('eerste keer op lichaamsgewicht → geen startgewicht-melding', () => {
    const be = exercise({ name: 'Back Extension', bodyweightCapable: true });
    const suggestion = suggestNext({
      exercise: be,
      templateItem: item({ repMin: 10, repMax: 12 }),
      setLogs: [],
      machineSettings: { exerciseId: 'leg-press', values: { type: 'bench' }, incrementKg: 0, updatedAt: 0 },
    });
    const currentSets = sessionSets('s1', 0, sets(3, 0, 12));
    expect(compareToPrevious({ exercise: be, suggestion, currentSets })).toBeNull();
  });

  it('geen sets vandaag of keuze nodig → null', () => {
    const suggestion = suggestNext({ exercise: lp, templateItem: item(), setLogs: [] });
    expect(compareToPrevious({ exercise: lp, suggestion, currentSets: [] })).toBeNull();
    const be = exercise({ name: 'Back Extension', bodyweightCapable: true });
    const choose = suggestNext({ exercise: be, templateItem: item(), setLogs: [] });
    expect(
      compareToPrevious({ exercise: be, suggestion: choose, currentSets: sessionSets('s', 0, sets(3, 20, 10)) }),
    ).toBeNull();
  });

  it('unilateraal: per been tegen de eigen suggestie', () => {
    const sl = exercise({ id: 'sl', name: 'Single-Leg Leg Press', unilateral: true });
    const slItem = item({ id: 'B-sl', exerciseId: 'sl', repMin: 10, repMax: 12 });
    const opts = { exerciseId: 'sl', templateItemId: 'B-sl' };
    const previousSets = sessionSets(
      's1',
      0,
      [{ w: 30, r: 12, side: 'L' }, { w: 25, r: 12, side: 'R' }],
      opts,
    );
    const suggestion = suggestNext({ exercise: sl, templateItem: { ...slItem, sets: 1 }, setLogs: previousSets });
    expect(suggestion.perSide?.L.weightKg).toBe(35);
    expect(suggestion.perSide?.R.weightKg).toBe(30);
    const ok = sessionSets('s2', 2, [{ w: 35, r: 10, side: 'L' }, { w: 30, r: 10, side: 'R' }], opts);
    expect(compareToPrevious({ exercise: sl, suggestion, currentSets: ok, previousSets })).toBe(
      'Nieuw: +5 kg op de Single-Leg Leg Press 💪',
    );
    const notOk = sessionSets('s3', 2, [{ w: 35, r: 10, side: 'L' }, { w: 25, r: 12, side: 'R' }], opts);
    expect(compareToPrevious({ exercise: sl, suggestion, currentSets: notOk, previousSets })).toBeNull();
  });

  describe('cardio', () => {
    const tm = exercise({ id: 'treadmill', name: 'Loopband', kind: 'cardio' });
    const tmItem = item({ exerciseId: 'treadmill', cardio: { minutes: 30, inclinePct: 12, speedKmh: 4.8 } });
    const suggestion = suggestNext({ exercise: tm, templateItem: tmItem, setLogs: [] });

    it('30 min gehaald → felicitatie', () => {
      expect(
        compareToPrevious({ exercise: tm, suggestion, currentSets: [], currentCardio: cardioLog('s', 0, 30) }),
      ).toBe('30 min volgehouden op de Loopband 💪');
    });

    it('korter of geen log → null', () => {
      expect(
        compareToPrevious({ exercise: tm, suggestion, currentSets: [], currentCardio: cardioLog('s', 0, 22) }),
      ).toBeNull();
      expect(compareToPrevious({ exercise: tm, suggestion, currentSets: [] })).toBeNull();
      expect(
        compareToPrevious({
          exercise: tm,
          suggestion: { ...suggestion, cardio: undefined },
          currentSets: [],
          currentCardio: cardioLog('s', 0, 30),
        }),
      ).toBeNull();
    });
  });
});
