// Rusttimer (PLAN.md §6.3): op tijdstempel gebaseerd, trilt/piept bij 10 s en bij 0.
import { useEffect, useRef, useState } from 'react';
import { nl } from '../../content/nl';
import { beep, vibrate, VIBRATE_DONE, VIBRATE_TICK } from './device';
import { formatClock } from './plan';
import { useWorkout } from './store';

export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);
  return now;
}

export function RestTimer() {
  const t = nl.workout.rest;
  const rest = useWorkout((s) => s.rest);
  const settings = useWorkout((s) => s.settings);
  const { adjustRest, clearRest } = useWorkout.getState();
  const now = useNow(!!rest);
  const fired = useRef<{ endAt: number; tick: boolean; done: boolean } | null>(null);

  const remaining = rest ? (rest.endAt - now) / 1000 : 0;
  const over = !!rest && remaining <= 0;

  useEffect(() => {
    if (!rest) return;
    if (fired.current?.endAt !== rest.endAt) fired.current = { endAt: rest.endAt, tick: false, done: false };
    const f = fired.current;
    if (remaining <= 10 && remaining > 0 && !f.tick && rest.totalSec > 15) {
      f.tick = true;
      vibrate(settings.vibration, VIBRATE_TICK);
    }
    if (remaining <= 0 && !f.done) {
      f.done = true;
      // Alleen afgaan als we het eindmoment echt meemaken (niet na uren terugkomen).
      if (remaining > -30) {
        vibrate(settings.vibration, VIBRATE_DONE);
        beep(settings.sound);
      }
    }
  }, [rest, remaining, settings.vibration, settings.sound]);

  useEffect(() => {
    if (!over) return;
    const id = window.setTimeout(clearRest, 4000);
    return () => window.clearTimeout(id);
  }, [over, clearRest]);

  if (!rest) return null;
  const pct = Math.min(100, Math.max(0, (1 - remaining / rest.totalSec) * 100));

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={t.label}
      className={`border-t-2 border-ink px-4 pb-2 pt-3 ${over ? 'bg-pop text-pop-fg' : 'bg-surface-2'}`}
    >
      <div className="mb-2 h-3.5 overflow-hidden rounded-full border-2 border-ink bg-surface">
        <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      {over ? (
        <button
          type="button"
          onClick={clearRest}
          className="animate-pop min-h-touch w-full text-center font-pop text-3xl tracking-wide"
        >
          {t.over}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => adjustRest(-15)} className="btn-secondary min-w-[64px]">
            {t.minus}
          </button>
          <div className="flex-1 text-center">
            <div className="eyebrow">{t.label}</div>
            <div className="text-4xl font-bold tabular-nums" data-testid="rest-remaining">
              {formatClock(remaining)}
            </div>
          </div>
          <button type="button" onClick={() => adjustRest(15)} className="btn-secondary min-w-[64px]">
            {t.plus}
          </button>
          <button type="button" onClick={clearRest} className="btn-secondary" aria-label={t.skipLabel}>
            {t.skip}
          </button>
        </div>
      )}
    </div>
  );
}
