// Lokale types van de progressie-coach (PLAN.md §7). Het datamodel zelf staat in src/types.ts.
import type {
  CardioLog,
  CardioPlan,
  Exercise,
  MachineSettings,
  Session,
  SetLog,
  Template,
  TemplateItem,
} from '../types';

export type Side = 'L' | 'R';

export type SuggestionKind =
  | 'first'
  | 'increase'
  | 'hold'
  | 'deload'
  | 'bodyweight-reps'
  | 'bodyweight-add-load'
  | 'cardio';

/** Doel-reps: een vast aantal per set of een range. Bij cardio: aantal minuten. */
export type RepTarget = { min: number; max: number } | number;

/** Progressie-trap bij de 45-graden-bank (PLAN.md §4.2): reps → tempo → 2 s pauze. */
export type BodyweightStage = 'reps' | 'tempo' | 'pause';

export interface SideSuggestion {
  kind: SuggestionKind;
  weightKg: number | null;
  repTarget: RepTarget;
  reason: string;
}

export interface WarmupSuggestion {
  weightKg: number;
  reps: number;
}

/** Samenvatting van de vorige sessie (voor "Vorige keer 3×8 @ 60 kg"). */
export interface PreviousSummary {
  weightKg: number;
  reps: number[];
  side?: Side;
}

export interface Suggestion {
  kind: SuggestionKind;
  /** null = veld leeg laten (eerste training of keuze nodig). */
  weightKg: number | null;
  perSide?: { L: SideSuggestion; R: SideSuggestion };
  repTarget: RepTarget;
  /** Korte, Nederlandse uitleg voor de gebruiker. */
  reason: string;
  warmup?: WarmupSuggestion;
  /** Gebruikte gewichtsstap (kg). */
  incrementKg?: number;
  /** Unilateraal: met welk been beginnen (het zwakkere). */
  startSide?: Side;
  /** Unilateraal: krachtsverschil > 10%. */
  imbalance?: { weakSide: Side; pct: number };
  /** Bank-variant: welke trap van de lichaamsgewicht-progressie. */
  bodyweightStage?: BodyweightStage;
  /** Cardio: voorgesteld plan. */
  cardio?: CardioPlan;
  /** Gewicht geschat via Epley-1RM uit een andere rep-range (geen historie in deze range). */
  estimatedFrom?: { repMin: number; repMax: number; oneRepMaxKg: number };
  /** Er moet eerst een keuze gemaakt worden (Back Extension: machine of bank). */
  needsChoice?: 'back-extension-type';
  previous?: PreviousSummary[];
}

export interface SuggestInput {
  exercise: Exercise;
  templateItem: TemplateItem;
  /** Alle (of alleen deze oefening z'n) set-logs; wordt intern gefilterd op exerciseId. */
  setLogs: SetLog[];
  cardioLogs?: CardioLog[];
  /** Voor volgorde (startedAt) en om afgebroken sessies over te slaan. */
  sessions?: Session[];
  /** Om templateItemId van oude logs naar een rep-range te vertalen (A/B-buckets). */
  templates?: Template[];
  machineSettings?: MachineSettings;
  /** Sessie die nu loopt; die telt niet als "vorige keer". */
  currentSessionId?: string;
  /** Bank-variant: begin minstens op deze trap (bv. 'pause' voor "met gewicht" in Training B). */
  minBodyweightStage?: BodyweightStage;
}
