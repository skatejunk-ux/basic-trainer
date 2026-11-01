// Seed-tekst (Nederlands) voor oefeningen en schema's (PLAN.md par. 3 en 4).
import type { Exercise, Template, TemplateItem } from '../types';

const bijschuif = {
  key: 'bijschuifgewicht',
  label: 'Bijschuifgewicht',
  hint: 'aan/uit (bv. +2,5 kg)',
};

export const SEED_EXERCISES: Exercise[] = [
  {
    id: 'leg-press',
    name: 'Seated Leg Press',
    pattern: 'squat',
    muscles: ['Quadriceps', 'Bilspieren'],
    kind: 'strength',
    unilateral: false,
    bodyweightCapable: false,
    settingFields: [
      { key: 'seat', label: 'Rugleuning/zitting', hint: 'nr' },
      { key: 'feet', label: 'Voetpositie', hint: 'hoog/midden/laag' },
      bijschuif,
    ],
    setup: [
      'Stel de rugleuning zo in dat je knieën ~90° maken in de startpositie.',
      'Voeten heupbreed, midden op het platform.',
      'Pak de handgrepen naast de zitting vast.',
    ],
    cues: [
      'Duw uit vanuit je hielen.',
      'Knieën bovenaan niet op slot.',
      'Gecontroleerd terug tot ~90°.',
      'Onderrug en billen blijven tegen het kussen.',
    ],
    mistakes: [
      'Knieën die naar binnen vallen.',
      'Billen die loskomen.',
      'Te diep zakken waardoor je onderrug bolt.',
    ],
    breathing: 'Uit bij het duwen, in bij het terugkomen.',
    tempo: '1 s duwen – 2 s terug',
    defaultIncrementKg: 5,
    animationId: 'leg-press',
    isCustom: false,
  },
  {
    id: 'back-extension',
    name: 'Back Extension',
    pattern: 'hinge',
    muscles: ['Hamstrings', 'Bilspieren', 'Onderrug'],
    kind: 'strength',
    unilateral: false,
    bodyweightCapable: true,
    settingFields: [
      {
        key: 'type',
        label: 'Type',
        hint: 'machine (Technogym Lower Back, zittend) of bank (45°-hyperextension)',
      },
      { key: 'seat', label: 'Zithoogte', hint: 'nr (machine)' },
      { key: 'backpad', label: 'Rugkussen/startpositie', hint: 'nr (machine)' },
      { key: 'padHeight', label: 'Kussenhoogte', hint: 'nr (bank)' },
      { key: 'footrest', label: 'Voetsteun', hint: 'nr (bank)' },
      bijschuif,
    ],
    setup: [
      'Bank: Steunkussen net onder de heupbuiging.',
      'Bank: Hielen stevig onder/tegen de rol.',
      'Bank: Armen gekruist voor de borst.',
      'Machine: Zithoogte zo dat het rugkussen op je schouderbladen ligt.',
      'Machine: Voeten plat op de steun, dijen onder het kussen.',
      'Machine: Armen gekruist voor de borst.',
    ],
    cues: [
      'Buig gecontroleerd voorover vanuit de heup, rug neutraal.',
      'Span billen en hamstrings aan om rechtop te komen tot je lichaam een rechte lijn vormt – niet overstrekken.',
      'Bank met gewicht (Training B): 2 s pauze bovenaan + langzaam 3 s omlaag (geen free weights).',
    ],
    mistakes: ['Bovenaan doorhangen naar achteren.', 'Zwaaien.', 'Rug rond trekken.'],
    breathing: 'In naar beneden, uit omhoog.',
    tempo: '1 s omhoog – 1 s vasthouden – 2 s omlaag',
    defaultIncrementKg: 5,
    animationId: 'back-extension-machine',
    isCustom: false,
  },
  {
    id: 'single-leg-press',
    name: 'Single-Leg Leg Press',
    pattern: 'single-leg',
    muscles: ['Benen', 'Krachtsverschil corrigeren'],
    kind: 'strength',
    unilateral: true,
    bodyweightCapable: false,
    settingFields: [
      { key: 'seat', label: 'Rugleuning/zitting', hint: 'nr' },
      { key: 'feet', label: 'Voetpositie', hint: 'hoog/midden/laag' },
      { key: 'weightPerLeg', label: 'Gewicht per been', hint: 'kg' },
      bijschuif,
    ],
    setup: [
      'Zelfde machine, gewicht ~40% van je tweebenige gewicht.',
      'Eén voet centraal op het platform, andere voet rust op de grond/het frame.',
    ],
    cues: [
      'Begin met je zwakkere been; doe met je sterke been hetzelfde aantal reps.',
      'Knie in lijn met de tenen, niet op slot.',
    ],
    mistakes: ['Heup die kantelt.', 'Knie naar binnen.', 'Sterk been meer reps laten doen.'],
    breathing: 'Uit bij het duwen, in bij het terugkomen.',
    tempo: '1 s duwen – 2 s terug',
    defaultIncrementKg: 5,
    animationId: 'single-leg-press',
    isCustom: false,
  },
  {
    id: 'shoulder-press',
    name: 'Seated Shoulder Press',
    pattern: 'vertical-push',
    muscles: ['Schouders', 'Triceps'],
    kind: 'strength',
    unilateral: false,
    bodyweightCapable: false,
    settingFields: [
      { key: 'seat', label: 'Zithoogte', hint: 'nr' },
      { key: 'grip', label: 'Greep', hint: 'neutraal/breed' },
      bijschuif,
    ],
    setup: [
      'Zitting zo dat de handgrepen in de startpositie op schouderhoogte hangen.',
      'Rug tegen de leuning, voeten plat.',
    ],
    cues: [
      'Druk verticaal omhoog tot de armen bijna gestrekt zijn.',
      'Gecontroleerd terug tot schouderhoogte.',
      'Buikspieren aan.',
    ],
    mistakes: ['Holle rug.', 'Ellebogen op slot.', 'Hoofd naar voren.'],
    breathing: 'Uit bij duwen.',
    tempo: '1 s – 2 s',
    defaultIncrementKg: 2.5,
    animationId: 'shoulder-press',
    isCustom: false,
  },
  {
    id: 'chest-press',
    name: 'Seated Chest Press',
    pattern: 'horizontal-press',
    muscles: ['Borst', 'Voorkant schouders', 'Triceps'],
    kind: 'strength',
    unilateral: false,
    bodyweightCapable: false,
    settingFields: [
      { key: 'seat', label: 'Zithoogte', hint: 'nr' },
      { key: 'range', label: 'Startpositie/bereik', hint: 'nr, indien aanwezig' },
      { key: 'grip', label: 'Greep', hint: 'horizontaal/verticaal' },
      bijschuif,
    ],
    setup: [
      'Handgrepen ter hoogte van het midden van je borst.',
      'Schouderbladen naar achter en omlaag, stevig tegen de rugleuning.',
    ],
    cues: [
      'Druk naar voren tot de armen bijna gestrekt zijn.',
      'Gecontroleerd terug zonder dat het gewicht neerklapt.',
    ],
    mistakes: ['Schouders die naar voren rollen.', 'Ellebogen te hoog.', 'Gewicht laten stuiteren.'],
    breathing: 'Uit bij duwen.',
    tempo: '1 s – 2 s',
    defaultIncrementKg: 2.5,
    animationId: 'chest-press',
    isCustom: false,
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    pattern: 'vertical-pull',
    muscles: ['Lats', 'Biceps'],
    kind: 'strength',
    unilateral: false,
    bodyweightCapable: false,
    settingFields: [
      { key: 'thighPad', label: 'Dijkussenhoogte', hint: 'nr' },
      { key: 'grip', label: 'Greep', hint: 'stang breed/smal/V' },
      bijschuif,
    ],
    setup: [
      'Klem je bovenbenen stevig onder de kussens.',
      'Pak de stang iets breder dan schouderbreedte.',
    ],
    cues: [
      'Borst omhoog, licht achterover (~10–15°).',
      'Trek de stang naar de bovenkant van je borst, ellebogen omlaag sturen.',
      'Gecontroleerd terug tot de armen gestrekt zijn.',
    ],
    mistakes: ['Achter de nek trekken.', 'Zwaaien met het bovenlichaam.', 'Schouders optrekken.'],
    breathing: 'Uit bij trekken.',
    tempo: '1 s trekken – 2 s terug',
    defaultIncrementKg: 2.5,
    animationId: 'lat-pulldown',
    isCustom: false,
  },
  {
    id: 'cable-row',
    name: 'Seated Cable Row',
    pattern: 'horizontal-row',
    muscles: ['Middenrug', 'Biceps'],
    kind: 'strength',
    unilateral: false,
    bodyweightCapable: false,
    settingFields: [
      { key: 'seat', label: 'Zitting/borstkussen', hint: 'nr' },
      { key: 'grip', label: 'Greep', hint: 'V-greep/breed' },
      bijschuif,
    ],
    setup: [
      'Voeten op de steunen, knieën licht gebogen (of borst tegen het kussen bij de row-machine).',
    ],
    cues: [
      'Borst vooruit, rug recht.',
      'Trek de greep naar je navel en knijp je schouderbladen samen.',
      'Gecontroleerd terug.',
    ],
    mistakes: ['Achterover zwaaien.', 'Ronde rug.', 'Schouders optrekken.'],
    breathing: 'Uit bij trekken.',
    tempo: '1 s – 1 s knijpen – 2 s terug',
    defaultIncrementKg: 2.5,
    animationId: 'cable-row',
    isCustom: false,
  },
  {
    id: 'treadmill',
    name: 'Loopband 12-3-30',
    pattern: 'walk',
    muscles: ['Vetverbranding', 'Herstel'],
    kind: 'cardio',
    unilateral: false,
    bodyweightCapable: false,
    settingFields: [
      { key: 'inclinePct', label: 'Helling', hint: '%' },
      { key: 'speedKmh', label: 'Snelheid', hint: 'km/u' },
      { key: 'minutes', label: 'Duur', hint: 'min' },
    ],
    setup: [
      'Standaard: helling 12%, snelheid 4,8 km/u, 30 min.',
      'Direct 12-3-30 vanaf de eerste training; geen opbouwplan. De waarden zijn per sessie aanpasbaar (stop je eerder, log dan de werkelijke duur).',
    ],
    cues: [
      'Niet aan de handgrepen hangen.',
      'Rechtop lopen, kleine stappen.',
      'Bij duizeligheid/pijn stoppen.',
    ],
    mistakes: [],
    breathing: '',
    tempo: '',
    defaultIncrementKg: 0,
    animationId: 'treadmill-walk',
    isCustom: false,
  },
];

function item(
  id: string,
  exerciseId: string,
  sets: number,
  repMin: number,
  repMax: number,
  restSec: number,
  extra: Partial<TemplateItem> = {},
): TemplateItem {
  return { id, exerciseId, sets, repMin, repMax, restSec, warmupSet: false, ...extra };
}

// Warming-up: 5 min rustig. Helling/snelheid zijn niet in het plan gespecificeerd (gekozen: 0% / 4,0 km/u).
const warmup = (id: string) =>
  item(id, 'treadmill', 1, 1, 1, 0, { cardio: { minutes: 5, inclinePct: 0, speedKmh: 4 } });
const cardio1230 = (id: string) =>
  item(id, 'treadmill', 1, 1, 1, 0, { cardio: { minutes: 30, inclinePct: 12, speedKmh: 4.8 } });
const strength = (
  id: string,
  exerciseId: string,
  sets: number,
  repMin: number,
  repMax: number,
  restSec: number,
) => item(id, exerciseId, sets, repMin, repMax, restSec, { warmupSet: true });

export const SEED_TEMPLATES: Template[] = [
  {
    id: 'template-a',
    name: 'A',
    order: 0,
    items: [
      warmup('a-0'),
      strength('a-1', 'leg-press', 3, 6, 8, 120),
      strength('a-2', 'back-extension', 3, 10, 12, 90),
      strength('a-3', 'chest-press', 3, 6, 8, 120),
      strength('a-4', 'lat-pulldown', 3, 6, 8, 120),
      strength('a-5', 'shoulder-press', 2, 10, 12, 90),
      strength('a-6', 'cable-row', 2, 10, 12, 90),
      cardio1230('a-7'),
    ],
  },
  {
    id: 'template-b',
    name: 'B',
    order: 1,
    items: [
      warmup('b-0'),
      // Plan: 60 s tussen benen / 90 s tussen sets; restSec = rust tussen sets.
      strength('b-1', 'single-leg-press', 3, 10, 12, 90),
      strength('b-2', 'back-extension', 3, 8, 10, 90),
      strength('b-3', 'shoulder-press', 3, 6, 8, 120),
      strength('b-4', 'cable-row', 3, 6, 8, 120),
      strength('b-5', 'chest-press', 2, 10, 12, 90),
      strength('b-6', 'lat-pulldown', 2, 10, 12, 90),
      cardio1230('b-7'),
    ],
  },
];
