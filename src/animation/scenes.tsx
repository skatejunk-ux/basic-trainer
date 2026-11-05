// Cartoon-scènes per machine (Technogym Selection-stijl, zijaanzicht). Eén scène per animationId,
// de back extension heeft er twee (machine en 45°-bank). Tempo volgt de seed (bv. 1 s duwen – 2 s terug).
import type { ReactNode } from 'react';
import { nl } from '../content/nl';
import { Bar, Dot, FLOOR, FRONT, FrontFigure, frontAt, lerpPt, Seg, Stack, type FigureFx, type FrontSide } from './draw';
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
  /** Eigen poppetje i.p.v. het zijaanzicht (vooraanzicht-scènes; de beweging zit dan in `j.load`). */
  figure?: (j: Joints, fx: FigureFx) => ReactNode;
  /** Midden van het knal-wolkje met het actiewoord; standaard rechtsboven. */
  burst?: Pt;
}

const t = nl.cartoon;
/** Werkfase met label ("Duwen – 1 s …") en comic-actiewoord ("DUW!"). */
type Act = keyof typeof t.pow;
const act = (a: Act) => ({ label: t[a], pow: t.pow[a] });
/** Knal-wolkje linksboven, voor scènes met de stapel of het hoofd rechtsboven. */
const BURST_LEFT: Pt = [62, 38];
const BIJSCHUIF = 'bijschuifgewicht';
const STACK_TOP = 64;

/** Standaard krachtcyclus: start, 1 s concentrisch, 2 s terug. */
function strength(start: Pose, end: Pose, work: Act, extra: Keyframe[] = []): Keyframe[] {
  return [
    { pose: start, ms: 700, label: t.start },
    { pose: { ...end, load: 1 }, ms: 1000, ...act(work) },
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

/** Leg press; `plate` = midden van het voetplatform (standaard bij de enkel). */
function legPressMachine(j: Joints, j0: Joints, plate: Pt = [j.ankle[0] + 9, j.ankle[1]]) {
  const px = plate[0];
  return (
    <>
      <Stack x={22} top={STACK_TOP} load={j.load} />
      <Seg p={[[60, FLOOR - 4], [276, FLOOR - 4]]} w={8} c="frame" />
      <Seg p={[[264, FLOOR - 4], [264, 118]]} w={14} c="frame" />
      <Seg p={[along(j0.hip, 215, 20), [92, FLOOR - 4]]} w={8} c="frame" />
      <Seat x0={104} x1={150} y={177} />
      <Backrest hip={j0.hip} torso={215} from={8} to={66} />
      <Seg p={[[px, plate[1] - 8], [264, plate[1] - 8]]} w={6} c="frame" />
      <Seg p={[[px, plate[1] - 30], [px, plate[1] + 10]]} w={8} c="pad" />
      <Bar at={[j0.hand[0] + 2, j0.hand[1] + 6]} a={90} len={16} w={6} c="grip" />
    </>
  );
}

const legPress: Scene = {
  id: 'leg-press',
  frames: strength(lpStart, lpEnd, 'push'),
  back: (j, j0) => legPressMachine(j, j0),
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
  frames: strength({ ...lpStart, ...sl }, { ...lpEnd, ...sl }, 'push').map((f, i) =>
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
    { pose: { ...beEnd, load: 1 }, ms: 1000, ...act('up') },
    { pose: { ...beEnd, load: 1 }, ms: 1000, ...act('hold') },
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
// `load` heeft hier geen stapel, maar stuurt wel de comic-effecten (uitademen bij omhoog).
const bbTop: Pose = { hip: [165, 112], torso: 135, ...crossed, thigh: 315, shin: 315, foot: 45, load: 1 };
const bbBottom: Pose = { ...bbTop, torso: 30, load: 0 };

const backExtensionBench: Scene = {
  id: 'back-extension-bench',
  title: nl.workout.typeBench,
  frames: [
    { pose: bbTop, ms: 700, label: t.start },
    { pose: bbBottom, ms: 2000, label: t.down },
    { pose: bbTop, ms: 1000, ...act('up') },
    { pose: bbTop, ms: 1000, ...act('hold') },
  ],
  burst: BURST_LEFT,
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
  frames: strength(spStart, spEnd, 'push'),
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
  frames: strength(cpStart, cpEnd, 'push'),
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
  frames: strength(latStart, latEnd, 'pull'),
  burst: BURST_LEFT,
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
  frames: strength(rowStart, rowEnd, 'pull', [{ pose: { ...rowEnd, load: 1 }, ms: 1000, ...act('squeeze') }]),
  burst: BURST_LEFT,
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
      {/* comic-"whoosh" achter de loper: streepjes die naar achteren wegglijden */}
      <g className="mc-speed">
        {[92, 116, 140].map((y, i) => {
          const o = (ms / 14 + i * 11) % 30;
          return <line key={y} x1={112 - o} y1={y} x2={92 - o} y2={y} style={{ opacity: 1 - o / 30 }} />;
        })}
      </g>
    </>
  ),
  pins: [{ keys: ['inclinePct', 'speedKmh', 'minutes'], at: () => [248, 52] }],
};

/** Krachtcyclus met 1 s vasthouden in de eindpositie (isolatie-oefeningen). */
const withHold = (start: Pose, end: Pose, work: Act, hold: Act = 'hold') =>
  strength(start, end, work, [{ pose: { ...end, load: 1 }, ms: 1000, ...act(hold) }]);

/** Absolute hoek van het scheenbeen (knie → enkel). */
const shinAngle = (j: Joints) => (Math.atan2(j.ankle[0] - j.knee[0], j.ankle[1] - j.knee[1]) * 180) / Math.PI;

/** Handen aan de handgrepen naast de zitting. */
const holdSeat = { uArm: -10, fArm: 20 };

// ---------------------------------------------------------------- Leg extension
const LE_HIP: Pt = [130, 160];
const leStart: Pose = { hip: LE_HIP, torso: 195, ...holdSeat, thigh: 90, shin: 5 };
const leEnd: Pose = { ...leStart, shin: 85 };
/** Enkelkussen voor op het scheenbeen. */
const leRoller = (j: Joints) => add(along(j.knee, shinAngle(j), 38), dir(shinAngle(j) + 90, 12));

const legExtension: Scene = {
  id: 'leg-extension',
  frames: withHold(leStart, leEnd, 'extend'),
  track: { at: leRoller, phase: 1 },
  back: (j, j0) => (
    <>
      <Stack x={22} top={STACK_TOP} load={j.load} />
      <Seat x0={108} x1={172} y={177} />
      <Backrest hip={j0.hip} torso={195} from={8} to={66} />
      <Seg p={[j.knee, leRoller(j)]} w={6} c="frame" />
      <Bar at={[j0.hand[0] + 2, j0.hand[1] + 6]} a={90} len={16} w={6} c="grip" />
    </>
  ),
  front: (j) => (
    <>
      <Dot at={leRoller(j)} r={8} c="pad" />
      <Dot at={j.knee} r={4} c="grip" />
    </>
  ),
  pins: [
    { keys: ['backrest'], at: (j) => add(along(j.hip, 195, 50), dir(285, 36)) },
    { keys: ['roller'], at: (j) => add(leRoller(j), [18, 10]) },
    { keys: ['range'], at: (j) => add(j.knee, [4, -26]) },
    { keys: [BIJSCHUIF], at: () => [38, STACK_TOP - 14] },
  ],
};

// ---------------------------------------------------------------- Seated leg curl
const LC_HIP: Pt = [104, 160];
const lcStart: Pose = { hip: LC_HIP, torso: 195, ...holdSeat, thigh: 90, shin: 85 };
const lcEnd: Pose = { ...lcStart, shin: -5 };
/** Enkelkussen achter/onder de kuit. */
const lcRoller = (j: Joints) => add(along(j.knee, shinAngle(j), 38), dir(shinAngle(j) - 90, 12));
const lcThighPad = (j: Joints) => add(along(j.hip, 90, 34), [0, -17]);
const LC_COLUMN = 244;

const legCurl: Scene = {
  id: 'leg-curl',
  frames: withHold(lcStart, lcEnd, 'curl'),
  burst: [170, 38],
  track: { at: lcRoller, phase: 1 },
  back: (j, j0) => (
    <>
      <Stack x={254} top={STACK_TOP} load={j.load} />
      <Seg p={[[LC_COLUMN, FLOOR - 4], [LC_COLUMN, 112], [lcThighPad(j0)[0] + 6, 112]]} w={8} c="frame" />
      <Seat x0={74} x1={150} y={177} />
      <Backrest hip={j0.hip} torso={195} from={8} to={66} />
      <Seg p={[j.knee, lcRoller(j)]} w={6} c="frame" />
      <Bar at={[j0.hand[0] + 2, j0.hand[1] + 6]} a={90} len={16} w={6} c="grip" />
    </>
  ),
  front: (j, j0) => {
    const pad = lcThighPad(j0);
    return (
      <>
        <Dot at={lcRoller(j)} r={8} c="pad" />
        <Dot at={j.knee} r={4} c="grip" />
        <Seg p={[pad, [pad[0] + 6, 112]]} w={6} c="frame" />
        <Bar at={pad} a={90} len={22} w={13} c="pad" />
      </>
    );
  },
  pins: [
    { keys: ['backrest'], at: (j) => add(along(j.hip, 195, 50), dir(285, 36)) },
    { keys: ['thighPad'], at: (j) => add(lcThighPad(j), [-22, -12]) },
    { keys: ['roller'], at: (j) => add(lcRoller(j), [16, 14]) },
    { keys: [BIJSCHUIF], at: () => [270, STACK_TOP - 14] },
  ],
};

// ---------------------------------------------------------------- Calf press (op de leg press)
const cpfStart: Pose = { ...lpEnd, foot: 205 };
const cpfEnd: Pose = { ...lpEnd, foot: 135 };
/** Bal van de voet tegen de onderrand van het platform, hielen vrij. */
const calfPlate = (j: Joints): Pt => [j.toe[0] + 6, j.toe[1] - 6];

const calfPress: Scene = {
  id: 'calf-press',
  frames: withHold(cpfStart, cpfEnd, 'toes'),
  back: (j, j0) => legPressMachine(j, j0, calfPlate(j)),
  track: { at: (j) => add(j.toe, [0, -20]), phase: 1 },
  pins: [
    { keys: ['seat'], at: (j) => add(along(j.hip, 215, 40), dir(305, 36)) },
    { keys: ['feet'], at: (j) => [calfPlate(j)[0], calfPlate(j)[1] - 42] },
    { keys: [BIJSCHUIF], at: () => [38, STACK_TOP - 14] },
  ],
};

// ---------------------------------------------------------------- Arm curl / arm extension (preacher-kussen)
const AC_HIP: Pt = [100, 172];
/** Bovenarm absoluut 45° schuin naar voren-omlaag over het kussen. */
const AC_UA = 45;
const acBent: Pose = { hip: AC_HIP, torso: 160, uArm: AC_UA - 340, fArm: 125, ...seated };
const acStraight: Pose = { ...acBent, fArm: 15 };

function armMachine(j: Joints, j0: Joints) {
  const pad = add(along(j0.shoulder, AC_UA, 30), dir(AC_UA - 90, 10));
  const foot = along(pad, AC_UA, 25);
  return (
    <>
      <Stack x={240} top={STACK_TOP} load={j.load} />
      <Seat x0={76} x1={124} y={190} />
      <Seg p={[foot, [foot[0] + 8, FLOOR - 4]]} w={8} c="frame" />
      <Seg p={[[foot[0] - 12, FLOOR - 4], [foot[0] + 28, FLOOR - 4]]} w={8} c="frame" />
      <Bar at={pad} a={AC_UA} len={50} w={13} c="pad" />
      <Seg p={[j0.elbow, j.hand]} w={6} c="frame" />
      <Bar at={j.hand} a={0} len={14} w={7} c="grip" />
    </>
  );
}

const armPins: Scene['pins'] = [
  { keys: ['seat'], at: () => [100, 208] },
  { keys: ['range'], at: (j) => add(j.elbow, [-30, 30]) },
  { keys: [BIJSCHUIF], at: () => [256, STACK_TOP - 14] },
];

const armCurl: Scene = {
  id: 'arm-curl',
  frames: strength(acStraight, acBent, 'curl'),
  burst: BURST_LEFT,
  back: armMachine,
  front: (_j, j0) => <Dot at={j0.elbow} r={4} c="grip" />,
  track: { at: (j) => add(j.hand, [14, 0]), phase: 1 },
  pins: armPins,
};

const armExtension: Scene = {
  ...armCurl,
  id: 'arm-extension',
  frames: strength({ ...acBent, fArm: 115 }, acStraight, 'extend'),
};

// ---------------------------------------------------------------- Abdominal crunch
const AB_HIP: Pt = [118, 172];
const abStart: Pose = { hip: AB_HIP, torso: 182, ...crossed, ...seated };
const abEnd: Pose = { ...abStart, torso: 150 };
/** Borstkussen op een zijarm die (zoals bij de machine) om de heup draait. */
const abPad = (j: Joints) => add(along(j.hip, j.torso, 52), dir(j.torso - 90, 24));
const abRoller = (j: Joints) => add(j.ankle, [12, -10]);

const abCrunch: Scene = {
  id: 'ab-crunch',
  frames: strength(abStart, abEnd, 'crunch'),
  back: (j) => (
    <>
      <Stack x={18} top={STACK_TOP} load={j.load} />
      <Seat x0={94} x1={142} y={190} />
    </>
  ),
  front: (j, j0) => {
    const r = abRoller(j0);
    return (
      <>
        <Seg p={[r, [r[0] + 14, r[1]], [r[0] + 14, FLOOR - 4]]} w={6} c="frame" />
        <Dot at={r} r={7} c="pad" />
        <Seg p={[j.hip, abPad(j)]} w={6} c="frame" />
        <Dot at={j.hip} r={5} c="grip" />
        <Bar at={abPad(j)} a={j.torso} len={30} w={13} c="pad" />
      </>
    );
  },
  pins: [
    { keys: ['seat'], at: () => [118, 208] },
    { keys: ['footrest'], at: (j) => add(abRoller(j), [26, -18]) },
    { keys: [BIJSCHUIF], at: () => [34, STACK_TOP - 14] },
  ],
  track: { at: (j) => add(along(j.hip, j.torso, LEN.torso + 10), dir(j.torso - 90, 44)), phase: 1 },
};

// ---------------------------------------------------------------- Vooraanzicht: fly, rear delt, abductor, adductor
// De pose zelf staat stil; `load` (0 → 1 in de werkfase) stuurt de zijwaartse beweging.
const FRONT_POSE: Pose = { hip: [FRONT.cx, FRONT.hip], torso: 180, uArm: 0, fArm: 0, ...seated };
const frontFrames = (work: Act) => withHold(FRONT_POSE, FRONT_POSE, work);
const STACK_X = 256;

const mix = (a: FrontSide, b: FrontSide) => (k: number): FrontSide => ({
  elbow: lerpPt(a.elbow, b.elbow, k),
  hand: lerpPt(a.hand, b.hand, k),
  knee: lerpPt(a.knee, b.knee, k),
  ankle: lerpPt(a.ankle, b.ankle, k),
});

/** Seat voor het vooraanzicht. */
function FrontSeat() {
  const { cx } = FRONT;
  return (
    <>
      <Seg p={[[cx, 186], [cx, FLOOR - 4]]} w={10} c="frame" />
      <Seg p={[[cx - 40, FLOOR - 4], [cx + 40, FLOOR - 4]]} w={8} c="frame" />
      <Seg p={[[cx - 34, 186], [cx + 34, 186]]} w={12} c="pad" />
    </>
  );
}

// Fly-machine: armen aan hendels die van draaipunten boven de schouders hangen.
const flyLegs = { knee: [22, 188] as Pt, ankle: [24, 216] as Pt };
const flyOpen: FrontSide = { elbow: [56, 112], hand: [84, 106], ...flyLegs };
const flyClosed: FrontSide = { elbow: [34, 122], hand: [8, 118], ...flyLegs };
const FLY_PIVOT_DX = 36;

function flyMachine(side: FrontSide, load: number, back: boolean) {
  const { cx } = FRONT;
  return (
    <>
      <Stack x={STACK_X} top={STACK_TOP} load={load} />
      <Seg p={[[cx - FLY_PIVOT_DX - 6, 26], [STACK_X + 16, 26], [STACK_X + 16, STACK_TOP]]} w={10} c="frame" />
      <rect
        x={cx - (back ? 24 : 30)}
        y={back ? 92 : 58}
        width={back ? 48 : 60}
        height={back ? 76 : 114}
        rx={12}
        className="mc-fill mc-pad"
      />
      <FrontSeat />
      {[-1, 1].map((s) => {
        const pivot = frontAt([FLY_PIVOT_DX, 56], s);
        const hand = frontAt(side.hand, s);
        return (
          <g key={s}>
            <Seg p={[frontAt([FLY_PIVOT_DX, 26], s), pivot]} w={8} c="frame" />
            <Seg p={[pivot, add(hand, [0, -12])]} w={6} c="frame" />
            <Dot at={pivot} r={5} c="grip" />
            <Bar at={hand} a={0} len={24} w={7} c="grip" />
          </g>
        );
      })}
    </>
  );
}

const flyPins: Scene['pins'] = [
  { keys: ['seat'], at: () => [FRONT.cx - 52, 194] },
  { keys: ['range'], at: () => frontAt([FLY_PIVOT_DX + 18, 48]) },
  { keys: [BIJSCHUIF], at: () => [STACK_X + 16, STACK_TOP - 14] },
];

const flySide = mix(flyOpen, flyClosed);
const pecFly: Scene = {
  id: 'pec-fly',
  frames: frontFrames('close'),
  burst: BURST_LEFT,
  figure: (j, fx) => <FrontFigure side={flySide(j.load)} fx={fx} />,
  back: (j) => flyMachine(flySide(j.load), j.load, false),
  track: { at: (j) => frontAt(add(flySide(j.load).hand, [0, 16])), phase: 1 },
  pins: flyPins,
};

const rdLegs = { knee: [20, 190] as Pt, ankle: [22, 218] as Pt };
const rdSide = mix(
  { elbow: [34, 114], hand: [8, 114], ...rdLegs },
  { elbow: [56, 108], hand: [88, 106], ...rdLegs },
);
const rearDelt: Scene = {
  id: 'rear-delt',
  frames: frontFrames('open'),
  burst: BURST_LEFT,
  figure: (j, fx) => <FrontFigure side={rdSide(j.load)} back fx={fx} />,
  back: (j) => flyMachine(rdSide(j.load), j.load, true),
  track: { at: (j) => frontAt(add(rdSide(j.load).hand, [0, 16])), phase: 1 },
  pins: flyPins,
};

// Abductor/adductor: kussens tegen de knieën op hendels die onder de zitting draaien.
const legArms = { elbow: [34, 140] as Pt, hand: [40, 170] as Pt };
const legsClosed: FrontSide = { ...legArms, knee: [18, 188], ankle: [18, 216] };
const legsOpen: FrontSide = { ...legArms, knee: [50, 184], ankle: [40, 214] };

function hipMachine(side: FrontSide, load: number) {
  const { cx } = FRONT;
  return (
    <>
      <Stack x={STACK_X} top={STACK_TOP} load={load} />
      <Seg p={[[cx + 30, 70], [STACK_X + 16, 70]]} w={8} c="frame" />
      <rect x={cx - 30} y={64} width={60} height={110} rx={12} className="mc-fill mc-pad" />
      <FrontSeat />
      {[-1, 1].map((s) => {
        const hand = frontAt(side.hand, s);
        return <Bar key={s} at={add(hand, [0, 2])} a={90} len={16} w={6} c="grip" />;
      })}
    </>
  );
}

/** Kniekussens met hendel; `outer` = buitenkant (abductor). */
function kneePads(side: FrontSide, outer: boolean) {
  return [-1, 1].map((s) => {
    const knee = frontAt(side.knee, s);
    const pad = add(knee, [s * (outer ? 13 : -13), 0]);
    return (
      <g key={s}>
        <Seg p={[frontAt([outer ? 8 : 4, 202], s), add(pad, [0, 10])]} w={6} c="frame" />
        <Bar at={pad} a={0} len={24} w={12} c="pad" />
        <Bar at={add(frontAt(side.ankle, s), [0, 10])} a={90} len={18} w={6} c="frame" />
      </g>
    );
  });
}

const hipPins: Scene['pins'] = [
  { keys: ['range'], at: () => [FRONT.cx, 206] },
  { keys: ['footrest'], at: () => frontAt([legsOpen.ankle[0] + 22, 222]) },
  { keys: [BIJSCHUIF], at: () => [STACK_X + 16, STACK_TOP - 14] },
];

const abSide = mix(legsClosed, legsOpen);
const abductor: Scene = {
  id: 'abductor',
  frames: frontFrames('apart'),
  burst: BURST_LEFT,
  figure: (j, fx) => <FrontFigure side={abSide(j.load)} fx={fx} />,
  back: (j) => hipMachine(abSide(j.load), j.load),
  front: (j) => kneePads(abSide(j.load), true),
  track: { at: (j) => frontAt(add(abSide(j.load).knee, [0, -20])), phase: 1 },
  pins: hipPins,
};

const adSide = mix(legsOpen, { ...legsClosed, knee: [20, 188], ankle: [20, 216] });
const adductor: Scene = {
  id: 'adductor',
  frames: frontFrames('together'),
  burst: BURST_LEFT,
  figure: (j, fx) => <FrontFigure side={adSide(j.load)} fx={fx} />,
  back: (j) => hipMachine(adSide(j.load), j.load),
  front: (j) => kneePads(adSide(j.load), false),
  track: { at: (j) => frontAt(add(adSide(j.load).knee, [0, -20])), phase: 1 },
  pins: hipPins,
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
  legExtension,
  legCurl,
  calfPress,
  abductor,
  adductor,
  pecFly,
  rearDelt,
  armCurl,
  armExtension,
  abCrunch,
  treadmill,
];

/** Scènes per animationId; de back extension toont machine én bank. */
export const SCENES: Record<string, Scene[]> = {
  ...Object.fromEntries(ALL.map((s) => [s.id, [s]])),
  'back-extension-machine': [backExtensionMachine, backExtensionBench],
};
