// Eigen oefening toevoegen (PLAN.md §6.5): naam, soort, patroon, spieren aantikken, tips.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MuscleId, Pattern } from '../../types';
import { MUSCLE_IDS } from '../../types';
import { createExercise } from '../../db';
import { BIJSCHUIFGEWICHT_KEY } from '../../coach';
import { nl } from '../../content/nl';
import { BackLink } from '../../components/BackLink';
import { MuscleMap } from '../../illustration/MuscleMap';
import { MUSCLE_NAMES } from '../../illustration/muscles';
import { NumberStepper } from '../../components/NumberStepper';

const t = nl.exercise;
const PATTERNS = Object.keys(t.patterns) as Pattern[];

export function NewExercise() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'strength' | 'cardio'>('strength');
  const [pattern, setPattern] = useState<Pattern>('horizontal-press');
  const [unilateral, setUnilateral] = useState(false);
  const [increment, setIncrement] = useState(2.5);
  const [primary, setPrimary] = useState<MuscleId[]>([]);
  const [secondary, setSecondary] = useState<MuscleId[]>([]);
  const [cues, setCues] = useState('');
  const [error, setError] = useState(false);

  const cycle = (id: MuscleId) => {
    if (primary.includes(id)) {
      setPrimary(primary.filter((m) => m !== id));
      setSecondary([...secondary, id]);
    } else if (secondary.includes(id)) {
      setSecondary(secondary.filter((m) => m !== id));
    } else {
      setPrimary([...primary, id]);
    }
  };

  const save = async () => {
    if (!name.trim() || !primary.length) return setError(true);
    const ex = await createExercise({
      name: name.trim(),
      pattern: kind === 'cardio' ? 'walk' : pattern,
      muscles: primary.map((m) => MUSCLE_NAMES[m]),
      kind,
      unilateral: kind === 'strength' && unilateral,
      bodyweightCapable: false,
      settingFields:
        kind === 'cardio'
          ? []
          : [
              { key: 'seat', label: 'Zithoogte', hint: 'nr' },
              { key: 'start', label: 'Startpositie', hint: 'nr' },
              { key: BIJSCHUIFGEWICHT_KEY, label: 'Bijschuifgewicht', hint: 'aan/uit (bv. +2,5 kg)' },
            ],
      setup: [],
      cues: cues
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean),
      mistakes: [],
      breathing: '',
      tempo: '',
      defaultIncrementKg: kind === 'cardio' ? 0 : increment,
      muscleMap: { primary, secondary },
      animationId: 'generic',
      isCustom: true,
    });
    navigate(`/oefening/${ex.id}`, { replace: true });
  };

  const seg = (on: boolean) =>
    `min-h-touch flex-1 rounded-xl border ${on ? 'border-accent bg-accent/20 font-semibold' : 'border-border bg-surface-2 text-muted'}`;

  return (
    <section className="space-y-4">
      <BackLink label={t.back} />
      <h1 className="text-3xl font-bold">{t.newTitle}</h1>
      <label className="block">
        <span className="text-sm font-medium">{nl.schema.name}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-3 outline-none focus:border-accent"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium">{t.kind}</legend>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            aria-pressed={kind === 'strength'}
            className={seg(kind === 'strength')}
            onClick={() => setKind('strength')}
          >
            {t.strength}
          </button>
          <button
            type="button"
            aria-pressed={kind === 'cardio'}
            className={seg(kind === 'cardio')}
            onClick={() => setKind('cardio')}
          >
            {t.cardio}
          </button>
        </div>
      </fieldset>
      {kind === 'strength' && (
        <>
          <label className="block">
            <span className="text-sm font-medium">{t.pattern}</span>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value as Pattern)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-3 outline-none focus:border-accent"
            >
              {PATTERNS.filter((p) => p !== 'walk').map((p) => (
                <option key={p} value={p}>
                  {t.patterns[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-touch items-center justify-between rounded-xl bg-surface-2 px-3">
            <span>{t.unilateral}</span>
            <input
              type="checkbox"
              checked={unilateral}
              onChange={(e) => setUnilateral(e.target.checked)}
              className="h-6 w-6 accent-[rgb(var(--color-accent))]"
            />
          </label>
          <NumberStepper label={t.increment} value={increment} step={0.5} min={0.5} max={20} onChange={setIncrement} />
        </>
      )}
      <div>
        <p className="text-sm text-muted">{t.musclesHint}</p>
        <MuscleMap map={{ primary, secondary }} size="lg" showLegend={false} />
        <div className="mt-2 flex flex-wrap gap-2">
          {MUSCLE_IDS.map((m) => {
            const level = primary.includes(m) ? 'primary' : secondary.includes(m) ? 'secondary' : 'idle';
            return (
              <button
                key={m}
                type="button"
                onClick={() => cycle(m)}
                aria-pressed={level !== 'idle'}
                className={`min-h-[40px] rounded-full border px-3 text-sm ${
                  level === 'primary'
                    ? 'mm-swatch-primary border-transparent font-semibold text-accent-fg'
                    : level === 'secondary'
                      ? 'mm-swatch-secondary border-transparent font-semibold text-bg'
                      : 'border-border text-muted'
                }`}
              >
                {MUSCLE_NAMES[m]}
              </button>
            );
          })}
        </div>
      </div>
      <label className="block">
        <span className="text-sm font-medium">{t.cuesLabel}</span>
        <textarea
          value={cues}
          onChange={(e) => setCues(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-border bg-surface-2 p-3 outline-none focus:border-accent"
        />
      </label>
      {error && <p className="text-sm font-semibold text-danger">{t.nameRequired}</p>}
      <button type="button" className="btn-primary w-full" onClick={save}>
        {t.save}
      </button>
    </section>
  );
}
