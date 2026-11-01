// Nederlandse gebruikersteksten van de coach. Staan hier (niet in src/content/) zodat de
// coach een pure, op zichzelf staande module blijft; de UI kan ze desgewenst overnemen.
import { formatKg } from './math';
import type { BodyweightStage, Side } from './types';

const range = (min: number, max: number) => `${min}–${max}`;
const sideName = (s: Side) => (s === 'L' ? 'links' : 'rechts');
const SideName = (s: Side) => (s === 'L' ? 'Links' : 'Rechts');

export const coachText = {
  first: (min: number, max: number) =>
    `Eerste keer: kies een gewicht waarmee je ${range(min, max)} reps haalt met nog ~2 reps over.`,
  estimated: (kg: number, fromMin: number, fromMax: number) =>
    `Geschat uit je ${range(fromMin, fromMax)}-sets: begin met ${formatKg(kg)} kg.`,
  increase: (inc: number, repMax: number, repMin: number) =>
    `Vorige keer alle sets ${repMax}+ reps: +${formatKg(inc)} kg, doel ${repMin} reps.`,
  holdPlusOne: (reps: number) => `Zelfde gewicht, probeer +1 rep per set (${reps}).`,
  holdHard: (reps: number) => `Vorige keer voelde zwaar: zelfde gewicht, doel ${reps} reps.`,
  holdMissedOnce: (reps: number) =>
    `Onderkant vorige keer niet overal gehaald: zelfde gewicht, doel ${reps} reps.`,
  holdIncomplete: (reps: number) =>
    `Niet alle sets gedaan: eerst alle sets afmaken met dit gewicht, doel ${reps} reps.`,
  deload: (kg: number) =>
    `Twee keer op rij de onderkant niet gehaald: −10% naar ${formatKg(kg)} kg en weer opbouwen.`,
  chooseBackExtensionType: 'Kies eerst je type Back Extension: machine of 45°-bank.',
  bodyweightFirst: (min: number, max: number) =>
    `Lichaamsgewicht: doe ${range(min, max)} nette reps per set.`,
  bodyweightStageLabel: (stage: BodyweightStage) =>
    stage === 'reps'
      ? 'normaal tempo'
      : stage === 'tempo'
        ? 'langzaam 3 s omlaag'
        : '2 s pauze bovenaan + 3 s omlaag',
  bodyweightReps: (reps: number, cap: number, stage: BodyweightStage) =>
    `Lichaamsgewicht (${coachText.bodyweightStageLabel(stage)}): probeer ${reps} reps per set, tot ${cap}.`,
  bodyweightNextStage: (stage: BodyweightStage, repMin: number) =>
    `Bovenkant gehaald! Volgende stap: ${coachText.bodyweightStageLabel(stage)}, begin weer bij ${repMin} reps.`,
  bodyweightAddLoad: (inc: number) =>
    `Alle varianten gehaald: tijd voor extra gewicht (bv. ${formatKg(inc)} kg) of de machine-variant.`,
  imbalance: (weak: Side) => `${SideName(weak)} blijft achter: begin met ${sideName(weak)}.`,
  perSide: (l: string, r: string) => `Links: ${l} Rechts: ${r}`,
  cardioPlan: (incline: number, speed: number, minutes: number) =>
    `${formatKg(incline)}% helling, ${formatKg(speed)} km/u, ${minutes} min.`,
  cardioShorter: (lastMinutes: number) => `Vorige keer ${formatKg(lastMinutes)} min.`,
  // Beloningen (compareToPrevious)
  celebrateKg: (kg: number, name: string) => `Nieuw: +${formatKg(kg)} kg op de ${name} 💪`,
  celebrateReps: (reps: number, name: string) =>
    `Nieuw: +${reps} ${reps === 1 ? 'rep' : 'reps'} op de ${name} 💪`,
  celebrateMet: (name: string) => `Doel gehaald op de ${name} 💪`,
  celebrateStart: (kg: number, name: string) => `Startgewicht ${formatKg(kg)} kg op de ${name} 💪`,
  celebrateCardio: (minutes: number, name: string) =>
    `${formatKg(minutes)} min volgehouden op de ${name} 💪`,
};
