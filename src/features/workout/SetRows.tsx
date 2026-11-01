// Setrijen met grote −/+ knoppen voor gewicht en reps (PLAN.md §6.2).
import { useState } from 'react';
import type { Feel, SetLog } from '../../types';
import { formatKg, roundKg } from '../../coach';
import { nl } from '../../content/nl';
import { primeAudio } from './device';
import type { PlannedRow } from './plan';

const t = nl.workout;

interface Props {
  row: PlannedRow;
  log?: SetLog;
  step: number;
  allowZero: boolean;
  soundEnabled: boolean;
  onDone: (weightKg: number, reps: number) => void;
  onUndo: (logId: string) => void;
  onFeel: (logId: string, feel: Feel) => void;
}

export function SetRow({ row, log, step, allowZero, soundEnabled, onDone, onUndo, onFeel }: Props) {
  const [weight, setWeight] = useState<string>(row.weightKg === null ? '' : formatKg(row.weightKg));
  const [reps, setReps] = useState(row.reps);
  const label = row.isWarmup ? t.warmup : `${t.set(row.setIndex)}${row.side ? ` · ${t.side[row.side]}` : ''}`;
  const parsed = Number(weight.replace(',', '.'));
  const valid =
    weight.trim() !== '' && Number.isFinite(parsed) && (parsed > 0 || (allowZero && parsed === 0)) && reps > 0;

  if (log) {
    return (
      <li className="rounded-xl border border-success/40 bg-success/10 p-3" data-row={row.key} data-done="true">
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm font-medium text-muted">{label}</span>
          <span className="flex-1 text-lg font-semibold tabular-nums">
            {formatKg(log.weightKg)} kg × {log.reps}
          </span>
          <button
            type="button"
            onClick={() => onUndo(log.id)}
            aria-label={t.undo}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-xl font-bold text-bg"
          >
            ✓
          </button>
        </div>
        {!row.isWarmup && (
          <div className="mt-2 flex items-center gap-2" role="group" aria-label={t.feel.label}>
            {(['easy', 'good', 'hard'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={log.feel === f}
                onClick={() => onFeel(log.id, f)}
                className={`min-h-[40px] flex-1 rounded-lg border text-sm ${
                  log.feel === f ? 'border-accent bg-accent/20 font-semibold text-fg' : 'border-border text-muted'
                }`}
              >
                {f === 'easy' ? '😌' : f === 'good' ? '👍' : '🥵'} {t.feel[f]}
              </button>
            ))}
          </div>
        )}
      </li>
    );
  }

  const bump = (delta: number) => {
    const base = Number.isFinite(parsed) && weight.trim() !== '' ? parsed : 0;
    setWeight(formatKg(Math.max(0, roundKg(base + delta))));
  };

  return (
    <li
      className={`rounded-xl border border-border bg-surface p-3 ${row.isWarmup ? 'opacity-90' : ''}`}
      data-row={row.key}
    >
      <div className="mb-2 text-sm font-medium text-muted">{label}</div>
      <div className="flex items-center gap-2">
        <Stepper
          label={t.weight}
          onMinus={() => bump(-step)}
          onPlus={() => bump(step)}
          input={
            <input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="–"
              aria-label={`${label} ${t.weight}`}
              className="w-full bg-transparent text-center text-xl font-semibold tabular-nums outline-none"
            />
          }
        />
        <Stepper
          label={t.reps}
          onMinus={() => setReps((r) => Math.max(1, r - 1))}
          onPlus={() => setReps((r) => r + 1)}
          input={
            <span className="block text-center text-xl font-semibold tabular-nums" aria-label={`${label} ${t.reps}`}>
              {reps}
            </span>
          }
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            primeAudio(soundEnabled);
            onDone(parsed, reps);
          }}
          aria-label={`${t.done}: ${label}`}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-fg active:scale-95 disabled:opacity-30"
        >
          ✓
        </button>
      </div>
    </li>
  );
}

function Stepper({
  label,
  input,
  onMinus,
  onPlus,
}: {
  label: string;
  input: React.ReactNode;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center rounded-xl bg-surface-2">
      <button
        type="button"
        onClick={onMinus}
        aria-label={t.minus(label)}
        className="h-14 w-11 shrink-0 text-2xl text-muted"
      >
        −
      </button>
      <div className="min-w-0 flex-1">
        {input}
        <div className="text-center text-[11px] uppercase tracking-wide text-muted">{label}</div>
      </div>
      <button
        type="button"
        onClick={onPlus}
        aria-label={t.plus(label)}
        className="h-14 w-11 shrink-0 text-2xl text-muted"
      >
        +
      </button>
    </div>
  );
}
