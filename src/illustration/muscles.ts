// Spiergroepen: Nederlandse namen en helpers voor de spierkaart (PLAN.md §8).
import type { MuscleId, MuscleMap } from '../types';
import { nl } from '../content/nl';

export const MUSCLE_NAMES: Record<MuscleId, string> = nl.muscles.names;

export type MuscleLevel = 'primary' | 'secondary' | 'idle';

export function muscleLevel(map: MuscleMap, id: MuscleId): MuscleLevel {
  if (map.primary.includes(id)) return 'primary';
  if (map.secondary.includes(id)) return 'secondary';
  return 'idle';
}

export function muscleList(ids: MuscleId[]): string {
  return ids.map((id) => MUSCLE_NAMES[id]).join(', ');
}

/** Toegankelijke beschrijving, bv. "Primair: Quadriceps, Bilspieren. Secundair: Hamstrings." */
export function describeMuscleMap(map: MuscleMap): string {
  const t = nl.muscles;
  const parts = [`${t.primary}: ${muscleList(map.primary)}.`];
  if (map.secondary.length) parts.push(`${t.secondary}: ${muscleList(map.secondary)}.`);
  return parts.join(' ');
}
