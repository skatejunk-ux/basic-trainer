import Dexie, { type Table } from 'dexie';
import type {
  AppSettings,
  CardioLog,
  Exercise,
  MachineCode,
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
export const SCHEMA_VERSION = 2;

export class BasicTrainerDB extends Dexie {
  exercises!: Table<Exercise, string>;
  machineSettings!: Table<MachineSettings, string>;
  templates!: Table<Template, string>;
  sessions!: Table<Session, string>;
  setLogs!: Table<SetLog, string>;
  cardioLogs!: Table<CardioLog, string>;
  settings!: Table<AppSettings, string>;
  machineCodes!: Table<MachineCode, string>;

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
    // v2: gescande machinecodes (PLAN.md §12.1).
    this.version(2).stores({ machineCodes: 'code, exerciseId' });
  }
}

export const db = new BasicTrainerDB();
