// Alle UI-teksten (Nederlands). Geen hardcoded strings in componenten.
export const nl = {
  appName: 'Basic-Trainer',
  nav: {
    label: 'Hoofdnavigatie',
    today: 'Vandaag',
    history: 'Historie',
    schema: 'Schema',
    more: 'Meer',
  },
  pages: {
    today: { title: 'Vandaag', placeholder: 'Hier komt je volgende training.' },
    history: { title: 'Historie', placeholder: 'Hier komen je afgeronde trainingen.' },
    schema: { title: 'Schema', placeholder: 'Hier pas je je trainingsschema aan.' },
    more: { title: 'Meer', placeholder: 'Instellingen, backup en info.' },
    workout: { title: 'Training', placeholder: 'De workout-modus komt hier.' },
    exercise: { title: 'Oefening', placeholder: 'Oefening-detail komt hier.' },
    devAnimations: { title: 'Animaties (dev)', placeholder: 'Galerij van alle animaties.' },
    notFound: { title: 'Pagina niet gevonden', back: 'Naar Vandaag' },
  },
} as const;
