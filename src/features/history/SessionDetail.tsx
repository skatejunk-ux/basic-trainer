// Detail van één training: alle sets per oefening, cardio, notitie; verwijderen met bevestiging.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CardioLog, Exercise, Session, SetLog, Template } from '../../types';
import {
  deleteSession,
  getSession,
  listCardioLogsBySession,
  listExercises,
  listSetLogsBySession,
  listTemplates,
} from '../../db';
import { formatKg } from '../../coach';
import { nl } from '../../content/nl';
import { capFirst, displayName, exerciseIdFor, formatDuration, itemsInOrder, tonnage } from '../workout/plan';

const t = nl.history;
const dateFmt = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

interface Data {
  session: Session;
  template?: Template;
  exercises: Record<string, Exercise>;
  sets: SetLog[];
  cardio: CardioLog[];
}

export function SessionDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Data | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const session = await getSession(id);
      if (!session) return alive && setData(null);
      const [templates, exs, sets, cardio] = await Promise.all([
        listTemplates(),
        listExercises(),
        listSetLogsBySession(id),
        listCardioLogsBySession(id),
      ]);
      if (alive)
        setData({
          session,
          template: templates.find((tp) => tp.id === session.templateId),
          exercises: Object.fromEntries(exs.map((e) => [e.id, e])),
          sets,
          cardio,
        });
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (data === undefined) return <p className="text-muted">{nl.today.loading}</p>;
  if (data === null)
    return (
      <div>
        <p className="mb-4 text-muted">{t.notFound}</p>
        <Link to="/historie" className="btn-secondary">
          {t.back}
        </Link>
      </div>
    );

  const { session, template, exercises, sets, cardio } = data;
  // Groepeer per template-item in uitgevoerde volgorde; losse logs (bv. verwijderd item) daarna per oefening.
  const groups: { key: string; name: string; exerciseId: string; sets: SetLog[]; cardio: CardioLog[] }[] = [];
  const used = new Set<string>();
  if (template) {
    for (const item of itemsInOrder(session, template)) {
      const exId = exerciseIdFor(session, item);
      const s = sets.filter((l) => l.templateItemId === item.id);
      const c = cardio.filter((l) => l.templateItemId === item.id);
      s.forEach((l) => used.add(l.id));
      c.forEach((l) => used.add(l.id));
      if (s.length || c.length)
        groups.push({
          key: item.id,
          name: displayName(exercises[exId], item, nl.workout.warmupCardio),
          exerciseId: exId,
          sets: s,
          cardio: c,
        });
    }
  }
  for (const l of [...sets, ...cardio]) {
    if (used.has(l.id)) continue;
    let g = groups.find((x) => x.key === `x-${l.exerciseId}`);
    if (!g) {
      g = {
        key: `x-${l.exerciseId}`,
        name: exercises[l.exerciseId]?.name ?? l.exerciseId,
        exerciseId: l.exerciseId,
        sets: [],
        cardio: [],
      };
      groups.push(g);
    }
    if ('reps' in l) g.sets.push(l);
    else g.cardio.push(l);
  }

  return (
    <section className="space-y-4">
      <Link to="/historie" className="text-sm font-semibold text-accent">
        {t.back}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{t.training(template?.name ?? '?')}</h1>
        <p className="text-sm text-muted">{capFirst(dateFmt.format(session.startedAt))}</p>
        <p className="mt-1 text-sm text-muted">
          {t.meta(
            formatDuration((session.endedAt ?? session.startedAt) - session.startedAt),
            sets.filter((s) => !s.isWarmup).length,
          )}{' '}
          · {t.tonnage(formatKg(Math.round(tonnage(sets))))}
        </p>
      </div>
      <ul className="space-y-2">
        {groups.map((g) => (
          <li key={g.key} className="rounded-2xl bg-surface p-3">
            <Link to={`/oefening/${g.exerciseId}`} className="font-semibold">
              {g.name}
            </Link>
            <ul className="mt-1 space-y-0.5 text-sm tabular-nums text-muted">
              {g.sets
                .sort((a, b) => a.completedAt - b.completedAt)
                .map((l) => (
                  <li key={l.id}>
                    {l.isWarmup
                      ? `${nl.workout.warmup}: `
                      : `${nl.workout.set(l.setIndex)}${l.side ? ` ${nl.workout.side[l.side]}` : ''}: `}
                    <span className="text-fg">
                      {formatKg(l.weightKg)} kg × {l.reps}
                    </span>
                    {l.feel && ` ${l.feel === 'easy' ? '😌' : l.feel === 'good' ? '👍' : '🥵'}`}
                  </li>
                ))}
              {g.cardio.map((c) => (
                <li key={c.id} className="text-fg">
                  {c.minutes} min · {formatKg(c.inclinePct)}% · {formatKg(c.speedKmh)} km/u
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {session.notes && (
        <div className="rounded-2xl bg-surface p-3">
          <h2 className="text-sm font-semibold">{t.notes}</h2>
          <p className="whitespace-pre-wrap text-sm">{session.notes}</p>
        </div>
      )}
      <button
        type="button"
        className="btn-secondary w-full text-danger"
        onClick={async () => {
          if (!window.confirm(t.deleteConfirm)) return;
          await deleteSession(session.id);
          navigate('/historie');
        }}
      >
        {t.delete}
      </button>
    </section>
  );
}
