import { expect, test, type Page } from '@playwright/test';

/**
 * Mockt camera + BarcodeDetector: de "camera" is een canvas-stream en de detector
 * geeft window.__scanCode terug zodra die gezet is (één keer per scan).
 */
async function mockScanner(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __scanCode: string | null; BarcodeDetector: unknown };
    w.__scanCode = null;
    w.BarcodeDetector = class {
      static getSupportedFormats = async () => ['qr_code', 'code_128'];
      async detect() {
        const code = w.__scanCode;
        if (!code) return [];
        w.__scanCode = null;
        return [{ rawValue: code, format: 'qr_code' }];
      }
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          canvas.getContext('2d')!.fillRect(0, 0, 64, 64);
          return canvas.captureStream(5);
        },
      },
    });
  });
}

async function scan(page: Page, code: string) {
  await page.getByRole('button', { name: 'Machine scannen' }).click();
  await expect(page.getByRole('dialog', { name: 'Scan de code op de machine' })).toBeVisible();
  await page.evaluate((c) => ((window as unknown as { __scanCode: string }).__scanCode = c), code);
}

test('QR-koppel-scan: koppelen, oefening openen en springen in de training', async ({ page }) => {
  await mockScanner(page);
  await page.goto('./');

  // Onbekende code op Vandaag → koppelen → oefening-detail
  await scan(page, 'TG-LEGPRESS-001');
  const pick = page.getByRole('dialog', { name: 'Welke machine is dit?' });
  await expect(pick.getByText('Code: TG-LEGPRESS-001')).toBeVisible();
  await pick.getByRole('button', { name: 'Seated Leg Press' }).click();
  await expect(page).toHaveURL(/#\/oefening\/leg-press$/);

  // Gekoppelde code staat bij de instellingen van de oefening
  await page.getByRole('tab', { name: 'Instellingen' }).click();
  await expect(page.getByText('TG-LEGPRESS-001')).toBeVisible();

  // In training A: scan springt van de warming-up naar Leg Press
  await page.getByRole('link', { name: 'Vandaag' }).click();
  await page.getByRole('button', { name: 'Start training A' }).click();
  await expect(page.getByRole('heading', { name: 'Loopband · Warming-up' })).toBeVisible();
  await scan(page, 'TG-LEGPRESS-001');
  await expect(page.getByRole('heading', { name: 'Seated Leg Press' })).toBeVisible();

  // Nieuwe code tijdens de training, gekoppeld aan een oefening die niet in A zit
  await scan(page, 'SN-998877');
  await page.getByRole('dialog', { name: 'Welke machine is dit?' }).getByRole('button', { name: 'Single-Leg Leg Press' }).click();
  await expect(page.getByText('Single-Leg Leg Press zit niet in deze training.')).toBeVisible();
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('heading', { name: 'Seated Leg Press' })).toBeVisible();
});

test('kcal-schatting in de samenvatting na het invullen van je gewicht', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Start training A' }).click();
  await page.getByRole('button', { name: 'Klaar – opslaan' }).click();
  await page.getByRole('button', { name: 'Training sluiten' }).click();
  await page.getByRole('button', { name: 'Afronden en opslaan' }).click();
  await expect(page.getByRole('heading', { name: 'Goed gedaan! 🎉' })).toBeVisible();

  await page.getByLabel('Gewicht (kg)').fill('80');
  await page.getByRole('button', { name: 'Bewaar gewicht' }).click();
  // Warming-up 5 min op de loopband → alleen cardio
  await expect(page.getByTestId('energy')).toContainText(/≈ \d+ kcal/);
  await expect(page.getByTestId('energy')).toContainText('kracht 0 ·');

  // Het gewicht staat nu ook onder Meer
  await page.getByRole('button', { name: 'Opslaan', exact: true }).click();
  await page.getByRole('link', { name: 'Meer' }).click();
  await expect(page.getByLabel('Lichaamsgewicht (kg)')).toHaveValue('80');
});

test('zonder BarcodeDetector is er geen scanknop', async ({ page }) => {
  await page.addInitScript(() => delete (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Vandaag' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Machine scannen' })).toHaveCount(0);
});
