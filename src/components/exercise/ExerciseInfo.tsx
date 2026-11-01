// Gedeelde stukken voor oefening-uitleg en machine-instellingen (workout-modus en oefening-detail).
import { useState } from 'react';
import type { Exercise } from '../../types';
import { BACK_EXTENSION_TYPE_KEY } from '../../types';
import { BIJSCHUIFGEWICHT_KEY } from '../../coach';
import { nl } from '../../content/nl';

const t = nl.workout;

/** Setup, uitvoering, aandachtspunten, adem en tempo van een oefening. */
export function ExerciseInstructions({ exercise }: { exercise: Exercise }) {
  return (
    <>
      <HowTo title={t.setupTitle} items={exercise.setup} ordered />
      <HowTo title={t.cuesTitle} items={exercise.cues} />
      <HowTo title={t.mistakesTitle} items={exercise.mistakes} />
      {exercise.breathing && <HowTo title={t.breathingTitle} items={[exercise.breathing]} />}
      {exercise.tempo && <HowTo title={t.tempoTitle} items={[exercise.tempo]} />}
    </>
  );
}

/** Instelling als tekst voor een label, bv. "Type: 45°-bank". */
export function settingChip(label: string, key: string, value: string): string {
  const shown =
    key === BACK_EXTENSION_TYPE_KEY
      ? value === 'bench'
        ? t.typeBench
        : value === 'machine'
          ? t.typeMachine
          : value
      : value;
  return `${label}: ${shown}`;
}

function HowTo({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  if (!items.length) return null;
  const List = ordered ? 'ol' : 'ul';
  return (
    <section className="mt-4">
      <h3 className="mb-1 font-semibold">{title}</h3>
      <List className={`space-y-1 pl-5 text-sm ${ordered ? 'list-decimal' : 'list-disc'}`}>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </List>
    </section>
  );
}

export function SettingsForm({
  fields,
  values,
  onSave,
  onCancel,
}: {
  fields: { key: string; label: string; hint?: string }[];
  values: Record<string, string>;
  onSave: (v: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(values);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = Object.fromEntries(Object.entries(draft).filter(([, v]) => v.trim() !== ''));
        onSave(clean);
      }}
    >
      {fields.map((f) =>
        f.key === BIJSCHUIFGEWICHT_KEY || f.key === BACK_EXTENSION_TYPE_KEY ? (
          <fieldset key={f.key}>
            <legend className="text-sm font-medium">{f.label}</legend>
            <div className="mt-1 flex gap-2">
              {(f.key === BIJSCHUIFGEWICHT_KEY
                ? [
                    ['aan', nl.workout.on],
                    ['uit', nl.workout.off],
                  ]
                : [
                    ['machine', nl.workout.typeMachine],
                    ['bench', nl.workout.typeBench],
                  ]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={draft[f.key] === value}
                  onClick={() => setDraft({ ...draft, [f.key]: value })}
                  className={`min-h-touch flex-1 rounded-xl border ${
                    draft[f.key] === value
                      ? 'border-accent bg-accent/20 font-semibold'
                      : 'border-border bg-surface-2 text-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {f.key === BIJSCHUIFGEWICHT_KEY && <p className="mt-1 text-xs text-muted">{nl.workout.bijschuifHint}</p>}
          </fieldset>
        ) : (
          <label key={f.key} className="block">
            <span className="text-sm font-medium">{f.label}</span>
            <input
              value={draft[f.key] ?? ''}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              placeholder={f.hint}
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-3 outline-none focus:border-accent"
            />
          </label>
        ),
      )}
      <div className="flex gap-2 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onCancel}>
          {nl.workout.settingsCancel}
        </button>
        <button type="submit" className="btn-primary flex-1">
          {nl.workout.settingsSave}
        </button>
      </div>
    </form>
  );
}
