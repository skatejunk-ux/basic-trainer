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
import { db, SCHEMA_VERSION } from './db';
import { updateSettings } from './repo';
import { seedIfEmpty } from './seed';

export interface Backup {
  schemaVersion: number;
  exportedAt: number;
  exercises: Exercise[];
  machineSettings: MachineSettings[];
  templates: Template[];
  sessions: Session[];
  setLogs: SetLog[];
  cardioLogs: CardioLog[];
  settings: AppSettings[];
  machineCodes: MachineCode[]; // sinds schemaVersion 2
}

export type ImportMode = 'replace' | 'merge';

export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupError';
  }
}

export async function exportBackup(): Promise<Backup> {
  return db.transaction('r', db.tables, async () => ({
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    exercises: await db.exercises.toArray(),
    machineSettings: await db.machineSettings.toArray(),
    templates: await db.templates.toArray(),
    sessions: await db.sessions.toArray(),
    setLogs: await db.setLogs.toArray(),
    cardioLogs: await db.cardioLogs.toArray(),
    settings: await db.settings.toArray(),
    machineCodes: await db.machineCodes.toArray(),
  }));
}

export function backupFileName(at = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `basic-trainer-backup-${at.getFullYear()}-${p(at.getMonth() + 1)}-${p(at.getDate())}.json`;
}

/** Deelt via de Web Share API (bestand) of valt terug op een download. Zet lastBackupAt bij succes. */
export async function shareOrDownloadBackup(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const backup = await exportBackup();
  const name = backupFileName(new Date(backup.exportedAt));
  const file = new File([JSON.stringify(backup, null, 2)], name, { type: 'application/json' });

  let result: 'shared' | 'downloaded' = 'downloaded';
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav?.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'Basic-Trainer back-up' });
      result = 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // andere fout: val terug op download
    }
  }
  if (result === 'downloaded') {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  await updateSettings({ lastBackupAt: backup.exportedAt });
  return result;
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Per tabel: controle van de vorm van één record. */
const recordChecks: Record<string, (r: Record<string, unknown>) => boolean> = {
  exercises: (r) =>
    isStr(r.id) &&
    isStr(r.name) &&
    isStr(r.pattern) &&
    (r.kind === 'strength' || r.kind === 'cardio') &&
    Array.isArray(r.settingFields) &&
    Array.isArray(r.setup) &&
    isStr(r.animationId),
  machineSettings: (r) => isStr(r.exerciseId) && isObj(r.values) && isNum(r.incrementKg),
  templates: (r) => isStr(r.id) && isStr(r.name) && Array.isArray(r.items) && isNum(r.order),
  sessions: (r) =>
    isStr(r.id) &&
    isStr(r.templateId) &&
    isNum(r.startedAt) &&
    (r.status === 'active' || r.status === 'done' || r.status === 'abandoned') &&
    Array.isArray(r.itemOrder),
  setLogs: (r) =>
    isStr(r.id) &&
    isStr(r.sessionId) &&
    isStr(r.exerciseId) &&
    isNum(r.weightKg) &&
    isNum(r.reps) &&
    isNum(r.completedAt),
  cardioLogs: (r) =>
    isStr(r.id) && isStr(r.sessionId) && isStr(r.exerciseId) && isNum(r.minutes) && isNum(r.completedAt),
  settings: (r) => r.id === 'singleton' && typeof r.vibration === 'boolean',
  machineCodes: (r) => isStr(r.code) && isStr(r.exerciseId) && isNum(r.linkedAt),
};

/** Valideert en geeft een Backup terug; gooit BackupError bij ongeldige invoer. */
export function parseBackup(input: string | unknown): Backup {
  let data: unknown = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input);
    } catch {
      throw new BackupError('Bestand is geen geldige JSON.');
    }
  }
  if (!isObj(data)) throw new BackupError('Ongeldig back-upbestand.');
  if (!isNum(data.schemaVersion) || !Number.isInteger(data.schemaVersion) || data.schemaVersion < 1) {
    throw new BackupError('Back-up mist een geldige schemaVersion.');
  }
  if (data.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError('Deze back-up is gemaakt met een nieuwere versie van de app.');
  }
  if (!isNum(data.exportedAt)) throw new BackupError('Back-up mist exportedAt.');
  // v1 → v2: machinecodes bestonden nog niet.
  if (data.schemaVersion < 2 && data.machineCodes === undefined) data = { ...data, machineCodes: [] };
  const rec = data as Record<string, unknown>;
  for (const [table, check] of Object.entries(recordChecks)) {
    const rows = rec[table];
    if (!Array.isArray(rows)) throw new BackupError(`Back-up mist tabel "${table}".`);
    rows.forEach((row, i) => {
      if (!isObj(row) || !check(row)) throw new BackupError(`Ongeldig record ${i} in tabel "${table}".`);
    });
  }
  return rec as unknown as Backup;
}

/**
 * Importeert een back-up. `replace` wist alles en vervangt het door de back-up;
 * `merge` voegt toe/overschrijft op id (primaire sleutel) en laat de lokale instellingen ongemoeid.
 */
export async function importBackup(input: string | unknown, mode: ImportMode): Promise<void> {
  const b = parseBackup(input);
  await db.transaction('rw', db.tables, async () => {
    if (mode === 'replace') {
      await Promise.all(db.tables.map((t) => t.clear()));
      await db.settings.bulkPut(b.settings);
    }
    await db.exercises.bulkPut(b.exercises);
    await db.machineSettings.bulkPut(b.machineSettings);
    await db.templates.bulkPut(b.templates);
    await db.sessions.bulkPut(b.sessions);
    await db.setLogs.bulkPut(b.setLogs);
    await db.cardioLogs.bulkPut(b.cardioLogs);
    await db.machineCodes.bulkPut(b.machineCodes);
  });
  await seedIfEmpty(); // zorgt voor een instellingenrij als de back-up er geen had
}
