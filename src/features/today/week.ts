// Weektellingen voor Vandaag: trainingen deze week (maandag–zondag) en reeks weken met weekdoel gehaald.
import type { Session } from '../../types';

const DAY = 24 * 60 * 60 * 1000;

/** Maandag 00:00 (lokale tijd) van de week waarin `at` valt. */
export function startOfWeek(at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // ma = 0
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

export function sessionsInWeek(sessions: Session[], now: number): number {
  const start = startOfWeek(now);
  const end = startOfWeek(start + 8 * DAY); // via startOfWeek i.v.m. zomer-/wintertijd
  return sessions.filter((s) => s.status === 'done' && s.startedAt >= start && s.startedAt < end).length;
}

/** Aantal aaneengesloten weken (tot en met vorige week, plus deze week als die al gehaald is) met ≥ goal trainingen. */
export function weekStreak(sessions: Session[], goal: number, now: number): number {
  const done = sessions.filter((s) => s.status === 'done');
  const countFrom = (weekStart: number) => {
    const next = startOfWeek(weekStart + 8 * DAY);
    return done.filter((s) => s.startedAt >= weekStart && s.startedAt < next).length;
  };
  let streak = countFrom(startOfWeek(now)) >= goal ? 1 : 0;
  let week = startOfWeek(startOfWeek(now) - DAY);
  while (countFrom(week) >= goal) {
    streak++;
    week = startOfWeek(week - DAY);
  }
  return streak;
}

export function daysSince(at: number | undefined, now: number): number | null {
  return at === undefined ? null : Math.floor((now - at) / DAY);
}

export interface WeekDay {
  date: Date;
  trained: boolean;
  isToday: boolean;
}

/** De zeven dagen (ma–zo) van deze week, met of er die dag een afgeronde training was. */
export function weekDays(sessions: Session[], now: number): WeekDay[] {
  const done = sessions.filter((s) => s.status === 'done');
  const today = new Date(now).toDateString();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek(now));
    date.setDate(date.getDate() + i);
    const key = date.toDateString();
    return {
      date,
      trained: done.some((s) => new Date(s.startedAt).toDateString() === key),
      isToday: key === today,
    };
  });
}
