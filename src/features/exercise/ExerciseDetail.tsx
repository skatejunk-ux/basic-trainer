// Oefening-detail (PLAN.md §6.5): spierkaart, uitleg, mijn instellingen en historie met grafiek.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CardioLog, Exercise, MachineSettings, Session, SetLog, Template } from '../../types';
import {
  db,
  deleteExercise,
  getExercise,
  getMachineSettings,
  listSessions,
  listTemplates,
  saveMachineSettings,
} from '../../db';
import { formatKg, resolveIncrement } from '../../coach';
import { nl } from '../../content/nl';
import { MuscleMap } from '../../illustration/MuscleMap';
import { ExerciseInstructions, SettingsForm } from '../../components/exercise/ExerciseInfo';
import { NumberStepper } from '../../components/NumberStepper';
import { ProgressChart } from '../history/ProgressChart';
import { buildProgress } from '../history/progress';
import { LinkedCodes } from '../scan/LinkedCodes';
import { capFirst, summarizeSets } from '../workout/plan';

const t = nl.exercise;
type Tab = 'info' | 'settings' | 'history';
const dateFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });

interface Data {
  exercise: Exercise;
  ms?: MachineSettings;
  sets: SetLog[];
  cardio: CardioLog[];
  sessions: Session[];
  templates: Template[];
}

export function ExerciseDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Data | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('info');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const exercise = await getExercise(id);
      if (!exercise) return alive && setData(null);
      const [ms, sets, cardio, sessions, templates] = await Promise.all([
        getMachineSettings(id),
        db.setLogs.where('exerciseId').equals(id).toArray(),
        db.cardioLogs.where('exerciseId').equals(id).toArray(),
        listSessions(),
        listTemplates(),
      ]);
      if (alive) setData({ exercise, ms, sets, cardio, sessions, templates });
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (data === undefined) return <p className="text-muted">{nl.today.loading}</p>;
  if (data === null)
    return (
      <Link to="/schema" className="btn-secondary">
        {t.back}
      </Link>
    );

  const { exercise, ms } = data;
  const isCardio = exercise.kind === 'cardio';
  const flash = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };
  const saveSettings = async (changes: Partial<MachineSettings>) => {
    const next = await saveMachineSettings({
      exerciseId: exercise.id,
      values: ms?.values ?? {},
      incrementKg: ms?.incrementKg ?? exercise.defaultIncrementKg,
      ...(ms?.notes ? { notes: ms.notes } : {}),
      ...changes,
    });
    setData({ ...data, ms: next });
    flash();
  };

  return (
    <section className="space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-accent">
        {t.back}
      </button>
      <h1 className="text-2xl font-bold">{exercise.name}</h1>
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-surface p-1">
        {(['info', 'settings', 'history'] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-[44px] rounded-lg text-sm font-semibold ${tab === k ? 'bg-accent text-accent-fg' : 'text-muted'}`}
          >
            {t.tabs[k]}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div>
          <MuscleMap map={exercise.muscleMap} size="lg" extraLabel={isCardio ? `${nl.muscles.cardio} ❤️` : undefined} />
          <ExerciseInstructions exercise={exercise} />
          {exercise.isCustom && (
            <button
              type="button"
              className="btn-secondary mt-6 w-full text-danger"
              onClick={async () => {
                if (data.templates.some((tp) => tp.items.some((i) => i.exerciseId === exercise.id))) {
                  return window.alert(t.inUse);
                }
                if (!window.confirm(t.deleteCustomConfirm)) return;
                await deleteExercise(exercise.id);
                navigate('/schema');
              }}
            >
              {t.deleteCustom}
            </button>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-4">
          {saved && <p className="text-sm font-semibold text-success">{t.saved}</p>}
          {!isCardio && (
            <>
              <SettingsForm
                key={JSON.stringify(ms?.values ?? {})}
                fields={exercise.settingFields}
                values={ms?.values ?? {}}
                onCancel={() => setTab('info')}
                onSave={(values) => void saveSettings({ values })}
              />
              <NumberStepper
                label={t.increment}
                value={ms?.incrementKg ?? exercise.defaultIncrementKg}
                step={0.5}
                min={0.5}
                max={20}
                onChange={(v) => void saveSettings({ incrementKg: v })}
              />
              <p className="text-xs text-muted">{nl.workout.step(formatKg(resolveIncrement(exercise, ms)))}</p>
            </>
          )}
          <label className="block">
            <span className="text-sm font-medium">{t.notes}</span>
            <textarea
              key={ms?.notes ?? ''}
              defaultValue={ms?.notes ?? ''}
              rows={3}
              onBlur={(e) => e.target.value !== (ms?.notes ?? '') && void saveSettings({ notes: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 p-3 outline-none focus:border-accent"
            />
          </label>
          <LinkedCodes exerciseId={exercise.id} exerciseName={exercise.name} />
        </div>
      )}

      {tab === 'history' && <HistoryTab data={data} />}
    </section>
  );
}

function HistoryTab({ data }: { data: Data }) {
  const { exercise, sets, cardio, sessions } = data;
  const isCardio = exercise.kind === 'cardio';
  const series = buildProgress(exercise, sets, cardio, sessions);
  const valid = new Set(sessions.filter((s) => s.status !== 'abandoned').map((s) => s.id));
  const bySession = new Map<string, { at: number; text: string }>();
  if (isCardio) {
    for (const c of cardio.filter((x) => valid.has(x.sessionId))) {
      const prev = bySession.get(c.sessionId);
      const text = `${c.minutes} min · ${formatKg(c.inclinePct)}% · ${formatKg(c.speedKmh)} km/u`;
      bySession.set(c.sessionId, {
        at: Math.min(prev?.at ?? Infinity, c.completedAt),
        text: prev ? `${prev.text}, ${text}` : text,
      });
    }
  } else {
    const per = new Map<string, SetLog[]>();
    for (const l of sets.filter((x) => valid.has(x.sessionId)))
      per.set(l.sessionId, [...(per.get(l.sessionId) ?? []), l]);
    for (const [sessionId, list] of per) {
      const text = summarizeSets(list);
      if (text) bySession.set(sessionId, { at: Math.min(...list.map((l) => l.completedAt)), text });
    }
  }
  const rows = [...bySession.entries()].sort((a, b) => b[1].at - a[1].at);
  if (!rows.length) return <p className="text-muted">{nl.exercise.noHistory}</p>;
  const plottable = series.some((s) => s.points.length >= 2);

  return (
    <div className="space-y-3">
      {plottable ? (
        <ProgressChart
          series={series}
          unit={isCardio ? 'min' : 'kg'}
          title={isCardio ? nl.exercise.chartCardio : nl.exercise.chartTitle}
        />
      ) : (
        <p className="rounded-xl bg-surface p-3 text-sm text-muted">{nl.exercise.chartEmpty}</p>
      )}
      <ul className="space-y-2">
        {rows.map(([sessionId, r]) => (
          <li key={sessionId}>
            <Link to={`/historie/${sessionId}`} className="block rounded-xl bg-surface p-3 active:bg-surface-2">
              <span className="block text-sm font-semibold">{capFirst(dateFmt.format(r.at))}</span>
              <span className="block text-sm tabular-nums text-muted">{r.text}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
