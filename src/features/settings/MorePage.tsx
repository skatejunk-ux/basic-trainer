// Meer (PLAN.md §6.7): instellingen, thema, weekdoel, backup en info.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AppSettings } from '../../types';
import {
  getSettings,
  importBackup,
  seedIfEmpty,
  shareOrDownloadBackup,
  updateSettings,
  type ImportMode,
} from '../../db';
import { nl } from '../../content/nl';
import { Sheet } from '../../components/Sheet';
import { applyTheme } from '../../theme';
import { useWorkout } from '../workout/store';

const t = nl.more;
const dateFmt = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

export function MorePage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  if (!settings) return <p className="text-muted">{nl.today.loading}</p>;

  const change = async (changes: Partial<Omit<AppSettings, 'id'>>) => {
    const next = await updateSettings(changes);
    setSettings(next);
    // Houd een eventueel lopende workout in sync met de nieuwe schakelaars.
    useWorkout.setState({ settings: next });
    if (changes.theme) applyTheme(changes.theme);
  };

  const doImport = async (mode: ImportMode) => {
    if (!pendingFile) return;
    if (mode === 'replace' && !window.confirm(t.replaceConfirm)) return;
    try {
      await importBackup(pendingFile, mode);
      await seedIfEmpty();
      const next = await getSettings();
      setSettings(next);
      applyTheme(next.theme);
      useWorkout.setState({ status: 'idle' });
      setMessage({ ok: true, text: t.imported });
    } catch (err) {
      setMessage({ ok: false, text: t.importError(err instanceof Error ? err.message : String(err)) });
    }
    setPendingFile(null);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{nl.pages.more.title}</h1>

      <Group title={t.workout}>
        <Switch label={`📳 ${t.vibration}`} on={settings.vibration} onChange={(v) => change({ vibration: v })} />
        <Switch label={`🔔 ${t.sound}`} on={settings.sound} onChange={(v) => change({ sound: v })} />
        <Switch
          label={`🔆 ${t.keepScreenOn}`}
          on={settings.keepScreenOn}
          onChange={(v) => change({ keepScreenOn: v })}
          hint={settings.keepScreenOn ? undefined : t.screenHint}
        />
        <div className="px-3 py-2">
          <p className="mb-2">{t.weekGoal}</p>
          <Segmented
            options={[3, 4].map((n) => ({ value: String(n), label: t.perWeek(n) }))}
            value={String(settings.weekGoal)}
            onChange={(v) => change({ weekGoal: Number(v) as 3 | 4 })}
          />
        </div>
        <label className="block px-3 py-2">
          <span className="mb-2 block">{t.bodyWeight}</span>
          <input
            inputMode="decimal"
            key={settings.bodyWeightKg ?? ''}
            defaultValue={settings.bodyWeightKg ?? ''}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              const v = Number(raw.replace(',', '.'));
              if (!raw) return void change({ bodyWeightKg: undefined });
              if (v >= 30 && v <= 300 && v !== settings.bodyWeightKg) void change({ bodyWeightKg: Math.round(v * 10) / 10 });
            }}
            className="min-h-touch w-full rounded-xl border border-border bg-surface-2 px-3 outline-none focus:border-accent"
          />
          <span className="mt-1 block text-xs text-muted">{t.bodyWeightHint}</span>
        </label>
      </Group>

      <Group title={t.appearance}>
        <div className="px-3 py-2">
          <Segmented
            options={(['dark', 'light', 'system'] as const).map((v) => ({ value: v, label: t.theme[v] }))}
            value={settings.theme}
            onChange={(v) => change({ theme: v as AppSettings['theme'] })}
          />
        </div>
      </Group>

      <Group title={t.backup}>
        <div className="space-y-3 px-3 py-2">
          <p className="text-sm text-muted">{t.backupText}</p>
          <p className="text-sm">
            {settings.lastBackupAt ? t.lastBackup(dateFmt.format(settings.lastBackupAt)) : t.neverBackup}
          </p>
          {message && (
            <p role="status" className={`text-sm font-semibold ${message.ok ? 'text-success' : 'text-danger'}`}>
              {message.text}
            </p>
          )}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={async () => {
              const r = await shareOrDownloadBackup();
              if (r !== 'cancelled') {
                setSettings(await getSettings());
                setMessage({ ok: true, text: t.exported });
              }
            }}
          >
            💾 {t.export}
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => fileRef.current?.click()}>
            📂 {t.import}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            data-testid="backup-file"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) setPendingFile(await file.text());
            }}
          />
        </div>
      </Group>

      <Group title={t.about}>
        <div className="space-y-2 px-3 py-2 text-sm">
          <p className="text-muted">{t.aboutText}</p>
          <Link to="/dev/muscles" className="font-semibold text-accent">
            {t.muscles} →
          </Link>
          <p className="text-muted">{t.version(__APP_VERSION__)}</p>
        </div>
      </Group>

      <Sheet title={t.importMode} open={pendingFile !== null} onClose={() => setPendingFile(null)}>
        <div className="space-y-2">
          <button type="button" className="btn-primary w-full" onClick={() => doImport('merge')}>
            {t.merge}
          </button>
          <button type="button" className="btn-secondary w-full text-danger" onClick={() => doImport('replace')}>
            {t.replace}
          </button>
        </div>
      </Sheet>
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="divide-y divide-border rounded-2xl bg-surface">{children}</div>
    </div>
  );
}

function Switch({
  label,
  on,
  hint,
  onChange,
}: {
  label: string;
  on: boolean;
  hint?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="px-3 py-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className="flex min-h-touch w-full items-center justify-between gap-3 text-left"
      >
        <span>{label}</span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-border'}`}>
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </span>
      </button>
      {hint && <p className="pb-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[44px] flex-1 rounded-lg text-sm font-semibold ${value === o.value ? 'bg-accent text-accent-fg' : 'text-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
