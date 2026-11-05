// Vandaag (PLAN.md §6.1): volgende training, weekdoel, vorige training, backup-herinnering.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  updateSettings,
} from '../../db';
import { nl } from '../../content/nl';
import { Icon } from '../../components/Icon';
import { MiniCartoon } from '../../animation/MachineCartoon';
import { useWorkout } from '../workout/store';
import { capFirst, displayName, estimateMinutes, formatDuration, tonnage } from '../workout/plan';
import { ScanButton } from '../scan/ScanButton';
import { InviteCard, OWNER_CODE } from './InviteCard';
import { daysSince, sessionsInWeek, weekDays, weekStreak } from './week';

const t = nl.today;
const BACKUP_REMIND_DAYS = 14;
const dayFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' });
const todayFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
const letterFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'narrow' });

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
  const [params, setParams] = useSearchParams();
  const unlock = params.get('eigenaar') === OWNER_CODE;
  const [version, setVersion] = useState(0);

  // Geheime eigenaar-link: ook als Vandaag al open staat (alleen de hash verandert dan).
  useEffect(() => {
    if (!unlock) return;
    void updateSettings({ showInvite: true }).then(() => {
      setParams({}, { replace: true });
      setVersion((v) => v + 1);
    });
  }, [unlock, setParams]);

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
  }, [version]);

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
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-muted">{capFirst(todayFmt.format(now))}</p>
          <h1 className="text-3xl font-bold">{nl.pages.today.title}</h1>
        </div>
        <ScanButton className="icon-btn border border-border/60 bg-surface text-fg" />
      </div>

      {data.settings.showInvite && <InviteCard />}

      {data.active ? (
        <div className="card border-accent/50 bg-accent/10 p-4">
          <p className="mb-3 font-medium">{t.resumeText(templateName(data.active.templateId))}</p>
          <button type="button" className="btn-primary w-full text-lg" onClick={() => navigate('/workout')}>
            <Icon name="play" className="h-4 w-4" /> {t.resume}
          </button>
        </div>
      ) : (
        <NextTraining data={data} chosen={chosen} onChoose={setChosen} onStart={() => navigate('/workout')} />
      )}

      <div className="card p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold">{thisWeek >= goal ? t.weekDone : t.week(thisWeek, goal)}</p>
          <p className="eyebrow">{t.weekLabel}</p>
        </div>
        <ul className="mt-3 grid grid-cols-7 gap-1 text-center" aria-hidden>
          {weekDays(data.sessions, now).map((d) => (
            <li key={d.date.getTime()} className="flex flex-col items-center gap-1">
              <span className={`text-[11px] font-semibold uppercase ${d.isToday ? 'text-fg' : 'text-muted'}`}>
                {letterFmt.format(d.date)}
              </span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums ${
                  d.trained
                    ? 'animate-pop border-ink bg-accent text-accent-fg shadow-comic-sm'
                    : d.isToday
                      ? 'border-ink bg-pop text-pop-fg'
                      : 'border-transparent bg-surface-2 text-muted'
                }`}
              >
                {d.trained ? <Icon name="check" className="h-4 w-4" strokeWidth={3} /> : d.date.getDate()}
              </span>
            </li>
          ))}
        </ul>
        {streak > 1 && <p className="mt-3 text-sm text-muted">{t.streak(streak)}</p>}
      </div>

      {last && (
        <Link to={`/historie/${last.id}`} className="card flex items-center gap-3 p-4 active:bg-surface-2">
          <span className="pop-badge h-11 w-11 rotate-2 rounded-xl text-2xl">
            {templateName(last.templateId).slice(0, 2)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="eyebrow block">{t.last}</span>
            <span className="block truncate font-semibold">
              {capFirst(t.lastMeta(dayFmt.format(last.startedAt), templateName(last.templateId)))}
            </span>
            <span className="block text-sm text-muted">
              {nl.history.meta(
                formatDuration((last.endedAt ?? last.startedAt) - last.startedAt),
                data.lastSets.filter((s) => !s.isWarmup).length,
              )}{' '}
              · {nl.history.tonnage(formatKg(Math.round(tonnage(data.lastSets))))}
            </span>
          </span>
          <Icon name="chevron-right" className="h-5 w-5 text-muted" />
        </Link>
      )}

      {remindBackup && (
        <div className="card flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
            <Icon name="download" className="h-[18px] w-[18px]" />
          </span>
          <p className="min-w-0 flex-1 text-sm">{backupAge === null ? t.backupNever : t.backupReminder(backupAge)}</p>
          <button
            type="button"
            className="btn-secondary min-h-[40px] shrink-0 text-sm"
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
  // Eerste krachtoefening als bewegend comic-plaatje in de kop.
  const star = template.items.map((i) => data.exercises[i.exerciseId]).find((e) => e && e.kind !== 'cardio');
  return (
    <div className="card relative overflow-hidden p-4">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-pop-blue/25 to-transparent"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="pop-badge h-12 w-12 text-3xl">{template.name.slice(0, 2)}</span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{t.next}</p>
            <h2 className="truncate text-3xl">{nl.workout.title(template.name)}</h2>
          </div>
          {star && (
            <div className="shrink-0 rotate-2" aria-hidden>
              <MiniCartoon exercise={star} />
            </div>
          )}
        </div>
        <p className="mt-3 flex items-center gap-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="dumbbell" className="h-4 w-4" />
            {t.exercises(template.items.length)}
          </span>
          {template.items.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="clock" className="h-4 w-4" />
              {t.duration(estimateMinutes(template, data.exercises))}
            </span>
          )}
        </p>
        <ol className="my-4 divide-y divide-border/50 rounded-xl bg-surface-2/60 px-3">
          {template.items.map((item, i) => {
            const ex = data.exercises[item.exerciseId];
            return (
              <li key={item.id} className="flex items-baseline gap-2 py-2 text-sm">
                <span className="w-4 text-right text-xs tabular-nums text-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{displayName(ex, item, nl.workout.warmupCardio)}</span>
                <span className="tabular-nums text-muted">
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
          <Icon name="play" className="h-4 w-4" /> {t.start(template.name)}
        </button>
        {others.map((o) => (
          <button key={o.id} type="button" className="btn-ghost mt-1 w-full text-sm" onClick={() => onChoose(o.id)}>
            {t.other(o.name)}
          </button>
        ))}
      </div>
    </div>
  );
}
