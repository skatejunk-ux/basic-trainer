import { describe, expect, it } from 'vitest';
import { backExtensionType, resolveIncrement, suggestNext } from '../suggest';
import type { SuggestInput } from '../types';
import {
  cardioLog,
  exercise,
  item,
  machine,
  session,
  sessionSets,
  sets,
  template,
} from './fixtures';

const base = (over: Partial<SuggestInput> = {}): SuggestInput => ({
  exercise: exercise(),
  templateItem: item(),
  setLogs: [],
  ...over,
});

describe('suggestNext – eerste keer', () => {
  it('geen historie → first, gewicht leeg (null, geen 0) met hint', () => {
    const s = suggestNext(base());
    expect(s.kind).toBe('first');
    expect(s.weightKg).toBeNull();
    expect(s.repTarget).toEqual({ min: 6, max: 8 });
    expect(s.reason).toContain('~2 reps over');
    expect(s.reason).toContain('6–8');
    expect(s.warmup).toBeUndefined();
    expect(s.previous).toBeUndefined();
  });

  it('alleen opwarmsets in de historie telt als geen historie', () => {
    const logs = sessionSets('s1', 0, [{ w: 30, r: 10, warmup: true }]);
    expect(suggestNext(base({ setLogs: logs })).kind).toBe('first');
  });

  it('logs van andere oefeningen worden genegeerd', () => {
    const logs = sessionSets('s1', 0, sets(3, 40, 8), { exerciseId: 'chest-press' });
    expect(suggestNext(base({ setLogs: logs })).kind).toBe('first');
  });
});

describe('suggestNext – double progression', () => {
  it('alle sets op de bovenkant → +stap, doel onderkant', () => {
    const s = suggestNext(base({ setLogs: sessionSets('s1', 0, sets(3, 60, 8)) }));
    expect(s.kind).toBe('increase');
    expect(s.weightKg).toBe(65);
    expect(s.repTarget).toBe(6);
    expect(s.reason).toBe('Vorige keer alle sets 8+ reps: +5 kg, doel 6 reps.');
    expect(s.previous).toEqual([{ weightKg: 60, reps: [8, 8, 8] }]);
    expect(s.incrementKg).toBe(5);
  });

  it('meer dan de bovenkant telt ook', () => {
    const s = suggestNext(base({ setLogs: sessionSets('s1', 0, [[60, 10], [60, 9], [60, 8]]) }));
    expect(s.kind).toBe('increase');
  });

  it('niet alle sets op de bovenkant → hold, +1 rep vanaf de zwakste set', () => {
    const s = suggestNext(base({ setLogs: sessionSets('s1', 0, [[60, 8], [60, 7], [60, 6]]) }));
    expect(s.kind).toBe('hold');
    expect(s.weightKg).toBe(60);
    expect(s.repTarget).toBe(7);
    expect(s.reason).toBe('Zelfde gewicht, probeer +1 rep per set (7).');
  });

  it('hold-doel is nooit hoger dan de bovenkant', () => {
    // 2 sets op 8, maar 3 vereist → incompleet; doel blijft 8
    const s = suggestNext(base({ setLogs: sessionSets('s1', 0, [[60, 8], [60, 8]]) }));
    expect(s.kind).toBe('hold');
    expect(s.repTarget).toBe(8);
    expect(s.reason).toContain('Niet alle sets gedaan');
  });

  it('gevoel "zwaar" blokkeert verhoging', () => {
    const logs = sessionSets('s1', 0, [[60, 8], [60, 8], { w: 60, r: 8, feel: 'hard' }]);
    const s = suggestNext(base({ setLogs: logs }));
    expect(s.kind).toBe('hold');
    expect(s.weightKg).toBe(60);
    expect(s.reason).toContain('voelde zwaar');
  });

  it('gevoel "makkelijk"/"goed" blokkeert niet', () => {
    const logs = sessionSets('s1', 0, [
      { w: 60, r: 8, feel: 'easy' },
      { w: 60, r: 8, feel: 'good' },
      [60, 8],
    ]);
    expect(suggestNext(base({ setLogs: logs })).kind).toBe('increase');
  });

  it('één keer onder de onderkant → hold (nog geen deload)', () => {
    const logs = [...sessionSets('s1', 0, sets(3, 60, 7)), ...sessionSets('s2', 2, [[65, 6], [65, 5], [65, 5]])];
    const s = suggestNext(base({ setLogs: logs }));
    expect(s.kind).toBe('hold');
    expect(s.weightKg).toBe(65);
    expect(s.repTarget).toBe(6);
    expect(s.reason).toContain('Onderkant');
  });

  it('twee sessies op rij onder de onderkant → deload −10% afgerond op stap', () => {
    const logs = [
      ...sessionSets('s1', 0, [[70, 6], [70, 5], [70, 5]]),
      ...sessionSets('s2', 2, [[70, 6], [70, 6], [70, 4]]),
    ];
    const s = suggestNext(base({ setLogs: logs }));
    expect(s.kind).toBe('deload');
    expect(s.weightKg).toBe(65); // 63 → 65
    expect(s.repTarget).toEqual({ min: 6, max: 8 });
    expect(s.reason).toContain('−10%');
    expect(s.reason).toContain('65 kg');
  });

  it('deload met kleine stap (bijschuifgewicht)', () => {
    const logs = [...sessionSets('s1', 0, sets(3, 50, 5)), ...sessionSets('s2', 2, sets(3, 50, 5))];
    const s = suggestNext(base({ setLogs: logs, machineSettings: machine({ bijschuifgewicht: 'aan' }) }));
    expect(s.kind).toBe('deload');
    expect(s.weightKg).toBe(45);
  });

  it('twee keer gemist maar op verschillend gewicht → geen deload', () => {
    const logs = [...sessionSets('s1', 0, sets(3, 70, 5)), ...sessionSets('s2', 2, sets(3, 65, 5))];
    expect(suggestNext(base({ setLogs: logs })).kind).toBe('hold');
  });

  it('gemist, gehaald, gemist → geen deload (niet op rij)', () => {
    const logs = [
      ...sessionSets('s1', 0, sets(3, 70, 5)),
      ...sessionSets('s2', 2, sets(3, 70, 7)),
      ...sessionSets('s3', 4, sets(3, 70, 5)),
    ];
    expect(suggestNext(base({ setLogs: logs })).kind).toBe('hold');
  });

  it('kijkt alleen naar de laatste sessie (volgorde op tijd, niet op invoer)', () => {
    const logs = [...sessionSets('new', 5, sets(3, 65, 6)), ...sessionSets('old', 0, sets(3, 60, 8))];
    const s = suggestNext(base({ setLogs: logs }));
    expect(s.kind).toBe('hold');
    expect(s.weightKg).toBe(65);
  });

  it('Session.startedAt bepaalt de volgorde als sessies meegegeven worden', () => {
    // set-tijden zeggen "x nieuwer", sessies zeggen "y nieuwer"
    const logs = [...sessionSets('x', 5, sets(3, 60, 8)), ...sessionSets('y', 0, sets(3, 65, 6))];
    const s = suggestNext(base({ setLogs: logs, sessions: [session('x', 0), session('y', 5)] }));
    expect(s.kind).toBe('hold');
    expect(s.weightKg).toBe(65);
  });

  it('opwarmsets tellen niet mee', () => {
    const logs = sessionSets('s1', 0, [{ w: 30, r: 3, warmup: true }, ...sets(3, 60, 8)]);
    const s = suggestNext(base({ setLogs: logs }));
    expect(s.kind).toBe('increase');
    expect(s.previous?.[0].reps).toEqual([8, 8, 8]);
  });

  it('gemengde gewichten: topgewicht telt; een lichtere set blokkeert verhoging', () => {
    const logs = sessionSets('s1', 0, [[60, 8], [60, 8], [55, 10]]);
    const s = suggestNext(base({ setLogs: logs }));
    expect(s.kind).toBe('hold');
    expect(s.weightKg).toBe(60);
    expect(s.repTarget).toBe(8);
    expect(s.previous).toEqual([{ weightKg: 60, reps: [8, 8] }]);
  });

  it('gemengde gewichten met set onder de onderkant op lager gewicht telt als gemist', () => {
    const logs = [
      ...sessionSets('s1', 0, [[60, 6], [60, 6], [55, 5]]),
      ...sessionSets('s2', 2, [[60, 6], [60, 5], [55, 6]]),
    ];
    const s = suggestNext(base({ setLogs: logs }));
    expect(s.kind).toBe('deload');
    expect(s.weightKg).toBe(55); // 54 → 55
  });

  it('huidige sessie en afgebroken sessies tellen niet als "vorige keer"', () => {
    const logs = [
      ...sessionSets('done', 0, sets(3, 60, 8)),
      ...sessionSets('abandoned', 2, sets(1, 60, 3)),
      ...sessionSets('current', 4, sets(1, 65, 3)),
    ];
    const s = suggestNext(
      base({
        setLogs: logs,
        sessions: [session('done', 0), session('abandoned', 2, { status: 'abandoned' }), session('current', 4, { status: 'active' })],
        currentSessionId: 'current',
      }),
    );
    expect(s.kind).toBe('increase');
    expect(s.weightKg).toBe(65);
  });

  it('opwarmset: ~50% van het werkgewicht, 10 reps, afgerond op stap', () => {
    const s = suggestNext(base({ templateItem: item({ warmupSet: true }), setLogs: sessionSets('s1', 0, sets(3, 60, 8)) }));
    expect(s.weightKg).toBe(65);
    expect(s.warmup).toEqual({ weightKg: 35, reps: 10 }); // 32.5 → 35
  });

  it('opwarmset ontbreekt als het gewicht nog onbekend is', () => {
    const s = suggestNext(base({ templateItem: item({ warmupSet: true }) }));
    expect(s.warmup).toBeUndefined();
  });

  it('geen opwarmset als het template er geen vraagt', () => {
    const s = suggestNext(base({ setLogs: sessionSets('s1', 0, sets(3, 60, 8)) }));
    expect(s.warmup).toBeUndefined();
  });

  it('kommagetallen in de uitleg', () => {
    const s = suggestNext(
      base({ setLogs: sessionSets('s1', 0, sets(3, 60, 8)), machineSettings: machine({ Bijschuifgewicht: 'Aan' }) }),
    );
    expect(s.weightKg).toBe(62.5);
    expect(s.reason).toContain('+2,5 kg');
  });
});

describe('gewichtsstap', () => {
  it('bijschuifgewicht aan → 2,5 kg (hoofdletterongevoelig, ook ja/on/true)', () => {
    for (const v of ['aan', 'Aan', ' AAN ', 'ja', 'on', 'true', '1']) {
      expect(resolveIncrement(exercise(), machine({ bijschuifgewicht: v }, 5))).toBe(2.5);
    }
  });
  it('bijschuifgewicht uit → eigen stackstap', () => {
    expect(resolveIncrement(exercise(), machine({ bijschuifgewicht: 'uit' }, 10))).toBe(10);
  });
  it('geen eigen stap → default van de oefening', () => {
    expect(resolveIncrement(exercise({ defaultIncrementKg: 5 }), machine({}, 0))).toBe(5);
    expect(resolveIncrement(exercise({ defaultIncrementKg: 5 }))).toBe(5);
  });
  it('niets ingesteld → 2,5 kg', () => {
    expect(resolveIncrement(exercise({ defaultIncrementKg: 0 }))).toBe(2.5);
  });
  it('stackstap wordt gebruikt bij verhogen', () => {
    const s = suggestNext(base({ setLogs: sessionSets('s1', 0, sets(3, 60, 8)), machineSettings: machine({}, 7) }));
    expect(s.weightKg).toBe(67);
  });
});

describe('rep-range-buckets (A ↔ B)', () => {
  const itemA = item({ id: 'A-chest', exerciseId: 'leg-press', repMin: 6, repMax: 8 });
  const itemB = item({ id: 'B-chest', exerciseId: 'leg-press', repMin: 10, repMax: 12, sets: 2 });
  const templates = [template('A', 0, [itemA]), template('B', 1, [itemB])];

  it('kijkt alleen naar historie in dezelfde rep-range', () => {
    const logs = [
      ...sessionSets('a1', 0, sets(3, 60, 8), { templateItemId: 'A-chest' }),
      ...sessionSets('b1', 2, sets(2, 45, 10), { templateItemId: 'B-chest' }),
    ];
    const a = suggestNext(base({ templateItem: itemA, setLogs: logs, templates }));
    expect(a.kind).toBe('increase');
    expect(a.weightKg).toBe(65);
    const b = suggestNext(base({ templateItem: itemB, setLogs: logs, templates }));
    expect(b.kind).toBe('hold');
    expect(b.weightKg).toBe(45);
    expect(b.repTarget).toBe(11);
  });

  it('templates met dezelfde range delen een bucket', () => {
    const itemC = item({ id: 'C-chest', repMin: 6, repMax: 8 });
    const logs = sessionSets('c1', 0, sets(3, 60, 8), { templateItemId: 'C-chest' });
    const s = suggestNext(
      base({ templateItem: itemA, setLogs: logs, templates: [...templates, template('C', 2, [itemC])] }),
    );
    expect(s.kind).toBe('increase');
  });

  it('lege bucket → schatting via Epley-1RM uit de andere bucket (zwaar → licht)', () => {
    const logs = sessionSets('a1', 0, sets(3, 60, 8), { templateItemId: 'A-chest' });
    const s = suggestNext(base({ templateItem: itemB, setLogs: logs, templates }));
    // 1RM = 60 × (1 + 8/30) = 76; 76 / (1 + 12/30) = 54.3 → omlaag op 5 = 50
    expect(s.kind).toBe('first');
    expect(s.weightKg).toBe(50);
    expect(s.repTarget).toEqual({ min: 10, max: 12 });
    expect(s.estimatedFrom).toEqual({ repMin: 6, repMax: 8, oneRepMaxKg: 76 });
    expect(s.reason).toBe('Geschat uit je 6–8-sets: begin met 50 kg.');
  });

  it('lege bucket → schatting uit licht → zwaar', () => {
    const logs = sessionSets('b1', 0, sets(2, 50, 12), { templateItemId: 'B-chest' });
    const s = suggestNext(base({ templateItem: itemA, setLogs: logs, templates }));
    // 1RM = 50 × 1.4 = 70; 70 / (1 + 8/30) = 55.26 → 55
    expect(s.weightKg).toBe(55);
    expect(s.estimatedFrom?.oneRepMaxKg).toBe(70);
  });

  it('schatting gebruikt de beste set van de meest recente andere sessie', () => {
    const logs = [
      ...sessionSets('a-old', 0, sets(3, 100, 8), { templateItemId: 'A-chest' }),
      ...sessionSets('a-new', 3, [[60, 8], [60, 6], [50, 8]], { templateItemId: 'A-chest' }),
    ];
    const s = suggestNext(base({ templateItem: itemB, setLogs: logs, templates }));
    expect(s.weightKg).toBe(50);
  });

  it('schatting met opwarmset', () => {
    const logs = sessionSets('a1', 0, sets(3, 60, 8), { templateItemId: 'A-chest' });
    const s = suggestNext(base({ templateItem: { ...itemB, warmupSet: true }, setLogs: logs, templates }));
    expect(s.warmup).toEqual({ weightKg: 25, reps: 10 });
  });

  it('logs van een onbekend (verwijderd) template-item tellen alleen voor de schatting', () => {
    const logs = sessionSets('x1', 0, [[60, 8], [60, 7]], { templateItemId: 'deleted' });
    const s = suggestNext(base({ templateItem: itemA, setLogs: logs, templates }));
    expect(s.kind).toBe('first');
    expect(s.weightKg).toBe(60); // 76 / (1 + 8/30) = 60
    expect(s.estimatedFrom).toMatchObject({ repMin: 7, repMax: 8 });
  });

  it('zonder templates is alleen het eigen template-item herkenbaar', () => {
    const logs = [
      ...sessionSets('a1', 0, sets(3, 60, 8), { templateItemId: 'A-chest' }),
      ...sessionSets('b1', 2, sets(2, 45, 10), { templateItemId: 'B-chest' }),
    ];
    const s = suggestNext(base({ templateItem: itemA, setLogs: logs }));
    expect(s.kind).toBe('increase');
  });

  it('gemengde sessie: één sessie met sets uit A- én B-item wordt per bucket gesplitst', () => {
    const logs = [
      ...sessionSets('m1', 0, sets(3, 60, 8), { templateItemId: 'A-chest' }),
      ...sessionSets('m1', 0, sets(2, 40, 12), { templateItemId: 'B-chest' }).map((l) => ({ ...l, id: `${l.id}-b` })),
    ];
    const a = suggestNext(base({ templateItem: itemA, setLogs: logs, templates }));
    expect(a.kind).toBe('increase');
    expect(a.weightKg).toBe(65);
    const b = suggestNext(base({ templateItem: itemB, setLogs: logs, templates }));
    expect(b.kind).toBe('increase');
    expect(b.weightKg).toBe(45);
  });

  it('andere bucket zonder bruikbaar gewicht (0 kg) → gewone first', () => {
    const logs = sessionSets('a1', 0, sets(3, 0, 8), { templateItemId: 'A-chest' });
    const s = suggestNext(base({ templateItem: itemB, setLogs: logs, templates }));
    expect(s.kind).toBe('first');
    expect(s.weightKg).toBeNull();
  });

  it('schatting die op 0 uitkomt → gewone first', () => {
    const logs = sessionSets('a1', 0, sets(3, 5, 6), { templateItemId: 'A-chest' });
    const s = suggestNext(base({ templateItem: itemB, setLogs: logs, templates, machineSettings: machine({}, 10) }));
    expect(s.weightKg).toBeNull();
    expect(s.estimatedFrom).toBeUndefined();
  });
});

describe('Back Extension', () => {
  const backEx = exercise({ id: 'back-ext', name: 'Back Extension', bodyweightCapable: true, pattern: 'hinge' });
  const backItem = item({ id: 'A-back', exerciseId: 'back-ext', repMin: 10, repMax: 12 });
  const logsFor = (sessionId: string, day: number, s: Parameters<typeof sessionSets>[2]) =>
    sessionSets(sessionId, day, s, { exerciseId: 'back-ext', templateItemId: 'A-back' });
  const bench = machine({ type: 'bench' });
  const input = (over: Partial<SuggestInput> = {}) =>
    base({ exercise: backEx, templateItem: backItem, machineSettings: bench, ...over });

  describe('backExtensionType', () => {
    it('niet van toepassing voor gewone oefeningen', () => {
      expect(backExtensionType(exercise(), machine({ type: 'bench' }))).toBeUndefined();
    });
    it('herkent machine en bank (ook "bank" en "45°")', () => {
      expect(backExtensionType(backEx, machine({ type: 'machine' }))).toBe('machine');
      expect(backExtensionType(backEx, machine({ type: 'bench' }))).toBe('bench');
      expect(backExtensionType(backEx, machine({ Type: 'Bank' }))).toBe('bench');
      expect(backExtensionType(backEx, machine({ type: '45°-bank' }))).toBe('bench');
    });
    it('niets of onbekend → null', () => {
      expect(backExtensionType(backEx)).toBeNull();
      expect(backExtensionType(backEx, machine({ type: '' }))).toBeNull();
      expect(backExtensionType(backEx, machine({ type: 'iets' }))).toBeNull();
    });
  });

  it('geen type ingesteld → eerst vragen', () => {
    const s = suggestNext(input({ machineSettings: undefined }));
    expect(s.kind).toBe('first');
    expect(s.weightKg).toBeNull();
    expect(s.needsChoice).toBe('back-extension-type');
    expect(s.reason).toContain('machine of 45°-bank');
  });

  it('machine → gewone double progression', () => {
    const s = suggestNext(
      input({ machineSettings: machine({ type: 'machine', bijschuifgewicht: 'aan' }), setLogs: logsFor('s1', 0, sets(3, 40, 12)) }),
    );
    expect(s.kind).toBe('increase');
    expect(s.weightKg).toBe(42.5);
    expect(s.bodyweightStage).toBeUndefined();
  });

  it('bank zonder historie → lichaamsgewicht, 0 kg, range', () => {
    const s = suggestNext(input());
    expect(s.kind).toBe('bodyweight-reps');
    expect(s.weightKg).toBe(0);
    expect(s.repTarget).toEqual({ min: 10, max: 12 });
    expect(s.bodyweightStage).toBe('reps');
    expect(s.reason).toContain('Lichaamsgewicht');
  });

  it('bank: reps omhoog, ook voorbij repMax tot repMax+3', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, sets(3, 0, 12)) }));
    expect(s.kind).toBe('bodyweight-reps');
    expect(s.repTarget).toBe(13);
    expect(s.reason).toContain('tot 15');
  });

  it('bank: doel nooit boven repMax+3 en nooit onder repMin', () => {
    const low = suggestNext(input({ setLogs: logsFor('s1', 0, sets(3, 0, 6)) }));
    expect(low.repTarget).toBe(10);
    const nearCap = suggestNext(input({ setLogs: logsFor('s1', 0, [[0, 15], [0, 15], [0, 14]]) }));
    expect(nearCap.repTarget).toBe(15);
  });

  it('bank: zwaar gevoeld → geen extra rep', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, [[0, 12], [0, 12], { w: 0, r: 12, feel: 'hard' }]) }));
    expect(s.repTarget).toBe(12);
  });

  it('bank: geen deload bij lichaamsgewicht', () => {
    const logs = [...logsFor('s1', 0, sets(3, 0, 6)), ...logsFor('s2', 2, sets(3, 0, 6))];
    expect(suggestNext(input({ setLogs: logs })).kind).toBe('bodyweight-reps');
  });

  it('bank: repMax+3 gehaald → volgende trap: tempo', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, sets(3, 0, 15)) }));
    expect(s.kind).toBe('bodyweight-reps');
    expect(s.bodyweightStage).toBe('tempo');
    expect(s.repTarget).toBe(10);
    expect(s.reason).toContain('3 s omlaag');
  });

  it('bank: plafond met "zwaar" telt niet als gehaald', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, [[0, 15], [0, 15], { w: 0, r: 15, feel: 'hard' }]) }));
    expect(s.bodyweightStage).toBe('reps');
    expect(s.repTarget).toBe(15);
  });

  it('bank: in tempo-trap gewoon reps opbouwen', () => {
    const logs = [...logsFor('s1', 0, sets(3, 0, 15)), ...logsFor('s2', 2, sets(3, 0, 11))];
    const s = suggestNext(input({ setLogs: logs }));
    expect(s.bodyweightStage).toBe('tempo');
    expect(s.repTarget).toBe(12);
  });

  it('bank: tweede keer plafond → pauze-trap', () => {
    const logs = [...logsFor('s1', 0, sets(3, 0, 15)), ...logsFor('s2', 2, sets(3, 0, 15))];
    const s = suggestNext(input({ setLogs: logs }));
    expect(s.bodyweightStage).toBe('pause');
    expect(s.reason).toContain('2 s pauze');
  });

  it('bank: derde keer plafond → voorstel gewicht toevoegen', () => {
    const logs = [
      ...logsFor('s1', 0, sets(3, 0, 15)),
      ...logsFor('s2', 2, sets(3, 0, 15)),
      ...logsFor('s3', 4, sets(3, 0, 15)),
    ];
    const s = suggestNext(input({ setLogs: logs, templateItem: { ...backItem, warmupSet: true } }));
    expect(s.kind).toBe('bodyweight-add-load');
    expect(s.weightKg).toBe(5);
    expect(s.repTarget).toBe(10);
    expect(s.warmup).toBeUndefined();
    expect(s.bodyweightStage).toBeUndefined();
  });

  it('bank: minimale trap (bv. "met gewicht" in Training B = pauze)', () => {
    const first = suggestNext(input({ minBodyweightStage: 'pause' }));
    expect(first.bodyweightStage).toBe('pause');
    const after = suggestNext(input({ minBodyweightStage: 'pause', setLogs: logsFor('s1', 0, sets(3, 0, 15)) }));
    expect(after.kind).toBe('bodyweight-add-load');
  });

  it('bank met extra gewicht gelogd → gewone double progression op dat gewicht', () => {
    const logs = [...logsFor('s1', 0, sets(3, 0, 15)), ...logsFor('s2', 2, sets(3, 5, 12))];
    const s = suggestNext(input({ setLogs: logs }));
    expect(s.kind).toBe('increase');
    expect(s.weightKg).toBe(10);
  });
});

describe('unilateraal (Single-Leg Leg Press)', () => {
  const sl = exercise({ id: 'sl-press', name: 'Single-Leg Leg Press', unilateral: true, pattern: 'single-leg' });
  const slItem = item({ id: 'B-sl', exerciseId: 'sl-press', repMin: 10, repMax: 12 });
  const logsFor = (sessionId: string, day: number, s: Parameters<typeof sessionSets>[2]) =>
    sessionSets(sessionId, day, s, { exerciseId: 'sl-press', templateItemId: 'B-sl' });
  const input = (over: Partial<SuggestInput> = {}) => base({ exercise: sl, templateItem: slItem, ...over });
  const both = (wL: number, rL: number, wR: number, rR: number, n = 3) =>
    Array.from({ length: n }, () => [
      { w: wL, r: rL, side: 'L' as const },
      { w: wR, r: rR, side: 'R' as const },
    ]).flat();

  it('geen historie → first per been, zonder startkant', () => {
    const s = suggestNext(input());
    expect(s.kind).toBe('first');
    expect(s.weightKg).toBeNull();
    expect(s.perSide?.L.kind).toBe('first');
    expect(s.perSide?.R.kind).toBe('first');
    expect(s.startSide).toBeUndefined();
    expect(s.imbalance).toBeUndefined();
  });

  it('suggestie per been', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, both(30, 12, 30, 11)) }));
    expect(s.perSide?.L).toMatchObject({ kind: 'increase', weightKg: 35, repTarget: 10 });
    expect(s.perSide?.R).toMatchObject({ kind: 'hold', weightKg: 30, repTarget: 12 });
    expect(s.reason).toContain('Links:');
    expect(s.reason).toContain('Rechts:');
    expect(s.previous).toEqual([
      { weightKg: 30, reps: [12, 12, 12], side: 'L' },
      { weightKg: 30, reps: [11, 11, 11], side: 'R' },
    ]);
  });

  it('klein verschil (≤ 10%) → geen waarschuwing, maar wel beginnen met het zwakkere been', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, both(30, 12, 30, 11)) }));
    expect(s.imbalance).toBeUndefined();
    expect(s.startSide).toBe('R');
    expect(s.kind).toBe('hold'); // top-level volgt het zwakkere been
    expect(s.weightKg).toBe(30);
  });

  it('verschil > 10% → "Links blijft achter: begin met links"', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, both(25, 10, 30, 12)) }));
    expect(s.imbalance?.weakSide).toBe('L');
    expect(s.imbalance?.pct).toBeGreaterThan(10);
    expect(s.startSide).toBe('L');
    expect(s.reason.startsWith('Links blijft achter: begin met links.')).toBe(true);
    expect(s.weightKg).toBe(25);
  });

  it('rechts blijft achter', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, both(30, 12, 20, 12)) }));
    expect(s.reason).toContain('Rechts blijft achter: begin met rechts.');
    expect(s.perSide?.R.weightKg).toBe(25);
  });

  it('gelijke benen → één gezamenlijke uitleg', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, both(30, 12, 30, 12)) }));
    expect(s.reason).toBe('Vorige keer alle sets 12+ reps: +5 kg, doel 10 reps.');
    expect(s.weightKg).toBe(35);
  });

  it('deload per been', () => {
    const logs = [...logsFor('s1', 0, both(40, 8, 40, 12)), ...logsFor('s2', 2, both(40, 9, 40, 12))];
    const s = suggestNext(input({ setLogs: logs }));
    expect(s.perSide?.L.kind).toBe('deload');
    expect(s.perSide?.L.weightKg).toBe(35); // 36 → 35
    expect(s.perSide?.R.kind).toBe('increase');
  });

  it('sets zonder kant tellen voor beide benen', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, sets(3, 30, 12)) }));
    expect(s.perSide?.L.weightKg).toBe(35);
    expect(s.perSide?.R.weightKg).toBe(35);
    expect(s.startSide).toBeUndefined();
  });

  it('balans uit nieuwste sessie waarin beide benen gelogd zijn', () => {
    const logs = [
      ...logsFor('s1', 0, both(20, 12, 30, 12)),
      ...logsFor('s2', 2, [{ w: 30, r: 12, side: 'L' }]),
    ];
    const s = suggestNext(input({ setLogs: logs }));
    expect(s.imbalance?.weakSide).toBe('L');
  });

  it('balans met 0 reps aan één kant wordt overgeslagen', () => {
    const s = suggestNext(input({ setLogs: logsFor('s1', 0, both(30, 0, 30, 12, 1)) }));
    expect(s.imbalance).toBeUndefined();
    expect(s.startSide).toBeUndefined();
  });

  it('lege bucket → schatting per been uit de andere range', () => {
    const otherItem = item({ id: 'X-sl', exerciseId: 'sl-press', repMin: 6, repMax: 8 });
    const logs = sessionSets('a1', 0, both(40, 8, 30, 8), { exerciseId: 'sl-press', templateItemId: 'X-sl' });
    const s = suggestNext(
      input({ setLogs: logs, templates: [template('A', 0, [otherItem]), template('B', 1, [slItem])] }),
    );
    expect(s.perSide?.L.weightKg).toBe(35); // 40 × 1.2667 = 50.67 / 1.4 = 36.2 → 35
    expect(s.perSide?.R.weightKg).toBe(25);
    expect(s.startSide).toBe('R');
    expect(s.imbalance?.weakSide).toBe('R');
    expect(s.estimatedFrom).toBeDefined();
  });

  it('opwarmset volgt het zwakkere been', () => {
    const s = suggestNext(input({ templateItem: { ...slItem, warmupSet: true }, setLogs: logsFor('s1', 0, both(20, 10, 30, 12)) }));
    expect(s.weightKg).toBe(20);
    expect(s.warmup).toEqual({ weightKg: 10, reps: 10 });
  });
});

describe('loopband (cardio)', () => {
  const tm = exercise({ id: 'treadmill', name: 'Loopband', kind: 'cardio', pattern: 'walk', defaultIncrementKg: 0 });
  const tmItem = item({
    id: 'A-tm',
    exerciseId: 'treadmill',
    sets: 1,
    repMin: 0,
    repMax: 0,
    cardio: { minutes: 30, inclinePct: 12, speedKmh: 4.8 },
  });
  const input = (over: Partial<SuggestInput> = {}) => base({ exercise: tm, templateItem: tmItem, ...over });

  it('altijd 12-3-30, geen gewicht', () => {
    const s = suggestNext(input());
    expect(s.kind).toBe('cardio');
    expect(s.weightKg).toBeNull();
    expect(s.cardio).toEqual({ minutes: 30, inclinePct: 12, speedKmh: 4.8 });
    expect(s.repTarget).toBe(30);
    expect(s.reason).toBe('12% helling, 4,8 km/u, 30 min.');
  });

  it('zonder cardio-plan in het template → standaard 12-3-30', () => {
    const s = suggestNext(input({ templateItem: { ...tmItem, cardio: undefined } }));
    expect(s.cardio).toEqual({ minutes: 30, inclinePct: 12, speedKmh: 4.8 });
  });

  it('geen opbouw: na 30 min blijft het 30 min', () => {
    const s = suggestNext(input({ cardioLogs: [cardioLog('s1', 0, 30), cardioLog('s2', 2, 30)] }));
    expect(s.cardio?.minutes).toBe(30);
    expect(s.reason).toBe('12% helling, 4,8 km/u, 30 min.');
  });

  it('vorige keer korter → info "vorige keer 22 min", maar plan blijft 30', () => {
    const s = suggestNext(input({ cardioLogs: [cardioLog('s1', 0, 30), cardioLog('s2', 2, 22)] }));
    expect(s.cardio?.minutes).toBe(30);
    expect(s.reason).toBe('12% helling, 4,8 km/u, 30 min. Vorige keer 22 min.');
  });

  it('opwarm-loopband in dezelfde sessie overschaduwt de 30 min niet', () => {
    const s = suggestNext(input({ cardioLogs: [cardioLog('s1', 0, 5), cardioLog('s1', 0.1, 30)] }));
    expect(s.reason).not.toContain('Vorige keer');
  });

  it('huidige en afgebroken sessies tellen niet; andere oefeningen ook niet', () => {
    const s = suggestNext(
      input({
        cardioLogs: [
          cardioLog('s1', 0, 30),
          cardioLog('ab', 1, 10),
          cardioLog('cur', 2, 3),
          cardioLog('s1', 0, 1, 'bike'),
        ],
        sessions: [session('s1', 0), session('ab', 1, { status: 'abandoned' }), session('cur', 2, { status: 'active' })],
        currentSessionId: 'cur',
      }),
    );
    expect(s.reason).not.toContain('Vorige keer');
  });

  it('volgorde op Session.startedAt', () => {
    const s = suggestNext(
      input({
        cardioLogs: [cardioLog('x', 5, 30), cardioLog('y', 0, 20)],
        sessions: [session('x', 0), session('y', 5)],
      }),
    );
    expect(s.reason).toContain('Vorige keer 20 min.');
  });

  it('opwarm-item met eigen plan (5 min) krijgt geen "korter"-info', () => {
    const s = suggestNext(
      input({
        templateItem: { ...tmItem, id: 'A-warm', cardio: { minutes: 5, inclinePct: 1, speedKmh: 5 } },
        cardioLogs: [cardioLog('s1', 0, 30)],
      }),
    );
    expect(s.cardio?.minutes).toBe(5);
    expect(s.reason).toBe('1% helling, 5 km/u, 5 min.');
  });
});
