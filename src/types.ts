// Datamodel van Basic-Trainer (PLAN.md §5). Wijzigen alleen via de WP0/WP1-eigenaar.

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'single-leg'
  | 'vertical-push'
  | 'horizontal-press'
  | 'vertical-pull'
  | 'horizontal-row'
  | 'knee-extension'
  | 'knee-flexion'
  | 'calf'
  | 'hip-abduction'
  | 'hip-adduction'
  | 'chest-fly'
  | 'rear-fly'
  | 'elbow-flexion'
  | 'elbow-extension'
  | 'trunk-flexion'
  | 'walk';

/** Back Extension-variant (PLAN.md §4.2): machine met gewichtsstapel of 45-graden-bank. */
export type BackExtensionType = 'machine' | 'bench';

/** Sleutel in MachineSettings.values waarin het Back Extension-type wordt bewaard. */
export const BACK_EXTENSION_TYPE_KEY = 'type';

/** Spiergroepen voor de spierkaart (PLAN.md §8). */
export const MUSCLE_IDS = [
  'chest',
  'front-delts',
  'side-delts',
  'rear-delts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'traps',
  'mid-back',
  'lats',
  'lower-back',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'calves',
] as const;

export type MuscleId = (typeof MUSCLE_IDS)[number];

export interface MuscleMap {
  primary: MuscleId[];
  secondary: MuscleId[];
}

export interface SettingField {
  key: string;
  label: string;
  hint?: string;
}

export interface Exercise {
  id: string;
  name: string;
  pattern: Pattern;
  muscles: string[];
  kind: 'strength' | 'cardio';
  unilateral: boolean; // Single-Leg Leg Press
  bodyweightCapable: boolean; // Back Extension (0 kg toegestaan)
  settingFields: SettingField[];
  setup: string[];
  cues: string[];
  mistakes: string[];
  breathing: string;
  tempo: string;
  defaultIncrementKg: number;
  muscleMap: MuscleMap; // spierkaart (PLAN.md §8)
  animationId: string; // gereserveerd voor latere animaties (backlog)
  isCustom: boolean;
}

/** Jouw persoonlijke instellingen per oefening. */
export interface MachineSettings {
  exerciseId: string;
  /**
   * Bv. { seat: "4", feet: "midden" }. Voor Back Extension staat onder
   * BACK_EXTENSION_TYPE_KEY ('type') de waarde 'machine' | 'bench' (BackExtensionType).
   * Bijschuifgewicht: sleutel 'bijschuifgewicht' met 'aan' | 'uit' (zie PLAN.md §7).
   */
  values: Record<string, string>;
  incrementKg: number; // overschrijft default (bv. stack gaat per 5 kg)
  notes?: string;
  updatedAt: number;
}

export interface CardioPlan {
  minutes: number;
  inclinePct: number;
  speedKmh: number;
}

export interface TemplateItem {
  id: string;
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  warmupSet: boolean;
  cardio?: CardioPlan;
}

export interface Template {
  id: string;
  name: string; // "A", "B"
  items: TemplateItem[];
  order: number;
}

export type SessionStatus = 'active' | 'done' | 'abandoned';

export interface Session {
  id: string;
  templateId: string;
  startedAt: number;
  endedAt?: number;
  status: SessionStatus;
  itemOrder: string[]; // volgorde zoals feitelijk uitgevoerd (incl. "machine bezet"-verschuivingen)
  skippedItemIds?: string[]; // overgeslagen template-items (workout-modus)
  exerciseOverrides?: Record<string, string>; // templateItemId → vervangende exerciseId (alleen deze sessie)
  notes?: string;
}

export type Feel = 'easy' | 'good' | 'hard'; // 3-knops gevoel i.p.v. RPE

export interface SetLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  templateItemId: string;
  setIndex: number;
  isWarmup: boolean;
  side?: 'L' | 'R';
  weightKg: number;
  reps: number;
  feel?: Feel;
  completedAt: number;
  settingsSnapshot?: Record<string, string>;
}

export interface CardioLog {
  id: string;
  sessionId: string;
  exerciseId: string;
  templateItemId?: string; // welk template-item (warming-up of 12-3-30)
  minutes: number;
  inclinePct: number;
  speedKmh: number;
  distanceKm?: number;
  kcal?: number;
  avgHr?: number;
  completedAt: number;
}

/** Gescande QR-/streepjescode op een machine, gekoppeld aan een oefening (PLAN.md §12.1). */
export interface MachineCode {
  code: string; // ruwe inhoud van de code
  exerciseId: string;
  format?: string; // bv. 'qr_code', 'code_128'
  linkedAt: number;
}

export interface AppSettings {
  id: 'singleton';
  theme: 'dark' | 'light' | 'system';
  vibration: boolean;
  sound: boolean;
  keepScreenOn: boolean;
  defaultRestSec: number;
  weekGoal: 3 | 4;
  lastBackupAt?: number;
  bodyWeightKg?: number; // voor de kcal-schatting (PLAN.md §12.2)
  showInvite?: boolean; // uitnodigingslink alleen op toestellen die de eigenaar met de geheime link vrijgaf
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'singleton',
  theme: 'dark',
  vibration: true,
  sound: true,
  keepScreenOn: true,
  defaultRestSec: 90,
  weekGoal: 3,
};
