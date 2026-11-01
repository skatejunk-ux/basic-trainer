// Eén oefening in de workout-modus: spierkaart, instellingen, suggestie, sets en acties (PLAN.md §6.2).
import { useEffect, useState } from 'react';
import type { TemplateItem } from '../../types';
import { BACK_EXTENSION_TYPE_KEY } from '../../types';
import { backExtensionType, coachText, DEFAULT_CARDIO_PLAN, formatKg, resolveIncrement } from '../../coach';
import { Icon, type IconName } from '../../components/Icon';
import { nl } from '../../content/nl';
import { MuscleMap } from '../../illustration/MuscleMap';
import { MiniCartoon } from '../../animation/MachineCartoon';
import { Sheet } from '../../components/Sheet';
import { ExerciseInstructions, SettingsForm, settingChip } from '../../components/exercise/ExerciseInfo';
import { CardioCard } from './CardioCard';
import { buildRows, displayName, exerciseIdFor, formatPrevious, logForRow, restAfter } from './plan';
import { SetRow } from './SetRows';
import { useWorkout } from './store';

const t = nl.workout;

interface Props {
  item: TemplateItem;
  done: boolean;
  nextName?: string;
  onNext?: () => void;
  onFinish: () => void;
  onReorder: () => void;
}

export function ExerciseCard({ item, done, nextName, onNext, onFinish, onReorder }: Props) {
  const s = useWorkout();
  const [showHow, setShowHow] = useState(false);
  const [editSettings, setEditSettings] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  // Nieuwe oefening in beeld (ook na "machine bezet"): begin bovenaan.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  if (!s.session) return null;

  const exercise = s.exercises[exerciseIdFor(s.session, item)];
  const sug = s.suggestions[item.id];
  if (!exercise || !sug) return null;

  const ms = s.machineSettings[exercise.id];
  const skipped = s.session.skippedItemIds?.includes(item.id) ?? false;
  const isCardio = exercise.kind === 'cardio';
  const step = resolveIncrement(exercise, ms);
  const bench = exercise.bodyweightCapable && backExtensionType(exercise, ms) === 'bench';
  const chips = exercise.settingFields
    .filter((f) => ms?.values[f.key])
    .map((f) => settingChip(f.label, f.key, ms!.values[f.key]));
  const previous = formatPrevious(sug.previous);
  const replaceable = Object.values(s.exercises).filter((e) => e.kind === exercise.kind);

  return (
    <article className="space-y-4" data-item={item.id} data-exercise-id={exercise.id}>
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setShowHow(true)}
          aria-label={`${t.howTo}: ${exercise.name}`}
          className="card flex shrink-0 items-center gap-1 p-1"
        >
          <MuscleMap map={exercise.muscleMap} size="xs" showLegend={false} />
          <MiniCartoon exercise={exercise} sceneId={bench ? 'back-extension-bench' : undefined} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-tight">{displayName(exercise, item, t.warmupCardio)}</h2>
          <p className="mt-1 text-sm text-muted">
            {isCardio
              ? `${item.cardio?.minutes ?? DEFAULT_CARDIO_PLAN.minutes} min`
              : `${item.sets} × ${item.repMin}–${item.repMax}${exercise.unilateral ? ' per been' : ''} · rust ${item.restSec} s`}
          </p>
          <button
            type="button"
            onClick={() => setShowHow(true)}
            className="mt-1 inline-flex min-h-[36px] items-center gap-1.5 text-sm font-semibold text-accent"
          >
            <Icon name="info" className="h-4 w-4" /> {t.howTo}
          </button>
        </div>
      </header>

      {!isCardio && (
        <button
          type="button"
          onClick={() => setEditSettings(true)}
          className="flex w-full flex-wrap items-center gap-2 text-left"
          aria-label={t.settings}
        >
          {chips.length ? (
            chips.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))
          ) : (
            <span className="chip text-muted">{t.settingsEmpty}</span>
          )}
          <span className="chip text-muted">{t.step(formatKg(step))}</span>
          <Icon name="pencil" className="h-4 w-4 text-muted" />
        </button>
      )}

      {sug.needsChoice === 'back-extension-type' ? (
        <div className="card border-accent/50 bg-accent/10 p-4">
          <p className="mb-3 font-semibold">{t.chooseType}</p>
          <div className="flex gap-2">
            {(['machine', 'bench'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className="btn-primary flex-1"
                onClick={() =>
                  s.saveSettingsFor(exercise.id, {
                    ...(ms?.values ?? {}),
                    [BACK_EXTENSION_TYPE_KEY]: type,
                  })
                }
              >
                {type === 'machine' ? t.typeMachine : t.typeBench}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card flex gap-3 p-3 text-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Icon name="sparkles" className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 self-center">
            <p className="font-medium">{sug.reason}</p>
            {bench && sug.bodyweightStage && sug.bodyweightStage !== 'reps' && (
              <p className="mt-1 font-semibold text-accent">
                {t.tempoTitle}: {coachText.bodyweightStageLabel(sug.bodyweightStage)}
              </p>
            )}
            {previous && (
              <p className="mt-1 text-muted">
                {t.previous}: {previous}
              </p>
            )}
          </div>
        </div>
      )}

      {skipped ? (
        <div className="rounded-2xl border border-dashed border-border p-4 text-center">
          <p className="mb-3 text-muted">{t.skipped}</p>
          <button type="button" className="btn-secondary" onClick={() => s.setSkipped(item.id, false)}>
            {t.unskip}
          </button>
        </div>
      ) : isCardio ? (
        <CardioCard
          key={`${item.id}-${exercise.id}`}
          plan={sug.cardio ?? item.cardio ?? DEFAULT_CARDIO_PLAN}
          log={s.cardio.find((c) => c.templateItemId === item.id)}
          vibration={s.settings.vibration}
          sound={s.settings.sound}
          onLog={(plan) => s.logCardio(item, plan)}
          onUndo={s.undoCardio}
        />
      ) : (
        !sug.needsChoice && (
          <ul className="space-y-2" key={`${item.id}-${exercise.id}-${sug.weightKg}`}>
            {buildRows(item, exercise, sug, bench).map((row) => {
              // Nog leeg (eerste keer)? Neem het gewicht van de laatst gelogde werkset over.
              const lastWork = [...s.logs]
                .reverse()
                .find((l) => l.templateItemId === item.id && !l.isWarmup && l.side === row.side);
              const prefilled =
                row.weightKg === null && !row.isWarmup && lastWork ? { ...row, weightKg: lastWork.weightKg } : row;
              return (
                <SetRow
                  key={`${row.key}-${prefilled.weightKg ?? ''}`}
                  row={prefilled}
                  log={logForRow(s.logs, item.id, row)}
                  step={step}
                  allowZero={exercise.bodyweightCapable}
                  soundEnabled={s.settings.sound}
                  onDone={(w, r) => s.logSet(item, row, w, r, restAfter(item, row, exercise.unilateral, sug.startSide))}
                  onUndo={s.undoSet}
                  onFeel={s.setFeel}
                />
              );
            })}
          </ul>
        )
      )}

      {done && (
        <button
          type="button"
          onClick={onNext ?? onFinish}
          className="flex w-full items-center gap-3 rounded-2xl bg-success px-4 py-3 text-left font-semibold text-bg active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg/15">
            <Icon name="check" className="h-5 w-5" strokeWidth={3} />
          </span>
          <span className="flex-1">
            <span className="block">{t.exerciseDone}</span>
            <span className="block text-sm font-medium opacity-80">{nextName ? t.upNext(nextName) : t.allDone}</span>
          </span>
          <Icon name="arrow-right" className="h-5 w-5" />
        </button>
      )}

      <div className="grid grid-cols-4 gap-2 pt-2">
        <Action icon="hourglass" label={t.busy} onClick={() => s.moveLater(item.id)} />
        {skipped ? (
          <span />
        ) : (
          <Action icon="skip-forward" label={t.skip} onClick={() => s.setSkipped(item.id, true)} />
        )}
        <Action icon="swap" label={t.replace} onClick={() => setReplaceOpen(true)} />
        <Action icon="arrow-up-down" label={t.reorder} onClick={onReorder} />
      </div>

      <Sheet title={exercise.name} open={showHow} onClose={() => setShowHow(false)}>
        <MuscleMap map={exercise.muscleMap} size="lg" extraLabel={isCardio ? `${nl.muscles.cardio} ❤️` : undefined} />
        <ExerciseInstructions exercise={exercise} />
      </Sheet>

      <Sheet title={`${t.settings} – ${exercise.name}`} open={editSettings} onClose={() => setEditSettings(false)}>
        <SettingsForm
          key={String(editSettings)}
          fields={exercise.settingFields}
          values={ms?.values ?? {}}
          onCancel={() => setEditSettings(false)}
          onSave={async (values) => {
            await s.saveSettingsFor(exercise.id, values);
            setEditSettings(false);
          }}
        />
      </Sheet>

      <Sheet title={t.replaceTitle} open={replaceOpen} onClose={() => setReplaceOpen(false)}>
        <ul className="space-y-2">
          {replaceable.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                className={`btn-secondary w-full justify-start ${e.id === exercise.id ? 'border-accent' : ''}`}
                onClick={async () => {
                  await s.replaceExercise(item.id, e.id);
                  setReplaceOpen(false);
                }}
              >
                {e.name}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </article>
  );
}

/** Secundaire actie onder een oefening: icoon met klein label, rustig zodat de sets de aandacht houden. */
function Action({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-center text-[11px] font-medium leading-tight text-muted active:bg-surface-2"
    >
      <Icon name={icon} className="h-5 w-5" />
      {label}
    </button>
  );
}
