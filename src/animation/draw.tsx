// Tekenhulpen voor de machine-cartoons: dikke afgeronde lijnen met contour, poppetje, gewichtsstapel.
import { add, along, dir, type Joints, type Pt } from './rig';

export type Paint =
  | 'skin'
  | 'skin-far'
  | 'shirt'
  | 'shirt-far'
  | 'shorts'
  | 'shorts-far'
  | 'shoe'
  | 'frame'
  | 'pad'
  | 'stack'
  | 'grip';

const pts = (ps: Pt[]) => ps.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Machine-onderdelen krijgen een glimlijn, zodat metaal en kussens wat volume hebben. */
const SHEEN = new Set<Paint>(['frame', 'pad', 'grip']);

/** Lijn (of polyline) met cartoon-contour: eerst een bredere donkere lijn, dan de vulling. */
export function Seg({ p, w, c }: { p: Pt[]; w: number; c: Paint }) {
  // Glimlijn iets naar linksboven (licht van boven), smal genoeg om binnen de ronde uiteinden te blijven.
  const o = -w * 0.18;
  return (
    <>
      <polyline points={pts(p)} className="mc-ol" style={{ strokeWidth: w + 4 }} />
      <polyline points={pts(p)} className={`mc-line mc-${c}`} style={{ strokeWidth: w }} />
      {SHEEN.has(c) && w >= 6 && (
        <polyline
          points={pts(p.map(([x, y]) => [x + o, y + o]))}
          className="mc-line mc-sheen"
          style={{ strokeWidth: w * 0.28 }}
        />
      )}
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

/** Achtergrond: zachte spot achter de machine en een vloer die naar onderen vervaagt. */
export function Stage({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-spot`} cx="0.5" cy="0.62" r="0.62">
          <stop offset="0" className="mc-spot-in" />
          <stop offset="1" className="mc-spot-out" />
        </radialGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="mc-floor-in" />
          <stop offset="1" className="mc-floor-out" />
        </linearGradient>
      </defs>
      <rect width="300" height={FLOOR + 3} fill={`url(#${id}-spot)`} />
      <rect y={FLOOR + 3} width="300" height={240 - FLOOR - 3} fill={`url(#${id}-floor)`} />
      <line x1="0" y1={FLOOR + 3} x2="300" y2={FLOOR + 3} className="mc-floor" />
    </>
  );
}

/** Gewichtsstapel met geleidestangen; de bovenste plaatjes (met selectiepin) gaan omhoog met `load`. */
export function Stack({ x, top, load }: { x: number; top: number; load: number }) {
  const w = 32;
  const bottom = FLOOR - 4;
  const lift = load * 26;
  const plate = 9;
  const lifted = top + 60 - lift;
  const plates = (y0: number, n: number, c: string) =>
    Array.from({ length: n }, (_, i) => (
      <rect key={i} x={x + 3} y={y0 + i * plate} width={w - 6} height={plate} rx={2.5} className={`mc-fill ${c}`} />
    ));
  return (
    <g>
      <rect x={x} y={top} width={w} height={bottom - top} rx={3} className="mc-tower" />
      <Seg p={[[x, bottom], [x, top], [x + w, top], [x + w, bottom]]} w={6} c="frame" />
      <line x1={x + w / 2} y1={top + 4} x2={x + w / 2} y2={lifted} className="mc-cable" />
      <line x1={x + 9} y1={top + 4} x2={x + 9} y2={bottom} className="mc-rod" />
      <line x1={x + w - 9} y1={top + 4} x2={x + w - 9} y2={bottom} className="mc-rod" />
      {plates(lifted, 3, 'mc-stack-lift')}
      {plates(bottom - 9 * plate, 9, 'mc-stack')}
      <circle cx={x + w - 3} cy={lifted + 2.5 * plate} r={3} className="mc-fill mc-knob" />
    </g>
  );
}

/** Instel-markering: genummerd rondje met een zachte halo. */
export function Pin({ at, n }: { at: Pt; n: number }) {
  return (
    <g className="mc-pin" transform={`translate(${at[0].toFixed(1)},${at[1].toFixed(1)})`}>
      <circle r="13" className="mc-pin-halo" />
      <circle r="9" />
      <text y="4" textAnchor="middle">
        {n}
      </text>
    </g>
  );
}

/** Bewegingsbaan van het werkende punt (hand, voet, schouder) met een pijl in de duwrichting. */
export function Track({ p, active }: { p: Pt[]; active: boolean }) {
  if (p.length < 2) return null;
  const end = p[p.length - 1];
  // Richting over de laatste paar punten; korte stukjes geven anders een wiebelige pijl.
  const from = p[Math.max(0, p.length - 4)];
  const a = Math.atan2(end[0] - from[0], end[1] - from[1]) * (180 / Math.PI);
  const head = [along(end, a, 4), along(end, a + 140, 8), along(end, a - 140, 8)];
  return (
    <g className="mc-track" data-active={active || undefined}>
      <polyline points={pts(p)} className="mc-track-line" />
      <circle cx={p[0][0]} cy={p[0][1]} r="3" className="mc-track-start" />
      <polygon points={pts(head)} className="mc-track-head" />
    </g>
  );
}

const LIMB = { arm: 11, leg: 15, torso: 28 };

const angle = (a: Pt, b: Pt) => Math.atan2(b[0] - a[0], b[1] - a[1]) * (180 / Math.PI);

function Arm({ j, far }: { j: Joints; far?: boolean }) {
  const c = far ? 'skin-far' : 'skin';
  const elbow = far ? j.farElbow : j.elbow;
  const hand = far ? j.farHand : j.hand;
  return (
    <>
      <Seg p={[j.shoulder, elbow, hand]} w={LIMB.arm} c={c} />
      <Dot at={hand} r={6} c={c} />
      {/* korte mouw */}
      <Seg p={[j.shoulder, along(j.shoulder, angle(j.shoulder, elbow), 13)]} w={LIMB.arm + 5} c={far ? 'shirt-far' : 'shirt'} />
    </>
  );
}

function Leg({ j, far }: { j: Joints; far?: boolean }) {
  const knee = far ? j.farKnee : j.knee;
  const ankle = far ? j.farAnkle : j.ankle;
  const toe = far ? j.farToe : j.toe;
  const foot = angle(ankle, toe);
  // Gekleurde zool binnen de schoen, aan de onderkant van de voet (haaks op de voetrichting).
  const sole = dir(foot - 90, 3);
  return (
    <>
      <Seg p={[ankle, toe]} w={10} c="shoe" />
      <polyline points={pts([add(ankle, sole), add(toe, sole)])} className="mc-line mc-sole" style={{ strokeWidth: 3.5 }} />
      <Seg p={[j.hip, knee, ankle]} w={LIMB.leg} c={far ? 'skin-far' : 'skin'} />
      <Seg p={[j.hip, along(j.hip, angle(j.hip, knee), 20)]} w={LIMB.leg + 4} c={far ? 'shorts-far' : 'shorts'} />
    </>
  );
}

function Head({ j }: { j: Joints }) {
  const tilt = (180 - j.torso) * 0.5;
  return (
    <g transform={`translate(${j.head[0].toFixed(1)},${j.head[1].toFixed(1)}) rotate(${tilt.toFixed(1)})`}>
      <circle r="15" className="mc-fill mc-skin" />
      <path
        d="M-15,2 C-18,-14 -4,-22 7,-17 C12,-15 16,-10 16,-5 C10,-9 3,-9 -1,-5 C-4,-1 -8,4 -13,8 Z"
        className="mc-fill mc-hair"
      />
      <path d="M-6,-14 C-2,-18 4,-19 9,-16" className="mc-hair-shine" />
      <circle cx="-2" cy="2" r="3.4" className="mc-fill mc-skin" />
      <path d="M5,-5 Q8.5,-7 12,-5" className="mc-detail" />
      <ellipse cx="8.5" cy="-0.5" rx="2" ry="2.5" className="mc-eye" />
      <circle cx="9.2" cy="-1.4" r="0.7" className="mc-eye-shine" />
      <circle cx="8" cy="6.5" r="2.8" className="mc-cheek" />
      <path d="M8,9 Q11.5,11.5 14.5,7.5" className="mc-detail" />
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
      <Seg p={[j.shoulder, j.head]} w={10} c="skin" />
      <Seg p={[add(j.hip, [up[0] * 6, up[1] * 6]), j.shoulder]} w={LIMB.torso} c="shirt" />
      <Seg p={[j.hip, along(j.hip, j.torso, 14)]} w={LIMB.torso + 2} c="shorts" />
      <Leg j={j} />
      <Head j={j} />
      <Arm j={j} />
    </g>
  );
}
