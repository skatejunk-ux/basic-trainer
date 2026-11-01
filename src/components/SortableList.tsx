// Herbruikbare sorteerbare lijst: slepen aan ☰ (dnd-kit, touch-vriendelijk) of pijltjes.
import type { ReactNode } from 'react';
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
import { nl } from '../content/nl';

const t = nl.workout;

interface Props {
  ids: string[];
  names: Record<string, string>;
  onChange: (ids: string[]) => void;
  /** Inhoud per rij; standaard de naam. */
  renderItem?: (id: string) => ReactNode;
}

export function SortableList({ ids, names, onChange, renderItem }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      onChange(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
    }
  };
  const move = (i: number, d: number) => onChange(arrayMove(ids, i, Math.min(ids.length - 1, Math.max(0, i + d))));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2">
          {ids.map((id, i) => (
            <Row
              key={id}
              id={id}
              name={names[id] ?? id}
              first={i === 0}
              last={i === ids.length - 1}
              onMove={(d) => move(i, d)}
            >
              {renderItem ? renderItem(id) : <span className="font-medium">{names[id] ?? id}</span>}
            </Row>
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function Row({
  id,
  name,
  first,
  last,
  onMove,
  children,
}: {
  id: string;
  name: string;
  first: boolean;
  last: boolean;
  onMove: (d: number) => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1 ${isDragging ? 'relative z-10 shadow-xl ring-2 ring-accent' : ''}`}
      data-sortable-item={id}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`${t.dragHandle}: ${name}`}
        className="h-12 w-10 shrink-0 touch-none text-xl text-muted"
      >
        ☰
      </button>
      <div className="min-w-0 flex-1">{children}</div>
      <button
        type="button"
        disabled={first}
        onClick={() => onMove(-1)}
        aria-label={`${t.up}: ${name}`}
        className="h-12 w-10 shrink-0 text-lg disabled:opacity-20"
      >
        ▲
      </button>
      <button
        type="button"
        disabled={last}
        onClick={() => onMove(1)}
        aria-label={`${t.down}: ${name}`}
        className="h-12 w-10 shrink-0 text-lg disabled:opacity-20"
      >
        ▼
      </button>
    </li>
  );
}
