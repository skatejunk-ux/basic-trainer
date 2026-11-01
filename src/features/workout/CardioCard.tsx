// Loopband-kaart (PLAN.md §4.8 / §6.2): plan aanpasbaar, eigen aftel-timer, trilt elke 10 min en aan het eind.
import { useEffect, useRef, useState } from 'react';
import type { CardioLog, CardioPlan } from '../../types';
import { formatKg } from '../../coach';
import { nl } from '../../content/nl';
import { beep, primeAudio, vibrate, VIBRATE_DONE } from './device';
import { formatClock } from './plan';
import { useNow } from './RestTimer';

const t = nl.workout.cardio;

interface Props {
  plan: CardioPlan;
  log?: CardioLog;
  vibration: boolean;
  sound: boolean;
  onLog: (plan: CardioPlan) => void;
  onUndo: (logId: string) => void;
}

export function CardioCard({ plan, log, vibration, sound, onLog, onUndo }: Props) {
  const [incline, setIncline] = useState(String(plan.inclinePct));
  const [speed, setSpeed] = useState(formatKg(plan.speedKmh));
  const [minutes, setMinutes] = useState(String(plan.minutes));
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const now = useNow(startedAt !== null, 500);
  const lastMark = useRef(0);

  const target = Number(minutes) || plan.minutes;
  const elapsedSec = startedAt ? (now - startedAt) / 1000 : 0;
  const remaining = target * 60 - elapsedSec;

  useEffect(() => {
    if (startedAt === null) return;
    const mark = Math.floor(elapsedSec / 600);
    if (mark > lastMark.current && remaining > 0) {
      lastMark.current = mark;
      vibrate(vibration, [200, 100, 200]);
    }
    if (remaining <= 0 && lastMark.current !== -1) {
      lastMark.current = -1;
      vibrate(vibration, VIBRATE_DONE);
      beep(sound, 3);
    }
  }, [elapsedSec, remaining, startedAt, vibration, sound]);

  if (log) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/10 p-4" data-done="true">
        <span className="flex-1 font-semibold">
          {t.logged(log.minutes)} · {formatKg(log.inclinePct)}% · {formatKg(log.speedKmh)} km/u
        </span>
        <button
          type="button"
          onClick={() => onUndo(log.id)}
          aria-label={nl.workout.undo}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-xl font-bold text-bg"
        >
          ✓
        </button>
      </div>
    );
  }

  const num = (v: string) => Number(v.replace(',', '.'));
  const save = () => {
    const ran = startedAt ? Math.max(1, Math.round(elapsedSec / 60)) : target;
    onLog({ inclinePct: num(incline), speedKmh: num(speed), minutes: ran });
    setStartedAt(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Field label={t.incline} value={incline} onChange={setIncline} />
        <Field label={t.speed} value={speed} onChange={setSpeed} />
        <Field label={t.minutes} value={minutes} onChange={setMinutes} />
      </div>
      {startedAt !== null && (
        <div className="rounded-xl bg-surface-2 p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-muted">{t.elapsed}</div>
          <div className="text-5xl font-bold tabular-nums">{formatClock(elapsedSec)}</div>
          <div className="mt-1 text-sm text-muted">−{formatClock(Math.max(0, remaining))}</div>
        </div>
      )}
      <p className="text-sm text-muted">💡 {t.tip}</p>
      <div className="flex gap-2">
        {startedAt === null ? (
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => {
              primeAudio(sound);
              lastMark.current = 0;
              setStartedAt(Date.now());
            }}
          >
            ▶ {t.start}
          </button>
        ) : (
          <button type="button" className="btn-secondary flex-1" onClick={() => setStartedAt(null)}>
            ■ {t.stop}
          </button>
        )}
        <button type="button" className="btn-primary flex-1" onClick={save}>
          {t.log}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block rounded-xl bg-surface-2 p-2 text-center">
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-center text-2xl font-semibold tabular-nums outline-none"
      />
      <span className="block text-[11px] uppercase tracking-wide text-muted">{label}</span>
    </label>
  );
}
