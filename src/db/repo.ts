import type {
  AppSettings,
  CardioLog,
  Exercise,
  MachineSettings,
  Session,
  SetLog,
  Template,
  TemplateItem,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { db } from './db';

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- exercises ----------
export const listExercises = (): Promise<Exercise[]> => db.exercises.toArray();
export const getExercise = (id: string): Promise<Exercise | undefined> => db.exercises.get(id);
export async function createExercise(e: Omit<Exercise, 'id'> & { id?: string }): Promise<Exercise> {
  const ex: Exercise = { ...e, id: e.id ?? newId() };
  await db.exercises.add(ex);
  return ex;
}
export async function updateExercise(id: string, changes: Partial<Omit<Exercise, 'id'>>): Promise<void> {
  await db.exercises.update(id, changes);
}
export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id);
}

// ---------- machine settings ----------
export const getMachineSettings = (exerciseId: string): Promise<MachineSettings | undefined> =>
  db.machineSettings.get(exerciseId);
export async function saveMachineSettings(
  s: Omit<MachineSettings, 'updatedAt'> & { updatedAt?: number },
): Promise<MachineSettings> {
  const full: MachineSettings = { ...s, updatedAt: s.updatedAt ?? Date.now() };
  await db.machineSettings.put(full);
  return full;
}
export const listMachineSettings = (): Promise<MachineSettings[]> => db.machineSettings.toArray();

// ---------- templates ----------
export const listTemplates = async (): Promise<Template[]> => db.templates.orderBy('order').toArray();
export const getTemplate = (id: string): Promise<Template | undefined> => db.templates.get(id);
export async function createTemplate(
  t: Omit<Template, 'id' | 'order'> & { id?: string; order?: number },
): Promise<Template> {
  const order = t.order ?? (await db.templates.count());
  const tpl: Template = { ...t, id: t.id ?? newId(), order };
  await db.templates.add(tpl);
  return tpl;
}
export async function updateTemplate(id: string, changes: Partial<Omit<Template, 'id'>>): Promise<void> {
  await db.templates.update(id, changes);
}
export async function deleteTemplate(id: string): Promise<void> {
  await db.templates.delete(id);
}
/** Zet de items van een template in de volgorde van `orderedItemIds`. Onbekende ids worden genegeerd, ontbrekende items achteraan gezet. */
export async function reorderTemplateItems(templateId: string, orderedItemIds: string[]): Promise<Template> {
  return db.transaction('rw', db.templates, async () => {
    const tpl = await db.templates.get(templateId);
    if (!tpl) throw new Error(`Template ${templateId} bestaat niet`);
    const byId = new Map(tpl.items.map((i) => [i.id, i]));
    const items: TemplateItem[] = [];
    for (const id of orderedItemIds) {
      const it = byId.get(id);
      if (it) {
        items.push(it);
        byId.delete(id);
      }
    }
    items.push(...byId.values());
    const next = { ...tpl, items };
    await db.templates.put(next);
    return next;
  });
}

// ---------- sessions ----------
export async function createSession(
  templateId: string,
  itemOrder: string[],
  startedAt = Date.now(),
): Promise<Session> {
  const s: Session = { id: newId(), templateId, startedAt, status: 'active', itemOrder };
  await db.sessions.add(s);
  return s;
}
export const getSession = (id: string): Promise<Session | undefined> => db.sessions.get(id);
export async function getActiveSession(): Promise<Session | undefined> {
  const active = await db.sessions.where('status').equals('active').sortBy('startedAt');
  return active[active.length - 1];
}
export async function updateSession(id: string, changes: Partial<Omit<Session, 'id'>>): Promise<void> {
  await db.sessions.update(id, changes);
}
export async function finishSession(id: string, notes?: string, endedAt = Date.now()): Promise<void> {
  await db.sessions.update(id, { status: 'done', endedAt, ...(notes !== undefined ? { notes } : {}) });
}
export async function abandonSession(id: string, endedAt = Date.now()): Promise<void> {
  await db.sessions.update(id, { status: 'abandoned', endedAt });
}
/** Sessies, nieuwste eerst. */
export async function listSessions(opts: { status?: Session['status']; limit?: number } = {}): Promise<Session[]> {
  let all = await db.sessions.orderBy('startedAt').reverse().toArray();
  if (opts.status) all = all.filter((s) => s.status === opts.status);
  return opts.limit ? all.slice(0, opts.limit) : all;
}
/** Verwijdert sessie inclusief bijbehorende setLogs en cardioLogs. */
export async function deleteSession(id: string): Promise<void> {
  await db.transaction('rw', db.sessions, db.setLogs, db.cardioLogs, async () => {
    await db.setLogs.where('sessionId').equals(id).delete();
    await db.cardioLogs.where('sessionId').equals(id).delete();
    await db.sessions.delete(id);
  });
}
/** Laatste afgeronde sessie per template (voor de coach: volgende template). */
export async function getLastSessionPerTemplate(): Promise<Record<string, Session>> {
  const done = await db.sessions.where('status').equals('done').toArray();
  const out: Record<string, Session> = {};
  for (const s of done) {
    const cur = out[s.templateId];
    if (!cur || s.startedAt > cur.startedAt) out[s.templateId] = s;
  }
  return out;
}

// ---------- set logs ----------
export async function addSetLog(l: Omit<SetLog, 'id'> & { id?: string }): Promise<SetLog> {
  const log: SetLog = { ...l, id: l.id ?? newId() };
  await db.setLogs.add(log);
  return log;
}
export async function updateSetLog(id: string, changes: Partial<Omit<SetLog, 'id'>>): Promise<void> {
  await db.setLogs.update(id, changes);
}
export async function deleteSetLog(id: string): Promise<void> {
  await db.setLogs.delete(id);
}
export async function listSetLogsBySession(sessionId: string): Promise<SetLog[]> {
  const logs = await db.setLogs.where('sessionId').equals(sessionId).toArray();
  return logs.sort((a, b) => a.completedAt - b.completedAt);
}
/** Alle sets van een oefening, oudste eerst. */
export async function listSetLogsByExercise(exerciseId: string): Promise<SetLog[]> {
  return db.setLogs
    .where('[exerciseId+completedAt]')
    .between([exerciseId, Dexie_MIN], [exerciseId, Dexie_MAX])
    .toArray();
}

// ---------- cardio logs ----------
export async function addCardioLog(l: Omit<CardioLog, 'id'> & { id?: string }): Promise<CardioLog> {
  const log: CardioLog = { ...l, id: l.id ?? newId() };
  await db.cardioLogs.add(log);
  return log;
}
export async function updateCardioLog(id: string, changes: Partial<Omit<CardioLog, 'id'>>): Promise<void> {
  await db.cardioLogs.update(id, changes);
}
export async function deleteCardioLog(id: string): Promise<void> {
  await db.cardioLogs.delete(id);
}
export const listCardioLogsBySession = (sessionId: string): Promise<CardioLog[]> =>
  db.cardioLogs.where('sessionId').equals(sessionId).toArray();
export async function listCardioLogsByExercise(exerciseId: string): Promise<CardioLog[]> {
  return db.cardioLogs
    .where('[exerciseId+completedAt]')
    .between([exerciseId, Dexie_MIN], [exerciseId, Dexie_MAX])
    .toArray();
}

// ---------- app settings ----------
export async function getSettings(): Promise<AppSettings> {
  return (await db.settings.get('singleton')) ?? { ...DEFAULT_SETTINGS };
}
export async function updateSettings(changes: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings> {
  const next: AppSettings = { ...(await getSettings()), ...changes, id: 'singleton' };
  await db.settings.put(next);
  return next;
}

const Dexie_MIN = -Infinity;
const Dexie_MAX = Infinity;
