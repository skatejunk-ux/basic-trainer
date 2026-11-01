import type { Exercise, TemplateItem } from '../../types';
import { DEFAULT_CARDIO_PLAN } from '../../coach';
import { SEED_EXERCISES } from '../../content/seed.nl';
import { newId } from '../../db';

/** Seed-oefeningen in vaste volgorde, eigen oefeningen daarna op naam. */
export function sortBySeed(list: Exercise[]): Exercise[] {
  const rank = (e: Exercise) => {
    const i = SEED_EXERCISES.findIndex((s) => s.id === e.id);
    return i === -1 ? SEED_EXERCISES.length : i;
  };
  return [...list].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'nl'));
}

/** Nieuw template-item met verstandige standaardwaarden. */
export function newTemplateItem(exercise: Exercise, defaultRestSec: number): TemplateItem {
  if (exercise.kind === 'cardio') {
    return {
      id: newId(),
      exerciseId: exercise.id,
      sets: 1,
      repMin: 1,
      repMax: 1,
      restSec: 0,
      warmupSet: false,
      cardio: { ...DEFAULT_CARDIO_PLAN },
    };
  }
  return {
    id: newId(),
    exerciseId: exercise.id,
    sets: 3,
    repMin: 8,
    repMax: 12,
    restSec: defaultRestSec,
    warmupSet: true,
  };
}
