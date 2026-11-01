// Wat te doen met een gescande code (PLAN.md §12.1). Puur: geen database, geen UI.
// Resolver-keten naar voorbeeld van de Technogym-app: elke resolver probeert de code,
// de eerste die een actie teruggeeft wint.

export type ScanAction =
  | { type: 'link'; code: string } // onbekende code → vraag welke oefening het is
  | { type: 'goto-item'; exerciseId: string; index: number } // spring naar die oefening in de training
  | { type: 'not-in-workout'; exerciseId: string } // gekoppeld, maar niet in deze training
  | { type: 'open-exercise'; exerciseId: string }; // geen training: open oefening-detail

export interface ScanContext {
  code: string;
  /** Oefening waaraan de code gekoppeld is, als die er is. */
  linkedExerciseId?: string;
  /** Lopende training: oefening-id per positie, plus welke posities al af zijn. */
  workout?: { exerciseIds: string[]; done: boolean[]; current: number };
}

type Resolver = (ctx: ScanContext) => ScanAction | null;

const unknownCode: Resolver = (ctx) => (ctx.linkedExerciseId ? null : { type: 'link', code: ctx.code });

const inWorkout: Resolver = ({ linkedExerciseId: id, workout }) => {
  if (!id || !workout) return null;
  const matches = workout.exerciseIds.flatMap((e, i) => (e === id ? [i] : []));
  if (!matches.length) return { type: 'not-in-workout', exerciseId: id };
  // Bij meerdere items met dezelfde oefening (loopband warming-up + 12-3-30):
  // de huidige als die past, anders de eerste die nog niet af is.
  const index = matches.includes(workout.current)
    ? workout.current
    : (matches.find((i) => !workout.done[i]) ?? matches[0]);
  return { type: 'goto-item', exerciseId: id, index };
};

const outsideWorkout: Resolver = ({ linkedExerciseId: id }) => (id ? { type: 'open-exercise', exerciseId: id } : null);

const RESOLVERS: Resolver[] = [unknownCode, inWorkout, outsideWorkout];

export function resolveScan(ctx: ScanContext): ScanAction {
  for (const r of RESOLVERS) {
    const action = r(ctx);
    if (action) return action;
  }
  return { type: 'link', code: ctx.code };
}

/** Is scannen mogelijk in deze browser? (BarcodeDetector + camera; Chrome op Android) */
export function canScan(): boolean {
  return (
    typeof window !== 'undefined' &&
    'BarcodeDetector' in window &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}
