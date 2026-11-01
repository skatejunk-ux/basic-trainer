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

test('Vandaag toont de Basic-Fit-uitnodiging als QR-code', async ({ page }) => {
  await page.goto('./');
  const card = page.getByTestId('invite-card');
  await expect(
    card.getByRole('img', { name: /QR-code: https:\/\/member\.basic-fit\.com\/friends\/nl-NL\/join\/4HF7N9RG/ }),
  ).toBeVisible();
  await expect(card.getByRole('link', { name: /Link openen/ })).toHaveAttribute(
    'href',
    'https://member.basic-fit.com/friends/nl-NL/join/4HF7N9RG',
  );
  await card.getByRole('button', { name: 'QR-code groot tonen' }).click();
  await expect(page.getByRole('dialog', { name: 'Scan deze code' })).toBeVisible();
});
