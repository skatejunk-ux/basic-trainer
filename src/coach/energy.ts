// Inspanningsscore als kcal-schatting (PLAN.md §12.2). Puur en unit-getest.
import type { CardioLog, Feel, SetLog } from '../types';

/** MET voor krachttraining per gevoel (Compendium of Physical Activities, licht/matig/zwaar). */
export const STRENGTH_MET: Record<Feel, number> = { easy: 3.5, good: 5, hard: 6 };
export const DEFAULT_STRENGTH_MET = 5;
/** Maximaal meetellende tijd per set (incl. rust), zodat een lange pauze de score niet opblaast. */
export const MAX_MIN_PER_SET = 2.5;
const RUN_FROM_KMH = 8;

/**
 * Loopband volgens de ACSM-formules (VO₂ in ml/kg/min, ~5 kcal per liter O₂).
 * Wandelen: 3,5 + 0,1·v + 1,8·v·helling; hardlopen (≥ 8 km/u): 3,5 + 0,2·v + 0,9·v·helling (v in m/min).
 * Gebruikt de kcal van de loopband zelf als die ingevuld is.
 */
export function cardioKcal(log: Pick<CardioLog, 'minutes' | 'speedKmh' | 'inclinePct' | 'kcal'>, kg: number): number {
  if (log.kcal && log.kcal > 0) return log.kcal;
  const v = (log.speedKmh * 1000) / 60;
  const grade = log.inclinePct / 100;
  const run = log.speedKmh >= RUN_FROM_KMH;
  const vo2 = 3.5 + (run ? 0.2 : 0.1) * v + (run ? 0.9 : 1.8) * v * grade;
  return ((vo2 * kg) / 1000) * 5 * log.minutes;
}

/** Kracht: MET (gemiddeld over de sets, naar gevoel) × kg × actieve uren. */
export function strengthKcal(sets: Pick<SetLog, 'feel'>[], activeMin: number, kg: number): number {
  if (!sets.length || activeMin <= 0) return 0;
  const minutes = Math.min(activeMin, sets.length * MAX_MIN_PER_SET);
  const met = sets.reduce((sum, s) => sum + (s.feel ? STRENGTH_MET[s.feel] : DEFAULT_STRENGTH_MET), 0) / sets.length;
  return met * kg * (minutes / 60);
}

export interface Energy {
  total: number;
  strength: number;
  cardio: number;
}

/** kcal-schatting voor een hele training; null zonder (geldig) lichaamsgewicht. */
export function sessionEnergy(input: {
  bodyWeightKg?: number;
  durationMin: number;
  sets: Pick<SetLog, 'feel'>[];
  cardio: Pick<CardioLog, 'minutes' | 'speedKmh' | 'inclinePct' | 'kcal'>[];
}): Energy | null {
  const kg = input.bodyWeightKg;
  if (!kg || kg <= 0) return null;
  const cardio = input.cardio.reduce((sum, c) => sum + cardioKcal(c, kg), 0);
  const cardioMin = input.cardio.reduce((sum, c) => sum + c.minutes, 0);
  const strength = strengthKcal(input.sets, input.durationMin - cardioMin, kg);
  return { total: Math.round(strength + cardio), strength: Math.round(strength), cardio: Math.round(cardio) };
}
