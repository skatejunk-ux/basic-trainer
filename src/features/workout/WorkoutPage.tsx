// Workout-modus (PLAN.md §6.2): één oefening per scherm, voortgang, toggles, rusttimer.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { TemplateItem } from '../../types';
import { nl } from '../../content/nl';
import { Sheet } from '../../components/Sheet';
import { useWakeLock } from './device';
import { ExerciseCard } from './ExerciseCard';
import { displayName, exerciseIdFor, formatDuration, isItemDone, itemsInOrder } from './plan';
import { ReorderSheet } from './ReorderSheet';
import { RestTimer, useNow } from './RestTimer';
import { Summary } from './Summary';
import { useWorkout } from './store';

const t = nl.workout;

export function WorkoutPage() {
  const s = useWorkout();
  const navigate = useNavigate();
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const now = useNow(s.status === 'ready', 15000);

  useEffect(() => {
    if (useWorkout.getState().status !== 'ready') void useWorkout.getState().init();
  }, []);
  useWakeLock(s.status === 'ready' && s.settings.keepScreenOn);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [s.view]);

  if (s.status === 'loading' || s.status === 'idle') return <p className="p-6 text-muted">{nl.today.loading}</p>;
  if (s.status === 'none' || !s.session || !s.template) {
    return (
      <div className="p-6">
        <p className="mb-4 text-muted">{t.none}</p>
        <Link to="/" className="btn-primary">
          {t.toToday}
        </Link>
      </div>
    );
  }

  const session = s.session;
  const items = itemsInOrder(session, s.template);
  const isDone = (item: TemplateItem) => isItemDone(item, s.exercises[exerciseIdFor(session, item)], s.logs, s.cardio);
  const skipped = new Set(session.skippedItemIds ?? []);
  const doneCount = items.filter(isDone).length;
  const index = Math.min(s.index, items.length - 1);
  const item = items[index];
  const last = index === items.length - 1;
  const remaining = items.filter((i) => !isDone(i));
  // Eerstvolgende oefening die nog niet af is (na de huidige, anders vanaf het begin).
  const nextItem =
    items.slice(index + 1).find((i) => !isDone(i) && !skipped.has(i.id)) ??
    items.slice(0, index).find((i) => !isDone(i) && !skipped.has(i.id));

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+8px)] backdrop-blur">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLeaveOpen(true)}
            aria-label={t.close}
            className="btn-ghost w-12 text-xl"
          >
            ✕
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{t.title(s.template.name)}</div>
            <div className="text-xs text-muted">
              {t.progress(doneCount, items.length)} · {formatDuration(now - session.startedAt)}
            </div>
          </div>
          <Toggle
            on={s.settings.vibration}
            label={t.toggles.vibration}
            icon="📳"
            onClick={() => s.toggle('vibration')}
          />
          <Toggle
            on={s.settings.keepScreenOn}
            label={t.toggles.keepScreenOn}
            icon="🔆"
            onClick={() => s.toggle('keepScreenOn')}
          />
          <Toggle on={s.settings.sound} label={t.toggles.sound} icon="🔔" onClick={() => s.toggle('sound')} />
        </div>
        {s.view === 'exercise' && (
          <ol className="mt-2 flex gap-1" aria-label={t.progress(doneCount, items.length)}>
            {items.map((it, i) => (
              <li key={it.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => s.goTo(i)}
                  aria-label={`${i + 1}: ${displayName(s.exercises[exerciseIdFor(session, it)], it, t.warmupCardio)}`}
                  aria-current={i === index ? 'step' : undefined}
                  className="flex h-6 w-full items-center"
                >
                  <span
                    className={`h-2 w-full rounded-full ${
                      i === index
                        ? 'bg-accent'
                        : isDone(it)
                          ? 'bg-success'
                          : skipped.has(it.id)
                            ? 'bg-border/50'
                            : 'bg-border'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ol>
        )}
      </header>

      <main className={`flex-1 px-4 pt-4 ${s.view === 'exercise' ? (s.rest ? 'pb-56' : 'pb-28') : 'pb-8'}`}>
        {s.view === 'summary' ? (
          <Summary onSaved={() => navigate('/')} />
        ) : (
          item && (
            <ExerciseCard
              key={item.id}
              item={item}
              done={isDone(item)}
              nextName={
                nextItem && displayName(s.exercises[exerciseIdFor(session, nextItem)], nextItem, t.warmupCardio)
              }
              onNext={nextItem ? () => s.goTo(items.indexOf(nextItem)) : undefined}
              onFinish={() => s.showSummary(true)}
              onReorder={() => setReorderOpen(true)}
            />
          )
        )}
      </main>

      {s.view === 'exercise' && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-xl bg-bg/95 shadow-[0_-8px_24px_rgba(0,0,0,0.25)] backdrop-blur">
          <RestTimer />
          <nav className="flex gap-2 border-t border-border px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
            <button
              type="button"
              className="btn-secondary flex-1"
              disabled={index === 0}
              onClick={() => s.goTo(index - 1)}
            >
              ← {t.prev}
            </button>
            {last ? (
              <button type="button" className="btn-primary flex-[2]" onClick={() => s.showSummary(true)}>
                🏁 {t.finish}
              </button>
            ) : (
              <button
                type="button"
                className={`${isDone(item) ? 'btn-primary' : 'btn-secondary'} flex-[2]`}
                onClick={() => s.goTo(index + 1)}
              >
                {t.next} →
              </button>
            )}
          </nav>
        </div>
      )}

      <ReorderSheet
        open={reorderOpen}
        items={remaining.map((i) => ({
          id: i.id,
          name: displayName(s.exercises[exerciseIdFor(session, i)], i, t.warmupCardio),
        }))}
        onClose={() => setReorderOpen(false)}
        onSave={async (ids) => {
          await s.reorderRemaining(ids);
          setReorderOpen(false);
          s.goTo(items.length - ids.length);
        }}
      />

      <Sheet title={t.leave.title} open={leaveOpen} onClose={() => setLeaveOpen(false)}>
        <div className="space-y-2">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              setLeaveOpen(false);
              s.showSummary(true);
            }}
          >
            {t.leave.finish}
          </button>
          <button
            type="button"
            className="btn-secondary w-full text-danger"
            onClick={async () => {
              await s.abandon();
              navigate('/');
            }}
          >
            {t.leave.abandon}
          </button>
          <button type="button" className="btn-ghost w-full" onClick={() => setLeaveOpen(false)}>
            {t.leave.cont}
          </button>
        </div>
      </Sheet>
    </div>
  );
}

function Toggle({ on, label, icon, onClick }: { on: boolean; label: string; icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`relative flex h-12 w-11 items-center justify-center rounded-xl text-xl ${on ? '' : 'opacity-35 grayscale'}`}
    >
      {icon}
      {!on && <span className="absolute h-0.5 w-7 rotate-45 bg-danger" aria-hidden />}
    </button>
  );
}
