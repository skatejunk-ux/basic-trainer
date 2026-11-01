import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { SEED_EXERCISES } from '../content/seed.nl';
import {
  BackupError,
  addCardioLog,
  addSetLog,
  createSession,
  db,
  deleteSession,
  exportBackup,
  finishSession,
  getLastSessionPerTemplate,
  getSettings,
  importBackup,
  linkMachineCode,
  listMachineCodesByExercise,
  unlinkMachineCode,
  getMachineCode,
  createExercise,
  deleteExercise,
  listCardioLogsBySession,
  listExercises,
  listSetLogsByExercise,
  listSetLogsBySession,
  listTemplates,
  reorderTemplateItems,
  saveMachineSettings,
  seedIfEmpty,
  updateSettings,
} from './index';

async function wipe() {
  await Promise.all(db.tables.map((t) => t.clear()));
}

const set = (sessionId: string, exerciseId: string, completedAt: number, weightKg = 50) => ({
  sessionId,
  exerciseId,
  templateItemId: 'a-1',
  setIndex: 0,
  isWarmup: false,
  weightKg,
  reps: 8,
  completedAt,
});

beforeEach(async () => {
  await wipe();
  await seedIfEmpty();
});

describe('seed', () => {
  it('vult later toegevoegde seed-oefeningen aan zonder bestaande te overschrijven', async () => {
    await db.exercises.delete('leg-curl');
    await db.exercises.update('leg-press', { name: 'Mijn Leg Press' });
    await seedIfEmpty();
    expect(await db.exercises.get('leg-curl')).toBeDefined();
    expect((await db.exercises.get('leg-press'))?.name).toBe('Mijn Leg Press');
  });

  it('is idempotent', async () => {
    await seedIfEmpty();
    await seedIfEmpty();
    expect(await db.exercises.count()).toBe(SEED_EXERCISES.length);
    expect(await db.templates.count()).toBe(2);
    expect(await db.settings.count()).toBe(1);
  });

  it('bevat de 18 oefeningen met animatie-ids', async () => {
    const ex = await listExercises();
    expect(ex.map((e) => e.id).sort()).toEqual(
      [
        'ab-crunch',
        'abductor',
        'adductor',
        'arm-curl',
        'arm-extension',
        'back-extension',
        'cable-row',
        'calf-press',
        'chest-press',
        'lat-pulldown',
        'leg-curl',
        'leg-extension',
        'leg-press',
        'pec-fly',
        'rear-delt',
        'shoulder-press',
        'single-leg-press',
        'treadmill',
      ],
    );
    expect(SEED_EXERCISES.find((e) => e.id === 'treadmill')?.animationId).toBe('treadmill-walk');
    expect(SEED_EXERCISES.find((e) => e.id === 'single-leg-press')?.unilateral).toBe(true);
    expect(SEED_EXERCISES.find((e) => e.id === 'back-extension')?.bodyweightCapable).toBe(true);
  });

  it('templates A en B komen overeen met PLAN.md par. 3', async () => {
    const [a, b] = await listTemplates();
    const rows = (t: typeof a) => t.items.map((i) => [i.exerciseId, i.sets, i.repMin, i.repMax, i.restSec]);
    expect(a.name).toBe('A');
    expect(rows(a)).toEqual([
      ['treadmill', 1, 1, 1, 0],
      ['leg-press', 3, 6, 8, 120],
      ['back-extension', 3, 10, 12, 90],
      ['chest-press', 3, 6, 8, 120],
      ['lat-pulldown', 3, 6, 8, 120],
      ['shoulder-press', 2, 10, 12, 90],
      ['cable-row', 2, 10, 12, 90],
      ['treadmill', 1, 1, 1, 0],
    ]);
    expect(b.name).toBe('B');
    expect(rows(b)).toEqual([
      ['treadmill', 1, 1, 1, 0],
      ['single-leg-press', 3, 10, 12, 90],
      ['back-extension', 3, 8, 10, 90],
      ['shoulder-press', 3, 6, 8, 120],
      ['cable-row', 3, 6, 8, 120],
      ['chest-press', 2, 10, 12, 90],
      ['lat-pulldown', 2, 10, 12, 90],
      ['treadmill', 1, 1, 1, 0],
    ]);
    for (const t of [a, b]) {
      expect(t.items[0].cardio).toMatchObject({ minutes: 5 });
      expect(t.items[7].cardio).toEqual({ minutes: 30, inclinePct: 12, speedKmh: 4.8 });
    }
  });

  it('heeft standaard instellingen', async () => {
    expect(await getSettings()).toMatchObject({ vibration: true, sound: true, keepScreenOn: true, weekGoal: 3 });
  });
});

describe('repo', () => {
  it('verwijdert een sessie met cascade', async () => {
    const s1 = await createSession('template-a', ['a-1']);
    const s2 = await createSession('template-b', ['b-1']);
    await addSetLog(set(s1.id, 'leg-press', 1));
    await addSetLog(set(s1.id, 'leg-press', 2));
    await addSetLog(set(s2.id, 'leg-press', 3));
    await addCardioLog({ sessionId: s1.id, exerciseId: 'treadmill', minutes: 30, inclinePct: 12, speedKmh: 4.8, completedAt: 4 });
    await deleteSession(s1.id);
    expect(await db.sessions.get(s1.id)).toBeUndefined();
    expect(await listSetLogsBySession(s1.id)).toHaveLength(0);
    expect(await listCardioLogsBySession(s1.id)).toHaveLength(0);
    expect(await listSetLogsBySession(s2.id)).toHaveLength(1);
  });

  it('listSetLogsByExercise sorteert op completedAt', async () => {
    await addSetLog(set('s', 'leg-press', 30));
    await addSetLog(set('s', 'leg-press', 10));
    await addSetLog(set('s', 'chest-press', 20));
    expect((await listSetLogsByExercise('leg-press')).map((l) => l.completedAt)).toEqual([10, 30]);
  });

  it('getLastSessionPerTemplate geeft laatste afgeronde sessie', async () => {
    const s1 = await createSession('template-a', [], 100);
    const s2 = await createSession('template-a', [], 200);
    await createSession('template-b', [], 300); // actief, telt niet
    await finishSession(s1.id);
    await finishSession(s2.id);
    const last = await getLastSessionPerTemplate();
    expect(last['template-a'].id).toBe(s2.id);
    expect(last['template-b']).toBeUndefined();
  });

  it('reorderTemplateItems', async () => {
    const [a] = await listTemplates();
    const ids = a.items.map((i) => i.id);
    const next = await reorderTemplateItems(a.id, [...ids].reverse());
    expect(next.items.map((i) => i.id)).toEqual([...ids].reverse());
  });
});

describe('machinecodes', () => {
  it('koppelt, overschrijft en ontkoppelt', async () => {
    await linkMachineCode('abc', 'leg-press');
    await linkMachineCode('abc', 'chest-press', 'qr_code');
    expect(await getMachineCode('abc')).toMatchObject({ exerciseId: 'chest-press', format: 'qr_code' });
    expect(await listMachineCodesByExercise('leg-press')).toHaveLength(0);
    await unlinkMachineCode('abc');
    expect(await getMachineCode('abc')).toBeUndefined();
  });

  it('verwijdert codes mee met een eigen oefening', async () => {
    const e = await createExercise({ ...SEED_EXERCISES[0], name: 'Eigen', isCustom: true, id: 'eigen' });
    await linkMachineCode('xyz', e.id);
    await deleteExercise(e.id);
    expect(await getMachineCode('xyz')).toBeUndefined();
  });
});

describe('backup', () => {
  async function fill() {
    const s = await createSession('template-a', ['a-1']);
    await addSetLog(set(s.id, 'leg-press', 5, 60));
    await finishSession(s.id, 'top');
    await saveMachineSettings({ exerciseId: 'back-extension', values: { type: 'bench' }, incrementKg: 5 });
    await updateSettings({ theme: 'light', lastBackupAt: 42 });
    await linkMachineCode('TG-123', 'leg-press', 'qr_code');
    return s;
  }

  it('round-trip met replace', async () => {
    await fill();
    const json = JSON.stringify(await exportBackup());
    await wipe();
    await importBackup(json, 'replace');
    const again = await exportBackup();
    const orig = JSON.parse(json);
    expect({ ...again, exportedAt: 0 }).toEqual({ ...orig, exportedAt: 0 });
    expect(orig.schemaVersion).toBe(2);
    expect(orig.machineCodes).toEqual([expect.objectContaining({ code: 'TG-123', exerciseId: 'leg-press' })]);
  });

  it('replace wist bestaande data', async () => {
    const backup = await exportBackup();
    const extra = await createSession('template-b', []);
    await importBackup(backup, 'replace');
    expect(await db.sessions.get(extra.id)).toBeUndefined();
  });

  it('merge behoudt lokale data en voegt toe op id', async () => {
    const s = await fill();
    const backup = await exportBackup();
    const local = await createSession('template-b', []);
    await db.setLogs.clear();
    await importBackup(backup, 'merge');
    expect(await db.sessions.get(local.id)).toBeDefined();
    expect(await db.sessions.get(s.id)).toBeDefined();
    expect(await listSetLogsBySession(s.id)).toHaveLength(1);
    expect(await db.sessions.count()).toBe(2);
    // dubbel importeren maakt geen duplicaten
    await importBackup(backup, 'merge');
    expect(await db.sessions.count()).toBe(2);
    expect(await db.exercises.count()).toBe(SEED_EXERCISES.length);
  });

  it('zet een v1-back-up (zonder machinecodes) om', async () => {
    await fill();
    const { machineCodes: _drop, ...v1 } = { ...(await exportBackup()), schemaVersion: 1 };
    await importBackup(v1, 'replace');
    expect(await db.machineCodes.count()).toBe(0);
    expect(await db.sessions.count()).toBe(1);
  });

  it('weigert ongeldige invoer', async () => {
    const good = await exportBackup();
    const bad: unknown[] = [
      'geen json',
      '[]',
      { ...good, schemaVersion: undefined },
      { ...good, schemaVersion: 999 },
      { ...good, sessions: undefined },
      { ...good, setLogs: [{ id: 'x' }] },
      { ...good, machineCodes: [{ code: 1 }] },
    ];
    await fill();
    const before = await db.sessions.count();
    for (const b of bad) {
      await expect(importBackup(b, 'replace')).rejects.toBeInstanceOf(BackupError);
    }
    expect(await db.sessions.count()).toBe(before);
  });
});
