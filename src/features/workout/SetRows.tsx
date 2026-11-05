// Setrijen met grote −/+ knoppen voor gewicht en reps (PLAN.md §6.2); beide zijn ook intypbaar.
import { useState } from 'react';
import type { Feel, SetLog } from '../../types';
import { formatKg, roundKg } from '../../coach';
import { Icon } from '../../components/Icon';
import { NumberInput } from '../../components/NumberInput';
import { parseNumber } from '../../components/numberField';
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
  const [reps, setReps] = useState(String(row.reps));
  const label = row.isWarmup ? t.warmup : `${t.set(row.setIndex)}${row.side ? ` · ${t.side[row.side]}` : ''}`;
  const parsed = parseNumber(weight);
  const repCount = parseNumber(reps);
  const validReps = repCount !== null && Number.isInteger(repCount) && repCount > 0 && repCount <= 999;
  const valid = parsed !== null && parsed <= 999 && (parsed > 0 || (allowZero && parsed === 0)) && validReps;

  if (log) {
    return (
      <li className="rounded-2xl border border-success/40 bg-success/10 p-3" data-row={row.key} data-done="true">
        <div className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-sm font-medium text-muted">{label}</span>
          <span className="flex-1 text-lg font-semibold tabular-nums">
            {formatKg(log.weightKg)} kg × {log.reps}
          </span>
          <button
            type="button"
            onClick={() => onUndo(log.id)}
            aria-label={t.undo}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-bg"
          >
            <Icon name="check" className="h-6 w-6" strokeWidth={3} />
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

  const bump = (delta: number) => setWeight(formatKg(Math.max(0, roundKg((parsed ?? 0) + delta))));
  const bumpReps = (delta: number) =>
    setReps(String(Math.max(1, Math.round(repCount ?? row.reps) + delta)));

  return (
    <li
      className={`card p-3 ${row.isWarmup ? 'opacity-90' : ''}`}
      data-row={row.key}
    >
      <div className="eyebrow mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <Stepper
          label={t.weight}
          className="flex-1"
          onMinus={() => bump(-step)}
          onPlus={() => bump(step)}
          input={
            <NumberInput
              value={weight}
              onChange={setWeight}
              placeholder="?"
              label={`${label} ${t.weight}`}
              onBlur={() => parsed !== null && setWeight(formatKg(Math.max(0, roundKg(parsed))))}
              className={`h-9 ${weight.length > 5 ? 'text-base' : weight.length > 4 ? 'text-lg' : 'text-xl'}`}
            />
          }
        />
        <Stepper
          label={t.reps}
          className="w-[104px] flex-none"
          onMinus={() => bumpReps(-1)}
          onPlus={() => bumpReps(1)}
          input={
            <NumberInput
              value={reps}
              onChange={setReps}
              decimal={false}
              label={`${label} ${t.reps}`}
              onBlur={() => setReps(String(validReps ? repCount : row.reps))}
              className="h-9 text-xl"
            />
          }
        />
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            if (!valid) return;
            primeAudio(soundEnabled);
            onDone(roundKg(parsed!), repCount!);
          }}
          aria-label={`${t.done}: ${label}`}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/20 active:scale-95 disabled:opacity-30 disabled:shadow-none"
        >
          <Icon name="check" className="h-7 w-7" strokeWidth={3} />
        </button>
      </div>
    </li>
  );
}

/** −/+ rond een invoervak; smalle knoppen zodat het getal ook op een 360 px-scherm past. */
function Stepper({
  label,
  input,
  className,
  onMinus,
  onPlus,
}: {
  label: string;
  input: React.ReactNode;
  className: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className={`flex min-w-0 items-center rounded-xl bg-surface-2 ${className}`}>
      <button
        type="button"
        onClick={onMinus}
        aria-label={t.minus(label)}
        className="h-14 w-[34px] shrink-0 text-2xl text-muted"
      >
        −
      </button>
      <div className="min-w-0 flex-1 py-1">
        {input}
        <div className="mt-0.5 text-center text-[11px] uppercase tracking-wide text-muted">{label}</div>
      </div>
      <button
        type="button"
        onClick={onPlus}
        aria-label={t.plus(label)}
        className="h-14 w-[34px] shrink-0 text-2xl text-muted"
      >
        +
      </button>
    </div>
  );
}
