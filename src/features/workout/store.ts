// Workout-state (Zustand). Elke wijziging wordt direct in IndexedDB opgeslagen (PLAN.md §6.2),
// zodat een herstart of vergrendeld scherm niets kwijtraakt.
import { create } from 'zustand';
import type {
  AppSettings,
  CardioLog,
  CardioPlan,
  Exercise,
  Feel,
  MachineSettings,
  Session,
  SetLog,
  Template,
  TemplateItem,
} from '../../types';
import { DEFAULT_SETTINGS } from '../../types';
import { suggestNext, type Suggestion } from '../../coach';
import {
  abandonSession,
  addCardioLog,
  addSetLog,
  createSession,
  db,
  deleteCardioLog,
  deleteSetLog,
  finishSession,
  getActiveSession,
  getSettings,
  listExercises,
  listMachineSettings,
  listTemplates,
  saveMachineSettings,
  seedIfEmpty,
  updateSession,
  updateSetLog,
  updateSettings,
} from '../../db';
import { applyRemainingOrder, exerciseIdFor, isItemDone, itemsInOrder, moveToEnd, type PlannedRow } from './plan';

export interface RestState {
  endAt: number;
  totalSec: number;
}

type ToggleKey = 'vibration' | 'sound' | 'keepScreenOn';

interface WorkoutState {
  status: 'idle' | 'loading' | 'ready' | 'none';
  view: 'exercise' | 'summary';
  session?: Session;
  template?: Template;
  exercises: Record<string, Exercise>;
  machineSettings: Record<string, MachineSettings>;
  /** Historie (zonder de huidige sessie) voor de coach en de samenvatting. */
  history: {
    setLogs: SetLog[];
    cardioLogs: CardioLog[];
    sessions: Session[];
    templates: Template[];
  };
  logs: SetLog[];
  cardio: CardioLog[];
  suggestions: Record<string, Suggestion>;
  index: number;
  rest: RestState | null;
  settings: AppSettings;

  init(): Promise<void>;
  start(templateId: string): Promise<void>;
  goTo(index: number): void;
  logSet(item: TemplateItem, row: PlannedRow, weightKg: number, reps: number, restSec: number): Promise<void>;
  setFeel(logId: string, feel: Feel): Promise<void>;
  undoSet(logId: string): Promise<void>;
  logCardio(item: TemplateItem, plan: CardioPlan): Promise<void>;
  undoCardio(logId: string): Promise<void>;
  moveLater(itemId: string): Promise<void>;
  setSkipped(itemId: string, skipped: boolean): Promise<void>;
  replaceExercise(itemId: string, exerciseId: string): Promise<void>;
  reorderRemaining(remaining: string[]): Promise<void>;
  saveSettingsFor(exerciseId: string, values: Record<string, string>): Promise<void>;
  startRest(sec: number): void;
  adjustRest(deltaSec: number): void;
  clearRest(): void;
  toggle(key: ToggleKey): Promise<void>;
  showSummary(show: boolean): void;
  finish(notes: string): Promise<void>;
  abandon(): Promise<void>;
}

const REST_KEY = 'bt-rest';

function saveRest(sessionId: string | undefined, rest: RestState | null) {
  try {
    if (rest && sessionId) localStorage.setItem(REST_KEY, JSON.stringify({ sessionId, ...rest }));
    else localStorage.removeItem(REST_KEY);
  } catch {
    /* opslag niet beschikbaar */
  }
}

function loadRest(sessionId: string): RestState | null {
  try {
    const raw = JSON.parse(localStorage.getItem(REST_KEY) ?? 'null') as (RestState & { sessionId: string }) | null;
    if (raw?.sessionId === sessionId && raw.endAt > Date.now()) return { endAt: raw.endAt, totalSec: raw.totalSec };
  } catch {
    /* negeren */
  }
  return null;
}

const empty = {
  session: undefined,
  template: undefined,
  logs: [],
  cardio: [],
  suggestions: {},
  index: 0,
  rest: null,
  view: 'exercise' as const,
};

export const useWorkout = create<WorkoutState>((set, get) => {
  function suggestionFor(
    item: TemplateItem,
    s: Pick<WorkoutState, 'session' | 'template' | 'exercises' | 'machineSettings' | 'history'>,
  ): Suggestion | undefined {
    if (!s.session || !s.template) return undefined;
    const exercise = s.exercises[exerciseIdFor(s.session, item)];
    if (!exercise) return undefined;
    const ms = s.machineSettings[exercise.id];
    return suggestNext({
      exercise,
      templateItem: item,
      setLogs: s.history.setLogs,
      cardioLogs: s.history.cardioLogs,
      sessions: s.history.sessions,
      templates: s.history.templates,
      machineSettings: ms,
      currentSessionId: s.session.id,
      // "Back Extension (met gewicht)" in Training B: op de bank minstens de pauze-variant.
      minBodyweightStage: exercise.bodyweightCapable && s.template.name === 'B' ? 'pause' : undefined,
    });
  }

  function recompute() {
    const s = get();
    if (!s.session || !s.template) return;
    const suggestions: Record<string, Suggestion> = {};
    for (const item of s.template.items) {
      const sug = suggestionFor(item, s);
      if (sug) suggestions[item.id] = sug;
    }
    set({ suggestions });
  }

  async function persistSession(changes: Partial<Session>) {
    const session = get().session;
    if (!session) return;
    const next = { ...session, ...changes };
    set({ session: next });
    await updateSession(session.id, changes);
  }

  async function load(session: Session) {
    const [templates, exercises, machine, allSets, allCardio, sessions, settings] = await Promise.all([
      listTemplates(),
      listExercises(),
      listMachineSettings(),
      db.setLogs.toArray(),
      db.cardioLogs.toArray(),
      db.sessions.toArray(),
      getSettings(),
    ]);
    const template = templates.find((t) => t.id === session.templateId);
    if (!template) {
      set({ status: 'none' });
      return;
    }
    const logs = allSets.filter((l) => l.sessionId === session.id).sort((a, b) => a.completedAt - b.completedAt);
    const cardio = allCardio.filter((l) => l.sessionId === session.id);
    set({
      status: 'ready',
      view: 'exercise',
      session,
      template,
      settings,
      exercises: Object.fromEntries(exercises.map((e) => [e.id, e])),
      machineSettings: Object.fromEntries(machine.map((m) => [m.exerciseId, m])),
      history: {
        setLogs: allSets.filter((l) => l.sessionId !== session.id),
        cardioLogs: allCardio.filter((l) => l.sessionId !== session.id),
        sessions,
        templates,
      },
      logs,
      cardio,
      rest: loadRest(session.id),
    });
    recompute();
    // Begin bij het eerste item dat nog niet af is (en niet overgeslagen).
    const items = itemsInOrder(session, template);
    const skipped = new Set(session.skippedItemIds ?? []);
    const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));
    const first = items.findIndex(
      (i) => !skipped.has(i.id) && !isItemDone(i, byId[exerciseIdFor(session, i)], logs, cardio),
    );
    set({ index: first === -1 ? Math.max(0, items.length - 1) : first });
  }

  return {
    status: 'idle',
    ...empty,
    exercises: {},
    machineSettings: {},
    history: { setLogs: [], cardioLogs: [], sessions: [], templates: [] },
    settings: { ...DEFAULT_SETTINGS },

    async init() {
      set({ status: 'loading' });
      await seedIfEmpty();
      const active = await getActiveSession();
      if (active) await load(active);
      else set({ status: 'none', ...empty });
    },

    async start(templateId) {
      set({ status: 'loading' });
      await seedIfEmpty();
      const existing = await getActiveSession();
      if (existing) return load(existing);
      const template = (await listTemplates()).find((t) => t.id === templateId);
      if (!template) return set({ status: 'none' });
      const session = await createSession(
        template.id,
        template.items.map((i) => i.id),
      );
      await load(session);
    },

    goTo(index) {
      set({ index, view: 'exercise' });
    },

    async logSet(item, row, weightKg, reps, restSec) {
      const s = get();
      if (!s.session) return;
      const exerciseId = exerciseIdFor(s.session, item);
      const log = await addSetLog({
        sessionId: s.session.id,
        exerciseId,
        templateItemId: item.id,
        setIndex: row.setIndex,
        isWarmup: row.isWarmup,
        ...(row.side ? { side: row.side } : {}),
        weightKg,
        reps,
        completedAt: Date.now(),
        settingsSnapshot: s.machineSettings[exerciseId]?.values,
      });
      set({ logs: [...get().logs, log] });
      get().startRest(restSec);
    },

    async setFeel(logId, feel) {
      await updateSetLog(logId, { feel });
      set({
        logs: get().logs.map((l) => (l.id === logId ? { ...l, feel } : l)),
      });
    },

    async undoSet(logId) {
      await deleteSetLog(logId);
      set({ logs: get().logs.filter((l) => l.id !== logId) });
    },

    async logCardio(item, plan) {
      const s = get();
      if (!s.session) return;
      const log = await addCardioLog({
        sessionId: s.session.id,
        exerciseId: exerciseIdFor(s.session, item),
        templateItemId: item.id,
        minutes: plan.minutes,
        inclinePct: plan.inclinePct,
        speedKmh: plan.speedKmh,
        completedAt: Date.now(),
      });
      set({ cardio: [...get().cardio, log] });
    },

    async undoCardio(logId) {
      await deleteCardioLog(logId);
      set({ cardio: get().cardio.filter((c) => c.id !== logId) });
    },

    async moveLater(itemId) {
      const session = get().session;
      if (!session) return;
      await persistSession({ itemOrder: moveToEnd(session.itemOrder, itemId) });
    },

    async setSkipped(itemId, skipped) {
      const session = get().session;
      if (!session) return;
      const current = new Set(session.skippedItemIds ?? []);
      if (skipped) current.add(itemId);
      else current.delete(itemId);
      const changes: Partial<Session> = { skippedItemIds: [...current] };
      // Overgeslagen items schuiven naar achteren, zodat je verder kunt met de volgende.
      if (skipped) changes.itemOrder = moveToEnd(session.itemOrder, itemId);
      await persistSession(changes);
    },

    async replaceExercise(itemId, exerciseId) {
      const session = get().session;
      if (!session) return;
      const overrides = { ...(session.exerciseOverrides ?? {}) };
      const original = get().template?.items.find((i) => i.id === itemId)?.exerciseId;
      if (exerciseId === original) delete overrides[itemId];
      else overrides[itemId] = exerciseId;
      await persistSession({ exerciseOverrides: overrides });
      recompute();
    },

    async reorderRemaining(remaining) {
      const session = get().session;
      if (!session) return;
      await persistSession({
        itemOrder: applyRemainingOrder(session.itemOrder, remaining),
      });
    },

    async saveSettingsFor(exerciseId, values) {
      const prev = get().machineSettings[exerciseId];
      const exercise = get().exercises[exerciseId];
      const saved = await saveMachineSettings({
        exerciseId,
        values,
        incrementKg: prev?.incrementKg ?? exercise?.defaultIncrementKg ?? 2.5,
        ...(prev?.notes ? { notes: prev.notes } : {}),
      });
      set({
        machineSettings: { ...get().machineSettings, [exerciseId]: saved },
      });
      recompute();
    },

    startRest(sec) {
      const rest = { endAt: Date.now() + sec * 1000, totalSec: sec };
      set({ rest });
      saveRest(get().session?.id, rest);
    },

    adjustRest(delta) {
      const rest = get().rest;
      if (!rest) return;
      const next = {
        endAt: Math.max(Date.now(), rest.endAt + delta * 1000),
        totalSec: Math.max(1, rest.totalSec + delta),
      };
      set({ rest: next });
      saveRest(get().session?.id, next);
    },

    clearRest() {
      set({ rest: null });
      saveRest(undefined, null);
    },

    async toggle(key) {
      const settings = await updateSettings({ [key]: !get().settings[key] });
      set({ settings });
    },

    showSummary(show) {
      set({ view: show ? 'summary' : 'exercise' });
    },

    async finish(notes) {
      const session = get().session;
      if (!session) return;
      await finishSession(session.id, notes.trim() || undefined);
      get().clearRest();
      set({ status: 'none', ...empty });
    },

    async abandon() {
      const session = get().session;
      if (!session) return;
      await abandonSession(session.id);
      get().clearRest();
      set({ status: 'none', ...empty });
    },
  };
});
