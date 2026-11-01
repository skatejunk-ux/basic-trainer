// Samenvatting na de training (PLAN.md §6.2): duur, sets, tonnage, kcal (§12.2), vergelijking met vorige keer, notitie.
import { useState } from 'react';
import type { SetLog } from '../../types';
import { compareToPrevious, formatKg, sessionEnergy } from '../../coach';
import { updateSettings } from '../../db';
import { Icon } from '../../components/Icon';
import { nl } from '../../content/nl';
import { displayName, exerciseIdFor, formatDuration, isWarmupCardio, itemsInOrder, tonnage } from './plan';
import { useWorkout } from './store';
import { parseBodyWeight } from '../settings/bodyWeight';

const t = nl.workout.summary;

/** Sets van de meest recente eerdere sessie met deze oefening. */
function previousSets(history: SetLog[], exerciseId: string): SetLog[] {
  const mine = history.filter((l) => l.exerciseId === exerciseId);
  if (!mine.length) return [];
  const last = mine.reduce((a, b) => (b.completedAt > a.completedAt ? b : a));
  return mine.filter((l) => l.sessionId === last.sessionId);
}

export function Summary({ onSaved }: { onSaved: () => void }) {
  const s = useWorkout();
  const [notes, setNotes] = useState('');
  if (!s.session || !s.template) return null;

  const session = s.session;
  const minutes = (from: number, to: number) => (to - from) / 60000;
  const energy = sessionEnergy({
    bodyWeightKg: s.settings.bodyWeightKg,
    durationMin: minutes(session.startedAt, Date.now()),
    sets: s.logs,
    cardio: s.cardio,
  });
  // Vorige afgeronde training van hetzelfde schema, voor het kcal-verschil.
  const prev = s.history.sessions
    .filter((p) => p.status === 'done' && p.templateId === session.templateId && p.id !== session.id && p.endedAt)
    .reduce<(typeof s.history.sessions)[number] | undefined>((a, b) => (!a || b.startedAt > a.startedAt ? b : a), undefined);
  const prevEnergy =
    energy &&
    prev &&
    sessionEnergy({
      bodyWeightKg: s.settings.bodyWeightKg,
      durationMin: minutes(prev.startedAt, prev.endedAt!),
      sets: s.history.setLogs.filter((l) => l.sessionId === prev.id),
      cardio: s.history.cardioLogs.filter((c) => c.sessionId === prev.id),
    });

  const items = itemsInOrder(s.session, s.template);
  const work = s.logs.filter((l) => !l.isWarmup);
  const lines = items
    .map((item) => {
      const exercise = s.exercises[exerciseIdFor(s.session!, item)];
      const sug = s.suggestions[item.id];
      if (!exercise || !sug) return null;
      if (exercise.kind === 'cardio') {
        const log = s.cardio.find((c) => c.templateItemId === item.id);
        if (!log) return null;
        return {
          id: item.id,
          name: displayName(exercise, item, nl.workout.warmupCardio),
          detail: t.cardio(log.minutes),
          cheer: isWarmupCardio(exercise, item)
            ? null
            : compareToPrevious({ exercise, suggestion: sug, currentSets: [], currentCardio: log }),
        };
      }
      const sets = work.filter((l) => l.templateItemId === item.id);
      if (!sets.length) return null;
      const best = sets.reduce((a, b) =>
        b.weightKg > a.weightKg || (b.weightKg === a.weightKg && b.reps > a.reps) ? b : a,
      );
      return {
        id: item.id,
        name: exercise.name,
        detail: `${t.setsDone(sets.length)} · ${t.best(formatKg(best.weightKg), best.reps)}`,
        cheer: compareToPrevious({
          exercise,
          suggestion: sug,
          currentSets: sets,
          previousSets: previousSets(s.history.setLogs, exercise.id),
        }),
      };
    })
    .filter((l): l is NonNullable<typeof l> => !!l);

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-center pt-2 text-center">
        <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent ring-8 ring-accent/5">
          <Icon name="trophy" className="h-8 w-8" />
        </span>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="mt-1 text-sm text-muted">{nl.workout.title(s.template.name)}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label={t.duration} value={formatDuration(Date.now() - s.session.startedAt)} />
        <Stat label={t.sets} value={String(work.length)} />
        <Stat label={t.tonnage} value={`${formatKg(Math.round(tonnage(s.logs)))} kg`} />
      </div>
      {energy ? (
        <div className="card p-4" data-testid="energy">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">≈ {energy.total} kcal</span>
            <span className="text-xs uppercase tracking-wide text-muted">{t.energy}</span>
          </div>
          <div className="text-sm text-muted">{t.energySplit(energy.strength, energy.cardio)}</div>
          {prevEnergy && (
            <div className="mt-1 text-sm font-semibold text-accent">{t.energyDiff(energy.total - prevEnergy.total)}</div>
          )}
          <div className="mt-1 text-xs text-muted">{t.energyNote}</div>
        </div>
      ) : (
        <WeightAsk />
      )}
      <ul className="space-y-2">
        {lines.map((l) => (
          <li key={l.id} className="card p-3">
            <div className="font-semibold">{l.name}</div>
            <div className="text-sm text-muted">{l.detail}</div>
            {l.cheer && <div className="mt-1 text-sm font-semibold text-accent">{l.cheer}</div>}
          </li>
        ))}
      </ul>
      <label className="block">
        <span className="text-sm font-medium">{t.notes}</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-border bg-surface-2 p-3 outline-none focus:border-accent"
        />
      </label>
      <div className="flex gap-2">
        <button type="button" className="btn-secondary flex-1" onClick={() => s.showSummary(false)}>
          {t.back}
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={async () => {
            await s.finish(notes);
            onSaved();
          }}
        >
          {t.save}
        </button>
      </div>
    </section>
  );
}

function WeightAsk() {
  const [kg, setKg] = useState('');
  const value = parseBodyWeight(kg);
  const valid = typeof value === 'number';
  return (
    <form
      className="card p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        useWorkout.setState({ settings: await updateSettings({ bodyWeightKg: value }) });
      }}
    >
      <p className="mb-2 text-sm">{t.weightAsk}</p>
      <div className="flex gap-2">
        <input
          inputMode="decimal"
          enterKeyHint="done"
          aria-label={t.weightLabel}
          placeholder={t.weightLabel}
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          className="min-h-touch min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-3 outline-none focus:border-accent"
        />
        <button type="submit" className="btn-secondary" disabled={!valid}>
          {t.weightSave}
        </button>
      </div>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-2 py-3">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="eyebrow mt-0.5">{label}</div>
    </div>
  );
}
