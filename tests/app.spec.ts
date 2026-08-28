import { expect, test, type Page } from '@playwright/test';

/**
 * Astro server renders the islands, so every control exists in the HTML before
 * it does anything. Clicking one before hydration is a click into the void, and
 * under parallel workers that is exactly what happened often enough to make the
 * suite flicker. Astro drops the `ssr` attribute once an island is live.
 */
async function ready(page: Page) {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.evaluate(() => localStorage.clear());
});

test('a draft survives a reload', async ({ page }) => {
  await page.goto('/app');
  await ready(page);

  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByPlaceholder('e.g. Q4 Roadmap Post').fill('Launch week');
  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(page.getByText('Launch week')).toBeVisible();

  await page.getByPlaceholder("Angle, hooks, links, anything you don't want to lose.").fill('ship on thursday');
  await page.getByText('Twitter / X', { exact: true }).last().click();
  await page.getByLabel('Post text').fill('forty thousand accounts, no downtime');

  await page.reload();
  await ready(page);

  await expect(page.getByText('Launch week')).toBeVisible();
  await expect(
    page.getByPlaceholder("Angle, hooks, links, anything you don't want to lose."),
  ).toHaveValue('ship on thursday');
  await expect(page.getByLabel('Post text')).toHaveValue('forty thousand accounts, no downtime');
});

test('turning a platform off keeps what was written', async ({ page }) => {
  await page.goto('/app');
  await ready(page);

  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByPlaceholder('e.g. Q4 Roadmap Post').fill('Keep it');
  await page.getByRole('button', { name: 'Create project' }).click();

  await page.getByText('Twitter / X', { exact: true }).last().click();
  await page.getByLabel('Post text').fill('still here');

  await page.getByRole('button', { name: 'Twitter / X' }).click();
  await page.getByRole('button', { name: 'Fine, turn it off' }).click();
  await expect(page.getByText('No platform is active.')).toBeVisible();

  await page.getByRole('button', { name: 'Twitter / X' }).click();
  await page.getByText('Twitter / X', { exact: true }).last().click();
  await expect(page.getByLabel('Post text')).toHaveValue('still here');
});

test('every legal page is reachable from the footer', async ({ page }) => {
  await page.goto('/');
  await ready(page);

  for (const [link, heading] of [
    ['Privacy Policy', 'Privacy Policy'],
    ['Terms of Use', 'Terms of Use'],
    ['Cookies', 'Cookies'],
  ] as const) {
    await page.goto('/');
  await ready(page);
    await page.getByRole('contentinfo').getByRole('link', { name: link }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
});

test('projects redirects to the app screen', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/app\/?$/);
});

test('the contact form refuses an empty submission before it leaves the browser', async ({
  page,
}) => {
  let posted = false;
  await page.route('**/api/contact', (route) => {
    posted = true;
    return route.fulfill({ status: 200, body: '{"ok":true}' });
  });

  await page.goto('/contact');
  await ready(page);
  await page.getByRole('button', { name: 'Send it' }).click();

  await expect(page.getByText('Tell me what to call you.')).toBeVisible();
  await expect(page.getByText('I need somewhere to write back.')).toBeVisible();
  await expect(page.getByText('The message is empty.')).toBeVisible();
  expect(posted).toBe(false);
});

test('the contact form carries a honeypot that no person can reach', async ({ page }) => {
  await page.goto('/contact');
  await ready(page);

  const honeypot = page.locator('input[name="company"]');
  await expect(honeypot).toHaveCount(1);

  // Positioned off screen rather than display:none, because some bots skip the
  // fields a browser would not paint. Keyboard and screen readers still skip it.
  await expect(honeypot).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('[aria-hidden="true"] input[name="company"]')).toHaveCount(1);

  const box = await honeypot.boundingBox();
  expect(box?.x ?? 0).toBeLessThan(0);
});

test('creating the project from the dialog moves the tour along with it', async ({ page }) => {
  await page.goto('/app?tour=1');
  await ready(page);
  await expect(page.getByText('1 / 6')).toBeVisible();

  await page.getByRole('button', { name: 'Press it' }).click();
  await expect(page.getByText('2 / 6')).toBeVisible();

  // The dialog's own button, not the tour's. Both have to land in one place.
  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(page.getByText('3 / 6')).toBeVisible();

  // One project, under the name the tour filled in. The old behaviour left the
  // tour pointing at a closed dialog and added a second, unnamed project.
  await expect(page.getByText('Merge Migration Recap')).toBeVisible();
  await expect(page.getByText('Untitled project')).toHaveCount(0);
});

test('cancelling the naming dialog ends the tour rather than stranding it', async ({ page }) => {
  await page.goto('/app?tour=1');
  await ready(page);
  await page.getByRole('button', { name: 'Press it' }).click();
  await expect(page.getByText('2 / 6')).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.getByText('2 / 6')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Skip the tour' })).toBeHidden();
  await expect(page.getByText('Nothing open yet')).toBeVisible();
});

test('the Turkish pages are actually Turkish', async ({ page }) => {
  await page.goto('/tr');
  await ready(page);

  await expect(page.getByText('Gönderilerini kolay yoldan hazırla')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');

  await page.goto('/tr/privacy');
  await expect(page.getByRole('heading', { level: 1, name: 'Gizlilik Politikası' })).toBeVisible();
});

test('the language switch swaps the page without leaving it', async ({ page }) => {
  await page.goto('/app');
  await ready(page);

  await expect(page.getByText('Nothing open yet')).toBeVisible();

  await page.getByRole('link', { name: 'TR' }).click();
  await expect(page).toHaveURL(/\/tr\/app\/?$/);
  await expect(page.getByText('Henüz açık bir şey yok')).toBeVisible();

  await page.getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(page.getByText('Nothing open yet')).toBeVisible();
});

test('the Turkish contact form reports its errors in Turkish', async ({ page }) => {
  await page.goto('/tr/contact');
  await ready(page);

  await page.getByRole('button', { name: 'Gönder' }).click();

  await expect(page.getByText('Sana nasıl sesleneceğimi söyle.')).toBeVisible();
  await expect(page.getByText('Geri yazabileceğim bir yer lazım.')).toBeVisible();
});

test('each page names its counterpart for search engines', async ({ page }) => {
  await page.goto('/terms');

  await expect(page.locator('link[rel="alternate"][hreflang="tr"]')).toHaveAttribute(
    'href',
    /\/tr\/terms$/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/terms$/);
});
