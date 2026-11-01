import { describe, expect, it } from 'vitest';
import { SEED_EXERCISES } from '../content/seed.nl';
import { cycleMs, joints, LEN, sample, type Pose } from './rig';
import { SCENES } from './scenes';

const upright: Pose = { hip: [100, 100], torso: 180, uArm: 0, fArm: 0, thigh: 0, shin: 0 };

describe('rig', () => {
  it('rechtop staand: schouder boven de heup, arm en been recht omlaag', () => {
    const j = joints(upright);
    expect(j.shoulder[0]).toBeCloseTo(100);
    expect(j.shoulder[1]).toBeCloseTo(100 - LEN.torso);
    expect(j.hand[1]).toBeCloseTo(j.shoulder[1] + LEN.uArm + LEN.fArm);
    expect(j.ankle[1]).toBeCloseTo(100 + LEN.thigh + LEN.shin);
    expect(j.toe[0]).toBeGreaterThan(j.ankle[0]); // voet wijst vooruit
  });

  it('arm 90° = recht vooruit, ook bij een voorover gebogen romp haaks op de romp', () => {
    const j = joints({ ...upright, uArm: 90 });
    expect(j.elbow[0]).toBeCloseTo(100 + LEN.uArm);
    expect(j.elbow[1]).toBeCloseTo(j.shoulder[1]);
  });

  it('sample interpoleert tussen keyframes en herhaalt de cyclus', () => {
    const frames = [
      { pose: upright, ms: 100, label: 'a' },
      { pose: { ...upright, torso: 160 }, ms: 100, label: 'b' },
    ];
    expect(cycleMs(frames)).toBe(200);
    expect(sample(frames, 150, false).pose.torso).toBeCloseTo(170);
    expect(sample(frames, 150, false).label).toBe('b');
    expect(sample(frames, 350, false).pose.torso).toBeCloseTo(170);
  });
});

describe('scènes', () => {
  it('elke seed-oefening heeft een cartoon', () => {
    for (const ex of SEED_EXERCISES) expect(SCENES[ex.animationId], ex.id).toBeDefined();
  });

  it('back extension toont machine én 45°-bank', () => {
    expect(SCENES['back-extension-machine'].map((s) => s.id)).toEqual(['back-extension-machine', 'back-extension-bench']);
  });

  it('instelpunten verwijzen naar bestaande instelvelden', () => {
    for (const ex of SEED_EXERCISES) {
      const keys = new Set(ex.settingFields.map((f) => f.key));
      for (const scene of SCENES[ex.animationId]) {
        for (const pin of scene.pins) expect(pin.keys.some((k) => keys.has(k)), `${scene.id} ${pin.keys}`).toBe(true);
      }
    }
  });

  it('bewegingsbaan (ook in vooraanzicht) blijft binnen het beeld', () => {
    for (const scenes of Object.values(SCENES)) {
      for (const scene of scenes) {
        if (!scene.track) continue;
        for (let ms = 0; ms < cycleMs(scene.frames); ms += 50) {
          const [x, y] = scene.track.at(joints(sample(scene.frames, ms).pose));
          expect(x, scene.id).toBeGreaterThan(0);
          expect(x, scene.id).toBeLessThan(300);
          expect(y, scene.id).toBeGreaterThan(0);
          expect(y, scene.id).toBeLessThan(240);
        }
      }
    }
  });

  it('poppetje en machine blijven binnen het beeld', () => {
    for (const scenes of Object.values(SCENES)) {
      for (const scene of scenes) {
        for (let ms = 0; ms < cycleMs(scene.frames); ms += 50) {
          const j = joints(sample(scene.frames, ms).pose);
          for (const [x, y] of [j.hand, j.farHand, j.toe, j.farToe, j.knee]) {
            expect(x, scene.id).toBeGreaterThan(0);
            expect(x, scene.id).toBeLessThan(300);
            expect(y, scene.id).toBeGreaterThan(0);
            expect(y, scene.id).toBeLessThan(240);
          }
          expect(j.head[1] - LEN.head, scene.id).toBeGreaterThan(0);
        }
      }
    }
  });
});
