// Cartoon-scènes per machine (Technogym Selection-stijl, zijaanzicht). Eén scène per animationId,
// de back extension heeft er twee (machine en 45°-bank). Tempo volgt de seed (bv. 1 s duwen – 2 s terug).
import type { ReactNode } from 'react';
import { nl } from '../content/nl';
import { Bar, Dot, FLOOR, Seg, Stack } from './draw';
import { add, along, dir, LEN, type Joints, type Keyframe, type Pose, type Pt } from './rig';

export interface Scene {
  id: string;
  /** Titel als een oefening meerdere scènes heeft. */
  title?: string;
  frames: Keyframe[];
  /** Lineair i.p.v. ease-in-out (lopen). */
  linear?: boolean;
  /** Machine-onderdelen achter resp. voor het poppetje; `j0` is de startpositie (vaste onderdelen). */
  back?: (j: Joints, j0: Joints, ms: number) => ReactNode;
  front?: (j: Joints, j0: Joints, ms: number) => ReactNode;
  /** Genummerde instelpunten; `keys` verwijzen naar settingFields van de oefening. */
  pins: { keys: string[]; at: (j0: Joints) => Pt }[];
  /** Bewegingsbaan met pijl: het punt dat beweegt, getekend over de werkfase `phase` (index in `frames`). */
  track?: { at: (j: Joints) => Pt; phase: number };
}

const t = nl.cartoon;
const BIJSCHUIF = 'bijschuifgewicht';
const STACK_TOP = 64;

/** Standaard krachtcyclus: start, 1 s concentrisch, 2 s terug. */
function strength(start: Pose, end: Pose, work: string, extra: Keyframe[] = []): Keyframe[] {
  return [
    { pose: start, ms: 700, label: t.start },
    { pose: { ...end, load: 1 }, ms: 1000, label: work },
    ...extra,
    { pose: start, ms: 2000, label: t.back },
  ];
}

/** Zitje met paal naar de vloer. */
function Seat({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <>
      <Seg p={[[(x0 + x1) / 2, y], [(x0 + x1) / 2, FLOOR - 4]]} w={10} c="frame" />
      <Seg p={[[x0 - 14, FLOOR - 4], [x1 + 14, FLOOR - 4]]} w={8} c="frame" />
      <Seg p={[[x0, y], [x1, y]]} w={12} c="pad" />
    </>
  );
}

/** Rugkussen evenwijdig aan de romp (`torso`), `off` px achter de rug. */
function Backrest({ hip, torso, from, to, off = 21 }: { hip: Pt; torso: number; from: number; to: number; off?: number }) {
  const back = dir(torso + 90, off);
  return <Seg p={[add(along(hip, torso, from), back), add(along(hip, torso, to), back)]} w={12} c="pad" />;
}

const seated = { thigh: 90, shin: 0, foot: 90 };

// ---------------------------------------------------------------- Leg press
const LP_HIP: Pt = [128, 160];
const lpStart: Pose = { hip: LP_HIP, torso: 215, uArm: -5, fArm: 30, thigh: 135, shin: 45, foot: 180 };
const lpEnd: Pose = { ...lpStart, thigh: 97, shin: 83 };

function legPressMachine(j: Joints, j0: Joints) {
  const px = j.ankle[0] + 9;
  return (
    <>
      <Stack x={22} top={STACK_TOP} load={j.load} />
      <Seg p={[[60, FLOOR - 4], [276, FLOOR - 4]]} w={8} c="frame" />
      <Seg p={[[264, FLOOR - 4], [264, 118]]} w={14} c="frame" />
      <Seg p={[along(j0.hip, 215, 20), [92, FLOOR - 4]]} w={8} c="frame" />
      <Seat x0={104} x1={150} y={177} />
      <Backrest hip={j0.hip} torso={215} from={8} to={66} />
      <Seg p={[[px, j.ankle[1] - 8], [264, j.ankle[1] - 8]]} w={6} c="frame" />
      <Seg p={[[px, j.ankle[1] - 30], [px, j.ankle[1] + 10]]} w={8} c="pad" />
      <Bar at={[j0.hand[0] + 2, j0.hand[1] + 6]} a={90} len={16} w={6} c="grip" />
    </>
  );
}

const legPress: Scene = {
  id: 'leg-press',
  frames: strength(lpStart, lpEnd, t.push),
  back: legPressMachine,
  track: { at: (j) => add(j.ankle, [0, 24]), phase: 1 },
  pins: [
    { keys: ['seat'], at: (j) => add(along(j.hip, 215, 40), dir(305, 36)) },
    { keys: ['feet', 'weightPerLeg'], at: (j) => [j.ankle[0] + 9, j.ankle[1] - 42] },
    { keys: [BIJSCHUIF], at: () => [38, STACK_TOP - 14] },
  ],
};

// ---------------------------------------------------------------- Single-leg leg press
const sl = { farThigh: 112, farShin: 5, farFoot: 95 };
const singleLegPress: Scene = {
  ...legPress,
  id: 'single-leg-press',
  frames: strength({ ...lpStart, ...sl }, { ...lpEnd, ...sl }, t.push).map((f, i) =>
    i === 0 ? { ...f, label: t.weakLeg } : f,
  ),
};

// ---------------------------------------------------------------- Back extension (Technogym Lower Back)
const BE_HIP: Pt = [130, 172];
const crossed = { uArm: 30, fArm: 125 };
const beStart: Pose = { hip: BE_HIP, torso: 150, ...crossed, thigh: 92, shin: 2, foot: 92 };
const beEnd: Pose = { ...beStart, torso: 184 };
const BE_PIVOT: Pt = [106, 178];

const backExtensionMachine: Scene = {
  id: 'back-extension-machine',
  title: nl.workout.typeMachine,
  frames: [
    { pose: beStart, ms: 700, label: t.start },
    { pose: { ...beEnd, load: 1 }, ms: 1000, label: t.up },
    { pose: { ...beEnd, load: 1 }, ms: 1000, label: t.hold },
    { pose: beStart, ms: 2000, label: t.down },
  ],
  back: (j) => {
    const pad = add(along(j.hip, j.torso, 46), dir(j.torso + 90, 21));
    return (
      <>
        <Stack x={22} top={STACK_TOP} load={j.load} />
        <Seat x0={106} x1={152} y={190} />
        <Seg p={[BE_PIVOT, pad]} w={7} c="frame" />
        <Dot at={BE_PIVOT} r={6} c="grip" />
        <Bar at={pad} a={j.torso} len={30} w={13} c="pad" />
      </>
    );
  },
  front: (j) => {
    const at = add(along(j.hip, 92, 34), [0, -19]);
    return (
      <>
        <Seg p={[at, [at[0] + 26, at[1]], [at[0] + 26, FLOOR - 4]]} w={6} c="frame" />
        <Bar at={at} a={90} len={18} w={13} c="pad" />
      </>
    );
  },
  pins: [
    { keys: ['seat'], at: () => [129, 208] },
    { keys: ['backpad'], at: () => [BE_PIVOT[0] - 14, BE_PIVOT[1] + 12] },
    { keys: [BIJSCHUIF], at: () => [38, STACK_TOP - 14] },
  ],
  track: { at: (j) => along(j.hip, j.torso, LEN.torso + 54), phase: 1 },
};

// ---------------------------------------------------------------- Back extension (45°-bank)
const bbTop: Pose = { hip: [165, 112], torso: 135, ...crossed, thigh: 315, shin: 315, foot: 45 };
const bbBottom: Pose = { ...bbTop, torso: 30 };

const backExtensionBench: Scene = {
  id: 'back-extension-bench',
  title: nl.workout.typeBench,
  frames: [
    { pose: bbTop, ms: 700, label: t.start },
    { pose: bbBottom, ms: 2000, label: t.down },
    { pose: bbTop, ms: 1000, label: t.up },
    { pose: bbTop, ms: 1000, label: t.hold },
  ],
  back: (_j, j0) => {
    const pad = add(along(j0.hip, 315, 14), dir(45, 19));
    const plate = add(along(j0.ankle, 45, 7), dir(315, 9));
    return (
      <>
        <Seg p={[pad, [pad[0], FLOOR - 4]]} w={8} c="frame" />
        <Seg p={[plate, [plate[0] - 8, FLOOR - 4]]} w={8} c="frame" />
        <Seg p={[[plate[0] - 30, FLOOR - 4], [pad[0] + 30, FLOOR - 4]]} w={8} c="frame" />
        <Seg p={[add(pad, dir(315, 6)), plate]} w={8} c="frame" />
        <Bar at={pad} a={315} len={32} w={13} c="pad" />
        <Bar at={plate} a={45} len={26} w={6} c="frame" />
      </>
    );
  },
  front: (_j, j0) => <Dot at={add(along(j0.ankle, 135, 10), dir(225, 13))} r={8} c="pad" />,
  pins: [
    { keys: ['padHeight'], at: (j) => add(along(j.hip, 315, 14), dir(45, 40)) },
    { keys: ['footrest'], at: (j) => add(j.ankle, [26, 26]) },
  ],
  track: { at: (j) => along(j.hip, j.torso, LEN.torso + 54), phase: 2 },
};

// ---------------------------------------------------------------- Shoulder press
const SP_HIP: Pt = [120, 172];
const spStart: Pose = { hip: SP_HIP, torso: 180, uArm: 30, fArm: 145, ...seated };
const spEnd: Pose = { ...spStart, uArm: 168, fArm: 8 };
const SP_PIVOT: Pt = [82, 112];

const shoulderPress: Scene = {
  id: 'shoulder-press',
  frames: strength(spStart, spEnd, t.push),
  track: { at: (j) => add(j.hand, [16, 0]), phase: 1 },
  back: (j, j0) => (
    <>
      <Stack x={18} top={STACK_TOP} load={j.load} />
      <Seg p={[[SP_PIVOT[0], FLOOR - 4], SP_PIVOT]} w={10} c="frame" />
      <Seat x0={98} x1={144} y={190} />
      <Backrest hip={j0.hip} torso={180} from={10} to={66} />
      <Seg p={[SP_PIVOT, j.hand]} w={7} c="frame" />
      <Dot at={SP_PIVOT} r={6} c="grip" />
      <Bar at={j.hand} a={0} len={16} w={7} c="grip" />
    </>
  ),
  pins: [
    { keys: ['seat'], at: () => [121, 208] },
    { keys: ['grip'], at: (j) => [j.hand[0] + 22, j.hand[1] + 24] },
    { keys: [BIJSCHUIF], at: () => [34, STACK_TOP - 14] },
  ],
};

// ---------------------------------------------------------------- Chest press
const CP_HIP: Pt = [100, 172];
const cpStart: Pose = { hip: CP_HIP, torso: 180, uArm: -60, fArm: 150, ...seated };
const cpEnd: Pose = { ...cpStart, uArm: 85, fArm: 5 };
const CP_PIVOT: Pt = [92, 26];

const chestPress: Scene = {
  id: 'chest-press',
  frames: strength(cpStart, cpEnd, t.push),
  track: { at: (j) => add(j.hand, [0, -16]), phase: 1 },
  back: (j, j0) => (
    <>
      <Stack x={14} top={STACK_TOP} load={j.load} />
      <Seg p={[[64, FLOOR - 4], [64, 18], [CP_PIVOT[0], 18], CP_PIVOT]} w={10} c="frame" />
      <Seat x0={78} x1={124} y={190} />
      <Backrest hip={j0.hip} torso={180} from={10} to={66} />
      <Seg p={[CP_PIVOT, j.hand]} w={7} c="frame" />
      <Dot at={CP_PIVOT} r={6} c="grip" />
      <Bar at={j.hand} a={0} len={18} w={7} c="grip" />
    </>
  ),
  pins: [
    { keys: ['seat'], at: () => [101, 208] },
    { keys: ['range'], at: () => [CP_PIVOT[0] + 18, CP_PIVOT[1] - 4] },
    { keys: ['grip'], at: (j) => [j.hand[0] + 16, j.hand[1] + 18] },
    { keys: [BIJSCHUIF], at: () => [30, STACK_TOP - 14] },
  ],
};

// ---------------------------------------------------------------- Lat pulldown
const LAT_HIP: Pt = [130, 172];
const latStart: Pose = { hip: LAT_HIP, torso: 190, uArm: 160, fArm: 5, ...seated };
const latEnd: Pose = { ...latStart, uArm: -15, fArm: 165 };
const LAT_PULLEY: Pt = [128, 16];

const latPulldown: Scene = {
  id: 'lat-pulldown',
  frames: strength(latStart, latEnd, t.pull),
  track: { at: (j) => add(j.hand, [22, 0]), phase: 1 },
  back: (j) => (
    <>
      <Seg p={[[208, FLOOR - 4], [208, 10], [LAT_PULLEY[0] - 8, 10]]} w={10} c="frame" />
      <Stack x={238} top={STACK_TOP} load={j.load} />
      <line x1={LAT_PULLEY[0]} y1={LAT_PULLEY[1]} x2={j.hand[0]} y2={j.hand[1]} className="mc-cable" />
      <polyline points={`${LAT_PULLEY[0]},${LAT_PULLEY[1] - 6} 254,4 254,${STACK_TOP + 4}`} className="mc-cable" />
      <Dot at={LAT_PULLEY} r={6} c="grip" />
      <Seat x0={110} x1={156} y={190} />
      <Seg p={[add(j.hand, [-12, 3]), add(j.hand, [16, -4])]} w={6} c="grip" />
    </>
  ),
  front: (_j, j0) => {
    const at = add(j0.knee, [-8, -20]);
    return (
      <>
        <Seg p={[at, [208, at[1]]]} w={6} c="frame" />
        <Bar at={at} a={90} len={18} w={13} c="pad" />
      </>
    );
  },
  pins: [
    { keys: ['thighPad'], at: (j) => add(j.knee, [24, -36]) },
    { keys: ['grip'], at: (j) => add(j.hand, [-24, 0]) },
    { keys: [BIJSCHUIF], at: () => [254, STACK_TOP - 14] },
  ],
};

// ---------------------------------------------------------------- Seated cable row
const ROW_HIP: Pt = [100, 180];
const rowStart: Pose = { hip: ROW_HIP, torso: 172, uArm: 88, fArm: 0, thigh: 75, shin: 100, foot: 180 };
const rowEnd: Pose = { ...rowStart, torso: 184, uArm: -40, fArm: 120 };
const ROW_PULLEY: Pt = [208, 150];

const cableRow: Scene = {
  id: 'cable-row',
  frames: strength(rowStart, rowEnd, t.pull, [{ pose: { ...rowEnd, load: 1 }, ms: 1000, label: t.squeeze }]),
  track: { at: (j) => add(j.hand, [0, 16]), phase: 1 },
  back: (j, j0) => {
    const px = j0.ankle[0] + 9;
    return (
      <>
        <Stack x={240} top={STACK_TOP + 20} load={j.load} />
        <Seg p={[[px, FLOOR - 4], [px, 148]]} w={8} c="frame" />
        <Seg p={[[px, j0.ankle[1] - 26], [px, j0.ankle[1] + 12]]} w={8} c="pad" />
        <polyline points={`${ROW_PULLEY[0]},${ROW_PULLEY[1]} 256,${ROW_PULLEY[1]} 256,${STACK_TOP + 24}`} className="mc-cable" />
        <line x1={ROW_PULLEY[0]} y1={ROW_PULLEY[1]} x2={j.hand[0]} y2={j.hand[1]} className="mc-cable" />
        <Dot at={ROW_PULLEY} r={6} c="grip" />
        <Seg p={[[50, FLOOR - 4], [px + 14, FLOOR - 4]]} w={8} c="frame" />
        <Seat x0={68} x1={132} y={198} />
        <Seg p={[add(j.hand, [6, -7]), j.hand, add(j.hand, [6, 7])]} w={6} c="grip" />
      </>
    );
  },
  pins: [
    { keys: ['seat'], at: () => [84, 214] },
    { keys: ['grip'], at: (j) => add(j.hand, [10, -22]) },
    { keys: [BIJSCHUIF], at: () => [256, STACK_TOP + 6] },
  ],
};

// ---------------------------------------------------------------- Loopband 12-3-30
const TM_HIP: Pt = [140, 106];
const TM_DECK: [Pt, Pt] = [
  [30, 214],
  [250, 188],
];
const tm = (p: Partial<Pose>): Pose => ({ hip: TM_HIP, torso: 175, uArm: 0, fArm: 30, thigh: 0, shin: 0, ...p });
const step1 = tm({ thigh: 22, shin: 10, foot: 100, farThigh: -18, farShin: -25, farFoot: 70, uArm: -25, fArm: 25, farUArm: 25, farFArm: 35 });
const pass1 = tm({ thigh: 0, shin: 0, foot: 95, farThigh: 18, farShin: -20, farFoot: 80 });
const step2 = tm({ thigh: -18, shin: -25, foot: 70, farThigh: 22, farShin: 10, farFoot: 100, uArm: 25, fArm: 35, farUArm: -25, farFArm: 25 });
const pass2 = tm({ thigh: 18, shin: -20, foot: 80, farThigh: 0, farShin: 0, farFoot: 95 });

const treadmill: Scene = {
  id: 'treadmill-walk',
  linear: true,
  frames: [step1, pass1, step2, pass2].map((pose) => ({ pose, ms: 340, label: t.walk })),
  back: (_j, _j0, ms) => (
    <>
      <Seg p={[[TM_DECK[1][0] - 14, TM_DECK[1][1]], [222, 76]]} w={9} c="frame" />
      <Seg p={[[214, 108], [150, 116]]} w={5} c="frame" />
      <Bar at={[226, 70]} a={100} len={34} w={16} c="pad" />
      <Seg p={[[TM_DECK[0][0] + 10, FLOOR - 4], [TM_DECK[1][0], FLOOR - 4]]} w={8} c="frame" />
      <Seg p={[[TM_DECK[1][0] - 10, TM_DECK[1][1]], [TM_DECK[1][0] - 10, FLOOR - 4]]} w={8} c="frame" />
      <Seg p={TM_DECK} w={10} c="grip" />
      <line
        x1={TM_DECK[0][0]}
        y1={TM_DECK[0][1]}
        x2={TM_DECK[1][0]}
        y2={TM_DECK[1][1]}
        className="mc-belt"
        style={{ strokeDashoffset: ((ms / 12) % 24).toFixed(1) }}
      />
    </>
  ),
  pins: [{ keys: ['inclinePct', 'speedKmh', 'minutes'], at: () => [248, 52] }],
};

const ALL = [
  legPress,
  singleLegPress,
  backExtensionMachine,
  backExtensionBench,
  shoulderPress,
  chestPress,
  latPulldown,
  cableRow,
  treadmill,
];

/** Scènes per animationId; de back extension toont machine én bank. */
export const SCENES: Record<string, Scene[]> = {
  ...Object.fromEntries(ALL.map((s) => [s.id, [s]])),
  'back-extension-machine': [backExtensionMachine, backExtensionBench],
};
