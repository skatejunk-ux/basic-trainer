# Basic-Trainer

Een PWA (installeerbare web-app) voor Android waarmee je een Basic-Fit machine-routine volgt, je machine-instellingen onthoudt, sets en reps logt en je vooruitgang ziet. Alles werkt offline; je data blijft lokaal op je telefoon (IndexedDB). Het volledige bouwplan staat in [PLAN.md](PLAN.md).

**Live:** https://skatejunk-ux.github.io/basic-trainer/

## Draaien

Vereist Node.js 22 of nieuwer.

```bash
npm install
npm run dev              # ontwikkelserver (http://localhost:5173/basic-trainer/)
npm run build            # type-check + productiebuild naar dist/
npm run preview          # bekijk de productiebuild
npm test                 # unit-tests (Vitest)
npx playwright install chromium   # eenmalig
npm run test:e2e         # e2e-tests (Playwright, Pixel 7-viewport)
npm run generate-pwa-assets       # iconen opnieuw genereren uit public/icon.svg
```

## Installeren op Android

1. Open https://skatejunk-ux.github.io/basic-trainer/ in **Chrome** op je telefoon.
2. Tik op het menu (drie puntjes) en kies **Toevoegen aan startscherm** (of **App installeren**).
3. Start Basic-Trainer vanaf je startscherm; na de eerste keer werkt de app ook zonder internet.

## Deploy

Een push naar `main` draait tests, bouwt de app en publiceert naar GitHub Pages (`.github/workflows/deploy.yml`).

## Disclaimer

Geen medisch advies. Stop bij pijn of duizeligheid.
