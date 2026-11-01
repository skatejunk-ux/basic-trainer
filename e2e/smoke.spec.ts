import { expect, test } from '@playwright/test';

test('laadt de app en navigeert door de 4 tabs', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Vandaag' })).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Hoofdnavigatie' });
  const tabs = [
    { label: 'Historie', hash: '#/historie' },
    { label: 'Schema', hash: '#/schema' },
    { label: 'Meer', hash: '#/meer' },
    { label: 'Vandaag', hash: '#/' },
  ];
  for (const { label, hash } of tabs) {
    const link = nav.getByRole('link', { name: label });
    const box = await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    expect(box!.width).toBeGreaterThanOrEqual(48);
    await link.click();
    await expect(page).toHaveURL((url) => url.hash === hash);
    await expect(page.getByRole('heading', { name: label })).toBeVisible();
  }
});

test('uitnodiging alleen op een toestel dat de geheime link opende', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Vandaag' })).toBeVisible();
  await expect(page.getByTestId('invite-card')).toHaveCount(0);

  await page.goto('./#/?eigenaar=margie-4hf7');
  const link = page.getByTestId('invite-card').getByRole('link', { name: /Login als man van Margie/ });
  await expect(link).toHaveAttribute('href', 'https://member.basic-fit.com/friends/nl-NL/join/4HF7N9RG');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(page).toHaveURL((url) => url.hash === '#/');

  // Onthouden op dit toestel, en uit te zetten via Meer
  await page.reload();
  await expect(page.getByTestId('invite-card')).toBeVisible();
  await page.getByRole('link', { name: 'Meer' }).click();
  await page.getByRole('switch', { name: /Uitnodigingslink op Vandaag/ }).click();
  await page.getByRole('link', { name: 'Vandaag' }).click();
  await expect(page.getByRole('heading', { name: 'Vandaag' })).toBeVisible();
  await expect(page.getByTestId('invite-card')).toHaveCount(0);
});
