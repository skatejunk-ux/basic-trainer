// Compact getalveld met − en + knoppen (touch-vriendelijk).
import { formatKg } from '../coach';
import { nl } from '../content/nl';

interface Props {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

export function NumberStepper({ label, value, step = 1, min = 0, max = 999, onChange }: Props) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 10) / 10)));
  return (
    <div className="flex items-center rounded-xl bg-surface-2">
      <button
        type="button"
        onClick={() => set(value - step)}
        aria-label={nl.workout.minus(label)}
        className="h-12 w-10 shrink-0 text-xl text-muted"
      >
        −
      </button>
      <div className="min-w-0 flex-1 text-center">
        <div className="text-lg font-semibold tabular-nums" aria-label={label}>
          {formatKg(value)}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      </div>
      <button
        type="button"
        onClick={() => set(value + step)}
        aria-label={nl.workout.plus(label)}
        className="h-12 w-10 shrink-0 text-xl text-muted"
      >
        +
      </button>
    </div>
  );
}
