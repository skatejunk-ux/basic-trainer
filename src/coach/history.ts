// Historie ordenen voor de coach: werksets per sessie, gesplitst per rep-range-bucket.
import type { CardioLog, Session, SetLog, Template, TemplateItem } from '../types';
import { estimate1RM } from './math';
import type { Side } from './types';

export interface RepRange {
  repMin: number;
  repMax: number;
}

/** Werksets van één oefening in één sessie, binnen één rep-range-bucket. */
export interface SessionSets {
  sessionId: string;
  time: number;
  sets: SetLog[];
  /** Rep-range waarmee deze sets gelogd zijn (null = onbekend, bv. template-item verwijderd). */
  range: RepRange | null;
}

export interface BucketedHistory {
  /** Zelfde (oefening, rep-range): nieuwste eerst. */
  same: SessionSets[];
  /** Andere of onbekende rep-range: nieuwste eerst. */
  other: SessionSets[];
}

export const bucketKey = (r: RepRange) => `${r.repMin}-${r.repMax}`;

function indexTemplateItems(templates: Template[] | undefined): Map<string, TemplateItem> {
  const map = new Map<string, TemplateItem>();
  for (const t of templates ?? []) for (const item of t.items) map.set(item.id, item);
  return map;
}

/** Sessies die niet als "vorige keer" mogen tellen: afgebroken en de huidige. */
function excludedSessionIds(sessions: Session[] | undefined, currentSessionId?: string): Set<string> {
  const ids = new Set<string>();
  for (const s of sessions ?? []) if (s.status === 'abandoned') ids.add(s.id);
  if (currentSessionId) ids.add(currentSessionId);
  return ids;
}

function sessionTimes(sessions: Session[] | undefined): Map<string, number> {
  return new Map((sessions ?? []).map((s) => [s.id, s.startedAt]));
}

const byNewest = (a: { time: number }, b: { time: number }) => b.time - a.time;

/**
 * Werksets (geen opwarmsets) van `templateItem.exerciseId`, per sessie en per bucket.
 * Sessietijd = Session.startedAt, of anders de vroegste completedAt van de sets.
 */
export function bucketHistory(
  setLogs: SetLog[],
  templateItem: TemplateItem,
  opts: { sessions?: Session[]; templates?: Template[]; currentSessionId?: string; exerciseId?: string },
): BucketedHistory {
  const exerciseId = opts.exerciseId ?? templateItem.exerciseId;
  const items = indexTemplateItems(opts.templates);
  const excluded = excludedSessionIds(opts.sessions, opts.currentSessionId);
  const times = sessionTimes(opts.sessions);
  const own: RepRange = { repMin: templateItem.repMin, repMax: templateItem.repMax };
  const ownKey = bucketKey(own);

  const groups = new Map<string, SessionSets>();
  for (const log of setLogs) {
    if (log.exerciseId !== exerciseId || log.isWarmup || excluded.has(log.sessionId)) continue;
    const item = log.templateItemId === templateItem.id ? templateItem : items.get(log.templateItemId);
    const range: RepRange | null = item ? { repMin: item.repMin, repMax: item.repMax } : null;
    const key = `${log.sessionId}|${range ? bucketKey(range) : '?'}`;
    let g = groups.get(key);
    if (!g) {
      g = { sessionId: log.sessionId, time: Number.POSITIVE_INFINITY, sets: [], range };
      groups.set(key, g);
    }
    g.sets.push(log);
    g.time = Math.min(g.time, log.completedAt);
  }

  const same: SessionSets[] = [];
  const other: SessionSets[] = [];
  for (const g of groups.values()) {
    g.time = times.get(g.sessionId) ?? g.time;
    g.sets.sort((a, b) => a.setIndex - b.setIndex || a.completedAt - b.completedAt);
    (g.range && bucketKey(g.range) === ownKey ? same : other).push(g);
  }
  same.sort(byNewest);
  other.sort(byNewest);
  return { same, other };
}

/** Sets voor één been; sets zonder `side` tellen voor beide benen. */
export function forSide(history: SessionSets[], side: Side): SessionSets[] {
  return history
    .map((g) => ({ ...g, sets: g.sets.filter((s) => s.side === undefined || s.side === side) }))
    .filter((g) => g.sets.length > 0);
}

export interface SessionAnalysis {
  topWeight: number;
  /** Alle vereiste sets op het topgewicht met ≥ repMax reps. */
  allTop: boolean;
  /** Er zijn minder sets gedaan dan het template vraagt. */
  incomplete: boolean;
  /** Minstens één set onder repMin. */
  anyBelow: boolean;
  /** Minstens één set gevoel 'zwaar'. */
  hard: boolean;
  /** Laagste aantal reps op het topgewicht. */
  minRepsAtTop: number;
  /** Reps van de sets op het topgewicht (voor "3×8 @ 60 kg"). */
  repsAtTop: number[];
  /** Hoogste Epley-1RM van de sessie. */
  best1RM: number;
}

export function analyzeSession(g: SessionSets, range: RepRange, requiredSets: number): SessionAnalysis {
  const topWeight = Math.max(...g.sets.map((s) => s.weightKg));
  const atTop = g.sets.filter((s) => s.weightKg === topWeight);
  const repsAtTop = atTop.map((s) => s.reps);
  const incomplete = g.sets.length < requiredSets;
  return {
    topWeight,
    incomplete,
    allTop: !incomplete && g.sets.every((s) => s.weightKg === topWeight && s.reps >= range.repMax),
    anyBelow: g.sets.some((s) => s.reps < range.repMin),
    hard: g.sets.some((s) => s.feel === 'hard'),
    minRepsAtTop: Math.min(...repsAtTop),
    repsAtTop,
    best1RM: Math.max(...g.sets.map((s) => estimate1RM(s.weightKg, s.reps))),
  };
}

/** Langste loopband-duur in de meest recente sessie met cardio voor deze oefening. */
export function lastCardioMinutes(
  cardioLogs: CardioLog[] | undefined,
  exerciseId: string,
  opts: { sessions?: Session[]; currentSessionId?: string },
): number | null {
  const excluded = excludedSessionIds(opts.sessions, opts.currentSessionId);
  const times = sessionTimes(opts.sessions);
  const groups = new Map<string, { time: number; minutes: number }>();
  for (const log of cardioLogs ?? []) {
    if (log.exerciseId !== exerciseId || excluded.has(log.sessionId)) continue;
    const g = groups.get(log.sessionId) ?? { time: Number.POSITIVE_INFINITY, minutes: 0 };
    g.time = Math.min(g.time, log.completedAt);
    g.minutes = Math.max(g.minutes, log.minutes);
    groups.set(log.sessionId, g);
  }
  let latest: { time: number; minutes: number } | null = null;
  for (const [id, g] of groups) {
    const time = times.get(id) ?? g.time;
    if (!latest || time > latest.time) latest = { time, minutes: g.minutes };
  }
  return latest ? latest.minutes : null;
}
