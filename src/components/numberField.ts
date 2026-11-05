// Getallen uit invoervelden (gewicht, reps, rust, loopband): komma of punt, eventueel met een eenheid erachter.

const UNIT = /\s*(kg|km\/u|km\/h|%|min|sec|s|reps?|x|×)\s*$/i;

/** Getal uit een invoerveld; `null` = leeg of geen getal. "62,5 kg" → 62.5. */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(UNIT, '').replace(',', '.').trim();
  if (!s) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

/** Afronden op `decimals` cijfers achter de komma en binnen `min`..`max` houden. */
export function fitNumber(v: number, { min, max, decimals }: { min: number; max: number; decimals: number }): number {
  const f = 10 ** decimals;
  return Math.min(max, Math.max(min, Math.round(v * f) / f));
}
