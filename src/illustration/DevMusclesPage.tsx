// Ontwikkelpagina: alle oefeningen met hun spierkaart (PLAN.md §8), voor review.
import { useEffect, useState } from 'react';
import type { Exercise } from '../types';
import { listExercises, seedIfEmpty } from '../db';
import { SEED_EXERCISES } from '../content/seed.nl';
import { nl } from '../content/nl';
import { MuscleMap } from './MuscleMap';

export function DevMusclesPage() {
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const t = nl.pages.devMuscles;

  useEffect(() => {
    let alive = true;
    // seedIfEmpty is idempotent; zo is de seed er ook als deze pagina eerder laadt dan initDb klaar is.
    void seedIfEmpty()
      .then(listExercises)
      .then((list) => {
        const order = (e: Exercise) => {
          const i = SEED_EXERCISES.findIndex((s) => s.id === e.id);
          return i === -1 ? Infinity : i;
        };
        if (alive) setExercises([...list].sort((a, b) => order(a) - order(b)));
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-bold">{t.title}</h1>
      {!exercises && <p className="mt-2 text-muted">{t.loading}</p>}
      <ul className="mt-4 space-y-4">
        {exercises?.map((ex) => (
          <li key={ex.id} data-exercise={ex.id} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-2 text-lg font-semibold">{ex.name}</h2>
            <div className="flex items-start gap-4">
              <MuscleMap map={ex.muscleMap} size="sm" showLegend={false} />
              <MuscleMap
                map={ex.muscleMap}
                size="lg"
                extraLabel={ex.kind === 'cardio' ? `${nl.muscles.cardio} ❤️` : undefined}
                className="min-w-0 flex-1"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
