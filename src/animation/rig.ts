// 2D-poppetje in zijaanzicht (kijkt naar rechts) met forward kinematics (PLAN.md §10, animaties per machine).
// Hoeken in graden; richting a = (sin a, cos a) in SVG-coördinaten: 0 = omlaag, 90 = vooruit, 180 = omhoog.

export type Pt = [number, number];

export interface Pose {
  hip: Pt;
  /** Absoluut: 180 = rechtop, < 180 voorover, > 180 achterover. */
  torso: number;
  /** Relatief aan de romp: 0 = hangend langs het lijf, 90 = recht vooruit, 180 = omhoog. */
  uArm: number;
  /** Relatief aan de bovenarm: buiging in de elleboog. */
  fArm: number;
  /** Absoluut. */
  thigh: number;
  shin: number;
  /** Absolute voetrichting; standaard haaks op het scheenbeen. */
  foot?: number;
  /** Verre kant; standaard gelijk aan de nabije kant. */
  farUArm?: number;
  farFArm?: number;
  farThigh?: number;
  farShin?: number;
  farFoot?: number;
  /** 0..1: hoe ver de gewichtsstapel omhoog is. */
  load?: number;
}

type FullPose = Required<Pose>;

export const LEN = { torso: 64, neck: 9, head: 15, uArm: 34, fArm: 32, thigh: 46, shin: 46, foot: 15 };

export function dir(a: number, len = 1): Pt {
  const r = (a * Math.PI) / 180;
  return [Math.sin(r) * len, Math.cos(r) * len];
}

export const add = (p: Pt, ...qs: Pt[]): Pt => qs.reduce<Pt>((s, q) => [s[0] + q[0], s[1] + q[1]], p);
export const along = (p: Pt, a: number, len: number): Pt => add(p, dir(a, len));

export function resolve(p: Pose): FullPose {
  return {
    ...p,
    foot: p.foot ?? p.shin + 90,
    farUArm: p.farUArm ?? p.uArm,
    farFArm: p.farFArm ?? p.fArm,
    farThigh: p.farThigh ?? p.thigh,
    farShin: p.farShin ?? p.shin,
    farFoot: p.farFoot ?? (p.farShin !== undefined ? p.farShin + 90 : (p.foot ?? p.shin + 90)),
    load: p.load ?? 0,
  };
}

export interface Joints {
  hip: Pt;
  shoulder: Pt;
  head: Pt;
  torso: number;
  elbow: Pt;
  hand: Pt;
  knee: Pt;
  ankle: Pt;
  toe: Pt;
  farElbow: Pt;
  farHand: Pt;
  farKnee: Pt;
  farAnkle: Pt;
  farToe: Pt;
  /** Absolute hoeken, handig voor machine-onderdelen. */
  foot: number;
  load: number;
}

export function joints(pose: Pose): Joints {
  const p = resolve(pose);
  const shoulder = along(p.hip, p.torso, LEN.torso);
  const arm = (u: number, f: number) => {
    const ua = p.torso + 180 + u;
    const elbow = along(shoulder, ua, LEN.uArm);
    return [elbow, along(elbow, ua + f, LEN.fArm)] as const;
  };
  const leg = (thigh: number, shin: number, foot: number) => {
    const knee = along(p.hip, thigh, LEN.thigh);
    const ankle = along(knee, shin, LEN.shin);
    return [knee, ankle, along(ankle, foot, LEN.foot)] as const;
  };
  const [elbow, hand] = arm(p.uArm, p.fArm);
  const [farElbow, farHand] = arm(p.farUArm, p.farFArm);
  const [knee, ankle, toe] = leg(p.thigh, p.shin, p.foot);
  const [farKnee, farAnkle, farToe] = leg(p.farThigh, p.farShin, p.farFoot);
  return {
    hip: p.hip,
    shoulder,
    head: along(p.hip, p.torso, LEN.torso + LEN.neck + LEN.head - 3),
    torso: p.torso,
    elbow,
    hand,
    knee,
    ankle,
    toe,
    farElbow,
    farHand,
    farKnee,
    farAnkle,
    farToe,
    foot: p.foot,
    load: p.load,
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const ra = resolve(a);
  const rb = resolve(b);
  const out = { hip: [lerp(ra.hip[0], rb.hip[0], t), lerp(ra.hip[1], rb.hip[1], t)] } as FullPose;
  for (const k of Object.keys(ra) as (keyof FullPose)[]) {
    if (k !== 'hip') (out[k] as number) = lerp(ra[k] as number, rb[k] as number, t);
  }
  return out;
}

export interface Keyframe {
  pose: Pose;
  /** Duur van de overgang vanaf het vorige keyframe (cyclisch) naar dit keyframe. */
  ms: number;
  label: string;
  /** Comic-actiewoord in een knal-wolkje tijdens deze fase, bv. "DUW!". */
  pow?: string;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export const cycleMs = (frames: Keyframe[]) => frames.reduce((s, f) => s + f.ms, 0);

/** Pose en label op tijdstip `ms` binnen de (herhalende) cyclus; `k` = voortgang (0..1) binnen het keyframe. */
export function sample(
  frames: Keyframe[],
  ms: number,
  easing = true,
): { pose: Pose; label: string; index: number; k: number } {
  const total = cycleMs(frames);
  let t = ((ms % total) + total) % total;
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    if (t < f.ms || i === frames.length - 1) {
      const from = frames[(i - 1 + frames.length) % frames.length].pose;
      const k = Math.min(1, t / f.ms);
      return { pose: lerpPose(from, f.pose, easing ? ease(k) : k), label: f.label, index: i, k };
    }
    t -= f.ms;
  }
  throw new Error('unreachable');
}
