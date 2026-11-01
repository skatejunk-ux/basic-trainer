import { describe, expect, it } from 'vitest';
import type { Session } from '../../types';
import { daysSince, sessionsInWeek, startOfWeek, weekStreak } from './week';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const s = (t: number, status: Session['status'] = 'done'): Session => ({
  id: String(t),
  templateId: 'a',
  startedAt: t,
  status,
  itemOrder: [],
});

describe('week', () => {
  it('week begint op maandag', () => {
    expect(new Date(startOfWeek(at(2026, 11, 1))).getDay()).toBe(1); // zondag 1 nov → maandag 26 okt
    expect(new Date(startOfWeek(at(2026, 11, 1))).getDate()).toBe(26);
    expect(new Date(startOfWeek(at(2026, 11, 2))).getDate()).toBe(2);
  });

  it('telt alleen afgeronde trainingen in deze week', () => {
    const now = at(2026, 11, 4);
    const list = [s(at(2026, 11, 2)), s(at(2026, 11, 3), 'abandoned'), s(at(2026, 11, 1)), s(at(2026, 11, 4))];
    expect(sessionsInWeek(list, now)).toBe(2);
  });

  it('reeks: vorige weken gehaald, deze week nog niet', () => {
    const now = at(2026, 11, 4);
    const list = [
      ...[26, 28, 30].map((d) => s(at(2026, 10, d))),
      ...[19, 21, 23].map((d) => s(at(2026, 10, d))),
      ...[12, 14].map((d) => s(at(2026, 10, d))),
      s(at(2026, 11, 2)),
    ];
    expect(weekStreak(list, 3, now)).toBe(2);
    expect(weekStreak([...list, s(at(2026, 11, 3)), s(at(2026, 11, 4))], 3, now)).toBe(3);
  });

  it('dagen sinds', () => {
    expect(daysSince(undefined, 0)).toBeNull();
    expect(daysSince(at(2026, 11, 1), at(2026, 11, 15))).toBe(14);
  });
});
