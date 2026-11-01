// Samenvatting na de training (PLAN.md §6.2): duur, sets, tonnage, vergelijking met vorige keer, notitie.
import { useState } from 'react';
import type { SetLog } from '../../types';
import { compareToPrevious, formatKg } from '../../coach';
import { nl } from '../../content/nl';
import { displayName, exerciseIdFor, formatDuration, isWarmupCardio, itemsInOrder, tonnage } from './plan';
import { useWorkout } from './store';

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
      <h1 className="text-3xl font-bold">{t.title}</h1>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label={t.duration} value={formatDuration(Date.now() - s.session.startedAt)} />
        <Stat label={t.sets} value={String(work.length)} />
        <Stat label={t.tonnage} value={`${formatKg(Math.round(tonnage(s.logs)))} kg`} />
      </div>
      <ul className="space-y-2">
        {lines.map((l) => (
          <li key={l.id} className="rounded-xl bg-surface p-3">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
