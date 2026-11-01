import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './types';

describe('DEFAULT_SETTINGS', () => {
  it('heeft trillen, geluid en scherm-aan standaard aan', () => {
    expect(DEFAULT_SETTINGS.vibration).toBe(true);
    expect(DEFAULT_SETTINGS.sound).toBe(true);
    expect(DEFAULT_SETTINGS.keepScreenOn).toBe(true);
  });

  it('start in donker thema met weekdoel 3', () => {
    expect(DEFAULT_SETTINGS.id).toBe('singleton');
    expect(DEFAULT_SETTINGS.theme).toBe('dark');
    expect(DEFAULT_SETTINGS.weekGoal).toBe(3);
  });
});
