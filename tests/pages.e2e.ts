import { test, expect } from "@playwright/test";
import { stubGoogleFonts } from "./google-fonts-stubs";
import { stubNhtsa } from "./nhtsa-stubs";

const BASE_PATH = "/AutoParts-fb/";
const KNOWN_GOOD_VIN = "1HGCM82633A004352";

test.describe("deployed GitHub Pages", () => {
  test.beforeEach(async ({ page }) => {
    await stubGoogleFonts(page);
    await stubNhtsa(page);
  });

  test("decodes a VIN and keeps catalog navigation under the Pages base path", async ({
    page,
  }) => {
    await page.goto("vin");
    await page.locator("main").getByRole("textbox").fill(KNOWN_GOOD_VIN);
    await page.getByRole("button", { name: "Decode VIN" }).click();

    await expect(
      page.getByRole("heading", { name: /2003 HONDA Accord/i }),
    ).toBeVisible();

    const browseParts = page.getByRole("link", { name: /Browse HONDA Parts/i });
    await expect(browseParts).toHaveAttribute(
      "href",
      `${BASE_PATH}catalog/honda`,
    );
    await browseParts.click();
    await expect(page).toHaveURL(new RegExp(`${BASE_PATH}catalog/honda$`));
    await expect(
      page.getByRole("heading", { name: "Honda", exact: true }),
    ).toBeVisible();

    const catalogNav = page
      .locator("header")
      .getByRole("link", { name: "Catalog", exact: true });
    await expect(catalogNav).toHaveAttribute("href", `${BASE_PATH}catalog`);
    await catalogNav.click();
    await expect(page).toHaveURL(new RegExp(`${BASE_PATH}catalog$`));
    await expect(
      page.getByRole("heading", { name: "Browse by Brand" }),
    ).toBeVisible();

    const brandCards = page.locator('[class*="brandCard"]');
    await expect(brandCards.first()).toBeVisible();
    const hrefs = await brandCards.evaluateAll((cards) =>
      cards.map((card) => card.getAttribute("href")),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(new RegExp(`^${BASE_PATH}catalog/[^/]+$`));
    }

    await brandCards.first().click();
    await expect(page).toHaveURL(new RegExp(`${BASE_PATH}catalog/[^/]+$`));
  });
});
