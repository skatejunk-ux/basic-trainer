# animation

Bewegende cartoon-uitleg per machine (Technogym Selection-stijl, zijaanzicht), getoond bij de uitleg van een oefening (oefening-detail en de "Uitleg"-sheet in de workout).

Stijl: **pop-art comic** — dikke zwarte inktlijnen, vlakke primaire kleuren (rood shirt, blauwe broek, gele accenten), Ben-Day-stipjes en een comic-paneel met zonnestralen (`.mc-panel` in `index.css`, als CSS-achtergrond zodat het niet elk frame opnieuw getekend wordt). Koppen en actiewoorden gebruiken het meegeleverde font Bangers (`@fontsource/bangers`, werkt offline).

- `rig.ts` – 2D-poppetje met forward kinematics (heup, romp, arm-, been- en voethoeken), keyframes en interpolatie.
- `draw.tsx` – tekenhulpen: dikke lijnen met inktcontour (glimlijn op machine-onderdelen en shirt), stippen-vloer, het poppetje (shirt, sneakers, Ben-Day-blosjes; mond open + uitadem-wolkje tijdens de werkfase), gewichtsstapel met selectiepin, genummerde comic-badges, de bewegingsbaan als comic-pijl, het knal-wolkje (`Burst`) en snelheidsstreepjes (`SpeedLines`).
- `scenes.tsx` – één scène per `animationId` (de back extension heeft machine én 45°-bank): keyframes op het tempo uit de seed, fase-label met ademhaling, een comic-actiewoord per werkfase (`pow`, bv. "DUW!", teksten in `nl.cartoon.pow`), machine-onderdelen die meebewegen, instelpunten die naar `settingFields` verwijzen, een `track` (welk punt beweegt in de werkfase) en optioneel `burst` (plek van het knal-wolkje).
- Zijwaartse bewegingen (Pectoral Fly, Rear Delt, Abductor, Adductor) zijn van opzij onzichtbaar; die scènes tekenen met `FrontFigure` (draw.tsx) een poppetje in voor- of achteraanzicht en sturen de beweging met `load` (0 → 1).
- `MachineCartoon.tsx` – speelt af met een tempo-balk per fase, pauzeert bij tikken en buiten beeld; met `prefers-reduced-motion` staat hij stil op de startpositie tot je op Afspelen tikt.
- Review alle scènes en keyframes op `/#/dev/machines`.

Eigen oefeningen hebben geen scène en tonen dus geen cartoon.
