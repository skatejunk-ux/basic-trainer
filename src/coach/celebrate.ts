// Kleine beloning (PLAN.md §7): suggestie gehaald of overtroffen → "Nieuw: +5 kg op de Leg Press 💪".
import type { CardioLog, Exercise, SetLog } from '../types';
import { roundKg } from './math';
import { coachText } from './messages';
import type { RepTarget, Suggestion } from './types';

export interface CompareInput {
  exercise: Exercise;
  suggestion: Suggestion;
  /** Sets van vandaag voor deze oefening (opwarmsets worden genegeerd). */
  currentSets: SetLog[];
  /** Sets van de vorige keer (opwarmsets worden genegeerd); leeg/weg = eerste keer. */
  previousSets?: SetLog[];
  /** Alleen bij cardio: de log van vandaag. */
  currentCardio?: CardioLog;
}

const minReps = (t: RepTarget) => (typeof t === 'number' ? t : t.min);
const working = (sets: SetLog[] | undefined) => (sets ?? []).filter((s) => !s.isWarmup);
const topWeight = (sets: SetLog[]) => Math.max(...sets.map((s) => s.weightKg));
const repsAt = (sets: SetLog[], w: number) =>
  sets.filter((s) => s.weightKg === w).reduce((sum, s) => sum + s.reps, 0);

/** Is de suggestie gehaald? Alle werksets op ≥ voorgesteld gewicht met ≥ doel-reps. */
function met(s: Suggestion, sets: SetLog[]): boolean {
  const target = minReps(s.repTarget);
  return sets.every((set) => {
    const side = set.side && s.perSide ? s.perSide[set.side] : undefined;
    const w = side ? side.weightKg : s.weightKg;
    const reps = side ? minReps(side.repTarget) : target;
    return (w === null || set.weightKg >= w) && set.reps >= reps;
  });
}

/**
 * Nederlandse felicitatie als de suggestie gehaald/overtroffen is, anders null.
 * Meer gewicht dan vorige keer → "+X kg"; zelfde gewicht en meer reps → "+N reps".
 */
export function compareToPrevious(input: CompareInput): string | null {
  const { exercise, suggestion } = input;
  const name = exercise.name;

  if (suggestion.kind === 'cardio') {
    const plan = suggestion.cardio;
    const c = input.currentCardio;
    if (!plan || !c || c.minutes < plan.minutes) return null;
    return coachText.celebrateCardio(c.minutes, name);
  }

  const cur = working(input.currentSets);
  if (cur.length === 0 || suggestion.needsChoice) return null;
  if (!met(suggestion, cur)) return null;

  const prev = working(input.previousSets);
  const curTop = topWeight(cur);
  if (prev.length === 0) {
    return curTop > 0 ? coachText.celebrateStart(curTop, name) : null;
  }
  const prevTop = topWeight(prev);
  if (curTop > prevTop) return coachText.celebrateKg(roundKg(curTop - prevTop), name);
  if (curTop === prevTop) {
    const extra = repsAt(cur, curTop) - repsAt(prev, prevTop);
    if (extra > 0) return coachText.celebrateReps(extra, name);
  }
  return coachText.celebrateMet(name);
}
