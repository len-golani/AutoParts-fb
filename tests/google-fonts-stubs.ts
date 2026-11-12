import type { Page } from '@playwright/test';

/** Replace Google Fonts with local responses so the suite makes no external requests. */
export async function stubGoogleFonts(page: Page): Promise<void> {
  await page.route(/^https:\/\/fonts\.googleapis\.com\//, route =>
    route.fulfill({
      status: 200,
      contentType: 'text/css; charset=utf-8',
      body: '/* Google Fonts stubbed for offline tests */',
    }),
  );

  await page.route(/^https:\/\/fonts\.gstatic\.com\//, route =>
    route.fulfill({
      status: 200,
      contentType: 'font/woff2',
      body: '',
    }),
  );
}
