// Scanknop + flow (PLAN.md §12.1): scannen → onbekend? koppelen → springen of oefening openen.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Exercise } from '../../types';
import { getMachineCode, linkMachineCode, listExercises } from '../../db';
import { nl } from '../../content/nl';
import { Sheet } from '../../components/Sheet';
import { CameraScanner } from './CameraScanner';
import { canScan, resolveScan, type ScanContext } from './resolve';

const t = nl.scan;

type Step =
  | { kind: 'idle' }
  | { kind: 'scanning' }
  | { kind: 'pick'; code: string; format: string; exercises: Exercise[] }
  | { kind: 'not-in-workout'; exercise: Exercise };

interface Props {
  /** Lopende training; zonder workout opent een scan de oefening-detailpagina. */
  workout?: ScanContext['workout'];
  onGotoItem?: (index: number) => void;
  className?: string;
}

export function ScanButton({ workout, onGotoItem, className = 'btn-ghost w-12 text-xl' }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  if (!canScan()) return null;

  const close = () => setStep({ kind: 'idle' });

  const act = async (code: string, linkedExerciseId: string) => {
    const action = resolveScan({ code, linkedExerciseId, workout });
    if (action.type === 'goto-item') {
      close();
      onGotoItem?.(action.index);
    } else if (action.type === 'not-in-workout') {
      const exercise = (await listExercises()).find((e) => e.id === action.exerciseId);
      if (exercise) setStep({ kind: 'not-in-workout', exercise });
      else close();
    } else if (action.type === 'open-exercise') {
      close();
      navigate(`/oefening/${action.exerciseId}`);
    }
  };

  const onDetect = async (code: string, format: string) => {
    const linked = await getMachineCode(code);
    if (linked) return act(code, linked.exerciseId);
    setStep({ kind: 'pick', code, format, exercises: await listExercises() });
  };

  return (
    <>
      <button type="button" onClick={() => setStep({ kind: 'scanning' })} aria-label={t.button} className={className}>
        📷
      </button>
      {step.kind === 'scanning' && <CameraScanner onDetect={(c, f) => void onDetect(c, f)} onClose={close} />}
      <Sheet title={t.pickTitle} open={step.kind === 'pick'} onClose={close}>
        {step.kind === 'pick' && (
          <>
            <p className="mb-1 text-sm text-muted">{t.pickText}</p>
            <p className="mb-3 break-all text-xs text-muted">{t.code(step.code)}</p>
            <ul className="space-y-2">
              {step.exercises.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="btn-secondary w-full justify-start text-left"
                    onClick={async () => {
                      await linkMachineCode(step.code, e.id, step.format);
                      await act(step.code, e.id);
                    }}
                  >
                    {e.name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Sheet>
      <Sheet title={t.button} open={step.kind === 'not-in-workout'} onClose={close}>
        {step.kind === 'not-in-workout' && (
          <>
            <p className="mb-4">{t.notInWorkout(step.exercise.name)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => {
                  close();
                  navigate(`/oefening/${step.exercise.id}`);
                }}
              >
                {t.openExercise}
              </button>
              <button type="button" className="btn-primary flex-1" onClick={close}>
                {t.ok}
              </button>
            </div>
          </>
        )}
      </Sheet>
    </>
  );
}
