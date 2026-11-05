// Cartoon-spierkaart in pop-art-stijl: poppetje voor- en achteraanzicht met gekleurde spiergroepen (PLAN.md §8).
// Groot: twee comic-panelen met zonnestralen en Ben-Day-raster op de getrainde spieren.
import { useId } from 'react';
import type { MuscleId, MuscleMap as MuscleMapData } from '../types';
import { nl } from '../content/nl';
import { describeMuscleMap, MUSCLE_NAMES, muscleLevel, type MuscleLevel } from './muscles';

interface Props {
  map: MuscleMapData;
  size?: 'xs' | 'sm' | 'lg';
  showLegend?: boolean;
  /** Extra label naast de legenda, bv. "Conditie ❤️" bij de loopband. */
  extraLabel?: string;
  className?: string;
}

/**
 * Spiervlakken voor de linkerhelft van een figuur (viewBox-breedte 200, midden x=100).
 * De rechterhelft wordt gespiegeld. Coördinaten horen bij het basissilhouet hieronder.
 */
const FRONT: [MuscleId, string][] = [
  ['traps', 'M91,70 C89,77 82,80 73,82 L77,87 L97,85 L97,70 Z'],
  ['chest', 'M98,87 L77,87 C69,93 63,104 65,116 C71,126 87,130 98,126 Z'],
  ['front-delts', 'M73,82 C62,81 53,87 49,96 C48,103 50,109 55,112 C59,102 65,94 76,89 Z'],
  ['side-delts', 'M49,96 C43,100 40,107 41,114 C46,115 51,114 55,112 C50,109 48,103 49,96 Z'],
  ['biceps', 'M41,116 C38,132 36,150 37,162 L51,162 C54,148 57,132 58,114 C52,111 46,111 41,116 Z'],
  ['forearms', 'M36,174 C33,194 32,214 34,232 L45,232 C47,214 50,194 52,174 C46,170 40,170 36,174 Z'],
  ['obliques', 'M68,126 C73,130 79,132 84,132 C83,155 83,178 85,198 L70,200 C68,180 68,150 68,126 Z'],
  ['abs', 'M86,132 L98,132 L98,198 L87,198 C85,176 85,150 86,132 Z'],
  ['quads', 'M66,240 C64,270 66,300 72,318 L86,318 C86,296 87,270 88,244 Z'],
  ['adductors', 'M88,244 C92,246 96,248 97,250 C96,270 94,288 87,304 C86,284 87,262 88,244 Z'],
];

const BACK: [MuscleId, string][] = [
  ['traps', 'M100,66 L100,128 C94,112 86,97 73,85 C83,80 92,74 100,66 Z'],
  ['rear-delts', 'M73,85 C62,82 53,87 49,96 C48,103 50,109 55,112 C59,102 65,94 75,90 Z'],
  ['side-delts', 'M49,96 C43,100 40,107 41,114 C46,115 51,114 55,112 C50,109 48,103 49,96 Z'],
  ['mid-back', 'M100,128 C94,112 86,99 75,90 C72,100 73,111 78,118 C86,124 94,132 100,142 Z'],
  ['lats', 'M64,114 C66,140 70,170 80,188 C85,180 89,170 91,160 C88,146 84,130 78,118 C73,116 68,114 64,114 Z'],
  ['lower-back', 'M93,148 L99,148 L99,198 L84,198 C86,184 90,168 93,148 Z'],
  ['triceps', 'M41,116 C38,132 36,150 37,162 L51,162 C54,148 57,132 58,114 C52,111 46,111 41,116 Z'],
  ['forearms', 'M36,174 C33,194 32,214 34,232 L45,232 C47,214 50,194 52,174 C46,170 40,170 36,174 Z'],
  ['glutes', 'M64,202 L99,202 L99,242 C92,252 78,252 70,246 C64,236 62,218 64,202 Z'],
  ['hamstrings', 'M68,252 C64,278 66,302 72,318 L94,318 C96,300 97,278 97,254 C88,258 76,258 68,252 Z'],
  ['calves', 'M68,338 C62,356 64,378 72,394 L89,394 C95,378 95,356 92,338 C84,333 76,333 68,338 Z'],
];

const TORSO =
  'M74,76 C60,78 48,84 46,100 L47,118 C58,126 64,150 66,180 C66,200 63,215 64,232 L136,232 C137,215 134,200 134,180 C136,150 142,126 153,118 L154,100 C152,84 140,78 126,76 Z';

/** Lijnen voor ledematen (links + rechts), getekend als dikke afgeronde strepen. */
const LIMBS: { d: string; w: number }[] = [
  { d: 'M50,100 L44,168 L40,236', w: 22 },
  { d: 'M150,100 L156,168 L160,236', w: 22 },
  { d: 'M82,226 L80,328 L80,402', w: 30 },
  { d: 'M118,226 L120,328 L120,402', w: 30 },
];

const MIRROR = 'translate(200,0) scale(-1,1)';

function Base() {
  return (
    <g className="mm-base">
      {/* schaduw op de vloer */}
      <ellipse cx="100" cy="421" rx="52" ry="8" className="mm-shadow" />
      {/* omtrek */}
      {LIMBS.map((l) => (
        <path key={`o${l.d}`} d={l.d} className="mm-outline-stroke" style={{ strokeWidth: l.w + 5 }} />
      ))}
      <rect x="89" y="58" width="22" height="26" rx="6" className="mm-skin" />
      {/* huid */}
      {LIMBS.map((l) => (
        <path key={`s${l.d}`} d={l.d} className="mm-skin-stroke" style={{ strokeWidth: l.w }} />
      ))}
      <path d={TORSO} className="mm-skin" />
      <circle cx="40" cy="245" r="10" className="mm-skin" />
      <circle cx="160" cy="245" r="10" className="mm-skin" />
      <ellipse cx="76" cy="414" rx="17" ry="9" className="mm-shoe" />
      <ellipse cx="124" cy="414" rx="17" ry="9" className="mm-shoe" />
      <path d="M62,418 Q76,424 90,418 M110,418 Q124,424 138,418" className="mm-sole" />
    </g>
  );
}

function Muscles({ shapes, map, dots }: { shapes: [MuscleId, string][]; map: MuscleMapData; dots?: string }) {
  const paths = () =>
    shapes.map(([id, d]) => {
      const level = muscleLevel(map, id);
      return <path key={id} d={d} data-muscle={id} data-level={level} className={`mm-muscle mm-${fillFor(id, level)}`} />;
    });
  // Ben-Day-raster over de getrainde spieren (alleen groot; klein wordt het ruis).
  const raster = () =>
    dots &&
    shapes.map(([id, d]) => {
      const level = muscleLevel(map, id);
      return level === 'idle' ? null : <path key={id} d={d} className="mm-dots" fill={`url(#${dots}-${level})`} />;
    });
  return (
    <g>
      {paths()}
      {raster()}
      <g transform={MIRROR}>
        {paths()}
        {raster()}
      </g>
    </g>
  );
}

/** Patronen voor het Ben-Day-raster en de zonnestralen van de panelen. */
function PopDefs({ id }: { id: string }) {
  const dot = (level: string, r: number) => (
    <pattern id={`${id}-${level}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <circle cx="3.5" cy="3.5" r={r} className={`mm-dot-${level}`} />
    </pattern>
  );
  return (
    <defs>
      {dot('primary', 1.7)}
      {dot('secondary', 1.5)}
      <pattern id={`${id}-bg`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <circle cx="5" cy="5" r="1.8" className="mm-panel-dot" />
      </pattern>
      <clipPath id={`${id}-clip`}>
        <rect x="4" y="4" width="192" height="440" rx="18" />
      </clipPath>
    </defs>
  );
}

const RAYS = Array.from({ length: 14 }, (_, i) => {
  const a0 = (i / 14) * Math.PI * 2;
  const a1 = a0 + Math.PI / 14;
  const r = 400;
  const p = (a: number) => `${(100 + Math.cos(a) * r).toFixed(1)},${(210 + Math.sin(a) * r).toFixed(1)}`;
  return `M100,210 L${p(a0)} L${p(a1)} Z`;
}).join(' ');

/** Comic-paneel achter een figuur: vlak, zonnestralen en stippen. */
function Panel({ id }: { id: string }) {
  return (
    <g className="mm-panel">
      <g clipPath={`url(#${id}-clip)`}>
        <rect x="4" y="4" width="192" height="440" className="mm-panel-bg" />
        <path d={RAYS} className="mm-panel-ray" />
        <rect x="4" y="4" width="192" height="440" fill={`url(#${id}-bg)`} />
      </g>
      <rect x="4" y="4" width="192" height="440" rx="18" className="mm-panel-border" />
    </g>
  );
}

/** Geel vertellersvakje linksboven in het paneel ("VOOR"), over de tekening heen. */
function Tag({ label }: { label: string }) {
  const w = label.length * 12 + 18;
  return (
    <g className="mm-tag" transform="translate(10,12) rotate(-4)">
      <rect x="3" y="3" width={w} height="28" rx="4" className="mm-tag-shadow" />
      <rect width={w} height="28" rx="4" className="mm-tag-box" />
      <text x={w / 2} y="21.5" textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/** Bilspieren zitten in het sportbroekje: in rust hebben ze de broekkleur. */
function fillFor(id: MuscleId, level: MuscleLevel): string {
  if (level === 'idle' && id === 'glutes') return 'shorts';
  return level;
}

/** Ben-Day-blosje: een rozetje kleine stipjes. */
function Blush({ cx, cy }: { cx: number; cy: number }) {
  const d = 3.6;
  const h = d * 0.87;
  const grid = [
    [0, 0],
    [d, 0],
    [-d, 0],
    [d / 2, h],
    [-d / 2, h],
    [d / 2, -h],
    [-d / 2, -h],
  ];
  return (
    <g className="mm-blush">
      {grid.map(([x, y]) => (
        <circle key={`${x},${y}`} cx={cx + x} cy={cy + y} r="1.4" />
      ))}
    </g>
  );
}

function FrontFigure({ map, dots }: { map: MuscleMapData; dots?: string }) {
  return (
    <g>
      <Base />
      {/* sportbroekje */}
      <path d="M63,200 L137,200 L139,240 C122,242 108,246 100,252 C92,246 78,242 61,240 Z" className="mm-shorts" />
      <Muscles shapes={FRONT} map={map} dots={dots} />
      {/* sixpack-lijntjes */}
      <path d="M86,154 L114,154 M86,176 L114,176 M100,132 L100,198" className="mm-detail" />
      {/* hoofd */}
      <circle cx="100" cy="40" r="30" className="mm-skin" />
      <path d="M69,40 C64,6 136,6 131,40 C126,28 114,22 100,24 C86,22 74,28 69,40 Z" className="mm-hair" />
      <path d="M82,17 C90,12 104,12 113,16" className="mm-hair-shine" />
      <path d="M82,33 Q89,28.5 96,32 M104,32 Q111,28.5 118,33" className="mm-brow" />
      <ellipse cx="89" cy="42" rx="3.6" ry="4.6" className="mm-eye" />
      <ellipse cx="111" cy="42" rx="3.6" ry="4.6" className="mm-eye" />
      <circle cx="90.4" cy="40.4" r="1.3" className="mm-eye-shine" />
      <circle cx="112.4" cy="40.4" r="1.3" className="mm-eye-shine" />
      <path d="M90,53 Q100,62 110,53" className="mm-face" />
      <Blush cx={80} cy={51} />
      <Blush cx={120} cy={51} />
    </g>
  );
}

function BackFigure({ map, dots }: { map: MuscleMapData; dots?: string }) {
  return (
    <g>
      <Base />
      <path d="M63,200 L137,200 L139,240 C122,244 108,250 100,252 C92,250 78,244 61,240 Z" className="mm-shorts" />
      <Muscles shapes={BACK} map={map} dots={dots} />
      {/* ruggengraat */}
      <path d="M100,70 L100,198" className="mm-detail" />
      <circle cx="100" cy="40" r="30" className="mm-skin" />
      <circle cx="70" cy="42" r="6" className="mm-skin" />
      <circle cx="130" cy="42" r="6" className="mm-skin" />
      <path d="M70,40 C68,12 132,12 130,40 C128,56 118,64 100,64 C82,64 72,56 70,40 Z" className="mm-hair" />
      <path d="M84,20 C92,15 106,15 114,19" className="mm-hair-shine" />
    </g>
  );
}

export function MuscleMap({ map, size = 'lg', showLegend = size === 'lg', extraLabel, className = '' }: Props) {
  const t = nl.muscles;
  const lg = size === 'lg';
  // useId bevat dubbele punten; die zijn lastig in url(#…).
  const id = `mm${useId().replace(/:/g, '')}`;
  const width = size === 'xs' ? 'w-[84px]' : size === 'sm' ? 'w-[120px]' : 'w-full max-w-[360px]';
  return (
    <figure className={`muscle-map ${lg ? 'mm-animate mm-lg' : ''} ${className}`}>
      <svg
        viewBox="0 0 420 452"
        role="img"
        aria-label={`${t.label}. ${describeMuscleMap(map)}`}
        className={`${width} h-auto`}
      >
        {lg && <PopDefs id={id} />}
        {lg && <Panel id={id} />}
        <FrontFigure map={map} dots={lg ? id : undefined} />
        {lg && <Tag label={t.front} />}
        <g transform="translate(220,0)">
          {lg && <Panel id={id} />}
          <BackFigure map={map} dots={lg ? id : undefined} />
          {lg && <Tag label={t.back} />}
        </g>
      </svg>
      {showLegend && (
        <figcaption className="mt-2 space-y-1 text-sm">
          <LegendRow level="primary" label={t.primary} ids={map.primary} />
          {map.secondary.length > 0 && <LegendRow level="secondary" label={t.secondary} ids={map.secondary} />}
          {extraLabel && <p className="text-muted">{extraLabel}</p>}
        </figcaption>
      )}
    </figure>
  );
}

function LegendRow({ level, label, ids }: { level: 'primary' | 'secondary'; label: string; ids: MuscleId[] }) {
  return (
    <p className="flex items-start gap-2">
      <span className={`mt-1 inline-block h-3.5 w-3.5 shrink-0 rounded-full mm-swatch-${level}`} aria-hidden />
      <span>
        <span className="font-semibold">{label}:</span> {ids.map((id) => MUSCLE_NAMES[id]).join(', ')}
      </span>
    </p>
  );
}
