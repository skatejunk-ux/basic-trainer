// Bewegende cartoon-uitleg per machine: poppetje + machine in zijaanzicht, fase-label en genummerde instelpunten.
import { useEffect, useRef, useState } from 'react';
import type { Exercise } from '../types';
import { nl } from '../content/nl';
import { Figure, Floor, Pin } from './draw';
import { joints, sample, type Pt } from './rig';
import { SCENES, type Scene } from './scenes';

const t = nl.cartoon;

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Alle cartoons van een oefening (de back extension heeft er twee); niets als er geen scène is. */
export function MachineCartoons({ exercise }: { exercise: Exercise }) {
  const scenes = SCENES[exercise.animationId];
  if (!scenes) return null;
  return (
    <div className="space-y-3">
      {scenes.map((s) => (
        <MachineCartoon key={s.id} scene={s} exercise={exercise} />
      ))}
    </div>
  );
}

function MachineCartoon({ scene, exercise }: { scene: Scene; exercise: Exercise }) {
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  const [visible, setVisible] = useState(true);
  const [ms, setMs] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => setPlaying(!reduced), [reduced]);

  // Alleen animeren als de cartoon in beeld is (scheelt batterij in de workout-modus).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setMs((m) => m + (now - last));
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, visible]);

  const { label } = sample(scene.frames, ms, !scene.linear);
  const pins = scenePins(scene, exercise);

  const name = scene.title ? `${exercise.name} (${scene.title})` : exercise.name;
  return (
    <figure ref={ref} className="machine-cartoon rounded-xl border border-border bg-surface p-2" data-scene={scene.id}>
      {scene.title && <p className="px-1 text-sm font-semibold">{scene.title}</p>}
      <button
        type="button"
        className="block w-full"
        onClick={() => setPlaying((p) => !p)}
        aria-label={`${t.label(name)}. ${playing ? t.pause : t.play}`}
      >
        <CartoonSvg scene={scene} ms={ms} pins={pins} />
      </button>
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-sm font-semibold" data-testid="cartoon-phase">
          {label}
        </p>
        <button
          type="button"
          className="btn-ghost min-h-[44px] shrink-0 px-2 text-sm"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? `⏸ ${t.pause}` : `▶ ${t.play}`}
        </button>
      </div>
      {pins.length > 0 && (
        <figcaption className="px-1 pb-1 text-sm">
          <p className="text-muted">{t.settings}</p>
          <ol className="mt-1 space-y-1">
            {pins.map((p, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="mc-pin-swatch" aria-hidden>
                  {i + 1}
                </span>
                {p.labels.join(', ')}
              </li>
            ))}
          </ol>
        </figcaption>
      )}
    </figure>
  );
}

/** Instelpunten die bij de instelvelden van deze oefening horen. */
function scenePins(scene: Scene, exercise: Exercise) {
  const j0 = joints(scene.frames[0].pose);
  const fields = new Map(exercise.settingFields.map((f) => [f.key, f.label]));
  return scene.pins
    .map((p) => ({ at: p.at(j0), labels: p.keys.filter((k) => fields.has(k)).map((k) => fields.get(k)!) }))
    .filter((p) => p.labels.length > 0);
}

/** De tekening zelf op tijdstip `ms` van de cyclus. */
export function CartoonSvg({ scene, ms, pins = [] }: { scene: Scene; ms: number; pins?: { at: Pt }[] }) {
  const j = joints(sample(scene.frames, ms, !scene.linear).pose);
  const j0 = joints(scene.frames[0].pose);
  return (
    <svg viewBox="0 0 300 240" className="h-auto w-full" aria-hidden>
      <Floor />
      {scene.back?.(j, j0, ms)}
      <Figure j={j} />
      {scene.front?.(j, j0, ms)}
      {pins.map((p, i) => (
        <Pin key={i} at={p.at} n={i + 1} />
      ))}
    </svg>
  );
}
