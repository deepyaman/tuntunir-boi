import { test, expect, type Page } from '@playwright/test';

const story = 'stories/tuntuni-ar-biraler-kotha/';

// The reader script throws if the markup and the timings disagree, and a clip that
// cannot be decoded rejects; both surface as page errors, so the audio tests watch for them.
function pageErrors(page: Page) {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
}

// Records the index of every word that lights up, in order. A word is lit for well
// under a second, too briefly to catch reliably by polling, so the tests read the
// recording once playback has ended. Headless Chrome runs with audio muted; the audio
// clock still runs, which is what moves the tint and fires the end of a clip.
async function recordLitWords(page: Page) {
  await page.evaluate(() => {
    const words = [...document.querySelectorAll('article .word')];
    const lit: number[] = [];
    (window as any).lit = lit;
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        const el = m.target as Element;
        if (el.classList.contains('playing') && lit[lit.length - 1] !== words.indexOf(el)) lit.push(words.indexOf(el));
      }
    }).observe(document.querySelector('article')!, { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  return () => page.evaluate(() => (window as any).lit as number[]);
}

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

test('every word and sentence is marked up, and the text reads as before', async ({ page }) => {
  const errors = pageErrors(page);
  await page.goto(story);
  await expect(page.locator('article .word')).toHaveCount(213);
  await expect(page.getByRole('button', { name: 'Play sentence' })).toHaveCount(23);
  // The play marks are CSS, so the paragraph text is just the prose, spaces intact.
  await expect(page.locator('article p').first()).toHaveText(
    'Grihôsther ghôrer pichhone begun gachh achhe. Shei begun gachher pata ṭhõṭ diye shelai kôre Ṭunṭuni pakhiṭi tar basha bẽdhechhe.',
  );
  expect(errors).toEqual([]);
});

test('tapping a word plays it and lights it while it sounds', async ({ page }) => {
  const errors = pageErrors(page);
  await page.goto(story);
  const lit = await recordLitWords(page);
  await page.locator('article .word').nth(5).click(); // "achhe.", under half a second
  await expect(page.locator('article .playing')).toHaveCount(1);
  await expect(page.locator('article .playing')).toHaveCount(0);
  expect(await lit()).toEqual([5]);
  expect(errors).toEqual([]);
});

test('the mark after a sentence plays it word by word', async ({ page }) => {
  const errors = pageErrors(page);
  await page.goto(story);
  const lit = await recordLitWords(page);
  await page.getByRole('button', { name: 'Play sentence' }).first().click(); // six words, under three seconds
  await expect(page.locator('article .playing')).toHaveCount(1);
  await expect(page.locator('article .playing')).toHaveCount(0);
  expect(await lit()).toEqual([0, 1, 2, 3, 4, 5]);
  expect(errors).toEqual([]);
});

test('tapping a word shows its gloss on a card', async ({ page }) => {
  const errors = pageErrors(page);
  await page.goto(story);
  const lit = await recordLitWords(page);
  const card = page.locator('#card');
  const words = page.locator('article .word');

  await words.nth(0).click(); // "Grihôsther", which has a `from`
  await expect(card).toBeVisible();
  await expect(card.locator('.headword')).toHaveText('Grihôsther');
  // The "from" label is CSS, like the play mark, so it is not part of the text.
  await expect(card.locator('.gloss p')).toHaveText(["the householder's", "গৃহস্থ grihôstho, householder, family man + এর -er, 's"]);
  await expect(card.locator('.gloss .from i').first()).toHaveText('grihôstho');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

  await words.nth(3).click(); // "begun", which has only a meaning
  await expect(card.locator('.headword')).toHaveText('begun');
  await expect(card.locator('.gloss p')).toHaveText(['eggplant, brinjal']);

  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  await words.nth(5).click(); // "achhe.", the punctuation left off the headword
  await expect(card.locator('.headword')).toHaveText('achhe');
  await card.getByRole('button', { name: 'Close' }).click();
  await expect(card).toBeHidden();
  await words.nth(0).click();
  await page.getByRole('button', { name: 'Play sentence' }).first().click();
  await expect(card).toBeHidden();

  await expect(page.locator('article .playing')).toHaveCount(0);
  expect(await lit()).toEqual([0, 3, 5, 0, 1, 2, 3, 4, 5]); // the sentence starts on the word already lit
  expect(errors).toEqual([]);
});

test('nothing is wider than the viewport', async ({ page }) => {
  await page.goto(story);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
