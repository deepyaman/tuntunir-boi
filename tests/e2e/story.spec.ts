import { test, expect } from '@playwright/test';

const story = 'stories/tuntuni-ar-biraler-kotha/';

test('the contents page lists the first story and links to it', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ṭunṭunir Boi');
  await page.getByRole('link', { name: 'Ṭunṭuni ar biṛaler kôtha' }).click();
  await expect(page).toHaveURL(new RegExp(`/${story}$`));
});

test('the story page shows the text and the illustrations', async ({ page }) => {
  await page.goto(story);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ṭunṭuni ar biṛaler kôtha');
  expect(await page.locator('article p').count()).toBeGreaterThanOrEqual(10);
  await expect(page.locator('article figure')).toHaveCount(3);
  await expect(page.locator('article figcaption')).toHaveText([
    '‘Prônam hoi Môharani!’',
    '‘Dur hô, lokkhichhaṛi biṛalni!’',
  ]);

  for (const img of await page.locator('article img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
});

test('nothing is wider than the viewport', async ({ page }) => {
  await page.goto(story);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
