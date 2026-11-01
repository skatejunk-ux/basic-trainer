// Schema (PLAN.md §6.4): trainingen en oefeningenbibliotheek.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Exercise, Template } from '../../types';
import { createTemplate, listExercises, listTemplates, seedIfEmpty } from '../../db';
import { nl } from '../../content/nl';
import { MuscleMap } from '../../illustration/MuscleMap';
import { sortBySeed } from './helpers';

const t = nl.schema;

export function SchemaPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await seedIfEmpty();
      const [tpls, exs] = await Promise.all([listTemplates(), listExercises()]);
      if (alive) {
        setTemplates(tpls);
        setExercises(sortBySeed(exs));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!templates) return <p className="text-muted">{nl.today.loading}</p>;

  const newTemplate = async () => {
    const used = new Set(templates.map((tp) => tp.name));
    const name = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !used.has(l)) ?? String(templates.length + 1);
    const tpl = await createTemplate({ name, items: [], order: templates.length });
    navigate(`/schema/${tpl.id}`);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{nl.pages.schema.title}</h1>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{t.trainings}</h2>
        <ul className="space-y-2">
          {templates.map((tp) => (
            <li key={tp.id}>
              <Link
                to={`/schema/${tp.id}`}
                className="flex min-h-touch items-center gap-3 rounded-2xl bg-surface p-4 active:bg-surface-2"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-xl font-bold text-accent-fg">
                  {tp.name}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{t.training(tp.name)}</span>
                  <span className="block text-sm text-muted">{t.count(tp.items.length)}</span>
                </span>
                <span className="text-muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-secondary mt-2 w-full" onClick={newTemplate}>
          {t.newTraining}
        </button>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{t.exercises}</h2>
        <ul className="grid grid-cols-2 gap-2">
          {exercises.map((ex) => (
            <li key={ex.id}>
              <Link
                to={`/oefening/${ex.id}`}
                className="flex h-full flex-col items-center gap-1 rounded-2xl bg-surface p-3 text-center active:bg-surface-2"
              >
                <MuscleMap map={ex.muscleMap} size="sm" showLegend={false} />
                <span className="text-sm font-semibold leading-tight">{ex.name}</span>
                {ex.isCustom && <span className="text-xs text-muted">{t.custom}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/oefening/nieuw" className="btn-secondary mt-2 w-full">
          {t.newExercise}
        </Link>
      </div>
    </section>
  );
}
