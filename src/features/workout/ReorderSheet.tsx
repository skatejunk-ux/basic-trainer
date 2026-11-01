// Volgorde van de resterende oefeningen aanpassen tijdens de training.
import { useState } from 'react';
import { nl } from '../../content/nl';
import { Sheet } from '../../components/Sheet';
import { SortableList } from '../../components/SortableList';

const t = nl.workout;

interface Props {
  open: boolean;
  items: { id: string; name: string }[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}

export function ReorderSheet({ open, items, onClose, onSave }: Props) {
  return (
    <Sheet title={t.reorderTitle} open={open} onClose={onClose}>
      {open && <ReorderList key={items.map((i) => i.id).join()} items={items} onSave={onSave} />}
    </Sheet>
  );
}

function ReorderList({ items, onSave }: { items: Props['items']; onSave: Props['onSave'] }) {
  const [ids, setIds] = useState(items.map((i) => i.id));
  const names = Object.fromEntries(items.map((i) => [i.id, i.name]));
  return (
    <>
      <p className="mb-3 text-sm text-muted">{t.reorderHint}</p>
      <SortableList ids={ids} names={names} onChange={setIds} />
      <button type="button" className="btn-primary mt-4 w-full" onClick={() => onSave(ids)}>
        {t.settingsSave}
      </button>
    </>
  );
}
