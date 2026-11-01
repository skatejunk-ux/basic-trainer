// Template-editor (PLAN.md §6.4): volgorde slepen, sets/reps/rust, oefeningen toevoegen/verwijderen.
// Elke wijziging wordt direct opgeslagen.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { AppSettings, Exercise, Template, TemplateItem } from '../../types';
import {
  createTemplate,
  deleteTemplate,
  getActiveSession,
  getSettings,
  listExercises,
  listTemplates,
  newId,
  updateTemplate,
} from '../../db';
import { formatKg } from '../../coach';
import { nl } from '../../content/nl';
import { BackLink } from '../../components/BackLink';
import { NumberStepper } from '../../components/NumberStepper';
import { Sheet } from '../../components/Sheet';
import { SortableList } from '../../components/SortableList';
import { displayName } from '../workout/plan';
import { newTemplateItem, sortBySeed } from './helpers';

const t = nl.schema;

export function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [count, setCount] = useState(0);
  const [exercises, setExercises] = useState<Record<string, Exercise>>({});
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [active, setActive] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [tpls, exs, st, act] = await Promise.all([
        listTemplates(),
        listExercises(),
        getSettings(),
        getActiveSession(),
      ]);
      if (!alive) return;
      const tpl = tpls.find((x) => x.id === id);
      if (!tpl) return setMissing(true);
      setTemplate(tpl);
      setCount(tpls.length);
      setExercises(Object.fromEntries(exs.map((e) => [e.id, e])));
      setSettings(st);
      setActive(act?.templateId === tpl.id);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (missing)
    return (
      <Link to="/schema" className="btn-secondary">
        {t.back}
      </Link>
    );
  if (!template || !settings) return <p className="text-muted">{nl.today.loading}</p>;

  const save = (next: Template) => {
    setTemplate(next);
    void updateTemplate(next.id, { name: next.name, items: next.items });
  };
  const updateItem = (itemId: string, changes: Partial<TemplateItem>) =>
    save({ ...template, items: template.items.map((i) => (i.id === itemId ? { ...i, ...changes } : i)) });
  const byId = Object.fromEntries(template.items.map((i) => [i.id, i]));
  const names = Object.fromEntries(
    template.items.map((i) => [i.id, displayName(exercises[i.exerciseId], i, nl.workout.warmupCardio)]),
  );

  return (
    <section className="space-y-4">
      <BackLink to="/schema" label={t.back} />
      <label className="block">
        <span className="text-sm font-medium text-muted">{t.name}</span>
        <input
          value={template.name}
          onChange={(e) => save({ ...template, name: e.target.value })}
          className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3 py-3 text-2xl font-bold outline-none focus:border-accent"
        />
      </label>
      {active && <p className="rounded-xl bg-accent/10 p-3 text-sm">{t.activeWarning}</p>}

      {template.items.length === 0 ? (
        <p className="text-muted">{t.empty}</p>
      ) : (
        <SortableList
          ids={template.items.map((i) => i.id)}
          names={names}
          onChange={(ids) => save({ ...template, items: ids.map((x) => byId[x]) })}
          renderItem={(itemId) => {
            const item = byId[itemId];
            const ex = exercises[item.exerciseId];
            return (
              <button
                type="button"
                onClick={() => setOpenItem(itemId)}
                className="block w-full py-1 text-left"
                aria-label={`${t.edit}: ${names[itemId]}`}
              >
                <span className="block truncate font-medium">{names[itemId]}</span>
                <span className="block text-xs text-muted">
                  {ex?.kind === 'cardio' && item.cardio
                    ? t.cardioSummary(item.cardio.minutes, item.cardio.inclinePct, formatKg(item.cardio.speedKmh))
                    : `${t.summary(item.sets, item.repMin, item.repMax, item.restSec)}${item.warmupSet ? ' · 🔥' : ''}`}
                </span>
              </button>
            );
          }}
        />
      )}

      <button type="button" className="btn-primary w-full" onClick={() => setAdding(true)}>
        {t.addExercise}
      </button>

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={async () => {
            const copy = await createTemplate({
              name: `${template.name}2`,
              items: template.items.map((i) => ({ ...i, id: newId() })),
            });
            navigate(`/schema/${copy.id}`);
          }}
        >
          {t.duplicate}
        </button>
        <button
          type="button"
          className="btn-secondary flex-1 text-danger"
          onClick={async () => {
            if (count <= 1) return window.alert(t.deleteLast);
            if (!window.confirm(t.deleteConfirm(template.name))) return;
            await deleteTemplate(template.id);
            navigate('/schema');
          }}
        >
          {t.delete}
        </button>
      </div>

      <Sheet title={openItem ? names[openItem] : ''} open={!!openItem} onClose={() => setOpenItem(null)}>
        {openItem && byId[openItem] && (
          <ItemFields
            item={byId[openItem]}
            cardio={exercises[byId[openItem].exerciseId]?.kind === 'cardio'}
            onChange={(c) => updateItem(openItem, c)}
            onRemove={() => {
              save({ ...template, items: template.items.filter((i) => i.id !== openItem) });
              setOpenItem(null);
            }}
            onDone={() => setOpenItem(null)}
          />
        )}
      </Sheet>

      <Sheet title={t.addTitle} open={adding} onClose={() => setAdding(false)}>
        <ul className="space-y-2">
          {sortBySeed(Object.values(exercises)).map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                className="btn-secondary w-full justify-start"
                onClick={() => {
                  const item = newTemplateItem(ex, settings.defaultRestSec);
                  save({ ...template, items: [...template.items, item] });
                  setAdding(false);
                  setOpenItem(item.id);
                }}
              >
                {ex.name}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </section>
  );
}

function ItemFields({
  item,
  cardio,
  onChange,
  onRemove,
  onDone,
}: {
  item: TemplateItem;
  cardio: boolean;
  onChange: (c: Partial<TemplateItem>) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  const c = item.cardio;
  return (
    <div className="space-y-3">
      {cardio && c ? (
        <div className="grid grid-cols-1 gap-2">
          <NumberStepper
            label={t.minutes}
            value={c.minutes}
            min={1}
            max={180}
            onChange={(v) => onChange({ cardio: { ...c, minutes: v } })}
          />
          <NumberStepper
            label={t.incline}
            value={c.inclinePct}
            min={0}
            max={20}
            onChange={(v) => onChange({ cardio: { ...c, inclinePct: v } })}
          />
          <NumberStepper
            label={t.speed}
            value={c.speedKmh}
            step={0.1}
            min={1}
            max={20}
            onChange={(v) => onChange({ cardio: { ...c, speedKmh: v } })}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2">
            <NumberStepper label={t.sets} value={item.sets} min={1} max={10} onChange={(v) => onChange({ sets: v })} />
            <NumberStepper
              label={t.repMin}
              value={item.repMin}
              min={1}
              max={50}
              onChange={(v) => onChange({ repMin: v, repMax: Math.max(v, item.repMax) })}
            />
            <NumberStepper
              label={t.repMax}
              value={item.repMax}
              min={1}
              max={50}
              onChange={(v) => onChange({ repMax: v, repMin: Math.min(v, item.repMin) })}
            />
            <NumberStepper
              label={t.rest}
              value={item.restSec}
              step={15}
              min={0}
              max={600}
              onChange={(v) => onChange({ restSec: v })}
            />
          </div>
          <label className="flex min-h-touch items-center justify-between rounded-xl bg-surface-2 px-3">
            <span>🔥 {t.warmupSet}</span>
            <input
              type="checkbox"
              checked={item.warmupSet}
              onChange={(e) => onChange({ warmupSet: e.target.checked })}
              className="h-6 w-6 accent-[rgb(var(--color-accent))]"
            />
          </label>
        </>
      )}
      <div className="flex gap-2 pt-2">
        <button type="button" className="btn-secondary flex-1 text-danger" onClick={onRemove}>
          {t.remove}
        </button>
        <button type="button" className="btn-primary flex-1" onClick={onDone}>
          {t.done}
        </button>
      </div>
    </div>
  );
}
