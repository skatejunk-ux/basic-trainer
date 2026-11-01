// Ontwikkelpagina: alle machine-cartoons onder elkaar, met elk keyframe stilstaand, voor review.
import { SEED_EXERCISES } from '../content/seed.nl';
import { CartoonSvg, MachineCartoons } from './MachineCartoon';
import { SCENES } from './scenes';

export function DevMachinesPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Machine-cartoons (dev)</h1>
      <ul className="mt-4 space-y-4">
        {SEED_EXERCISES.map((ex) => (
          <li key={ex.id}>
            <h2 className="mb-2 text-lg font-semibold">{ex.name}</h2>
            <MachineCartoons exercise={ex} />
            {SCENES[ex.animationId]?.map((scene) => (
              <div key={scene.id} className="machine-cartoon mt-2 grid grid-cols-2 gap-1" data-frames={scene.id}>
                {scene.frames.map((_f, i) => {
                  const at = scene.frames.slice(0, i + 1).reduce((s, k) => s + k.ms, 0) - 1;
                  return (
                    <div key={i} className="rounded-lg border border-border">
                      <CartoonSvg scene={scene} ms={at} />
                    </div>
                  );
                })}
              </div>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
