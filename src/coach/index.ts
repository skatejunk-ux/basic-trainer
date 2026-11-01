// Publieke API van de progressie-coach (WP2, PLAN.md §7).
export {
  suggestNext,
  resolveIncrement,
  backExtensionType,
  DEFAULT_CARDIO_PLAN,
  BIJSCHUIFGEWICHT_KEY,
  BIJSCHUIFGEWICHT_KG,
  BODYWEIGHT_EXTRA_REPS,
  WARMUP_REPS,
  IMBALANCE_THRESHOLD,
} from './suggest';
export { nextTemplate } from './nextTemplate';
export { compareToPrevious, type CompareInput } from './celebrate';
export {
  estimate1RM,
  weightForReps,
  roundToIncrement,
  roundKg,
  deloadWeight,
  warmupWeight,
  formatKg,
  type RoundMode,
} from './math';
export { coachText } from './messages';
export { sessionEnergy, cardioKcal, strengthKcal, type Energy } from './energy';
export type {
  Suggestion,
  SuggestionKind,
  SuggestInput,
  SideSuggestion,
  RepTarget,
  Side,
  BodyweightStage,
  WarmupSuggestion,
  PreviousSummary,
} from './types';
