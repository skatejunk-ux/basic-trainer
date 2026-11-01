// Eenvoudig bottom-sheet-venster voor mobiel.
import { useEffect, type ReactNode } from 'react';
import { nl } from '../content/nl';
import { Icon } from './Icon';

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
    <div className="animate-fade fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t border-border/60 bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" aria-hidden />
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label={nl.workout.closeSheet}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
