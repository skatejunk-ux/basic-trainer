# Basic-Trainer – bouwplan

Naam: **Basic-Trainer** – een PWA voor Android waarmee je een Basic-Fit machine-routine volgt, je machine-instellingen onthoudt, sets/reps logt en vooruitgang ziet.

Bron oefeningen: `oefeningen.txt` (+ 12-3-30 loopbandmethode uit https://www.youtube.com/watch?v=l2uB6wTiEiw).

---

## 1. Gemaakte keuzes

| Onderwerp | Keuze |
|---|---|
| Platform | **PWA** (installeerbaar via Chrome op Android, werkt offline) |
| Opslag | **Lokaal op de telefoon** (IndexedDB) + **export/import JSON** als backup. Geen account. |
| Visuals | **Cartoon-spierkaart per oefening** (statische SVG: poppetje voor- en achteraanzicht, getrainde spiergroepen gekleurd). Animaties → backlog (§10). |
| Niveau / ritme | Wat ervaring, **3–4x per week** |
| Split | **Full-body A/B**, wisselend (A-B-A, B-A-B, …) |
| Extra's v1 | **Rusttimer + trillen**, **slimme gewichtsuggesties** (progressie-coach) |
| Hosting | **GitHub Pages**, persoonlijk account `skatejunk-ux` (skatejunk@gmail.com), repo `basic-trainer` (publiek, nodig voor gratis Pages) → `https://skatejunk-ux.github.io/basic-trainer/`. **Niet** het werkaccount `JobVanDonselaar` gebruiken. |
| Trillen / scherm aan | Beide **uitschakelbaar**: in Instellingen én met snelle toggles in de workout-modus |
| Machines | **Technogym** (Selection-lijn) als standaard voor instelvelden |
| Back Extension | Type onbekend → app ondersteunt **machine met gewichtsstapel én 45°-bank**; je kiest bij eerste gebruik |
| Startgewichten | Bepalen **tijdens de eerste training** (coach in "first"-modus) |
| Loopband | **Direct 12-3-30** (12%, 4,8 km/u, 30 min), geen opbouwplan |
| Taal / eenheden | Nederlands, kg, km/u |

Bewust **niet** in v1 (backlog, §10): badges/records-feest, uitgebreide statistieken, cloud-sync, foto's.
Wel in v1, omdat het een kerneis is ("historie om vooruitgang te tracken"): sessiehistorie + **één simpele lijngrafiek per oefening**.

---

## 2. Techstack

- **Vite + React 18 + TypeScript** (strict)
- **Tailwind CSS** – mobile-first, groot touch-oppervlak (min. 48px), donker thema als standaard (sportschool-licht/batterij) + licht thema
- **vite-plugin-pwa** (Workbox) – manifest, service worker, volledige offline precache
- **Dexie.js** – IndexedDB-wrapper met schema-versies/migraties
- **Zustand** – lichte state voor de actieve workout
- **React Router** (HashRouter, i.v.m. GitHub Pages)
- **@dnd-kit** – drag-and-drop voor volgorde aanpassen (touch-vriendelijk)
- **Grafiek**: zelfgeschreven kleine SVG-lijngrafiek (geen zware chart-lib nodig)
- **Testen**: Vitest (unit, vooral progressie-engine en data), Playwright met Android-viewport (e2e)
- **Deploy**: GitHub Actions → GitHub Pages bij push naar `main`

Browser-API's: `navigator.vibrate` (rusttimer), **Screen Wake Lock API** (scherm aan tijdens training), `navigator.storage.persist()` (voorkomt dat Android de data opruimt).

---

## 3. Trainingsschema (seed-data)

Alle oefeningen zitten in **elke week meerdere keren** in het schema. A = zwaarder accent op benen/borst/lats, B = zwaarder accent op schouders/row, unilateraal benen.

### Training A
| # | Oefening | Sets × reps | Rust |
|---|---|---|---|
| 0 | Warming-up: Loopband 5 min rustig | – | – |
| 1 | Seated Leg Press | 3 × 6–8 | 120 s |
| 2 | Back Extension | 3 × 10–12 | 90 s |
| 3 | Seated Chest Press | 3 × 6–8 | 120 s |
| 4 | Lat Pulldown | 3 × 6–8 | 120 s |
| 5 | Seated Shoulder Press | 2 × 10–12 | 90 s |
| 6 | Seated Cable Row | 2 × 10–12 | 90 s |
| 7 | Loopband 12-3-30 | 1 × 30 min | – |

### Training B
| # | Oefening | Sets × reps | Rust |
|---|---|---|---|
| 0 | Warming-up: Loopband 5 min rustig | – | – |
| 1 | Single-Leg Leg Press | 3 × 10–12 per been | 60 s tussen benen / 90 s tussen sets |
| 2 | Back Extension (met gewicht) | 3 × 8–10 | 90 s |
| 3 | Seated Shoulder Press | 3 × 6–8 | 120 s |
| 4 | Seated Cable Row | 3 × 6–8 | 120 s |
| 5 | Seated Chest Press | 2 × 10–12 | 90 s |
| 6 | Lat Pulldown | 2 × 10–12 | 90 s |
| 7 | Loopband 12-3-30 | 1 × 30 min | – |

- De app kiest automatisch **de volgende training** (afwisselend A/B), maar je kunt altijd handmatig de andere kiezen.
- Per oefening optioneel **1 opwarmset** (~50% van werkgewicht, 10 reps), niet meegeteld in progressie.
- Alles is aanpasbaar in de schema-editor (§6.4): volgorde, sets, rep-range, rust, oefeningen toevoegen/verwijderen, extra templates (bv. "C – kort, 45 min").

---

## 4. Oefeningen-content (seed, NL)

Iedere oefening heeft: naam, bewegingspatroon, spiergroepen, **instelvelden** (wat je aan de machine verstelt), **setup-stappen**, **uitvoeringscues**, **veelgemaakte fouten**, **ademhaling**, **tempo**, standaard **gewichtsstap**, **spierkaart** (primaire/secundaire spiergroepen, §8) en een gereserveerde **animatie-id** voor later.

> Instelvelden zijn vrij invulbare key/value-paren met voorgestelde labels. De gebruiker vult zelf het nummer in (bv. "Stoel: 4"). De app toont deze als chips bovenaan de oefening.
>
> **Technogym-standaard**: Technogym Selection-machines hebben doorgaans genummerde instellingen voor **zithoogte**, **rugleuning** en een **startpositie/bereik-hendel**, plus een gewichtsstapel. De labels hieronder volgen die conventie; het exacte aantal standen verschilt per machine, dus velden zijn vrije tekst. Kleine gewichtsstappen: veel Technogym-stacks hebben een **bijschuifgewichtje** (bv. +2,5 kg) — veld `Bijschuifgewicht` (aan/uit) zodat de coach 2,5 kg-stappen kan voorstellen.

### 4.1 Seated Leg Press — Squat-patroon · Quadriceps & bilspieren
- **Instellingen**: Rugleuning/zitting (nr), Voetpositie (hoog/midden/laag), Gewicht (kg). Stap: 5 kg.
- **Setup**: 1) Stel de rugleuning zo in dat je knieën ~90° maken in de startpositie. 2) Voeten heupbreed, midden op het platform. 3) Pak de handgrepen naast de zitting vast.
- **Uitvoering**: Duw uit vanuit je hielen. Knieën bovenaan **niet op slot**. Gecontroleerd terug tot ~90°. Onderrug en billen blijven tegen het kussen.
- **Fouten**: knieën die naar binnen vallen; billen die loskomen; te diep zakken waardoor je onderrug bolt.
- **Adem**: uit bij het duwen, in bij het terugkomen. **Tempo**: 1 s duwen – 2 s terug.

### 4.2 Back Extension Machine (of 45° hyperextension) — Hinge · Hamstrings, bilspieren, onderrug
- **Twee varianten** (veld `Type`, gekozen bij eerste gebruik, later wijzigbaar):
  - **Machine (Technogym Lower Back, zittend)**: Zithoogte (nr), Rugkussen/startpositie (nr), Gewicht (kg). Stap 5 kg (2,5 met bijschuifgewicht).
  - **45°-bank**: Kussenhoogte (nr), Voetsteun (nr). Lichaamsgewicht; progressie via reps → tempo → 2 s pauze bovenaan.
- **Setup (bank)**: 1) Steunkussen net **onder de heupbuiging**. 2) Hielen stevig onder/tegen de rol. 3) Armen gekruist voor de borst.
- **Setup (machine)**: 1) Zithoogte zo dat het rugkussen op je schouderbladen ligt. 2) Voeten plat op de steun, dijen onder het kussen. 3) Armen gekruist voor de borst.
- In Training B betekent "met gewicht" bij de bank-variant: **2 s pauze bovenaan + langzaam 3 s omlaag** (geen free weights).
- **Uitvoering**: Buig gecontroleerd voorover vanuit de heup, rug neutraal. Span billen en hamstrings aan om rechtop te komen tot je lichaam een rechte lijn vormt — **niet overstrekken**.
- **Fouten**: bovenaan doorhangen naar achteren; zwaaien; rug rond trekken.
- **Adem**: in naar beneden, uit omhoog. **Tempo**: 1 s omhoog – 1 s vasthouden – 2 s omlaag.

### 4.3 Single-Leg Leg Press — Lunge/single leg · Benen & krachtsverschil corrigeren
- **Instellingen**: zoals Leg Press + Gewicht per been (kg). Stap: 5 kg (of kleinste stap van de machine).
- **Setup**: 1) Zelfde machine, gewicht ~40% van je tweebenige gewicht. 2) Eén voet **centraal** op het platform, andere voet rust op de grond/het frame.
- **Uitvoering**: Begin met je **zwakkere been**; doe met je sterke been **hetzelfde aantal reps**. Knie in lijn met de tenen, niet op slot.
- **Fouten**: heup die kantelt; knie naar binnen; sterk been meer reps laten doen.
- **Logging**: reps **per been (L/R)** → de app toont het krachtsverschil.

### 4.4 Seated Shoulder Press — Vertical push · Schouders & triceps
- **Instellingen**: Zithoogte (nr), Greep (neutraal/breed), Gewicht. Stap: 2,5–5 kg.
- **Setup**: Zitting zo dat de handgrepen in de startpositie op **schouderhoogte** hangen. Rug tegen de leuning, voeten plat.
- **Uitvoering**: Druk verticaal omhoog tot de armen bijna gestrekt zijn, gecontroleerd terug tot schouderhoogte. Buikspieren aan.
- **Fouten**: holle rug; ellebogen op slot; hoofd naar voren.
- **Adem**: uit bij duwen. **Tempo**: 1 s – 2 s.

### 4.5 Seated Chest Press — Horizontal press · Borst, voorkant schouders, triceps
- **Instellingen**: Zithoogte (nr), Startpositie/bereik (nr, indien aanwezig), Greep (horizontaal/verticaal), Gewicht. Stap: 2,5–5 kg.
- **Setup**: Handgrepen ter hoogte van het **midden van je borst**. Schouderbladen naar achter en omlaag, stevig tegen de rugleuning.
- **Uitvoering**: Druk naar voren tot de armen bijna gestrekt zijn, gecontroleerd terug zonder dat het gewicht neerklapt.
- **Fouten**: schouders die naar voren rollen; ellebogen te hoog; gewicht laten stuiteren.
- **Adem**: uit bij duwen. **Tempo**: 1 s – 2 s.

### 4.6 Lat Pulldown — Vertical pull · Lats & biceps
- **Instellingen**: Dijkussenhoogte (nr), Greep (stang breed/smal/V), Gewicht. Stap: 2,5–5 kg.
- **Setup**: Klem je **bovenbenen stevig** onder de kussens. Pak de stang **iets breder dan schouderbreedte**.
- **Uitvoering**: Borst omhoog, licht achterover (~10–15°). Trek de stang naar de **bovenkant van je borst**, ellebogen omlaag sturen. Gecontroleerd terug tot de armen gestrekt zijn.
- **Fouten**: achter de nek trekken; zwaaien met het bovenlichaam; schouders optrekken.
- **Adem**: uit bij trekken. **Tempo**: 1 s trekken – 2 s terug.

### 4.7 Seated Cable Row / Row Machine — Horizontal row · Middenrug & biceps
- **Instellingen**: Zitting/borstkussen (nr), Greep (V-greep/breed), Gewicht. Stap: 2,5–5 kg.
- **Setup**: Voeten op de steunen, knieën licht gebogen (of borst tegen het kussen bij de row-machine).
- **Uitvoering**: Borst vooruit, rug recht. Trek de greep naar je **navel** en **knijp je schouderbladen samen**. Gecontroleerd terug.
- **Fouten**: achterover zwaaien; ronde rug; schouders optrekken.
- **Adem**: uit bij trekken. **Tempo**: 1 s – 1 s knijpen – 2 s terug.

### 4.8 Loopband 12-3-30 — Wandelen · Vetverbranding & herstel
- **Instellingen/log**: Helling (%), Snelheid (km/u), Duur (min), optioneel afstand/kcal/hartslag.
- **Standaard**: helling **12%**, snelheid **4,8 km/u**, **30 min**.
- **Direct 12-3-30** vanaf de eerste training. Geen opbouwplan; de waarden zijn wel per sessie aanpasbaar (bv. als je eerder stopt, log je de werkelijke duur).
- **Cues**: **niet aan de handgrepen hangen**, rechtop lopen, kleine stappen. Bij duizeligheid/pijn stoppen.

---

## 5. Datamodel (Dexie / TypeScript)

```ts
type Pattern = 'squat'|'hinge'|'single-leg'|'vertical-push'|'horizontal-press'|'vertical-pull'|'horizontal-row'|'walk';

interface Exercise {
  id: string; name: string; pattern: Pattern; muscles: string[];
  kind: 'strength' | 'cardio';
  unilateral: boolean;            // Single-Leg Leg Press
  bodyweightCapable: boolean;     // Back Extension (0 kg toegestaan)
  settingFields: { key: string; label: string; hint?: string }[];
  setup: string[]; cues: string[]; mistakes: string[]; breathing: string; tempo: string;
  defaultIncrementKg: number;
  muscleMap: { primary: MuscleId[]; secondary: MuscleId[] }; // §8
  animationId: string;            // gereserveerd voor latere animaties (backlog)
  isCustom: boolean;
}

interface MachineSettings {       // jouw persoonlijke instellingen per oefening
  exerciseId: string;
  values: Record<string, string>; // { seat: "4", feet: "midden" }
  incrementKg: number;            // overschrijft default (bv. stack gaat per 5 kg)
  notes?: string;
  updatedAt: number;
}

interface TemplateItem {
  id: string; exerciseId: string;
  sets: number; repMin: number; repMax: number; restSec: number;
  warmupSet: boolean;
  cardio?: { minutes: number; inclinePct: number; speedKmh: number };
}
interface Template { id: string; name: string; /* "A", "B" */ items: TemplateItem[]; order: number; }

interface Session {
  id: string; templateId: string; startedAt: number; endedAt?: number;
  status: 'active' | 'done' | 'abandoned';
  itemOrder: string[];            // volgorde zoals feitelijk uitgevoerd (incl. "machine bezet"-verschuivingen)
  notes?: string;
}
interface SetLog {
  id: string; sessionId: string; exerciseId: string; templateItemId: string;
  setIndex: number; isWarmup: boolean;
  side?: 'L' | 'R';
  weightKg: number; reps: number;
  feel?: 'easy' | 'good' | 'hard'; // 3-knops gevoel i.p.v. RPE
  completedAt: number;
  settingsSnapshot?: Record<string, string>;
}
interface CardioLog {
  id: string; sessionId: string; exerciseId: string;
  minutes: number; inclinePct: number; speedKmh: number;
  distanceKm?: number; kcal?: number; avgHr?: number; completedAt: number;
}
interface AppSettings {
  id: 'singleton'; theme: 'dark'|'light'|'system';
  vibration: boolean; sound: boolean; keepScreenOn: boolean;
  defaultRestSec: number; weekGoal: 3 | 4; lastBackupAt?: number;
}
```

- Dexie-tabellen: `exercises, machineSettings, templates, sessions, setLogs, cardioLogs, settings` met indexen op `[exerciseId+completedAt]`, `sessionId`.
- **Export**: één JSON `{ schemaVersion, exportedAt, ...alle tabellen }` → download via Web Share API (Android share sheet → Google Drive/WhatsApp) of als bestand.
- **Import**: valideren (schemaVersion, vorm), keuze "vervangen" of "samenvoegen op id".
- **Backup-herinnering**: banner als laatste backup > 14 dagen geleden.
- Bij eerste start: `navigator.storage.persist()` aanvragen.

---

## 6. Schermen & flows

Onderste navigatie: **Vandaag · Historie · Schema · Meer**.

### 6.1 Vandaag (home)
- Grote kaart: "Volgende: **Training B**" + oefeningenlijst-preview + geschatte duur → knop **Start training**.
- Weekteller: "2 / 3 trainingen deze week" (ringetje).
- Laatste training: datum, duur, highlights ("Chest Press +2,5 kg").
- Lopende sessie? → "Ga verder met je training".

### 6.2 Workout-modus (belangrijkste scherm, ontwerp voor één hand + bezweet)
- Eén oefening per scherm; horizontaal swipen / knoppen vorige-volgende; voortgangsbalkje bovenaan (3/7).
- Bovenaan de **spierkaart** (klein; tik = groot met de cues).
- **Instellingen-chips**: "Stoel 4 · Voeten midden · stap 5 kg" — tik = direct bewerken.
- **Suggestie-regel**: "Vorige keer 3×8 @ 60 kg → vandaag **65 kg**, doel 6–8 reps" + kort waarom.
- Setrijen: `[gewicht −/+] [reps −/+] [✓]`, vooraf ingevuld met de suggestie. Unilateraal: L- en R-rij per set.
- Na ✓: optionele 3-knopsvraag *makkelijk / goed / zwaar* en de **rusttimer** start automatisch.
- Knoppen per oefening: **"Machine bezet → later"** (verplaatst naar einde van de rij), **Overslaan**, **Vervangen** (andere oefening), lijst-icoon om de **volgorde van de resterende oefeningen** te slepen.
- Cardio-kaart: helling/snelheid/duur vooraf ingevuld, **eigen timer** (30 min aftellen met trilling op 10/20/30 min) of achteraf invullen.
- Afronden: samenvatting (duur, totaal sets, elke oefening vs. vorige keer, tonnage) + notitieveld.
- Sessie wordt **na elke set opgeslagen** (crash/telefoon-op-slot-bestendig); bij heropenen gaat hij verder.

### 6.3 Rusttimer
- Overlay/onderbalk met grote cijfers, +15 s / −15 s / overslaan.
- Op tijdstempel gebaseerd (niet tellen met intervals), zodat de tijd klopt na scherm-uit/app-wissel.
- Bij 0: trillen (patroon) + optioneel piepje; 10 s vooraf een korte tik.
- **Wake Lock** tijdens de training; opnieuw aanvragen bij `visibilitychange`.
- **Alles uitschakelbaar**: `vibration`, `sound` en `keepScreenOn` zijn losse schakelaars in Instellingen (§6.7). Daarnaast in de workout-modus een klein menu (⋮ of icoontjes 📳 / 🔆 / 🔔 in de kopbalk) om ze **tijdens de training direct aan/uit** te zetten; dat past de globale instelling aan. Scherm-aan uit → wake lock direct vrijgeven; trillen uit → `navigator.vibrate` nooit aanroepen.
- Beperking (documenteren en in Instellingen als hint tonen): met scherm-aan uit kan de timer op Android niet betrouwbaar trillen zodra het scherm uitgaat; de timer telt wel correct door en trilt/piept als je de app weer opent.

### 6.4 Schema (templates)
- Lijst van templates (A, B, + nieuw/dupliceren).
- Template-editor: **drag-and-drop volgorde**, per item sets/rep-range/rust/opwarmset, oefening toevoegen uit bibliotheek, verwijderen.
- Instelling: automatisch afwisselen A/B aan/uit; weekdoel 3 of 4.

### 6.5 Oefening-detail (bibliotheek)
- Grote **spierkaart** met legenda (primair / secundair).
- Tabs: **Instructie** (setup/cues/fouten/adem) · **Mijn instellingen** · **Historie**.
- Historie: lijst per datum (sets × reps @ kg) + **lijngrafiek**: beste gewicht en geschat 1RM (Epley) over tijd; bij unilateraal L vs. R.
- Eigen oefening toevoegen (naam, patroon, velden; spiergroepen aanvinken voor de spierkaart).

### 6.6 Historie
- Lijst/kalender van sessies; detail met alle sets; bewerken/verwijderen (met bevestiging).

### 6.7 Meer
- Instellingen (thema, **trillen aan/uit**, **geluid aan/uit**, **scherm aan tijdens training aan/uit**, standaard rust). Alle drie standaard **aan**.
- **Backup**: exporteren, importeren, laatste backup-datum.
- Over / disclaimer ("geen medisch advies; stop bij pijn").

---

## 7. Progressie-coach (pure TS-module, volledig unit-getest)

`suggestNext(exercise, templateItem, history, machineSettings) → { weightKg, repTarget, reason, kind }`

**Double progression:**
1. Kijk naar de laatste sessie met deze oefening (werksets, geen opwarmsets).
2. Haalde je bij **alle sets de bovenkant** van de rep-range (en gevoel ≠ "zwaar")? → **gewicht + incrementKg**, doel = onderkant range. `kind: 'increase'`
3. Haalde je de **onderkant** niet bij ≥1 set, **twee sessies achter elkaar**? → gewicht −10% (afgerond op increment). `kind: 'deload'`
4. Anders → zelfde gewicht, probeer +1 rep per set. `kind: 'hold'`
5. Geen historie → `kind: 'first'`: "Kies een gewicht waarmee je de range haalt met nog ~2 reps over."
- **Andere rep-range in A vs B**: historie wordt per *(oefening, rep-range-bucket)* bekeken; als die er niet is, schat via 1RM (Epley) van de andere bucket.
- **Lichaamsgewicht (Back Extension, 0 kg)**: eerst reps omhoog tot repMax+3, daarna voorstel om gewicht toe te voegen.
- **Unilateraal**: suggestie per been; signaleer verschil > 10% ("Links blijft achter: begin met links").
- **Loopband**: altijd 12-3-30 voorstellen; geen automatische opbouw. Als de laatste sessie korter was dan 30 min, toon dat ter info ("vorige keer 22 min").
- **Back Extension**: bij `Type = bank` → bodyweight-route hierboven; bij `Type = machine` → gewone double progression. Geen type ingesteld → eerst vragen.
- **Eerste training**: bij `kind: 'first'` staan gewicht-velden leeg (geen 0), met hint; het eerst gelogde gewicht wordt het startpunt.
- **Bijschuifgewicht**: als `Bijschuifgewicht = aan` in de machine-instellingen → increment 2,5 kg, anders de stackstap.
- **Volgende template**: kies het template dat het langst geleden is gedaan.
- Kleine beloning in UI wanneer je de suggestie haalt/overtreft ("Nieuw: +5 kg op de Leg Press 💪").

---

## 8. Spierkaart (cartoon-illustratie)

Doel: in één oogopslag zien **welke spieren een oefening traint**. Licht, offline, zonder externe assets. (Bewegende animaties zijn uitgesteld naar de backlog, §10.)

- **Eén herbruikbaar SVG-poppetje** in vrolijke cartoonstijl (ronde vormen, dikke contourlijn, vriendelijk gezichtje), **vooraanzicht en achteraanzicht naast elkaar**. Eigen tekening, geen merklogo's.
- Het lichaam is opgedeeld in losse, benoemde spiervlakken (`<path id>` per `MuscleId`, links en rechts):
  `chest, front-delts, side-delts, rear-delts, biceps, triceps, forearms, abs, obliques, traps, mid-back, lats, lower-back, glutes, quads, hamstrings, adductors, calves`.
- Kleuren: **primair** = felle accentkleur, **secundair** = dezelfde kleur lichter, rest = neutraal grijs. Via CSS-variabelen, zodat het in dark en light theme werkt.
- Component: `<MuscleMap primary={[...]} secondary={[...]} size="sm" | "lg" showLegend? />`. Legenda in het Nederlands, bv. "Primair: Quadriceps, Bilspieren · Secundair: Hamstrings".
- Klein formaat (~120 px) voor in de workout-kaart, groot (~360 px) in het oefening-detail.
- Optioneel bij de oefeningnaam: een **emoji/icoon per bewegingspatroon** (🦵 duwen benen, 🍑 hinge, 💪 duwen, 🧲 trekken, 🚶 lopen) voor extra herkenbaarheid.

**Spiermapping (seed):**

| Oefening | Primair | Secundair |
|---|---|---|
| Seated Leg Press | quads, glutes | hamstrings, adductors |
| Back Extension | hamstrings, glutes, lower-back | – |
| Single-Leg Leg Press | quads, glutes | hamstrings, adductors, abs |
| Seated Shoulder Press | front-delts, side-delts | triceps, traps |
| Seated Chest Press | chest | front-delts, triceps |
| Lat Pulldown | lats | biceps, mid-back, rear-delts |
| Seated Cable Row | mid-back, lats | biceps, rear-delts, forearms |
| Loopband 12-3-30 | glutes, calves, hamstrings | quads, lower-back (+ label "Conditie ❤️") |

- Nederlandse namen: borst, voorkant schouders, zijkant schouders, achterkant schouders, biceps, triceps, onderarmen, buikspieren, schuine buikspieren, trapezius, middenrug, brede rugspier (lats), onderrug, bilspieren, quadriceps, hamstrings, binnenkant dij, kuiten.
- Ontwikkelpagina `/#/dev/muscles` die alle 8 oefeningen met hun spierkaart toont (voor review).

---

## 9. Werkpakketten voor subagents

Volgorde & parallellisatie:

```
WP0 Scaffold + contracten ──┬─> WP1 Data & seed ──┬─> WP4 Workout-modus + rusttimer
                            │                     ├─> WP5 Schema-editor + oefening-detail
                            ├─> WP2 Progressie-coach (parallel, alleen types nodig)
                            └─> WP3 Spierkaart (parallel, onafhankelijk)
                                                  └─> WP6 Historie + grafiek + backup
                                         alles ──> WP7 QA, PWA-audit, deploy
```

| WP | Inhoud | Klaar wanneer | Suggestie agent |
|---|---|---|---|
| **WP0** | Vite/React/TS/Tailwind/PWA/Router/Vitest/Playwright opzetten; `src/types.ts` met het datamodel uit §5; app-shell met onderste navigatie en lege routes; designtokens (dark/light); GitHub Actions workflow voor Pages; `README`. | `npm run dev/build/test` slagen; lege app installeerbaar als PWA (manifest + iconen) | standard |
| **WP1** | Dexie-schema + repositories (CRUD), seed-data uit §3 en §4 (letterlijk NL), export/import + validatie, `storage.persist()`. Unit-tests. | Seed laadt bij eerste start; export→import round-trip test groen | standard |
| **WP2** | `src/coach/` progressie-engine uit §7 + volgende-template-logica, met uitgebreide Vitest-cases (increase/hold/deload/first/bodyweight/unilateral/cardio/A↔B bucket). | ≥ 90% coverage op de module, alle regels uit §7 getest | deep (logica moet kloppen) |
| **WP3** | `src/illustration/`: cartoon-SVG-poppetje voor/achter met spiervlakken, `<MuscleMap />` (§8), `MuscleId`-type + NL-namen, `muscleMap` toevoegen aan de seed-oefeningen (§8-tabel), dev-pagina `/#/dev/muscles`. | Alle 8 oefeningen tonen de juiste spieren; leesbaar op 120 px en 360 px; dark + light; screenshots bekeken | standard (klein, afgebakend) |
| **WP4** | Workout-modus §6.2 + rusttimer §6.3 (Zustand store, autosave per set, wake lock, vibratie, "machine bezet", herordenen, cardio-timer, samenvatting). | Volledige A-training te doorlopen in Playwright op Pixel-viewport; herstel na reload werkt | deep |
| **WP5** | Schema §6.4 (dnd-kit) + oefening-detail §6.5 (instructie, instellingen bewerken) + eigen oefening toevoegen. | Volgorde slepen blijft bewaard; instellingen-chips verschijnen in workout | standard |
| **WP6** | Historie §6.6, lijngrafiek per oefening, Vandaag-scherm §6.1, Meer/backup §6.7, backup-herinnering. | Grafiek toont seed-historie; export deelbaar via share-sheet | standard |
| **WP7** | Playwright e2e-suite, Lighthouse PWA/a11y ≥ 90, offline-test, touch-targets, NL-teksten nalopen, deploy naar GitHub Pages + installatie-instructie. | Live URL, installeerbaar op Android, offline bruikbaar | standard |

**Regels voor alle subagents**
- Werk alleen in de eigen mappen/routes van het werkpakket; `src/types.ts` wijzigen alleen via WP0/WP1-eigenaar.
- Alle UI-tekst in het Nederlands; teksten centraal in `src/content/` (geen hardcoded strings verspreid).
- Mobiel eerst (360–412 px breed), touch-targets ≥ 48 px, bedienbaar met één duim.
- Geen netwerkverzoeken naar derden; app moet volledig offline werken.
- Elk WP levert tests mee en laat `npm run build && npm test` groen achter.
- Git: één branch per WP, kleine commits.

---

## 10. Backlog (na v1)

- **Animaties per machine** (uitgesteld op 2026-11-01): 2D-poppetje met forward kinematics en keyframes op tempo, gestileerde machine waarvan de bewegende delen meebewegen, fase-label ("Duw – 1 s"), adem-icoon, setup-modus met genummerde pijlen, `prefers-reduced-motion`. 9 animaties (incl. 2 voor back extension). `animationId` staat al in de data. Bouw dit in kleine stukken (eerst rig + 1 oefening, dan per 2–3 oefeningen) met tussentijdse commits.
- **Records & badges**: PR-detectie met confetti, streaks, mijlpalen ("100 trainingen", "1 ton getild").
- **Uitgebreide stats**: volume per spiergroep per week, tonnage-vergelijkingen ("je tilde vandaag een olifant 🐘"), heatmap-kalender.
- **Club-profielen**: andere instellingen per Basic-Fit vestiging (andere machinemerken).
- **Foto per machine** (eigen foto + instellingen), QR/NFC-sticker niet nodig.
- **Free weights**-oefeningen later toevoegen.
- **Cloud-sync** (bijv. Supabase) of automatische Drive-backup.
- **Deload-weken** en periodisering; hartslag-koppeling (Bluetooth via Web Bluetooth).
- **Android-homescreen-shortcuts** ("Start training A") via manifest-shortcuts.

---

## 11. Besloten open punten (2026-11-01)

1. **Machinemerk**: Technogym → instelvelden volgens §4-conventie (zithoogte, rugleuning, startpositie, bijschuifgewicht).
2. **Back Extension**: type onbekend → beide varianten ondersteund, keuze bij eerste gebruik (§4.2). Beide varianten trainen dezelfde spieren, dus één spierkaart.
3. **Startgewichten**: tijdens de eerste training (§7 "first").
4. **Hosting**: `github.com/skatejunk-ux/basic-trainer`, publiek, GitHub Pages via Actions. Repo aanmaken gebeurt in WP0 **pas na bevestiging**. `gh` heeft twee accounts; het werkaccount `JobVanDonselaar` is actief. Gebruik voor deze repo daarom expliciet `skatejunk-ux` (bv. `gh auth switch --user skatejunk-ux` vóór repo-acties, daarna terugzetten), en zet lokaal `git config user.email skatejunk@gmail.com` in deze repo.
5. **Loopband**: direct 12-3-30, geen opbouwplan.

Nog na te gaan bij je eerstvolgende bezoek (niet blokkerend): het soort back extension en of je stacks een bijschuifgewicht hebben. Beide vul je gewoon in de app in.
