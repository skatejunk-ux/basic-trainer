// Vandaag (PLAN.md §6.1): volgende training, weekdoel, vorige training, backup-herinnering.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AppSettings, Exercise, Session, SetLog, Template } from '../../types';
import { formatKg, nextTemplate } from '../../coach';
import {
  db,
  getActiveSession,
  getSettings,
  listExercises,
  listSessions,
  listTemplates,
  seedIfEmpty,
  shareOrDownloadBackup,
} from '../../db';
import { nl } from '../../content/nl';
import { useWorkout } from '../workout/store';
import { capFirst, displayName, formatDuration, tonnage } from '../workout/plan';
import { InviteCard } from './InviteCard';
import { daysSince, sessionsInWeek, weekStreak } from './week';

const t = nl.today;
const BACKUP_REMIND_DAYS = 14;
const dayFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' });

interface Data {
  templates: Template[];
  exercises: Record<string, Exercise>;
  sessions: Session[];
  settings: AppSettings;
  lastSets: SetLog[];
  active?: Session;
}

export function TodayPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Data | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [backupDone, setBackupDone] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await seedIfEmpty();
      const [templates, exercises, sessions, active, settings] = await Promise.all([
        listTemplates(),
        listExercises(),
        listSessions(),
        getActiveSession(),
        getSettings(),
      ]);
      const last = sessions.find((s) => s.status === 'done');
      const lastSets = last ? await db.setLogs.where('sessionId').equals(last.id).toArray() : [];
      if (alive)
        setData({
          templates,
          exercises: Object.fromEntries(exercises.map((e) => [e.id, e])),
          sessions,
          settings,
          lastSets,
          active,
        });
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return <p className="text-muted">{t.loading}</p>;

  const now = Date.now();
  const doneSessions = data.sessions.filter((s) => s.status === 'done');
  const thisWeek = sessionsInWeek(data.sessions, now);
  const goal = data.settings.weekGoal;
  const streak = weekStreak(data.sessions, goal, now);
  const last = doneSessions[0];
  const backupAge = daysSince(data.settings.lastBackupAt, now);
  const remindBackup =
    !backupDone && doneSessions.length > 0 && (backupAge === null || backupAge >= BACKUP_REMIND_DAYS);
  const templateName = (id: string) => data.templates.find((tp) => tp.id === id)?.name ?? '?';

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{nl.pages.today.title}</h1>

      <InviteCard />

      {data.active ? (
        <div className="rounded-2xl border border-accent/50 bg-accent/10 p-4">
          <p className="mb-3">{t.resumeText(templateName(data.active.templateId))}</p>
          <button type="button" className="btn-primary w-full text-lg" onClick={() => navigate('/workout')}>
            ▶ {t.resume}
          </button>
        </div>
      ) : (
        <NextTraining data={data} chosen={chosen} onChoose={setChosen} onStart={() => navigate('/workout')} />
      )}

      <div className="flex items-center gap-4 rounded-2xl bg-surface p-4">
        <WeekRing done={thisWeek} goal={goal} />
        <div>
          <p className="font-semibold">{thisWeek >= goal ? t.weekDone : t.week(thisWeek, goal)}</p>
          {streak > 1 && <p className="text-sm text-muted">{t.streak(streak)}</p>}
        </div>
      </div>

      {last && (
        <Link to={`/historie/${last.id}`} className="block rounded-2xl bg-surface p-4 active:bg-surface-2">
          <p className="text-sm uppercase tracking-wide text-muted">{t.last}</p>
          <p className="font-semibold">
            {capFirst(t.lastMeta(dayFmt.format(last.startedAt), templateName(last.templateId)))}
          </p>
          <p className="text-sm text-muted">
            {nl.history.meta(
              formatDuration((last.endedAt ?? last.startedAt) - last.startedAt),
              data.lastSets.filter((s) => !s.isWarmup).length,
            )}{' '}
            · {nl.history.tonnage(formatKg(Math.round(tonnage(data.lastSets))))}
          </p>
        </Link>
      )}

      {remindBackup && (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="mb-2 text-sm">💾 {backupAge === null ? t.backupNever : t.backupReminder(backupAge)}</p>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={async () => {
              const r = await shareOrDownloadBackup();
              if (r !== 'cancelled') setBackupDone(true);
            }}
          >
            {t.backupNow}
          </button>
        </div>
      )}
    </section>
  );
}

function NextTraining({
  data,
  chosen,
  onChoose,
  onStart,
}: {
  data: Data;
  chosen: string | null;
  onChoose: (id: string) => void;
  onStart: () => void;
}) {
  const suggestedId = nextTemplate(data.templates, data.sessions);
  const template = data.templates.find((tp) => tp.id === (chosen ?? suggestedId)) ?? data.templates[0];
  if (!template) return null;
  const others = data.templates.filter((tp) => tp.id !== template.id);
  return (
    <div className="rounded-2xl bg-surface p-4">
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
        disabled={template.items.length === 0}
        onClick={async () => {
          await useWorkout.getState().start(template.id);
          onStart();
        }}
      >
        ▶ {t.start(template.name)}
      </button>
      {others.map((o) => (
        <button key={o.id} type="button" className="btn-ghost mt-2 w-full" onClick={() => onChoose(o.id)}>
          {t.other(o.name)}
        </button>
      ))}
    </div>
  );
}

function WeekRing({ done, goal }: { done: number; goal: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, done / goal);
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 shrink-0" aria-hidden>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgb(var(--color-border))" strokeWidth="6" />
      {pct > 0 && (
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={pct >= 1 ? 'rgb(var(--color-success))' : 'rgb(var(--color-accent))'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 28 28)"
        />
      )}
      <text x="28" y="33" textAnchor="middle" fontSize="15" fontWeight="700" fill="rgb(var(--color-fg))">
        {done}
      </text>
    </svg>
  );
}
