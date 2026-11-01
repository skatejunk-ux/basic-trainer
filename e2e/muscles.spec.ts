import { expect, test } from '@playwright/test';

test('dev-pagina toont de spierkaart van alle 8 oefeningen', async ({ page }) => {
  await page.goto('./#/dev/muscles');
  await expect(page.getByRole('heading', { name: 'Spierkaarten (dev)' })).toBeVisible();
  await expect(page.locator('[data-exercise]')).toHaveCount(8);

  const legPress = page.locator('[data-exercise="leg-press"]').first();
  await expect(legPress.getByRole('img').first()).toHaveAttribute('aria-label', /Primair: Quadriceps, Bilspieren/);
  // links + rechts, voor- én achteraanzicht van de grote kaart
  await expect(legPress.locator('figure').nth(1).locator('[data-muscle="quads"][data-level="primary"]')).toHaveCount(2);
  await expect(legPress.locator('figure').nth(1).locator('[data-muscle="glutes"][data-level="primary"]')).toHaveCount(2);

  await page.screenshot({ path: 'test-results/muscles-dev.png', fullPage: true });
});
