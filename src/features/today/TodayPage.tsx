// Vandaag (PLAN.md §6.1) – basisversie: volgende training starten of doorgaan. WP6 breidt dit uit.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Exercise, Session, Template } from '../../types';
import { nextTemplate } from '../../coach';
import { getActiveSession, listExercises, listSessions, listTemplates, seedIfEmpty } from '../../db';
import { nl } from '../../content/nl';
import { useWorkout } from '../workout/store';
import { displayName } from '../workout/plan';

const t = nl.today;

interface Data {
  templates: Template[];
  exercises: Record<string, Exercise>;
  sessions: Session[];
  active?: Session;
}

export function TodayPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await seedIfEmpty();
      const [templates, exercises, sessions, active] = await Promise.all([
        listTemplates(),
        listExercises(),
        listSessions(),
        getActiveSession(),
      ]);
      if (alive)
        setData({
          templates,
          exercises: Object.fromEntries(exercises.map((e) => [e.id, e])),
          sessions,
          active,
        });
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return <p className="text-muted">{t.loading}</p>;

  if (data.active) {
    const name = data.templates.find((tp) => tp.id === data.active!.templateId)?.name ?? '';
    return (
      <section>
        <h1 className="text-2xl font-bold">{nl.pages.today.title}</h1>
        <div className="mt-4 rounded-2xl border border-accent/50 bg-accent/10 p-4">
          <p className="mb-3">{t.resumeText(name)}</p>
          <button type="button" className="btn-primary w-full text-lg" onClick={() => navigate('/workout')}>
            ▶ {t.resume}
          </button>
        </div>
      </section>
    );
  }

  const suggestedId = nextTemplate(data.templates, data.sessions);
  const template = data.templates.find((tp) => tp.id === (chosen ?? suggestedId)) ?? data.templates[0];
  if (!template) return null;
  const others = data.templates.filter((tp) => tp.id !== template.id);

  return (
    <section>
      <h1 className="text-2xl font-bold">{nl.pages.today.title}</h1>
      <div className="mt-4 rounded-2xl bg-surface p-4">
        <p className="text-sm uppercase tracking-wide text-muted">{t.next}</p>
        <h2 className="text-3xl font-bold">{nl.workout.title(template.name)}</h2>
        <p className="mb-3 text-sm text-muted">{t.exercises(template.items.length)}</p>
        <ol className="mb-4 space-y-1">
          {template.items.map((item, i) => {
            const ex = data.exercises[item.exerciseId];
            return (
              <li key={item.id} className="flex items-baseline gap-2 text-sm">
                <span className="w-5 text-right tabular-nums text-muted">{i + 1}.</span>
                <span className="flex-1">{displayName(ex, item, nl.workout.warmupCardio)}</span>
                <span className="text-muted">
                  {ex?.kind === 'cardio'
                    ? `${item.cardio?.minutes ?? 30} min`
                    : `${item.sets}×${item.repMin}–${item.repMax}`}
                </span>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          className="btn-primary w-full text-lg"
          onClick={async () => {
            await useWorkout.getState().start(template.id);
            navigate('/workout');
          }}
        >
          ▶ {t.start(template.name)}
        </button>
        {others.map((o) => (
          <button key={o.id} type="button" className="btn-ghost mt-2 w-full" onClick={() => setChosen(o.id)}>
            {t.other(o.name)}
          </button>
        ))}
      </div>
    </section>
  );
}
