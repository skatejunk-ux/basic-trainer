// Historie (PLAN.md §6.6): afgeronde trainingen per maand, nieuwste eerst.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Session, SetLog, Template } from '../../types';
import { db, listSessions, listTemplates } from '../../db';
import { formatKg } from '../../coach';
import { Icon } from '../../components/Icon';
import { nl } from '../../content/nl';
import { capFirst, formatDuration, tonnage } from '../workout/plan';

const t = nl.history;
const monthFmt = new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' });
const dayFmt = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });

export function HistoryPage() {
  const [data, setData] = useState<{ sessions: Session[]; templates: Template[]; sets: SetLog[] } | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([listSessions({ status: 'done' }), listTemplates(), db.setLogs.toArray()]).then(
      ([sessions, templates, sets]) => alive && setData({ sessions, templates, sets }),
    );
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return <p className="text-muted">{nl.today.loading}</p>;
  const names = Object.fromEntries(data.templates.map((tp) => [tp.id, tp.name]));
  const months = new Map<string, Session[]>();
  for (const s of data.sessions) {
    const key = monthFmt.format(s.startedAt);
    months.set(key, [...(months.get(key) ?? []), s]);
  }

  return (
    <section>
      <h1 className="text-3xl font-bold">{nl.pages.history.title}</h1>
      {data.sessions.length === 0 && (
        <div className="card mt-4 flex flex-col items-center gap-3 p-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
            <Icon name="history" className="h-6 w-6" />
          </span>
          <p className="text-muted">{t.empty}</p>
        </div>
      )}
      {[...months.entries()].map(([month, sessions]) => (
        <div key={month} className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="eyebrow">{month}</h2>
            <span className="text-xs text-muted">{t.monthCount(sessions.length)}</span>
          </div>
          <ul className="space-y-2">
            {sessions.map((s) => {
              const sets = data.sets.filter((l) => l.sessionId === s.id);
              const work = sets.filter((l) => !l.isWarmup).length;
              return (
                <li key={s.id}>
                  <Link
                    to={`/historie/${s.id}`}
                    className="card flex items-center gap-3 p-3 active:bg-surface-2"
                    data-session={s.id}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-lg font-bold text-accent">
                      {names[s.templateId] ?? '?'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{capFirst(dayFmt.format(s.startedAt))}</span>
                      <span className="block text-sm text-muted">
                        {t.meta(formatDuration((s.endedAt ?? s.startedAt) - s.startedAt), work)} ·{' '}
                        {t.tonnage(formatKg(Math.round(tonnage(sets))))}
                      </span>
                    </span>
                    <Icon name="chevron-right" className="h-5 w-5 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
