// Lichaamsgewicht invoeren (Meer en de samenvatting): komma of punt, eventueel met "kg" erachter.

export const BODY_WEIGHT_MIN = 30;
export const BODY_WEIGHT_MAX = 300;

/** Geparst gewicht op 0,1 kg; `null` = leeg veld, `undefined` = ongeldig. */
export function parseBodyWeight(raw: string): number | null | undefined {
  const s = raw.trim().replace(/\s*kg$/i, '').replace(',', '.');
  if (!s) return null;
  const v = Number(s);
  if (!Number.isFinite(v) || v < BODY_WEIGHT_MIN || v > BODY_WEIGHT_MAX) return undefined;
  return Math.round(v * 10) / 10;
}

export const formatBodyWeight = (kg: number | undefined) => (kg === undefined ? '' : String(kg).replace('.', ','));
