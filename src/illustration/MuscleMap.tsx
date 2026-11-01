// Cartoon-spierkaart: poppetje voor- en achteraanzicht met gekleurde spiergroepen (PLAN.md §8).
import type { MuscleId, MuscleMap as MuscleMapData } from '../types';
import { nl } from '../content/nl';
import { describeMuscleMap, MUSCLE_NAMES, muscleLevel, type MuscleLevel } from './muscles';

interface Props {
  map: MuscleMapData;
  size?: 'sm' | 'lg';
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
    </g>
  );
}

function Muscles({ shapes, map }: { shapes: [MuscleId, string][]; map: MuscleMapData }) {
  const paths = () =>
    shapes.map(([id, d]) => {
      const level = muscleLevel(map, id);
      return <path key={id} d={d} data-muscle={id} data-level={level} className={`mm-muscle mm-${fillFor(id, level)}`} />;
    });
  return (
    <g>
      {paths()}
      <g transform={MIRROR}>{paths()}</g>
    </g>
  );
}

/** Bilspieren zitten in het sportbroekje: in rust hebben ze de broekkleur. */
function fillFor(id: MuscleId, level: MuscleLevel): string {
  if (level === 'idle' && id === 'glutes') return 'shorts';
  return level;
}

function FrontFigure({ map }: { map: MuscleMapData }) {
  return (
    <g>
      <Base />
      {/* sportbroekje */}
      <path d="M63,200 L137,200 L139,240 C122,242 108,246 100,252 C92,246 78,242 61,240 Z" className="mm-shorts" />
      <Muscles shapes={FRONT} map={map} />
      {/* sixpack-lijntjes */}
      <path d="M86,154 L114,154 M86,176 L114,176 M100,132 L100,198" className="mm-detail" />
      {/* hoofd */}
      <circle cx="100" cy="40" r="30" className="mm-skin" />
      <path d="M69,40 C64,6 136,6 131,40 C126,28 114,22 100,24 C86,22 74,28 69,40 Z" className="mm-hair" />
      <circle cx="89" cy="42" r="3.5" className="mm-eye" />
      <circle cx="111" cy="42" r="3.5" className="mm-eye" />
      <path d="M90,54 Q100,62 110,54" className="mm-detail" />
      <circle cx="82" cy="52" r="4" className="mm-cheek" />
      <circle cx="118" cy="52" r="4" className="mm-cheek" />
    </g>
  );
}

function BackFigure({ map }: { map: MuscleMapData }) {
  return (
    <g>
      <Base />
      <path d="M63,200 L137,200 L139,240 C122,244 108,250 100,252 C92,250 78,244 61,240 Z" className="mm-shorts" />
      <Muscles shapes={BACK} map={map} />
      {/* ruggengraat */}
      <path d="M100,70 L100,198" className="mm-detail" />
      <circle cx="100" cy="40" r="30" className="mm-skin" />
      <circle cx="70" cy="42" r="6" className="mm-skin" />
      <circle cx="130" cy="42" r="6" className="mm-skin" />
      <path d="M70,40 C68,12 132,12 130,40 C128,56 118,64 100,64 C82,64 72,56 70,40 Z" className="mm-hair" />
    </g>
  );
}

export function MuscleMap({ map, size = 'lg', showLegend = size === 'lg', extraLabel, className = '' }: Props) {
  const t = nl.muscles;
  const width = size === 'sm' ? 'w-[120px]' : 'w-full max-w-[360px]';
  return (
    <figure className={`muscle-map ${className}`}>
      <svg
        viewBox="0 0 420 452"
        role="img"
        aria-label={`${t.label}. ${describeMuscleMap(map)}`}
        className={`${width} h-auto`}
      >
        <FrontFigure map={map} />
        <g transform="translate(220,0)">
          <BackFigure map={map} />
        </g>
        {size === 'lg' && (
          <g className="mm-caption">
            <text x="100" y="446" textAnchor="middle">
              {t.front}
            </text>
            <text x="320" y="446" textAnchor="middle">
              {t.back}
            </text>
          </g>
        )}
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
      <span className={`mt-1 inline-block h-3 w-3 shrink-0 rounded-full mm-swatch-${level}`} aria-hidden />
      <span>
        <span className="font-semibold">{label}:</span> {ids.map((id) => MUSCLE_NAMES[id]).join(', ')}
      </span>
    </p>
  );
}
