import { describe, expect, it } from 'vitest';
import { fitNumber, parseNumber } from './numberField';

describe('parseNumber', () => {
  it('leest komma en punt', () => {
    expect(parseNumber('62,5')).toBe(62.5);
    expect(parseNumber('62.5')).toBe(62.5);
    expect(parseNumber(' 8 ')).toBe(8);
  });

  it('negeert een eenheid erachter', () => {
    expect(parseNumber('60 kg')).toBe(60);
    expect(parseNumber('4,8 km/u')).toBe(4.8);
    expect(parseNumber('12%')).toBe(12);
    expect(parseNumber('90 s')).toBe(90);
    expect(parseNumber('10 reps')).toBe(10);
  });

  it('leeg of onzin wordt null', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
    expect(parseNumber('–')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('kg')).toBeNull();
  });
});

describe('fitNumber', () => {
  it('rondt af en houdt binnen de grenzen', () => {
    expect(fitNumber(2.6, { min: 1, max: 10, decimals: 0 })).toBe(3);
    expect(fitNumber(14, { min: 1, max: 10, decimals: 0 })).toBe(10);
    expect(fitNumber(0, { min: 1, max: 10, decimals: 0 })).toBe(1);
    expect(fitNumber(4.85, { min: 1, max: 20, decimals: 1 })).toBe(4.9);
  });
});
