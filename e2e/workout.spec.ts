import { expect, test, type Page } from '@playwright/test';

/** Houdt navigator.vibrate-aanroepen bij in window.__vibrations. */
async function stubVibrate(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __vibrations: unknown[] }).__vibrations = [];
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: (p: unknown) => {
        (window as unknown as { __vibrations: unknown[] }).__vibrations.push(p);
        return true;
      },
    });
  });
}

const vibrations = (page: Page) => page.evaluate(() => (window as unknown as { __vibrations: unknown[] }).__vibrations);

test('volledige training A: loggen, rust, herstel na herladen, afronden', async ({ page }) => {
  await stubVibrate(page);
  await page.clock.install();
  await page.goto('./');

  await page.getByRole('button', { name: 'Start training A' }).click();
  await expect(page).toHaveURL(/#\/workout$/);
  await expect(page.getByRole('heading', { name: 'Loopband · Warming-up' })).toBeVisible();

  // Warming-up loggen
  await page.getByRole('button', { name: 'Klaar – opslaan' }).click();
  await expect(page.getByText('Gelogd: 5 min')).toBeVisible();
  await page.getByRole('button', { name: 'Volgende', exact: true }).click();

  // Leg Press: eerste keer, gewicht leeg → ✓ uitgeschakeld tot er een gewicht is
  await expect(page.getByRole('heading', { name: 'Seated Leg Press' })).toBeVisible();
  const done1 = page.getByRole('button', { name: 'Set klaar: Set 1' });
  await expect(done1).toBeDisabled();
  await page.getByLabel('Set 1 kg').fill('60');
  await done1.click();

  // Rusttimer start (120 s) en trilt bij 0
  const timer = page.getByRole('timer');
  await expect(timer).toBeVisible();
  await expect(page.getByTestId('rest-remaining')).toHaveText('2:00');
  await page.clock.fastForward(111_000);
  await expect.poll(() => vibrations(page)).toContainEqual(60);
  await page.clock.fastForward(10_000);
  await expect(page.getByText('Klaar! Volgende set 💪')).toBeVisible();
  await expect.poll(() => vibrations(page)).toContainEqual([300, 150, 300, 150, 600]);

  // Set 2 en 3 zijn vooraf ingevuld met 60 kg
  await expect(page.getByLabel('Set 2 kg')).toHaveValue('60');
  await page.getByRole('button', { name: 'Set klaar: Set 2' }).click();
  await page.getByRole('button', { name: 'Rust overslaan' }).click();

  // Herladen: sessie en sets blijven bewaard
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Seated Leg Press' })).toBeVisible();
  await expect(page.locator('[data-done="true"]')).toHaveCount(2);

  // Trillen uitzetten via de kopbalk: daarna geen nieuwe trillingen
  await page.getByRole('button', { name: 'Trillen' }).click();
  await expect(page.getByRole('button', { name: 'Trillen' })).toHaveAttribute('aria-pressed', 'false');
  const before = (await vibrations(page)).length;
  await page.getByRole('button', { name: 'Set klaar: Set 3' }).click();
  await page.clock.fastForward(125_000);
  await expect(page.getByText('Klaar! Volgende set 💪')).toBeVisible();
  expect((await vibrations(page)).length).toBe(before);

  // Machine bezet: Back Extension gaat naar achteren
  await page.getByRole('button', { name: 'Volgende', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Back Extension' })).toBeVisible();
  await page.getByRole('button', { name: /Machine bezet/ }).click();
  await expect(page.getByRole('heading', { name: 'Seated Chest Press' })).toBeVisible();

  // Volgorde: Lat Pulldown naar boven via pijltje
  await page.getByRole('button', { name: /Volgorde/ }).click();
  await page.getByRole('button', { name: 'Omhoog: Lat Pulldown' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Opslaan' }).click();
  await expect(page.getByRole('heading', { name: 'Lat Pulldown' })).toBeVisible();

  // Afronden
  await page.getByRole('button', { name: 'Training sluiten' }).click();
  await page.getByRole('button', { name: 'Afronden en opslaan' }).click();
  await expect(page.getByRole('heading', { name: 'Goed gedaan!' })).toBeVisible();
  await expect(page.getByText('Startgewicht 60 kg op de Seated Leg Press 💪')).toBeVisible();
  await page.getByRole('button', { name: 'Opslaan' }).click();

  // Vandaag stelt nu training B voor
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { name: 'Training B' })).toBeVisible();
});

test('back extension vraagt eerst het type en onthoudt het', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Liever training B' }).click();
  await page.getByRole('button', { name: 'Start training B' }).click();
  await page.getByRole('button', { name: /^3: / }).click();
  await expect(page.getByText('Welke Back Extension gebruik je?')).toBeVisible();
  await page.getByRole('button', { name: '45°-bank' }).click();
  await expect(page.getByText('Type: 45°-bank')).toBeVisible();
  await expect(page.getByText(/2 s pauze bovenaan/)).toBeVisible();
  await expect(page.getByLabel('Set 1 kg')).toHaveValue('0');
});
