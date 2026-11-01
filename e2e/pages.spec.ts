import { expect, test, type Page } from '@playwright/test';

/** Rondt snel een training A af met één Leg Press-set van 60 kg × 8. */
async function quickSessionA(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Start training A' }).click();
  await page.getByRole('button', { name: /^2: / }).click();
  await page.getByLabel('Set 1 kg').fill('60');
  await page.getByRole('button', { name: 'reps omhoog' }).first().click();
  await page.getByRole('button', { name: 'reps omhoog' }).first().click();
  await page.getByRole('button', { name: 'Set klaar: Set 1' }).click();
  await page.getByRole('button', { name: 'Training sluiten' }).click();
  await page.getByRole('button', { name: 'Afronden en opslaan' }).click();
  await page.getByRole('button', { name: 'Opslaan' }).click();
  await expect(page).toHaveURL(/#\/$/);
}

test('schema: volgorde en sets aanpassen blijft bewaard', async ({ page }) => {
  await page.goto('./#/schema');
  await page.getByRole('link', { name: /Training A/ }).click();
  await page.getByRole('button', { name: 'Omhoog: Lat Pulldown' }).click();
  await page.getByRole('button', { name: 'Aanpassen: Seated Leg Press' }).click();
  await page.getByRole('button', { name: 'Sets omhoog' }).click();
  await page.getByRole('button', { name: 'Klaar' }).click();
  await page.reload();
  const items = page.locator('[data-sortable-item]');
  await expect(items.nth(3)).toContainText('Lat Pulldown');
  await expect(items.nth(4)).toContainText('Seated Chest Press');
  await expect(page.getByRole('button', { name: 'Aanpassen: Seated Leg Press' })).toContainText('4×6–8');

  // Vandaag toont de nieuwe volgorde
  await page.goto('./');
  await expect(page.locator('ol li').nth(3)).toContainText('Lat Pulldown');
});

test('historie, sessie-detail en oefening-historie na een training', async ({ page }) => {
  await quickSessionA(page);
  await expect(page.getByText('1 van 3 deze week')).toBeVisible();
  await expect(page.getByText('Vorige training')).toBeVisible();

  await page.getByRole('link', { name: 'Historie' }).click();
  await page.locator('[data-session]').first().click();
  await expect(page.getByRole('heading', { name: 'Training A' })).toBeVisible();
  await expect(page.getByText('60 kg × 8')).toBeVisible();

  await page.getByRole('link', { name: 'Seated Leg Press' }).click();
  await page.getByRole('tab', { name: 'Historie' }).click();
  await expect(page.getByText('60 kg: 8')).toBeVisible();
  await expect(page.getByText('Na twee trainingen zie je hier je vooruitgang.')).toBeVisible();

  // Verwijderen
  await page.goto('./#/historie');
  await page.locator('[data-session]').first().click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Training verwijderen' }).click();
  await expect(page.getByText('Nog geen trainingen afgerond.')).toBeVisible();
});

test('meer: thema, schakelaars en backup maken + terugzetten', async ({ page }) => {
  await page.addInitScript(() => {
    // Forceer de download-route (geen deelmenu in de testbrowser).
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  });
  await quickSessionA(page);
  await page.goto('./#/meer');

  await page.getByRole('button', { name: 'Licht' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  const screen = page.getByRole('switch', { name: /Scherm aan tijdens training/ });
  await screen.click();
  await expect(screen).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByText(/kan Android niet trillen/)).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Backup maken/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^basic-trainer-backup-\d{4}-\d{2}-\d{2}\.json$/);
  await expect(page.getByText('Backup gemaakt ✓')).toBeVisible();
  const path = await download.path();

  await page.getByTestId('backup-file').setInputFiles(path!);
  await page.getByRole('button', { name: 'Samenvoegen met wat er staat' }).click();
  await expect(page.getByText('Backup teruggezet ✓')).toBeVisible();
});

test('eigen oefening toevoegen en in een training zetten', async ({ page }) => {
  await page.goto('./#/oefening/nieuw');
  await page.getByLabel('Naam').fill('Pec Deck');
  await page.getByRole('button', { name: 'Opslaan' }).click();
  await expect(page.getByText('Geef de oefening een naam en minstens één primaire spier.')).toBeVisible();
  await page.getByRole('button', { name: 'Borst', exact: true }).click();
  await page.getByRole('button', { name: 'Voorkant schouders' }).click();
  await page.getByRole('button', { name: 'Voorkant schouders' }).click();
  await page.getByRole('button', { name: 'Opslaan' }).click();
  await expect(page.getByRole('heading', { name: 'Pec Deck' })).toBeVisible();
  await expect(page.getByRole('img', { name: /Primair: Borst\. Secundair: Voorkant schouders\./ })).toBeVisible();

  await page.goto('./#/schema');
  await expect(page.getByRole('link', { name: /Pec Deck/ })).toBeVisible();
  await page.getByRole('link', { name: /Training B/ }).click();
  await page.getByRole('button', { name: '+ Oefening toevoegen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Pec Deck' }).click();
  await page.getByRole('button', { name: 'Klaar' }).click();
  await expect(page.getByRole('button', { name: 'Aanpassen: Pec Deck' })).toContainText('3×8–12');
});

test('werkt offline na de eerste keer laden', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // nu onder controle van de service worker
  await expect(page.getByRole('heading', { name: 'Vandaag' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: /Start training/ })).toBeVisible();
  await page.getByRole('link', { name: 'Schema' }).click();
  await expect(page.getByRole('link', { name: /Training A/ })).toBeVisible();
  await context.setOffline(false);
});
