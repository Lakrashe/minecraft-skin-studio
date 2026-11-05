import { test as base, expect, type Page } from '@playwright/test';

/**
 * Every test fails on any console error or uncaught page exception
 * (auto fixture), so error handling is checked across all flows.
 */
const test = base.extend<{ runtimeErrors: string[] }>({
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(err.message));
      await use(errors);
      expect(errors, 'console errors / uncaught exceptions').toEqual([]);
    },
    { auto: true },
  ],
});

const NOT_SAVED = /can't be saved on this device/;

async function openNav(page: Page) {
  const menuButton = page.getByRole('button', { name: 'Open menu' });
  if (await menuButton.isVisible()) await menuButton.click();
}

test.beforeEach(async ({ page }) => {
  // Start every test in English regardless of the runner's locale.
  await page.addInitScript(() => {
    try {
      if (!localStorage.getItem('mss.settings')) {
        localStorage.setItem(
          'mss.settings',
          JSON.stringify({ state: { language: 'en' }, version: 1 }),
        );
      }
    } catch {
      // Storage may be deliberately disabled by a test.
    }
  });
});

test('home page renders the hero', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Create Your Own Minecraft Identity.' }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/Home · /);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('navigates to settings and back', async ({ page }) => {
  await page.goto('/');
  await openNav(page);
  await page.getByRole('link', { name: 'Settings' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  await expect(page).toHaveURL(/\/settings$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Create Your Own Minecraft Identity.' }),
  ).toBeVisible();
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
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('status').filter({ hasText: 'Settings reset' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test.describe('when settings cannot be saved', () => {
  test('a write failure after startup is handled and reported honestly', async ({ page }) => {
    await page.goto('/settings');
    await expect(
      page.getByText('Preferences are saved on this device automatically.'),
    ).toBeVisible();

    // Simulate quota exhaustion after the app has started.
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      };
    });

    await page.getByRole('radio', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('status').filter({ hasText: NOT_SAVED }).first()).toBeVisible();

    // Reset still completes: dialog closes, success toast, defaults applied.
    await page.getByRole('button', { name: 'Reset settings' }).click();
    const dialog = page.getByRole('dialog', { name: 'Reset all settings?' });
    await dialog.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: 'Settings reset' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('storage denied at startup still gives a working app', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('Access denied', 'SecurityError');
        },
      });
    });
    await page.goto('/settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: NOT_SAVED }).first()).toBeVisible();

    await page.getByRole('radio', { name: 'Light' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test('tooltips open on keyboard focus and close with Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Switch to light theme' });
  for (let i = 0; i < 10 && !(await trigger.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(trigger).toBeFocused();

  const tooltip = page.locator('[role="tooltip"]', { hasText: 'Switch to light theme' });
  await expect(tooltip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  await expect(trigger).toBeFocused();
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
