// Compact getalveld met − en + knoppen (touch-vriendelijk); het getal zelf is ook intypbaar.
import { useEffect, useRef, useState } from 'react';
import { formatKg } from '../coach';
import { nl } from '../content/nl';
import { NumberInput } from './NumberInput';
import { fitNumber, parseNumber } from './numberField';

interface Props {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  /** Cijfers achter de komma; standaard 0 bij hele stappen (sets, reps, rust), anders 1. */
  decimals?: number;
  onChange: (v: number) => void;
}

export function NumberStepper({ label, value, step = 1, min = 0, max = 999, decimals, onChange }: Props) {
  const dec = decimals ?? (Number.isInteger(step) && Number.isInteger(min) ? 0 : 1);
  const fit = (v: number) => fitNumber(v, { min, max, decimals: dec });
  const [draft, setDraft] = useState(formatKg(value));
  const [editing, setEditing] = useState(false);

  // Waarde van buiten (−/+ of opgeslagen) tonen zolang je niet aan het typen bent.
  useEffect(() => {
    if (!editing) setDraft(formatKg(value));
  }, [value, editing]);

  const set = (v: number) => {
    const f = fit(v);
    setDraft(formatKg(f));
    if (f !== value) onChange(f);
  };

  /** Getypte waarde vastleggen (bij verlaten van het veld, Enter of sluiten); leeg/onzin = terug naar de oude. */
  const commit = () => {
    setEditing(false);
    const v = parseNumber(draft);
    if (v === null) setDraft(formatKg(value));
    else set(v);
  };

  // Wordt het veld weggehaald terwijl je typt (bv. sheet dicht), dan toch bewaren.
  const pending = useRef<(() => void) | null>(null);
  pending.current = editing ? commit : null;
  useEffect(() => () => pending.current?.(), []);

  return (
    <div className="flex items-center rounded-xl bg-surface-2">
      <button
        type="button"
        onClick={() => set((parseNumber(draft) ?? value) - step)}
        aria-label={nl.workout.minus(label)}
        className="h-12 w-10 shrink-0 text-xl text-muted"
      >
        −
      </button>
      <div className="min-w-0 flex-1 py-1 text-center">
        <NumberInput
          value={draft}
          onChange={setDraft}
          label={label}
          decimal={dec > 0}
          onFocus={() => setEditing(true)}
          onBlur={commit}
          className="h-8 text-lg"
        />
        <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">{label}</div>
      </div>
      <button
        type="button"
        onClick={() => set((parseNumber(draft) ?? value) + step)}
        aria-label={nl.workout.plus(label)}
        className="h-12 w-10 shrink-0 text-xl text-muted"
      >
        +
      </button>
    </div>
  );
}
