# coach (WP2)

Pure TypeScript progressie-coach uit PLAN.md §7. Geen Dexie, geen React, geen klok:
alle historie gaat er als argument in. Importeer via `src/coach` (`index.ts`).

- `suggestNext(input) → Suggestion` — gewicht + doel-reps + korte NL-uitleg voor één oefening.
  `input`: `exercise`, `templateItem`, `setLogs`, optioneel `cardioLogs`, `sessions` (volgorde,
  afgebroken overslaan), `templates` (oude logs → rep-range-bucket), `machineSettings`,
  `currentSessionId` (telt niet als "vorige keer"), `minBodyweightStage`.
- `nextTemplate(templates, sessions) → templateId | null` — nooit gedaan eerst (op `order`),
  daarna het langst geleden afgeronde template.
- `compareToPrevious({ exercise, suggestion, currentSets, previousSets?, currentCardio? })` —
  felicitatie ("Nieuw: +5 kg op de Leg Press 💪") of `null`.
- Hulpjes: `estimate1RM` (Epley), `weightForReps`, `roundToIncrement`, `deloadWeight`,
  `warmupWeight`, `formatKg`, `resolveIncrement`, `backExtensionType`.

Gedrag in het kort:

| Situatie | kind | gewicht |
|---|---|---|
| Geen historie in deze rep-range, ook niet in een andere | `first` | `null` + hint |
| Geen historie in deze range, wel in een andere (A↔B) | `first` | Epley-schatting, `estimatedFrom` gezet |
| Alle sets ≥ repMax, niets "zwaar" | `increase` | + stap, doel repMin |
| 2 sessies op rij ≥1 set < repMin (zelfde gewicht) | `deload` | −10%, afgerond, min. één stap lager |
| Anders | `hold` | zelfde, doel laagste set + 1 (binnen range) |
| Back Extension zonder type | `first` + `needsChoice` | `null` |
| Back Extension bank | `bodyweight-reps` → `bodyweight-add-load` | 0 → stap |
| Loopband | `cardio` | `null`, plan 12-3-30 |

Teksten staan in `messages.ts` (`coachText`). Tests + coverage: `npm run test:coverage:coach`.
