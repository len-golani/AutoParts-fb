import { test as base, expect } from '@playwright/test';
import { stubGoogleFonts } from './google-fonts-stubs';
import { stubNhtsa } from './nhtsa-stubs';

// Fail any test that lets a page reach an external host without a route stub.
const test = base.extend<{ offlineGuard: void }>({
  offlineGuard: [
    async ({ page }, use) => {
      const unexpected: string[] = [];
      await page.route(/^https?:\/\//, route => {
        const url = new URL(route.request().url());
        if (url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '[::1]') {
          return route.continue();
        }
        // Live mode intentionally reaches NHTSA; all other external hosts stay guarded.
        if (process.env.LIVE_NHTSA === '1' && url.hostname === 'vpic.nhtsa.dot.gov') {
          return route.continue();
        }
        unexpected.push(url.href);
        return route.abort();
      });
      await stubGoogleFonts(page);
      await use();
      expect(
        unexpected,
        `Unexpected external requests without stubs: ${unexpected.join(', ')}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});

// Set LIVE_NHTSA=1 to run the VIN tests against the real vPIC API.
const LIVE_NHTSA = process.env.LIVE_NHTSA === '1';

// NHTSA vPIC decodes this cleanly (ErrorCode "0").
const KNOWN_GOOD_VIN = '1HGCM82633A004352';
// NHTSA flags this VIN's check digit (ErrorCode "1") but still returns the vehicle.
const CHECK_DIGIT_VIN = '4T1BF3EK8AU561547';
// NHTSA returns no vehicle data for this VIN.
const BOGUS_VIN = '00000000000000000';

test.describe('VIN decoder', () => {
  test.beforeEach(async ({ page }) => {
    if (!LIVE_NHTSA) await stubNhtsa(page);
  });

  test('decodes a known-good VIN through the form', async ({ page }) => {
    await page.goto('/vin');
    await page.locator('main').getByRole('textbox').fill(KNOWN_GOOD_VIN);
    await page.getByRole('button', { name: 'Decode VIN' }).click();

    await expect(page.getByRole('heading', { name: /2003 HONDA Accord/i })).toBeVisible();
    await expect(page.getByText(/check digit did not validate/i)).toHaveCount(0);
  });

  test('typing a VIN makes exactly one NHTSA decode request', async ({ page }) => {
    const decodeValuesRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/DecodeVinValues/')) decodeValuesRequests.push(request.url());
    });

    await page.goto('/vin');
    await page.locator('main').getByRole('textbox').fill(KNOWN_GOOD_VIN);
    await page.getByRole('button', { name: 'Decode VIN' }).click();

    await expect(page.getByRole('heading', { name: /2003 HONDA Accord/i })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/vin\\?vin=${KNOWN_GOOD_VIN}$`));
    await page.waitForTimeout(500);
    expect(decodeValuesRequests).toHaveLength(1);
  });

  test('header VIN search fills the scanner input', async ({ page }) => {
    await page.goto('/catalog');
    const headerSearch = page.getByPlaceholder('VIN or search model...');
    await headerSearch.fill(CHECK_DIGIT_VIN);
    await headerSearch.press('Enter');

    await expect(page).toHaveURL(new RegExp(`/vin\\?vin=${CHECK_DIGIT_VIN}$`));
    await expect(page.locator('main').getByRole('textbox')).toHaveValue(CHECK_DIGIT_VIN);
    await expect(page.getByRole('heading', { name: /2010 TOYOTA Camry/i })).toBeVisible();
  });

  test('decodes a check-digit-flagged VIN with an advisory instead of failing', async ({ page }) => {
    await page.goto(`/vin?vin=${CHECK_DIGIT_VIN}`);

    await expect(page.getByRole('heading', { name: /2010 TOYOTA Camry/i })).toBeVisible();
    await expect(page.getByText(/check digit did not validate/i)).toBeVisible();
    await expect(page.getByText(/could not decode this VIN/i)).toHaveCount(0);
  });

  test('shows a clear error for a bogus 17-character VIN loaded from a URL', async ({ page }) => {
    await page.goto(`/vin?vin=${BOGUS_VIN}`);

    await expect(page.getByText(/NHTSA could not decode this VIN/i)).toBeVisible();
    await expect(page.getByText('VIN Decoded', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Browse .* Parts/i })).toHaveCount(0);
  });

  test('shows a clear error for a bogus 17-character VIN submitted through the form', async ({ page }) => {
    await page.goto('/vin');
    await page.locator('main').getByRole('textbox').fill(BOGUS_VIN);
    await page.getByRole('button', { name: 'Decode VIN' }).click();

    await expect(page.getByText(/NHTSA could not decode this VIN/i)).toBeVisible();
    await expect(page.getByText('VIN Decoded', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Browse .* Parts/i })).toHaveCount(0);
  });

  test('manual selector loads models by NHTSA make ID and year', async ({ page }) => {
    await page.goto('/vin');
    await page.getByRole('button', { name: /Manual Selection/ }).click();

    const makeSelect = page.getByRole('combobox').nth(0);
    const yearSelect = page.getByRole('combobox').nth(1);
    const modelSelect = page.getByRole('combobox').nth(2);

    const modelsByMakeId = page.waitForRequest(req =>
      req.url().includes('/GetModelsForMakeId/474?'),
    );
    await makeSelect.selectOption('HONDA');
    await modelsByMakeId;
    await expect(modelSelect.getByRole('option', { name: 'Civic', exact: true })).toBeAttached();

    const modelsByMakeIdAndYear = page.waitForRequest(req =>
      req.url().includes('/GetModelsForMakeIdYear/makeId/474/modelyear/2020'),
    );
    await yearSelect.selectOption('2020');
    await modelsByMakeIdAndYear;
    await expect(modelSelect.getByRole('option', { name: 'Civic', exact: true })).toBeAttached();

    await modelSelect.selectOption('Civic');
    const browseParts = page.getByRole('button', { name: 'Browse Parts for 2020 HONDA Civic' });
    await expect(browseParts).toBeEnabled();
    await expect(page.getByText(/isn't in the parts catalog yet/i)).toHaveCount(0);
    await browseParts.click();

    await expect(page).toHaveURL(/\/catalog\/honda$/);
  });

  test('manual selector disables Browse Parts for an uncatalogued make', async ({ page }) => {
    await page.goto('/vin');
    await page.getByRole('button', { name: /Manual Selection/ }).click();

    const makeSelect = page.getByRole('combobox').nth(0);
    const modelSelect = page.getByRole('combobox').nth(2);

    const modelsByMakeId = page.waitForRequest(req =>
      req.url().includes('/GetModelsForMakeId/485?'),
    );
    await makeSelect.selectOption('VOLVO');
    await modelsByMakeId;
    await modelSelect.selectOption('XC90');

    await expect(page.getByRole('button', { name: 'Parts catalog for VOLVO coming soon' })).toBeDisabled();
    await expect(page.getByText(/VOLVO isn't in the parts catalog yet/i)).toBeVisible();
  });
});

test.describe('catalog search and filtering', () => {
  test('filters from the catalog page and writes ?q= to the URL', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByPlaceholder(/Search brands or models/i).fill('civic');

    await expect(page).toHaveURL(/\/catalog\?q=civic$/);
    await expect(page.getByText(/1 brand matching "civic"/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Honda/ })).toBeVisible();
  });

  test('header quick search filters while already on /catalog', async ({ page }) => {
    await page.goto('/catalog');
    const headerSearch = page.getByPlaceholder('VIN or search model...');
    await headerSearch.fill('mustang');
    await headerSearch.press('Enter');

    await expect(page).toHaveURL(/\/catalog\?q=mustang$/);
    await expect(page.getByText(/1 brand matching "mustang"/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Ford/ })).toBeVisible();
  });

  test('region filter narrows the brand list and resets to all', async ({ page }) => {
    await page.goto('/catalog');

    await page.getByRole('button', { name: 'Japanese' }).click();
    await expect(page.locator('a[href^="/catalog/"]')).toHaveCount(6);
    await expect(page.getByRole('link', { name: /Toyota/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Ford/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.locator('a[href^="/catalog/"]')).toHaveCount(20);
    await expect(page.getByRole('link', { name: /Ford/ })).toBeVisible();
  });
});

test.describe('home popular models', () => {
  test('focused popular model card activates with Enter and Space', async ({ page }) => {
    const toyotaCard = page.getByRole('button', { name: /Toyota/i });
    const expectToyotaBrandPage = async () => {
      await expect(page).toHaveURL(/\/catalog\/toyota$/);
      await expect(page.getByRole('heading', { name: 'Toyota', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Toyota Lineup' })).toBeVisible();
    };

    await page.goto('/');
    await expect(toyotaCard).toBeVisible();
    await toyotaCard.focus();
    await expect(toyotaCard).toBeFocused();
    await page.keyboard.press('Enter');
    await expectToyotaBrandPage();

    await page.goto('/');
    await expect(toyotaCard).toBeVisible();
    await toyotaCard.focus();
    await expect(toyotaCard).toBeFocused();
    await page.keyboard.press('Space');
    await expectToyotaBrandPage();
  });

  test('clicking a popular model card opens its brand page', async ({ page }) => {
    await page.goto('/');

    const toyotaCard = page.getByRole('button', { name: /Toyota/i });
    await expect(toyotaCard).toBeVisible();
    await toyotaCard.click();

    await expect(page).toHaveURL(/\/catalog\/toyota$/);
    await expect(page.getByRole('heading', { name: 'Toyota', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Toyota Lineup' })).toBeVisible();
  });
});

test.describe('favicon', () => {
  test('icon link points to a served SVG asset', async ({ page, request }) => {
    await page.goto('/');

    const href = await page.locator('link[rel="icon"]').getAttribute('href');
    if (!href) throw new Error('No favicon link found in index.html');

    const response = await request.get(new URL(href, page.url()).toString());
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
    expect(await response.text()).toContain('<svg');
  });
});

test.describe('mobile menu', () => {
  test.use({ viewport: { width: 600, height: 900 } });

  test('closes the menu and filters the catalog after a quick search is submitted', async ({ page }) => {
    await page.goto('/catalog');
    await page.getByRole('button', { name: 'Toggle menu' }).click();

    const mobileSearch = page.locator('[class*="mobileSearch"] input');
    await expect(mobileSearch).toBeVisible();
    await mobileSearch.fill('civic');
    await mobileSearch.press('Enter');

    await expect(page).toHaveURL(/\/catalog\?q=civic$/);
    await expect(page.getByText(/1 brand matching "civic"/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Honda/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Toyota/ })).toHaveCount(0);
    await expect(page.locator('main input')).toHaveValue('civic');
    await expect(page.locator('[class*="mobileMenu"]')).toHaveCount(0);
  });
});
