// Volgorde van de resterende oefeningen aanpassen: slepen (dnd-kit) of pijltjes.
import { useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { nl } from '../../content/nl';
import { Sheet } from '../../components/Sheet';

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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      setIds((cur) => arrayMove(cur, cur.indexOf(String(active.id)), cur.indexOf(String(over.id))));
    }
  };
  const move = (i: number, d: number) =>
    setIds((cur) => arrayMove(cur, i, Math.min(cur.length - 1, Math.max(0, i + d))));

  return (
    <>
      <p className="mb-3 text-sm text-muted">{t.reorderHint}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {ids.map((id, i) => (
              <Row
                key={id}
                id={id}
                name={names[id]}
                first={i === 0}
                last={i === ids.length - 1}
                onMove={(d) => move(i, d)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <button type="button" className="btn-primary mt-4 w-full" onClick={() => onSave(ids)}>
        {t.settingsSave}
      </button>
    </>
  );
}

function Row({
  id,
  name,
  first,
  last,
  onMove,
}: {
  id: string;
  name: string;
  first: boolean;
  last: boolean;
  onMove: (d: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-1 ${isDragging ? 'z-10 shadow-xl ring-2 ring-accent' : ''}`}
      data-reorder-item={id}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`${t.dragHandle}: ${name}`}
        className="h-12 w-10 touch-none text-xl text-muted"
      >
        ☰
      </button>
      <span className="flex-1 font-medium">{name}</span>
      <button
        type="button"
        disabled={first}
        onClick={() => onMove(-1)}
        aria-label={`${t.up}: ${name}`}
        className="h-12 w-11 text-lg disabled:opacity-20"
      >
        ▲
      </button>
      <button
        type="button"
        disabled={last}
        onClick={() => onMove(1)}
        aria-label={`${t.down}: ${name}`}
        className="h-12 w-11 text-lg disabled:opacity-20"
      >
        ▼
      </button>
    </li>
  );
}
