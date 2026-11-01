import Dexie, { type Table } from 'dexie';
import type {
  AppSettings,
  CardioLog,
  Exercise,
  MachineSettings,
  Session,
  SetLog,
  Template,
} from '../types';

/**
 * Schema-versie van de database én van het back-upformaat.
 *
 * Migratiepatroon: wijzig NOOIT een bestaande `db.version(n).stores(...)`.
 * Voeg een nieuwe `db.version(n+1).stores({...}).upgrade(tx => ...)` toe (alleen
 * gewijzigde tabellen hoeven vermeld), verhoog SCHEMA_VERSION en pas
 * `backup.ts` aan als oude back-ups omgezet moeten worden.
 */
export const SCHEMA_VERSION = 1;

export class BasicTrainerDB extends Dexie {
  exercises!: Table<Exercise, string>;
  machineSettings!: Table<MachineSettings, string>;
  templates!: Table<Template, string>;
  sessions!: Table<Session, string>;
  setLogs!: Table<SetLog, string>;
  cardioLogs!: Table<CardioLog, string>;
  settings!: Table<AppSettings, string>;

  constructor(name = 'basic-trainer') {
    super(name);
    this.version(1).stores({
      exercises: 'id, kind, isCustom',
      machineSettings: 'exerciseId',
      templates: 'id, order',
      sessions: 'id, templateId, status, startedAt',
      setLogs: 'id, sessionId, exerciseId, [exerciseId+completedAt]',
      cardioLogs: 'id, sessionId, exerciseId, [exerciseId+completedAt]',
      settings: 'id',
    });
    // Voorbeeld voor een volgende versie:
    // this.version(2).stores({ sessions: 'id, templateId, status, startedAt, endedAt' })
    //   .upgrade(async (tx) => { await tx.table('sessions').toCollection().modify(...); });
  }
}

export const db = new BasicTrainerDB();
