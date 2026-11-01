// Tekenhulpen voor de machine-cartoons: dikke afgeronde lijnen met contour, poppetje, gewichtsstapel.
import { add, along, dir, type Joints, type Pt } from './rig';

export type Paint =
  | 'skin'
  | 'skin-far'
  | 'shorts'
  | 'shorts-far'
  | 'shoe'
  | 'frame'
  | 'pad'
  | 'stack'
  | 'grip';

const pts = (ps: Pt[]) => ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Lijn (of polyline) met cartoon-contour: eerst een bredere donkere lijn, dan de vulling. */
export function Seg({ p, w, c }: { p: Pt[]; w: number; c: Paint }) {
  return (
    <>
      <polyline points={pts(p)} className="mc-ol" style={{ strokeWidth: w + 5 }} />
      <polyline points={pts(p)} className={`mc-line mc-${c}`} style={{ strokeWidth: w }} />
    </>
  );
}

export function Dot({ at, r, c }: { at: Pt; r: number; c: Paint }) {
  return <circle cx={at[0]} cy={at[1]} r={r} className={`mc-fill mc-${c}`} />;
}

/** Kussen of balk langs richting `a`, gecentreerd op `at`. */
export function Bar({ at, a, len, w, c }: { at: Pt; a: number; len: number; w: number; c: Paint }) {
  return <Seg p={[along(at, a, -len / 2), along(at, a, len / 2)]} w={w} c={c} />;
}

export const FLOOR = 226;

export function Floor() {
  return <line x1="4" y1={FLOOR + 3} x2="296" y2={FLOOR + 3} className="mc-floor" />;
}

/** Gewichtsstapel met geleidestangen; de bovenste plaatjes gaan omhoog met `load`. */
export function Stack({ x, top, load }: { x: number; top: number; load: number }) {
  const w = 32;
  const bottom = FLOOR - 4;
  const lift = load * 26;
  const plates = (y0: number, n: number) =>
    Array.from({ length: n }, (_, i) => (
      <rect key={i} x={x + 3} y={y0 + i * 9} width={w - 6} height={9} rx={2} className="mc-fill mc-stack" />
    ));
  return (
    <g>
      <Seg p={[[x, bottom], [x, top], [x + w, top], [x + w, bottom]]} w={6} c="frame" />
      <line x1={x + w / 2} y1={top + 4} x2={x + w / 2} y2={top + 60 - lift} className="mc-cable" />
      <line x1={x + 9} y1={top + 4} x2={x + 9} y2={bottom} className="mc-rod" />
      <line x1={x + w - 9} y1={top + 4} x2={x + w - 9} y2={bottom} className="mc-rod" />
      {plates(top + 60 - lift, 3)}
      {plates(bottom - 9 * 9, 9)}
    </g>
  );
}

/** Instel-markering: genummerd rondje. */
export function Pin({ at, n }: { at: Pt; n: number }) {
  return (
    <g className="mc-pin" transform={`translate(${at[0].toFixed(1)},${at[1].toFixed(1)})`}>
      <circle r="9" />
      <text y="4" textAnchor="middle">
        {n}
      </text>
    </g>
  );
}

const LIMB = { arm: 11, leg: 15, torso: 28 };

function Arm({ j, far }: { j: Joints; far?: boolean }) {
  const c = far ? 'skin-far' : 'skin';
  const elbow = far ? j.farElbow : j.elbow;
  const hand = far ? j.farHand : j.hand;
  return (
    <>
      <Seg p={[j.shoulder, elbow, hand]} w={LIMB.arm} c={c} />
      <Dot at={hand} r={6} c={c} />
    </>
  );
}

function Leg({ j, far }: { j: Joints; far?: boolean }) {
  const knee = far ? j.farKnee : j.knee;
  const ankle = far ? j.farAnkle : j.ankle;
  const toe = far ? j.farToe : j.toe;
  const thighDir = Math.atan2(knee[0] - j.hip[0], knee[1] - j.hip[1]) * (180 / Math.PI);
  return (
    <>
      <Seg p={[ankle, toe]} w={9} c="shoe" />
      <Seg p={[j.hip, knee, ankle]} w={LIMB.leg} c={far ? 'skin-far' : 'skin'} />
      <Seg p={[j.hip, along(j.hip, thighDir, 20)]} w={LIMB.leg + 4} c={far ? 'shorts-far' : 'shorts'} />
    </>
  );
}

function Head({ j }: { j: Joints }) {
  const tilt = (180 - j.torso) * 0.5;
  return (
    <g transform={`translate(${j.head[0].toFixed(1)},${j.head[1].toFixed(1)}) rotate(${tilt.toFixed(1)})`}>
      <circle r="15" className="mc-fill mc-skin" />
      <path d="M-15,1 C-17,-15 -2,-21 8,-16 C13,-13 16,-8 15,-4 C8,-9 1,-8 -3,-3 C-5,1 -9,5 -13,7 Z" className="mc-fill mc-hair" />
      <circle cx="-2" cy="2" r="3" className="mc-fill mc-skin" />
      <circle cx="8" cy="-1" r="2.2" className="mc-eye" />
      <circle cx="7" cy="6" r="2.6" className="mc-cheek" />
      <path d="M6,8 Q10,11 14,6" className="mc-detail" />
    </g>
  );
}

/** Het poppetje; volgorde: verre kant, romp, nabije been, hoofd, nabije arm. */
export function Figure({ j }: { j: Joints }) {
  const up = dir(j.torso, 1);
  return (
    <g>
      <Arm j={j} far />
      <Leg j={j} far />
      <Seg p={[add(j.hip, [up[0] * 6, up[1] * 6]), j.shoulder]} w={LIMB.torso} c="skin" />
      <Seg p={[j.shoulder, j.head]} w={10} c="skin" />
      <Seg p={[j.hip, along(j.hip, j.torso, 14)]} w={LIMB.torso + 2} c="shorts" />
      <Leg j={j} />
      <Head j={j} />
      <Arm j={j} />
    </g>
  );
}
