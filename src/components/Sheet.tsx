// Eenvoudig bottom-sheet-venster voor mobiel.
import { useEffect, type ReactNode } from 'react';
import { nl } from '../content/nl';

interface Props {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ title, open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="btn-ghost" aria-label={nl.workout.closeSheet}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
