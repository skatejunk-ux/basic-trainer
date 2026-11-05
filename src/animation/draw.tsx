// Tekenhulpen voor de machine-cartoons in pop-art-stijl: dikke inktcontouren, vlakke primaire kleuren,
// Ben-Day-stipjes, een knal-wolkje met actiewoord en snelheidsstreepjes.
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

/** Machine-onderdelen en het shirt krijgen een glimlijn: comic-licht van linksboven. */
const SHEEN = new Set<Paint>(['frame', 'pad', 'grip', 'shirt']);

/** Lijn (of polyline) met inktcontour: eerst een bredere zwarte lijn, dan de vulling. */
export function Seg({ p, w, c }: { p: Pt[]; w: number; c: Paint }) {
  // Glimlijn iets naar linksboven, smal genoeg om binnen de ronde uiteinden te blijven.
  const o = -w * 0.2;
  return (
    <>
      <polyline points={pts(p)} className="mc-ol" style={{ strokeWidth: w + 5 }} />
      <polyline points={pts(p)} className={`mc-line mc-${c}`} style={{ strokeWidth: w }} />
      {SHEEN.has(c) && w >= 6 && (
        <polyline
          points={pts(p.map(([x, y]) => [x + o, y + o]))}
          className="mc-line mc-sheen"
          style={{ strokeWidth: w * 0.26 }}
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

/**
 * Vloer: vlak met Ben-Day-stippen en een dikke inktlijn. De zonnestralen en stippen
 * van de achtergrond zitten in CSS (`.mc-panel`), zodat ze niet elk frame opnieuw getekend worden.
 */
export function Stage({ id }: { id: string }) {
  return (
    <>
      <defs>
        <pattern id={`${id}-dots`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="3" cy="3" r="1.25" className="mc-floor-dot" />
        </pattern>
      </defs>
      <rect y={FLOOR + 3} width="300" height={240 - FLOOR - 3} className="mc-floor-fill" />
      <rect y={FLOOR + 3} width="300" height={240 - FLOOR - 3} fill={`url(#${id}-dots)`} />
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
      <circle cx={x + w - 3} cy={lifted + 2.5 * plate} r={3.2} className="mc-fill mc-knob" />
    </g>
  );
}

/** Instel-markering: genummerd comic-badge met harde schaduw en een pulserende ring. */
export function Pin({ at, n }: { at: Pt; n: number }) {
  return (
    <g className="mc-pin" transform={`translate(${at[0].toFixed(1)},${at[1].toFixed(1)})`}>
      <circle r="11" className="mc-pin-halo" />
      <circle cx="2" cy="2" r="9.5" className="mc-pin-shadow" />
      <circle r="9.5" className="mc-pin-badge" />
      <text y="5" textAnchor="middle">
        {n}
      </text>
    </g>
  );
}

/** Bewegingsbaan van het werkende punt (hand, voet, schouder): comic-pijl met inktrand. */
export function Track({ p, active }: { p: Pt[]; active: boolean }) {
  if (p.length < 2) return null;
  const end = p[p.length - 1];
  // Richting over de laatste paar punten; korte stukjes geven anders een wiebelige pijl.
  const from = p[Math.max(0, p.length - 4)];
  const a = Math.atan2(end[0] - from[0], end[1] - from[1]) * (180 / Math.PI);
  const tip = along(end, a, 6);
  const head = [tip, along(end, a + 135, 7), along(end, a - 135, 7)];
  return (
    <g className="mc-track" data-active={active || undefined}>
      <polyline points={pts(p)} className="mc-track-ol" />
      <polyline points={pts(p)} className="mc-track-line" />
      <circle cx={p[0][0]} cy={p[0][1]} r="3.5" className="mc-track-start" />
      <polygon points={pts(head)} className="mc-track-head" />
    </g>
  );
}

// ---------------------------------------------------------------- Comic-effecten

const easeOutBack = (x: number) => {
  const c = 1.9;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

/** Grillige straal per punt van de ster, zodat hij met de hand getekend lijkt. */
const SPIKES = [1, 0.84, 0.97, 0.8, 1.06, 0.88, 0.95, 0.78, 1.02, 0.86, 0.99, 0.82, 1.04, 0.9];

function starPoints(rx: number, ry: number, inner: number): Pt[] {
  const n = SPIKES.length;
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? SPIKES[i / 2] : inner;
    return [Math.cos(a) * rx * r, Math.sin(a) * ry * r] as Pt;
  });
}

/**
 * Knal-wolkje met actiewoord ("DUW!") dat opploft aan het begin van een fase en
 * aan het eind weer krimpt. `t` = ms sinds het begin van de fase, `dur` = duur van de fase.
 */
export function Burst({ at, text, t, dur }: { at: Pt; text: string; t: number; dur: number }) {
  const fs = Math.min(21, 70 / (text.length * 0.47));
  const rx = Math.max(36, (text.length * 0.47 * fs) / 2 + 17);
  const ry = Math.max(25, rx * 0.62);
  const grow = easeOutBack(Math.min(1, t / 240));
  const shrink = Math.min(1, Math.max(0, (dur - t) / 140));
  const s = Math.max(0, grow * shrink);
  if (s <= 0.01) return null;
  const wobble = Math.sin(t / 70) * 1.5;
  const star = pts(starPoints(rx, ry, 0.74));
  return (
    <g
      className="mc-burst"
      transform={`translate(${at[0]},${at[1]}) rotate(${(-8 + wobble).toFixed(2)}) scale(${s.toFixed(3)})`}
    >
      <polygon points={star} transform="translate(3,3)" className="mc-burst-shadow" />
      <polygon points={star} className="mc-burst-star" />
      <polygon points={pts(starPoints(rx * 0.62, ry * 0.6, 0.82))} className="mc-burst-core" />
      <text y={fs * 0.36} textAnchor="middle" style={{ fontSize: fs }}>
        {text}
      </text>
    </g>
  );
}

/** Drie snelheidsstreepjes achter een punt dat met verplaatsing `v` (px per ~80 ms) beweegt. */
export function SpeedLines({ at, v }: { at: Pt; v: Pt }) {
  const speed = Math.hypot(v[0], v[1]);
  if (speed < 1.5) return null;
  const u: Pt = [v[0] / speed, v[1] / speed];
  const n: Pt = [-u[1], u[0]];
  const len = Math.min(24, speed * 2.6);
  return (
    <g className="mc-speed">
      {[-9, 0, 9].map((o, i) => {
        const gap = 13 + Math.abs(o) * 0.4;
        const l = len * (i === 1 ? 1 : 0.7);
        const a = add(at, [n[0] * o - u[0] * gap, n[1] * o - u[1] * gap]);
        const b = add(a, [-u[0] * l, -u[1] * l]);
        return <line key={o} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
      })}
    </g>
  );
}

/** Ben-Day-blosje: een rozetje van kleine stipjes, zoals in oude strips. */
function BenDay({ at }: { at: Pt }) {
  const d = 2.4;
  const h = d * 0.87;
  const grid: Pt[] = [
    [0, 0],
    [d, 0],
    [-d, 0],
    [d / 2, h],
    [-d / 2, h],
    [d / 2, -h],
    [-d / 2, -h],
  ];
  return (
    <g className="mc-benday">
      {grid.map(([x, y]) => (
        <circle key={`${x},${y}`} cx={at[0] + x} cy={at[1] + y} r="0.95" />
      ))}
    </g>
  );
}

/** Uitadem-wolkje: drie bolletjes die van de mond wegdrijven en vervagen (`k` 0 → 1). */
function Puff({ at, k, dx = 1, dy = 0 }: { at: Pt; k: number; dx?: number; dy?: number }) {
  const out = 3 + k * 15;
  return (
    <g className="mc-puff" style={{ opacity: Math.max(0, 1 - k * 0.9) }}>
      {[0, 1, 2].map((i) => {
        const d = out - i * 4.5;
        if (d < 2) return null;
        const r = 1.6 + k * 2.2 - i * 0.4;
        return <circle key={i} cx={at[0] + dx * d} cy={at[1] + dy * d - i * 1.2} r={Math.max(0.8, r)} />;
      })}
    </g>
  );
}

// ---------------------------------------------------------------- Poppetje (zijaanzicht)

const LIMB = { arm: 11, leg: 15, torso: 28 };

const angle = (a: Pt, b: Pt) => Math.atan2(b[0] - a[0], b[1] - a[1]) * (180 / Math.PI);

/** Effecten op het poppetje: `exhale` = voortgang (0..1) van een uitadem-fase, of null. */
export interface FigureFx {
  exhale: number | null;
}

function Arm({ j, far }: { j: Joints; far?: boolean }) {
  const c = far ? 'skin-far' : 'skin';
  const elbow = far ? j.farElbow : j.elbow;
  const hand = far ? j.farHand : j.hand;
  return (
    <>
      <Seg p={[j.shoulder, elbow, hand]} w={LIMB.arm} c={c} />
      <Dot at={hand} r={6.2} c={c} />
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

function Head({ j, fx }: { j: Joints; fx: FigureFx }) {
  const tilt = (180 - j.torso) * 0.5;
  const effort = fx.exhale !== null;
  return (
    <g transform={`translate(${j.head[0].toFixed(1)},${j.head[1].toFixed(1)}) rotate(${tilt.toFixed(1)})`}>
      <circle r="15" className="mc-fill mc-skin" />
      <path
        d="M-15,2 C-18,-14 -4,-22 7,-17 C12,-15 16,-10 16,-5 C10,-9 3,-9 -1,-5 C-4,-1 -8,4 -13,8 Z"
        className="mc-fill mc-hair"
      />
      <path d="M-8,-12 C-4,-17 3,-18 8,-16" className="mc-hair-shine" />
      <circle cx="-2" cy="2" r="3.4" className="mc-fill mc-skin" />
      <BenDay at={[7, 6.5]} />
      {/* wenkbrauw: bij inspanning schuin omlaag, vastberaden */}
      <path d={effort ? 'M4.5,-7.5 L12.5,-3.8' : 'M5,-5.6 Q8.6,-8 12.2,-5.6'} className="mc-brow" />
      <ellipse cx="8.7" cy="-0.4" rx="2.1" ry={effort ? 1.7 : 2.7} className="mc-eye" />
      <circle cx="9.4" cy="-1.4" r="0.75" className="mc-eye-shine" />
      {effort ? (
        <ellipse cx="12.4" cy="8.6" rx="2" ry="2.5" className="mc-mouth" />
      ) : (
        <path d="M8,9 Q11.5,11.5 14.5,7.5" className="mc-detail" />
      )}
      {fx.exhale !== null && <Puff at={[16, 9]} k={fx.exhale} />}
    </g>
  );
}

/** Het poppetje; volgorde: verre kant, romp, nabije been, hoofd, nabije arm. */
export function Figure({ j, fx = { exhale: null } }: { j: Joints; fx?: FigureFx }) {
  const up = dir(j.torso, 1);
  return (
    <g>
      <Arm j={j} far />
      <Leg j={j} far />
      <Seg p={[j.shoulder, j.head]} w={10} c="skin" />
      <Seg p={[add(j.hip, [up[0] * 6, up[1] * 6]), j.shoulder]} w={LIMB.torso} c="shirt" />
      <Seg p={[j.hip, along(j.hip, j.torso, 14)]} w={LIMB.torso + 2} c="shorts" />
      <Leg j={j} />
      <Head j={j} fx={fx} />
      <Arm j={j} />
    </g>
  );
}

// ---------------------------------------------------------------- Vooraanzicht
// Fly, rear delt, abductor en adductor bewegen zijwaarts en zijn in zijaanzicht onzichtbaar;
// die scènes tekenen het poppetje recht van voren (of van achteren).

export const FRONT = { cx: 150, hip: 170, shoulder: 106, shoulderDx: 22, hipDx: 12 };

/** Punten van de rechterkant (x relatief aan het midden); de linkerkant wordt gespiegeld. */
export interface FrontSide {
  elbow: Pt;
  hand: Pt;
  knee: Pt;
  ankle: Pt;
}

export const lerpPt = (a: Pt, b: Pt, k: number): Pt => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** Absolute positie van een rechterkant-punt; `s` = 1 rechts, -1 links. */
export const frontAt = (p: Pt, s = 1): Pt => [FRONT.cx + s * p[0], p[1]];

function FrontHead({ back, fx }: { back: boolean; fx: FigureFx }) {
  const { cx, shoulder } = FRONT;
  const effort = fx.exhale !== null;
  return (
    <g transform={`translate(${cx},${shoulder - 26})`}>
      <circle cx="-15" cy="2" r="4" className="mc-fill mc-skin" />
      <circle cx="15" cy="2" r="4" className="mc-fill mc-skin" />
      <circle r="15" className="mc-fill mc-skin" />
      {back ? (
        <>
          <path d="M-15,4 C-17,-16 -6,-20 0,-19 C6,-20 17,-16 15,4 C11,10 -11,10 -15,4 Z" className="mc-fill mc-hair" />
          <path d="M-8,-12 C-3,-16 3,-16 8,-12" className="mc-hair-shine" />
        </>
      ) : (
        <>
          <path
            d="M-15,1 C-17,-16 -6,-20 0,-19 C6,-20 17,-16 15,1 C12,-8 6,-11 0,-10 C-6,-11 -12,-8 -15,1 Z"
            className="mc-fill mc-hair"
          />
          <path d="M-7,-14 C-2,-17.5 4,-17.5 8,-14.5" className="mc-hair-shine" />
          <BenDay at={[-9, 6]} />
          <BenDay at={[9, 6]} />
          <path
            d={effort ? 'M-9,-5.5 L-2.5,-3 M9,-5.5 L2.5,-3' : 'M-8.5,-4.5 Q-5.5,-6.5 -2.5,-4.5 M8.5,-4.5 Q5.5,-6.5 2.5,-4.5'}
            className="mc-brow"
          />
          <ellipse cx="-5.5" cy="0.2" rx="2" ry={effort ? 1.6 : 2.6} className="mc-eye" />
          <ellipse cx="5.5" cy="0.2" rx="2" ry={effort ? 1.6 : 2.6} className="mc-eye" />
          <circle cx="-4.8" cy="-0.8" r="0.7" className="mc-eye-shine" />
          <circle cx="6.2" cy="-0.8" r="0.7" className="mc-eye-shine" />
          {effort ? (
            <ellipse cx="0" cy="8.5" rx="2.4" ry="2.8" className="mc-mouth" />
          ) : (
            <path d="M-4,7.5 Q0,11 4,7.5" className="mc-detail" />
          )}
          {fx.exhale !== null && <Puff at={[3, 9]} k={fx.exhale} dx={0.8} dy={0.35} />}
        </>
      )}
    </g>
  );
}

/** Zittend poppetje in vooraanzicht; `back` = van achteren gezien (armen achter de romp). */
export function FrontFigure({ side, back = false, fx = { exhale: null } }: { side: FrontSide; back?: boolean; fx?: FigureFx }) {
  const { cx, hip, shoulder, shoulderDx, hipDx } = FRONT;
  const legs = [-1, 1].map((s) => {
    const h: Pt = [cx + s * hipDx, hip + 2];
    const k = frontAt(side.knee, s);
    const a = frontAt(side.ankle, s);
    return (
      <g key={s}>
        <Seg p={[a, add(a, [s * 2, 7])]} w={12} c="shoe" />
        <Seg p={[h, k, a]} w={LIMB.leg} c="skin" />
        <Seg p={[h, lerpPt(h, k, 0.7)]} w={LIMB.leg + 4} c="shorts" />
      </g>
    );
  });
  const arms = [-1, 1].map((s) => {
    const sh: Pt = [cx + s * shoulderDx, shoulder + 4];
    const e = frontAt(side.elbow, s);
    const h = frontAt(side.hand, s);
    return (
      <g key={s}>
        <Seg p={[sh, e, h]} w={LIMB.arm} c="skin" />
        <Dot at={h} r={6.2} c="skin" />
        <Seg p={[sh, along(sh, angle(sh, e), 12)]} w={LIMB.arm + 5} c="shirt" />
      </g>
    );
  });
  return (
    <g>
      {legs}
      {back && arms}
      <Seg p={[[cx, shoulder], [cx, shoulder - 16]]} w={11} c="skin" />
      <path
        d={`M${cx - 26},${shoulder} Q${cx},${shoulder - 6} ${cx + 26},${shoulder} L${cx + 20},${hip} L${cx - 20},${hip} Z`}
        className="mc-fill mc-shirt mc-round"
      />
      {/* glimlijn op het shirt */}
      <path d={`M${cx - 19},${shoulder + 6} L${cx - 15},${hip - 14}`} className="mc-line mc-sheen" style={{ strokeWidth: 3 }} />
      <rect x={cx - 21} y={hip - 8} width={42} height={16} rx={6} className="mc-fill mc-shorts" />
      {!back && arms}
      <FrontHead back={back} fx={fx} />
    </g>
  );
}
