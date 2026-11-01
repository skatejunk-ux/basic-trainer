// Pure helpers voor de workout-modus (PLAN.md §6.2): setrijen plannen, voortgang, volgorde.
import type { CardioLog, Exercise, Session, SetLog, Template, TemplateItem } from '../../types';
import type { RepTarget, Side, Suggestion } from '../../coach';
import { formatKg } from '../../coach';

export interface PlannedRow {
  key: string;
  setIndex: number; // 0 = opwarmset, 1..n = werksets
  isWarmup: boolean;
  side?: Side;
  weightKg: number | null;
  reps: number;
}

const firstReps = (t: RepTarget) => (typeof t === 'number' ? t : t.min);

export const rowKey = (setIndex: number, isWarmup: boolean, side?: Side) =>
  `${isWarmup ? 'w' : 's'}${setIndex}${side ?? ''}`;

/** Bouwt de setrijen voor een krachtoefening, vooraf ingevuld met de suggestie van de coach. */
export function buildRows(item: TemplateItem, exercise: Exercise, s: Suggestion, benchType = false): PlannedRow[] {
  const rows: PlannedRow[] = [];
  const fallback = benchType ? 0 : null;
  if (item.warmupSet && s.warmup) {
    rows.push({
      key: rowKey(0, true),
      setIndex: 0,
      isWarmup: true,
      weightKg: s.warmup.weightKg,
      reps: s.warmup.reps,
    });
  }
  const start: Side = s.startSide ?? 'L';
  const sides: (Side | undefined)[] = exercise.unilateral ? [start, start === 'L' ? 'R' : 'L'] : [undefined];
  for (let i = 1; i <= item.sets; i++) {
    for (const side of sides) {
      const per = side && s.perSide ? s.perSide[side] : undefined;
      rows.push({
        key: rowKey(i, false, side),
        setIndex: i,
        isWarmup: false,
        side,
        weightKg: per?.weightKg ?? s.weightKg ?? fallback,
        reps: firstReps(per?.repTarget ?? s.repTarget),
      });
    }
  }
  return rows;
}

export const logForRow = (logs: SetLog[], itemId: string, row: PlannedRow) =>
  logs.find(
    (l) =>
      l.templateItemId === itemId && l.setIndex === row.setIndex && l.isWarmup === row.isWarmup && l.side === row.side,
  );

/** Rust na een set: opwarmset 60 s, eerste been van een unilaterale set 60 s, anders de template-rust. */
export function restAfter(item: TemplateItem, row: PlannedRow, unilateral: boolean, startSide: Side = 'L'): number {
  if (row.isWarmup) return 60;
  if (unilateral && row.side === startSide) return 60;
  return item.restSec;
}

export function itemsInOrder(session: Session, template: Template): TemplateItem[] {
  const byId = new Map(template.items.map((i) => [i.id, i]));
  return session.itemOrder.map((id) => byId.get(id)).filter((i): i is TemplateItem => !!i);
}

export const isWarmupCardio = (exercise: Exercise | undefined, item: TemplateItem) =>
  exercise?.kind === 'cardio' && (item.cardio?.minutes ?? 30) <= 10;

/** Weergavenaam: de korte loopband-warming-up heet geen "12-3-30". */
export function displayName(exercise: Exercise | undefined, item: TemplateItem, warmupLabel: string): string {
  if (!exercise) return item.exerciseId;
  return isWarmupCardio(exercise, item)
    ? `${exercise.name.replace(/\s*12-3-30$/, '')} · ${warmupLabel}`
    : exercise.name;
}

/** Klaar = cardio gelogd, of alle werksets (bij unilateraal: beide benen) gelogd. */
export function isItemDone(
  item: TemplateItem,
  exercise: Exercise | undefined,
  logs: SetLog[],
  cardio: CardioLog[],
): boolean {
  if (!exercise) return false;
  if (exercise.kind === 'cardio') return cardio.some((c) => c.templateItemId === item.id);
  const work = logs.filter((l) => l.templateItemId === item.id && !l.isWarmup).length;
  return work >= item.sets * (exercise.unilateral ? 2 : 1);
}

export const exerciseIdFor = (session: Session, item: TemplateItem) =>
  session.exerciseOverrides?.[item.id] ?? item.exerciseId;

/** Verplaatst een item naar het einde ("machine bezet → later"). */
export function moveToEnd(order: string[], id: string): string[] {
  return [...order.filter((x) => x !== id), id];
}

/** Vervangt de volgorde van de resterende items, met behoud van de afgeronde items vooraan. */
export function applyRemainingOrder(order: string[], remaining: string[]): string[] {
  const rest = new Set(remaining);
  return [...order.filter((id) => !rest.has(id)), ...remaining];
}

/** Korte tekst "3×8 @ 60 kg" voor de vorige keer. */
export function formatPrevious(prev: Suggestion['previous']): string | null {
  if (!prev?.length) return null;
  return prev
    .map((p) => {
      const reps =
        p.reps.length && p.reps.every((r) => r === p.reps[0]) ? `${p.reps.length}×${p.reps[0]}` : p.reps.join('/');
      return `${p.side ? `${p.side}: ` : ''}${reps} @ ${formatKg(p.weightKg)} kg`;
    })
    .join(' · ');
}

/** Compacte samenvatting van werksets: "60 kg: 8/7/6" of per been "L 36,5 kg: 11/11 · R 38,5 kg: 11/11". */
export function summarizeSets(sets: SetLog[]): string {
  const work = [...sets].filter((l) => !l.isWarmup).sort((a, b) => a.completedAt - b.completedAt);
  const groups: { side?: string; weight: number; reps: number[] }[] = [];
  for (const l of work) {
    const g = groups.find((x) => x.side === l.side && x.weight === l.weightKg);
    if (g) g.reps.push(l.reps);
    else groups.push({ side: l.side, weight: l.weightKg, reps: [l.reps] });
  }
  groups.sort((a, b) => (a.side ?? '').localeCompare(b.side ?? ''));
  return groups.map((g) => `${g.side ? `${g.side} ` : ''}${formatKg(g.weight)} kg: ${g.reps.join('/')}`).join(' · ');
}

export function tonnage(logs: SetLog[]): number {
  return logs.filter((l) => !l.isWarmup).reduce((sum, l) => sum + l.weightKg * l.reps, 0);
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} u ${m} min` : `${m} min`;
}

/** Eerste letter hoofdletter ("vr 30 okt" → "Vr 30 okt"); CSS capitalize zou elk woord doen. */
export const capFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const SET_WORK_SEC = 45;
const SETUP_SEC = 90;

/** Ruwe duur van een training in minuten (sets × (uitvoering + rust) + omstellen + cardio), afgerond op 5. */
export function estimateMinutes(template: Template, exercises: Record<string, Exercise | undefined>): number {
  const sec = template.items.reduce((sum, item) => {
    const ex = exercises[item.exerciseId];
    if (ex?.kind === 'cardio') return sum + (item.cardio?.minutes ?? 30) * 60;
    const sets = (item.sets + (item.warmupSet ? 1 : 0)) * (ex?.unilateral ? 2 : 1);
    return sum + SETUP_SEC + sets * SET_WORK_SEC + Math.max(0, sets - 1) * item.restSec;
  }, 0);
  return Math.max(5, Math.round(sec / 300) * 5);
}
