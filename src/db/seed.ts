import { SEED_EXERCISES, SEED_TEMPLATES } from '../content/seed.nl';
import { DEFAULT_SETTINGS } from '../types';
import { db } from './db';

/** Vult lege tabellen (exercises, templates, settings) met seed-data. Idempotent. */
export async function seedIfEmpty(): Promise<void> {
  await db.transaction('rw', db.exercises, db.templates, db.settings, async () => {
    if ((await db.exercises.count()) === 0) await db.exercises.bulkAdd(structuredClone(SEED_EXERCISES));
    if ((await db.templates.count()) === 0) await db.templates.bulkAdd(structuredClone(SEED_TEMPLATES));
    if (!(await db.settings.get('singleton'))) await db.settings.add({ ...DEFAULT_SETTINGS });
    // Aanvulling voor databases van vóór de spierkaart: muscleMap invullen bij seed-oefeningen.
    for (const seed of SEED_EXERCISES) {
      const existing = await db.exercises.get(seed.id);
      if (existing && !existing.muscleMap) {
        await db.exercises.update(seed.id, { muscleMap: structuredClone(seed.muscleMap) });
      }
    }
  });
}

/** Vraagt persistente opslag aan (voorkomt dat Android de data opruimt). Faalt stil. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      if (await navigator.storage.persisted?.()) return true;
      return await navigator.storage.persist();
    }
  } catch {
    /* niet ondersteund of geweigerd */
  }
  return false;
}

/** Eénmalig aanroepen bij app-start. */
export async function initDb(): Promise<void> {
  await seedIfEmpty();
  void requestPersistentStorage();
}
