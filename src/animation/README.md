# animation

Bewegende cartoon-uitleg per machine (Technogym Selection-stijl, zijaanzicht), getoond bij de uitleg van een oefening (oefening-detail en de "Uitleg"-sheet in de workout).

- `rig.ts` – 2D-poppetje met forward kinematics (heup, romp, arm-, been- en voethoeken), keyframes en interpolatie.
- `draw.tsx` – tekenhulpen: dikke lijnen met cartoon-contour, het poppetje, gewichtsstapel, genummerde instelpunten.
- `scenes.tsx` – één scène per `animationId` (de back extension heeft machine én 45°-bank): keyframes op het tempo uit de seed, fase-label met ademhaling, machine-onderdelen die meebewegen en instelpunten die naar `settingFields` verwijzen.
- `MachineCartoon.tsx` – speelt af, pauzeert bij tikken en buiten beeld; met `prefers-reduced-motion` staat hij stil op de startpositie tot je op Afspelen tikt.
- Review alle scènes en keyframes op `/#/dev/machines`.

Eigen oefeningen hebben geen scène en tonen dus geen cartoon.
