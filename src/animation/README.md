# animation

Bewegende cartoon-uitleg per machine (Technogym Selection-stijl, zijaanzicht), getoond bij de uitleg van een oefening (oefening-detail en de "Uitleg"-sheet in de workout).

- `rig.ts` – 2D-poppetje met forward kinematics (heup, romp, arm-, been- en voethoeken), keyframes en interpolatie.
- `draw.tsx` – tekenhulpen: dikke lijnen met cartoon-contour (glimlijn op machine-onderdelen), achtergrond met spot en vloer, het poppetje (shirt, sneakers), gewichtsstapel met selectiepin, genummerde instelpunten en de bewegingsbaan met pijl.
- `scenes.tsx` – één scène per `animationId` (de back extension heeft machine én 45°-bank): keyframes op het tempo uit de seed, fase-label met ademhaling, machine-onderdelen die meebewegen, instelpunten die naar `settingFields` verwijzen en een `track` (welk punt beweegt in de werkfase).
- Zijwaartse bewegingen (Pectoral Fly, Rear Delt, Abductor, Adductor) zijn van opzij onzichtbaar; die scènes tekenen met `FrontFigure` (draw.tsx) een poppetje in voor- of achteraanzicht en sturen de beweging met `load` (0 → 1).
- `MachineCartoon.tsx` – speelt af met een tempo-balk per fase, pauzeert bij tikken en buiten beeld; met `prefers-reduced-motion` staat hij stil op de startpositie tot je op Afspelen tikt.
- Review alle scènes en keyframes op `/#/dev/machines`.

Eigen oefeningen hebben geen scène en tonen dus geen cartoon.
