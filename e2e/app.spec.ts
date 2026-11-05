import { expect, test, type Page } from '@playwright/test';

/** Fails the test on any console error or uncaught exception. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function openNav(page: Page) {
  const menuButton = page.getByRole('button', { name: 'Open menu' });
  if (await menuButton.isVisible()) await menuButton.click();
}

test.beforeEach(async ({ page }) => {
  // Start every test in English regardless of the runner's locale.
  await page.addInitScript(() => {
    if (!localStorage.getItem('mss.settings')) {
      localStorage.setItem(
        'mss.settings',
        JSON.stringify({ state: { language: 'en' }, version: 1 }),
      );
    }
  });
});

test('home page renders the hero without errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Create Your Own Minecraft Identity.' }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/Home · /);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
});

test('navigates to settings and back', async ({ page }) => {
  await page.goto('/');
  await openNav(page);
  await page.getByRole('link', { name: 'Settings' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  await expect(page).toHaveURL(/\/settings$/);
});

test('theme and accent persist across reloads', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.getByRole('button', { name: 'Lapis' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const accent = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--accent'),
  );
  expect(accent).toBe('#5b84f5');
});

test('header theme toggle switches theme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('switching language translates the interface', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Language').selectOption('it');
  await expect(page.getByRole('heading', { level: 1, name: 'Impostazioni' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
});

test('reset settings asks for confirmation and shows a toast', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'Light' }).click();
  await page.getByRole('button', { name: 'Reset settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reset all settings?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Settings reset' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('unknown routes show the 404 page', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('developer-only routes are not shipped', async ({ page }) => {
  await page.goto('/dev/ui');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('layout has no horizontal overflow at any width', async ({ page }) => {
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ['/', '/settings', '/missing']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} @ ${String(width)}px`).toBeLessThanOrEqual(0);
    }
  }
});
