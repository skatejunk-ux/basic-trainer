// Progressie-coach (PLAN.md §7): suggestNext bepaalt gewicht en doel-reps voor de volgende sessie.
import {
  BACK_EXTENSION_TYPE_KEY,
  type BackExtensionType,
  type CardioPlan,
  type Exercise,
  type MachineSettings,
  type TemplateItem,
} from '../types';
import {
  analyzeSession,
  bucketHistory,
  forSide,
  lastCardioMinutes,
  type BucketedHistory,
  type RepRange,
  type SessionSets,
} from './history';
import { clamp, deloadWeight, roundToIncrement, warmupWeight, weightForReps } from './math';
import { coachText } from './messages';
import type {
  BodyweightStage,
  PreviousSummary,
  Side,
  SideSuggestion,
  SuggestInput,
  Suggestion,
} from './types';

/** 12-3-30: 12% helling, 4,8 km/u, 30 min (PLAN.md §4.8). */
export const DEFAULT_CARDIO_PLAN: CardioPlan = { minutes: 30, inclinePct: 12, speedKmh: 4.8 };
/** Sleutel in MachineSettings.values voor het bijschuifgewichtje ('aan' | 'uit'). */
export const BIJSCHUIFGEWICHT_KEY = 'bijschuifgewicht';
export const BIJSCHUIFGEWICHT_KG = 2.5;
export const FALLBACK_INCREMENT_KG = 2.5;
/** Bank-variant: reps omhoog tot repMax + 3 voordat de volgende trap komt. */
export const BODYWEIGHT_EXTRA_REPS = 3;
export const WARMUP_REPS = 10;
/** Krachtsverschil tussen benen waarboven we waarschuwen. */
export const IMBALANCE_THRESHOLD = 0.1;

const STAGES: BodyweightStage[] = ['reps', 'tempo', 'pause'];
const ON_VALUES = new Set(['aan', 'ja', 'on', 'true', '1', 'yes']);

function settingValue(ms: MachineSettings | undefined, key: string): string | undefined {
  if (!ms) return undefined;
  const match = Object.keys(ms.values).find((k) => k.toLowerCase() === key.toLowerCase());
  return match === undefined ? undefined : ms.values[match].trim().toLowerCase();
}

/** Gewichtsstap: 2,5 kg met bijschuifgewicht, anders de eigen stackstap, anders de default. */
export function resolveIncrement(exercise: Exercise, ms?: MachineSettings): number {
  const bijschuif = settingValue(ms, BIJSCHUIFGEWICHT_KEY);
  if (bijschuif !== undefined && ON_VALUES.has(bijschuif)) return BIJSCHUIFGEWICHT_KG;
  if (ms && ms.incrementKg > 0) return ms.incrementKg;
  if (exercise.defaultIncrementKg > 0) return exercise.defaultIncrementKg;
  return FALLBACK_INCREMENT_KG;
}

/**
 * Back Extension-type. `undefined` = niet van toepassing (oefening kan niet op lichaamsgewicht),
 * `null` = nog niet gekozen.
 */
export function backExtensionType(
  exercise: Exercise,
  ms?: MachineSettings,
): BackExtensionType | null | undefined {
  if (!exercise.bodyweightCapable) return undefined;
  const v = settingValue(ms, BACK_EXTENSION_TYPE_KEY);
  if (v === undefined || v === '') return null;
  if (v === 'machine') return 'machine';
  if (v === 'bench' || v === 'bank' || v.includes('45')) return 'bench';
  return null;
}

const rangeTarget = (r: RepRange) => ({ min: r.repMin, max: r.repMax });

interface ProgressionResult extends SideSuggestion {
  previous?: PreviousSummary;
  estimatedFrom?: Suggestion['estimatedFrom'];
}

/** Schat een startgewicht via Epley-1RM uit de meest recente sessie in een andere rep-range. */
function estimateFromOther(other: SessionSets[], range: RepRange, inc: number): ProgressionResult | null {
  for (const g of other) {
    const sets = g.sets.filter((s) => s.weightKg > 0 && s.reps > 0);
    if (sets.length === 0) continue;
    const a = analyzeSession({ ...g, sets }, range, 0);
    const weight = roundToIncrement(weightForReps(a.best1RM, range.repMax), inc, 'down');
    if (weight <= 0) return null;
    const reps = sets.map((s) => s.reps);
    const from = g.range ?? { repMin: Math.min(...reps), repMax: Math.max(...reps) };
    return {
      kind: 'first',
      weightKg: weight,
      repTarget: rangeTarget(range),
      reason: coachText.estimated(weight, from.repMin, from.repMax),
      estimatedFrom: { repMin: from.repMin, repMax: from.repMax, oneRepMaxKg: Math.round(a.best1RM * 10) / 10 },
    };
  }
  return null;
}

/** Double progression (PLAN.md §7 regels 1–5). */
function weightedProgression(h: BucketedHistory, item: TemplateItem, inc: number): ProgressionResult {
  const range: RepRange = { repMin: item.repMin, repMax: item.repMax };
  const [lastG, prevG] = h.same;
  if (!lastG) {
    return (
      estimateFromOther(h.other, range, inc) ?? {
        kind: 'first',
        weightKg: null,
        repTarget: rangeTarget(range),
        reason: coachText.first(range.repMin, range.repMax),
      }
    );
  }

  const last = analyzeSession(lastG, range, item.sets);
  const previous: PreviousSummary = { weightKg: last.topWeight, reps: last.repsAtTop };

  if (last.anyBelow && prevG) {
    const prev = analyzeSession(prevG, range, item.sets);
    if (prev.anyBelow && prev.topWeight === last.topWeight) {
      const w = deloadWeight(last.topWeight, inc);
      return { kind: 'deload', weightKg: w, repTarget: rangeTarget(range), reason: coachText.deload(w), previous };
    }
  }

  if (last.allTop && !last.hard) {
    return {
      kind: 'increase',
      weightKg: Math.round((last.topWeight + inc) * 100) / 100,
      repTarget: range.repMin,
      reason: coachText.increase(inc, range.repMax, range.repMin),
      previous,
    };
  }

  const target = clamp(last.minRepsAtTop + 1, range.repMin, range.repMax);
  const reason = last.hard
    ? coachText.holdHard(target)
    : last.incomplete
      ? coachText.holdIncomplete(target)
      : last.anyBelow
        ? coachText.holdMissedOnce(target)
        : coachText.holdPlusOne(target);
  return { kind: 'hold', weightKg: last.topWeight, repTarget: target, reason, previous };
}

/** 45°-bank: reps tot repMax+3 → tempo → 2 s pauze → gewicht toevoegen (PLAN.md §4.2, §7). */
function bodyweightProgression(
  h: BucketedHistory,
  item: TemplateItem,
  inc: number,
  minStage: BodyweightStage | undefined,
): ProgressionResult & { stage?: BodyweightStage } {
  const range: RepRange = { repMin: item.repMin, repMax: item.repMax };
  const cap = range.repMax + BODYWEIGHT_EXTRA_REPS;
  const minIdx = minStage ? STAGES.indexOf(minStage) : 0;
  const [lastG] = h.same;

  if (!lastG) {
    return {
      kind: 'bodyweight-reps',
      weightKg: 0,
      repTarget: rangeTarget(range),
      reason: coachText.bodyweightFirst(range.repMin, range.repMax),
      stage: STAGES[minIdx],
    };
  }

  const last = analyzeSession(lastG, range, item.sets);
  // Al met extra gewicht bezig → gewone double progression op dat gewicht.
  if (last.topWeight > 0) return weightedProgression(h, item, inc);

  const capRange: RepRange = { repMin: range.repMin, repMax: cap };
  const isCeiling = (g: SessionSets) => {
    const a = analyzeSession(g, capRange, item.sets);
    return a.topWeight === 0 && a.allTop && !a.hard;
  };
  const hits = h.same.filter(isCeiling).length;
  const idx = minIdx + hits;
  const previous: PreviousSummary = { weightKg: 0, reps: last.repsAtTop };

  if (idx >= STAGES.length) {
    return {
      kind: 'bodyweight-add-load',
      weightKg: inc,
      repTarget: range.repMin,
      reason: coachText.bodyweightAddLoad(inc),
      previous,
    };
  }
  const stage = STAGES[idx];
  if (isCeiling(lastG)) {
    return {
      kind: 'bodyweight-reps',
      weightKg: 0,
      repTarget: range.repMin,
      reason: coachText.bodyweightNextStage(stage, range.repMin),
      stage,
      previous,
    };
  }
  const target = clamp(last.minRepsAtTop + (last.hard ? 0 : 1), range.repMin, cap);
  return {
    kind: 'bodyweight-reps',
    weightKg: 0,
    repTarget: target,
    reason: coachText.bodyweightReps(target, cap, stage),
    stage,
    previous,
  };
}

/** Zwakste been o.b.v. de nieuwste sessie waarin beide benen gelogd zijn. */
function sideBalance(history: SessionSets[]): { weak: Side; pct: number } | null {
  for (const g of history) {
    const best = (side: Side) =>
      analyzeSession({ ...g, sets: g.sets.filter((s) => s.side === side) }, { repMin: 0, repMax: 0 }, 0).best1RM;
    if (!g.sets.some((s) => s.side === 'L') || !g.sets.some((s) => s.side === 'R')) continue;
    const l = best('L');
    const r = best('R');
    if (l <= 0 || r <= 0) continue;
    const weak: Side = l <= r ? 'L' : 'R';
    const strong = Math.max(l, r);
    return { weak, pct: Math.round(((strong - Math.min(l, r)) / strong) * 1000) / 10 };
  }
  return null;
}

const strip = ({ kind, weightKg, repTarget, reason }: ProgressionResult): SideSuggestion => ({
  kind,
  weightKg,
  repTarget,
  reason,
});

function unilateral(h: BucketedHistory, item: TemplateItem, inc: number): Suggestion {
  const L = weightedProgression({ same: forSide(h.same, 'L'), other: forSide(h.other, 'L') }, item, inc);
  const R = weightedProgression({ same: forSide(h.same, 'R'), other: forSide(h.other, 'R') }, item, inc);
  const balance = sideBalance(h.same.length > 0 ? h.same : h.other);
  const weak: Side = balance?.weak ?? 'L';
  const lead = weak === 'L' ? L : R;
  const imbalanced = balance !== null && balance.pct > IMBALANCE_THRESHOLD * 100;
  const sideReason = L.reason === R.reason ? L.reason : coachText.perSide(L.reason, R.reason);
  const previous = [
    ...(L.previous ? [{ ...L.previous, side: 'L' as const }] : []),
    ...(R.previous ? [{ ...R.previous, side: 'R' as const }] : []),
  ];
  return {
    kind: lead.kind,
    weightKg: lead.weightKg,
    repTarget: lead.repTarget,
    perSide: { L: strip(L), R: strip(R) },
    reason: imbalanced ? `${coachText.imbalance(weak)} ${sideReason}` : sideReason,
    ...(balance ? { startSide: weak } : {}),
    ...(imbalanced ? { imbalance: { weakSide: weak, pct: balance.pct } } : {}),
    ...(lead.estimatedFrom ? { estimatedFrom: lead.estimatedFrom } : {}),
    ...(previous.length > 0 ? { previous } : {}),
  };
}

function cardio(input: SuggestInput): Suggestion {
  const plan = input.templateItem.cardio ?? DEFAULT_CARDIO_PLAN;
  const last = lastCardioMinutes(input.cardioLogs, input.exercise.id, input);
  const base = coachText.cardioPlan(plan.inclinePct, plan.speedKmh, plan.minutes);
  return {
    kind: 'cardio',
    weightKg: null,
    repTarget: plan.minutes,
    cardio: { ...plan },
    reason: last !== null && last < plan.minutes ? `${base} ${coachText.cardioShorter(last)}` : base,
  };
}

/**
 * Suggestie voor de volgende sessie van één oefening (PLAN.md §7).
 * Puur: alle historie komt binnen via `input`; geen klok, geen opslag.
 */
export function suggestNext(input: SuggestInput): Suggestion {
  const { exercise, templateItem: item, machineSettings: ms } = input;
  if (exercise.kind === 'cardio') return cardio(input);

  const inc = resolveIncrement(exercise, ms);
  const type = backExtensionType(exercise, ms);
  if (type === null) {
    return {
      kind: 'first',
      weightKg: null,
      repTarget: { min: item.repMin, max: item.repMax },
      reason: coachText.chooseBackExtensionType,
      needsChoice: 'back-extension-type',
      incrementKg: inc,
    };
  }

  const history = bucketHistory(input.setLogs, item, {
    sessions: input.sessions,
    templates: input.templates,
    currentSessionId: input.currentSessionId,
    exerciseId: exercise.id,
  });

  let s: Suggestion;
  if (exercise.unilateral) {
    s = unilateral(history, item, inc);
  } else if (type === 'bench') {
    const r = bodyweightProgression(history, item, inc, input.minBodyweightStage);
    s = {
      ...strip(r),
      ...(r.stage ? { bodyweightStage: r.stage } : {}),
      ...(r.previous ? { previous: [r.previous] } : {}),
    };
  } else {
    const r = weightedProgression(history, item, inc);
    s = {
      ...strip(r),
      ...(r.estimatedFrom ? { estimatedFrom: r.estimatedFrom } : {}),
      ...(r.previous ? { previous: [r.previous] } : {}),
    };
  }

  s.incrementKg = inc;
  if (item.warmupSet && s.weightKg !== null && s.weightKg > 0 && s.kind !== 'bodyweight-add-load') {
    s.warmup = { weightKg: warmupWeight(s.weightKg, inc), reps: WARMUP_REPS };
  }
  return s;
}
