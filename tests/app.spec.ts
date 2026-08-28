import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test('a draft survives a reload', async ({ page }) => {
  await page.goto('/app');

  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByPlaceholder('e.g. Q4 Roadmap Post').fill('Launch week');
  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(page.getByText('Launch week')).toBeVisible();

  await page.getByPlaceholder("Angle, hooks, links, anything you don't want to lose.").fill('ship on thursday');
  await page.getByText('Twitter / X', { exact: true }).last().click();
  await page.getByLabel('Post text').fill('forty thousand accounts, no downtime');

  await page.reload();

  await expect(page.getByText('Launch week')).toBeVisible();
  await expect(
    page.getByPlaceholder("Angle, hooks, links, anything you don't want to lose."),
  ).toHaveValue('ship on thursday');
  await expect(page.getByLabel('Post text')).toHaveValue('forty thousand accounts, no downtime');
});

test('turning a platform off keeps what was written', async ({ page }) => {
  await page.goto('/app');

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

  for (const [link, heading] of [
    ['Privacy Policy', 'Privacy Policy'],
    ['Terms of Use', 'Terms of Use'],
    ['Cookies', 'Cookies'],
  ] as const) {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: link }).click();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
});

test('projects redirects to the app screen', async ({ page }) => {
  await page.goto('/projects');
  await expect(page).toHaveURL(/\/app\/?$/);
});
