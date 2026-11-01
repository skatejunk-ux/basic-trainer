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
