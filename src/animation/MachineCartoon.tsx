// Bewegende cartoon-uitleg per machine: poppetje + machine in zijaanzicht, fase-label en genummerde instelpunten.
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react';
import type { Exercise } from '../types';
import { nl } from '../content/nl';
import { Icon } from '../components/Icon';
import { Burst, Figure, Pin, SpeedLines, Stage, Track, type FigureFx } from './draw';
import { cycleMs, joints, sample, type Keyframe, type Pt } from './rig';
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

/** Tijd in ms die doorloopt zolang `playing` en het element in beeld is (scheelt batterij in de workout-modus). */
function useCartoonClock(ref: RefObject<Element>, playing: boolean) {
  const [visible, setVisible] = useState(true);
  const [ms, setMs] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

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

  return ms;
}

/** Kleine, doorlopende versie zonder knoppen en instelpunten, bv. naast de titel in de workout. */
export function MiniCartoon({ exercise, sceneId }: { exercise: Exercise; sceneId?: string }) {
  const scenes = SCENES[exercise.animationId];
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const ms = useCartoonClock(ref, !reduced);
  const scene = scenes?.find((s) => s.id === sceneId) ?? scenes?.[0];
  if (!scene) return null;
  return (
    <div ref={ref} className="machine-cartoon mc-mini w-[112px]" data-mini-scene={scene.id}>
      <CartoonSvg scene={scene} ms={ms} track={false} />
    </div>
  );
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
  const ref = useRef<HTMLElement>(null);
  const ms = useCartoonClock(ref, playing);

  useEffect(() => setPlaying(!reduced), [reduced]);

  const { label } = sample(scene.frames, ms, !scene.linear);
  const pins = scenePins(scene, exercise);

  const name = scene.title ? `${exercise.name} (${scene.title})` : exercise.name;
  return (
    <figure ref={ref} className="machine-cartoon card p-2" data-scene={scene.id}>
      {scene.title && <p className="mc-title px-1 pb-1">{scene.title}</p>}
      <button
        type="button"
        className="block w-full"
        onClick={() => setPlaying((p) => !p)}
        aria-label={`${t.label(name)}. ${playing ? t.pause : t.play}`}
      >
        <CartoonSvg scene={scene} ms={ms} pins={pins} />
      </button>
      <PhaseBar frames={scene.frames} ms={ms} />
      <div className="mt-1 flex items-center justify-between gap-2 px-1">
        <p className="mc-caption" data-testid="cartoon-phase">
          {label}
        </p>
        <button
          type="button"
          className="btn-ghost min-h-[44px] shrink-0 px-2 text-sm"
          onClick={() => setPlaying((p) => !p)}
        >
          <Icon name={playing ? 'pause' : 'play'} className="h-3.5 w-3.5" />
          {playing ? t.pause : t.play}
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

/** Fases van de cyclus; opeenvolgende keyframes met hetzelfde label vormen één fase. */
function phases(frames: Keyframe[]) {
  const out: { label: string; ms: number }[] = [];
  for (const f of frames) {
    const last = out[out.length - 1];
    if (last?.label === f.label) last.ms += f.ms;
    else out.push({ label: f.label, ms: f.ms });
  }
  return out;
}

/** Tempo-balk: één segment per fase, breedte naar duur, het lopende segment vult zich. */
function PhaseBar({ frames, ms }: { frames: Keyframe[]; ms: number }) {
  const list = useMemo(() => phases(frames), [frames]);
  if (list.length < 2) return null;
  const total = cycleMs(frames);
  let t0 = ((ms % total) + total) % total;
  return (
    <div className="mx-1 mt-2 flex gap-1.5" aria-hidden>
      {list.map((p, i) => {
        const fill = Math.min(1, Math.max(0, t0 / p.ms));
        t0 -= p.ms;
        return (
          <div key={i} className="mc-phase" style={{ flexGrow: p.ms }}>
            <div className="mc-phase-fill h-full" style={{ width: `${fill * 100}%` }} />
          </div>
        );
      })}
    </div>
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

/** Punten van de bewegingsbaan: het werkende punt, bemonsterd over de werkfase. */
function trackPoints(scene: Scene): Pt[] {
  if (!scene.track) return [];
  const { at, phase } = scene.track;
  const start = scene.frames.slice(0, phase).reduce((s, f) => s + f.ms, 0);
  const len = scene.frames[phase].ms;
  const n = 24;
  return Array.from({ length: n + 1 }, (_, i) =>
    at(joints(sample(scene.frames, start + (len * Math.min(i, n - 0.01)) / n, !scene.linear).pose)),
  );
}

/** Spiegelt een punt rond het midden (vooraanzicht-scènes zijn symmetrisch). */
const MIRROR = 'translate(300,0) scale(-1,1)';

/** De tekening zelf op tijdstip `ms` van de cyclus; `track` = ook bewegingsbaan en comic-effecten. */
export function CartoonSvg({
  scene,
  ms,
  pins = [],
  track = true,
}: {
  scene: Scene;
  ms: number;
  pins?: { at: Pt }[];
  track?: boolean;
}) {
  // useId bevat dubbele punten; die zijn lastig in url(#…).
  const id = `mc${useId().replace(/:/g, '')}`;
  const easing = !scene.linear;
  const { pose, index, k } = sample(scene.frames, ms, easing);
  const j = joints(pose);
  const j0 = joints(scene.frames[0].pose);
  const path = useMemo(() => (track ? trackPoints(scene) : []), [scene, track]);
  const frame = scene.frames[index];
  const prev = scene.frames[(index - 1 + scene.frames.length) % scene.frames.length];
  // Uitademen zodra de stapel (of het lichaam) omhoog gaat: mond open en een wolkje.
  const fx: FigureFx = { exhale: (frame.pose.load ?? 0) > (prev.pose.load ?? 0) ? k : null };
  const working = !!scene.track && index === scene.track.phase;
  const front = !!scene.figure;
  let speed: { at: Pt; v: Pt } | null = null;
  if (track && working && scene.track) {
    const at = scene.track.at(j);
    const before = scene.track.at(joints(sample(scene.frames, ms - 80, easing).pose));
    speed = { at, v: [at[0] - before[0], at[1] - before[1]] };
  }
  return (
    <span className="mc-panel">
      <svg viewBox="0 0 300 240" className="block h-auto w-full" aria-hidden>
        <Stage id={id} />
        {scene.back?.(j, j0, ms)}
        {scene.figure ? scene.figure(j, fx) : <Figure j={j} fx={fx} />}
        {scene.front?.(j, j0, ms)}
        <Track p={path} active={working} />
        {front && (
          <g transform={MIRROR}>
            <Track p={path} active={working} />
          </g>
        )}
        {speed && <SpeedLines {...speed} />}
        {speed && front && (
          <g transform={MIRROR}>
            <SpeedLines {...speed} />
          </g>
        )}
        {pins.map((p, i) => (
          <Pin key={i} at={p.at} n={i + 1} />
        ))}
        {track && frame.pow && (
          <Burst at={scene.burst ?? [238, 38]} text={frame.pow} t={k * frame.ms} dur={frame.ms} />
        )}
      </svg>
    </span>
  );
}
