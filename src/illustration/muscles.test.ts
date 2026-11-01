import { describe, expect, it } from 'vitest';
import { MUSCLE_IDS } from '../types';
import { SEED_EXERCISES } from '../content/seed.nl';
import { describeMuscleMap, MUSCLE_NAMES, muscleLevel } from './muscles';

describe('spierkaart', () => {
  it('heeft een Nederlandse naam voor elke spiergroep', () => {
    for (const id of MUSCLE_IDS) expect(MUSCLE_NAMES[id]).toBeTruthy();
  });

  it('elke seed-oefening heeft minstens één primaire spier en geen dubbelingen', () => {
    for (const ex of SEED_EXERCISES) {
      expect(ex.muscleMap.primary.length, ex.id).toBeGreaterThan(0);
      const all = [...ex.muscleMap.primary, ...ex.muscleMap.secondary];
      expect(new Set(all).size, ex.id).toBe(all.length);
    }
  });

  it('volgt de mapping uit PLAN.md §8', () => {
    const byId = Object.fromEntries(SEED_EXERCISES.map((e) => [e.id, e.muscleMap]));
    expect(byId['leg-press']).toEqual({ primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'] });
    expect(byId['chest-press']).toEqual({ primary: ['chest'], secondary: ['front-delts', 'triceps'] });
    expect(byId['lat-pulldown'].primary).toEqual(['lats']);
    expect(byId['back-extension'].secondary).toEqual([]);
  });

  it('bepaalt het niveau en een leesbare beschrijving', () => {
    const map = { primary: ['quads' as const], secondary: ['hamstrings' as const] };
    expect(muscleLevel(map, 'quads')).toBe('primary');
    expect(muscleLevel(map, 'hamstrings')).toBe('secondary');
    expect(muscleLevel(map, 'chest')).toBe('idle');
    expect(describeMuscleMap(map)).toBe('Primair: Quadriceps. Secundair: Hamstrings.');
  });
});
