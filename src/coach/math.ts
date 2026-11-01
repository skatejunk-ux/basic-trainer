// Rekenhulpen van de coach: Epley-1RM, afronden op gewichtsstap, kg-notatie.

const EPS = 1e-9;

/** Epley: 1RM = gewicht × (1 + reps / 30). 1 rep = het gewicht zelf; 0 reps of 0 kg = 0. */
export function estimate1RM(weightKg: number, reps: number): number {
  if (!(weightKg > 0) || !(reps > 0)) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

/** Omgekeerde Epley: welk gewicht hoort bij `reps` herhalingen gegeven een 1RM. */
export function weightForReps(oneRepMaxKg: number, reps: number): number {
  if (!(oneRepMaxKg > 0)) return 0;
  if (reps <= 1) return oneRepMaxKg;
  return oneRepMaxKg / (1 + reps / 30);
}

export type RoundMode = 'nearest' | 'down' | 'up';

/** Rond af op een veelvoud van `incrementKg` (en op 2 decimalen tegen float-ruis). */
export function roundToIncrement(
  weightKg: number,
  incrementKg: number,
  mode: RoundMode = 'nearest',
): number {
  if (!(incrementKg > 0)) return roundKg(weightKg);
  const steps = weightKg / incrementKg;
  const n =
    mode === 'down'
      ? Math.floor(steps + EPS)
      : mode === 'up'
        ? Math.ceil(steps - EPS)
        : Math.round(steps + EPS);
  return roundKg(n * incrementKg);
}

/** Rond af op 2 decimalen (voorkomt 62.50000001). */
export function roundKg(weightKg: number): number {
  return Math.round(weightKg * 100) / 100;
}

/** −10%, afgerond op de stap, maar altijd minstens één stap lager (niet onder 0). */
export function deloadWeight(weightKg: number, incrementKg: number): number {
  if (weightKg <= 0) return 0;
  let w = roundToIncrement(weightKg * 0.9, incrementKg, 'nearest');
  if (w >= weightKg) w = roundKg(weightKg - incrementKg);
  return Math.max(0, w);
}

/** Opwarmset: ~50% van het werkgewicht, afgerond op de stap, minstens één stap. */
export function warmupWeight(workingWeightKg: number, incrementKg: number): number {
  const w = roundToIncrement(workingWeightKg * 0.5, incrementKg, 'nearest');
  return Math.max(incrementKg > 0 ? incrementKg : 0, w);
}

/** Nederlandse kg-notatie: 62.5 → "62,5", 60 → "60". */
export function formatKg(weightKg: number): string {
  return String(roundKg(weightKg)).replace('.', ',');
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
