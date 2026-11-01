// Gekoppelde machinecodes van één oefening, met koppelen via scan en ontkoppelen (PLAN.md §12.1).
import { useCallback, useEffect, useState } from 'react';
import type { MachineCode } from '../../types';
import { linkMachineCode, listMachineCodesByExercise, unlinkMachineCode } from '../../db';
import { Icon } from '../../components/Icon';
import { nl } from '../../content/nl';
import { CameraScanner } from './CameraScanner';
import { canScan } from './resolve';

const t = nl.scan;

export function LinkedCodes({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const [codes, setCodes] = useState<MachineCode[]>([]);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const reload = useCallback(() => void listMachineCodesByExercise(exerciseId).then(setCodes), [exerciseId]);
  useEffect(reload, [reload]);

  const scannable = canScan();
  if (!scannable && !codes.length) return null;

  return (
    <div className="card p-3">
      <h2 className="mb-2 font-semibold">{t.codesTitle}</h2>
      {message && (
        <p role="status" className="mb-2 text-sm font-semibold text-success">
          {message}
        </p>
      )}
      {codes.length ? (
        <ul className="mb-3 space-y-1">
          {codes.map((c) => (
            <li key={c.code} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm">{c.code}</span>
              <button
                type="button"
                className="btn-ghost w-12 text-danger"
                aria-label={t.unlink(c.code)}
                onClick={async () => {
                  await unlinkMachineCode(c.code);
                  setMessage(null);
                  reload();
                }}
              >
                <Icon name="x" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-muted">{t.codesEmpty}</p>
      )}
      {scannable && (
        <button type="button" className="btn-secondary w-full" onClick={() => setScanning(true)}>
          <Icon name="scan" /> {t.linkHere}
        </button>
      )}
      {scanning && (
        <CameraScanner
          onClose={() => setScanning(false)}
          onDetect={async (code, format) => {
            await linkMachineCode(code, exerciseId, format);
            setScanning(false);
            setMessage(t.linked(exerciseName));
            reload();
          }}
        />
      )}
    </div>
  );
}
