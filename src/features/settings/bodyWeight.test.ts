import { describe, expect, it } from 'vitest';
import { formatBodyWeight, parseBodyWeight } from './bodyWeight';

describe('parseBodyWeight', () => {
  it('accepteert komma, punt en "kg"', () => {
    expect(parseBodyWeight('82,5')).toBe(82.5);
    expect(parseBodyWeight(' 82.5 ')).toBe(82.5);
    expect(parseBodyWeight('80 kg')).toBe(80);
    expect(parseBodyWeight('80KG')).toBe(80);
    expect(parseBodyWeight('75,26')).toBe(75.3);
  });

  it('leeg is null, onzin en buiten 30–300 is ongeldig', () => {
    expect(parseBodyWeight('  ')).toBeNull();
    expect(parseBodyWeight('abc')).toBeUndefined();
    expect(parseBodyWeight('29')).toBeUndefined();
    expect(parseBodyWeight('301')).toBeUndefined();
  });
});

describe('formatBodyWeight', () => {
  it('toont een komma en leeg zonder gewicht', () => {
    expect(formatBodyWeight(82.5)).toBe('82,5');
    expect(formatBodyWeight(80)).toBe('80');
    expect(formatBodyWeight(undefined)).toBe('');
  });
});
