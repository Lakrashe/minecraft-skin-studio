import { test as base, expect, type Locator, type Page } from '@playwright/test';

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
    for (const path of ['/', '/editor', '/settings', '/missing']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} @ ${String(width)}px`).toBeLessThanOrEqual(0);
    }
  }
});

test.describe('homepage', () => {
  test('hero CTA opens the studio', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Start Creating' }).first().click();
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Studio' })).toBeVisible();
  });

  test('shows a live 3D character in the hero', async ({ page }) => {
    await page.goto('/');
    const hero = page.getByRole('img', { name: /Interactive 3D preview of the Explorer/ });
    await expect(hero).toBeVisible();
    await expect(hero.locator('canvas')).toBeVisible();
  });

  test('sample characters open in the studio', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Meet the sample characters' }).click();
    await page.getByRole('button', { name: /^Mage/ }).click();
    await expect(page.getByRole('button', { name: /^Mage/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByRole('link', { name: 'Open in Studio' }).click();
    // The sample is loaded once and the URL is cleaned up.
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.getByLabel('Start from', { exact: true })).toHaveValue('mage');
  });

  test('feature cards state honestly what is available', async ({ page }) => {
    await page.goto('/');
    const features = page.locator('#features');
    await expect(features.getByText('Available now')).toHaveCount(2);
    await expect(features.getByText('Planned')).toHaveCount(4);
  });
});

test.describe('studio', () => {
  /** Screen position of a texel's center on the 2D texture. */
  async function texelPoint(page: Page, x: number, y: number) {
    const texture = page.getByRole('img', { name: /64×64 skin texture/ });
    const box = await texture.boundingBox();
    if (!box) throw new Error('texture not visible');
    const zoom = box.width / 64;
    return { x: box.x + (x + 0.5) * zoom, y: box.y + (y + 0.5) * zoom };
  }

  /** Hovers a texel and returns the status bar that describes it. */
  async function colorAt(page: Page, x: number, y: number) {
    const p = await texelPoint(page, x, y);
    await page.mouse.move(p.x, p.y);
    const status = page.getByRole('status').filter({ hasText: `Pixel ${String(x)}, ${String(y)}` });
    await expect(status).toBeVisible();
    return status;
  }

  test('inspects pixels with the keyboard', async ({ page }) => {
    await page.goto('/editor?sample=knight');
    const texture = page.getByRole('img', { name: /64×64 skin texture/ });
    await texture.focus();
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowDown');
    await expect(page.getByText('Pixel 8, 8')).toBeVisible();
    await expect(page.getByText('Head · Front · Inner')).toBeVisible();
  });

  test('draws with the mouse; undo and redo restore the exact pixel', async ({ page }) => {
    await page.goto('/editor');
    const before = (await (await colorAt(page, 10, 10)).textContent()) ?? '';
    const a = await texelPoint(page, 9, 10);
    const b = await texelPoint(page, 13, 10);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 4 });
    await page.mouse.up();
    await expect(await colorAt(page, 10, 10)).toContainText('#3fa34d');
    await expect(await colorAt(page, 13, 10)).toContainText('#3fa34d');

    await page.keyboard.press('Control+z');
    await expect(await colorAt(page, 10, 10)).toHaveText(before);
    await page.keyboard.press('Control+Shift+z');
    await expect(await colorAt(page, 10, 10)).toContainText('#3fa34d');
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(await colorAt(page, 10, 10)).toHaveText(before);
  });

  test('tools: line, mirror drawing, eraser and HEX color', async ({ page, isMobile }) => {
    await page.goto('/editor?sample=knight');
    if (isMobile) await page.getByRole('radio', { name: 'Tools', exact: true }).click();
    await page.getByLabel('HEX').fill('#ff0000');
    if (isMobile) await page.getByRole('radio', { name: '2D texture' }).click();
    await page.getByRole('img', { name: /64×64 skin texture/ }).focus();

    // Line (L) across the body front.
    await page.keyboard.press('l');
    const from = await texelPoint(page, 20, 22);
    const to = await texelPoint(page, 27, 22);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 3 });
    await page.mouse.up();
    await expect(await colorAt(page, 24, 22)).toContainText('#ff0000');

    // Mirror (M) + pencil (B): the right arm front is mirrored onto the left arm front.
    await page.keyboard.press('m');
    await page.keyboard.press('b');
    const arm = await texelPoint(page, 44, 21);
    await page.mouse.click(arm.x, arm.y);
    await expect(await colorAt(page, 39, 53)).toContainText('#ff0000');

    // Eraser (E) makes a pixel transparent.
    await page.keyboard.press('e');
    const head = await texelPoint(page, 9, 9);
    await page.mouse.click(head.x, head.y);
    await expect(await colorAt(page, 9, 9)).toContainText('Transparent');
  });

  test('custom palettes are saved on the device', async ({ page, isMobile }) => {
    await page.goto('/editor');
    if (isMobile) await page.getByRole('radio', { name: 'Tools', exact: true }).click();
    await page.getByRole('button', { name: 'New palette' }).click();
    await page.getByLabel('Name').fill('Armor');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByLabel('HEX').fill('#123456');
    await page.getByRole('button', { name: 'Add current color' }).click();
    await page.reload();
    if (isMobile) await page.getByRole('radio', { name: 'Tools', exact: true }).click();
    await page.getByLabel('Palette', { exact: true }).selectOption({ label: 'Armor' });
    await expect(page.getByRole('button', { name: 'Use #123456' })).toBeVisible();
  });

  test('the 3D preview redraws when the texture changes', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop shows the 2D texture and the 3D preview side by side.');
    await instrumentDraws(page);
    await page.goto('/editor');
    await page.getByRole('radio', { name: 'Off' }).click();
    const preview = page.getByRole('img', { name: '3D preview of your skin' });
    await expect(preview).toHaveAttribute('data-frameloop', 'demand');
    expect(await drawsDuring(preview)).toBe(0);
    const canvas = preview.locator('canvas');
    const before = Number((await canvas.getAttribute('data-draws')) ?? '0');
    const p = await texelPoint(page, 10, 10);
    await page.mouse.click(p.x, p.y);
    await expect
      .poll(async () => Number((await canvas.getAttribute('data-draws')) ?? '0'))
      .toBeGreaterThan(before);
  });

  test('pinch zooms the texture without drawing', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Touch gestures run in the phone project.');
    await page.goto('/editor');
    const texture = page.getByRole('img', { name: /64×64 skin texture/ });
    const zoom = page.getByRole('region', { name: '2D texture' }).locator('output');
    await expect(texture).toBeVisible();
    const before = Number.parseInt((await zoom.textContent()) ?? '0', 10);
    const box = await texture.boundingBox();
    if (!box) throw new Error('texture not visible');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;

    // Two fingers land on the texture and spread apart.
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', spread: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints:
          type === 'touchEnd'
            ? []
            : [
                { x: cx - spread, y: cy, id: 1 },
                { x: cx + spread, y: cy, id: 2 },
              ],
      });
    await touch('touchStart', 20);
    for (const spread of [30, 40, 50, 60]) await touch('touchMove', spread);
    await touch('touchEnd', 60);

    await expect
      .poll(async () => Number.parseInt((await zoom.textContent()) ?? '0', 10))
      .toBeGreaterThan(before);
    // The first finger's stroke was cancelled: nothing to undo.
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  test('face labels can be shown and hide when too small to read', async ({ page, isMobile }) => {
    await page.goto('/editor');
    const labels = page.getByTestId('face-labels');
    await expect(labels).toHaveAttribute('data-labels', '0');
    if (isMobile) await page.getByRole('radio', { name: 'Tools', exact: true }).click();
    await page.getByRole('switch', { name: 'Face labels' }).click();
    if (isMobile) await page.getByRole('radio', { name: '2D texture' }).click();
    const texture = page.getByRole('img', { name: /64×64 skin texture/ });
    const zoom = page.getByRole('region', { name: '2D texture' }).locator('output');
    await texture.focus();
    // How many labels fit at a middle zoom depends on the platform's font
    // metrics, so check the two font-independent ends instead. At 24× even the
    // smallest face (4×4 → 96 px) fits its short name, so all 72 are labeled.
    for (let i = 0; i < 24; i++) await page.keyboard.press('+');
    await expect(zoom).toHaveText('24×');
    await expect(labels).toHaveAttribute('data-labels', '72');
    // Below 6× nothing is drawn: the text could not be read.
    for (let i = 0; i < 24; i++) await page.keyboard.press('-');
    await expect(zoom).toHaveText('2×');
    await expect(labels).toHaveAttribute('data-labels', '0');
    // Switching them off removes them at any zoom.
    for (let i = 0; i < 24; i++) await page.keyboard.press('+');
    await expect(labels).toHaveAttribute('data-labels', '72');
    if (isMobile) await page.getByRole('radio', { name: 'Tools', exact: true }).click();
    await page.getByRole('switch', { name: 'Face labels' }).click();
    await expect(labels).toHaveAttribute('data-labels', '0');
  });

  test.describe('audit regressions', () => {
    test('undo while the mouse is still down keeps history exact (P1)', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Mouse input; the engine and component tests cover the logic.');
      await page.goto('/editor');
      const original = (await (await colorAt(page, 8, 8)).textContent()) ?? '';
      const a = await texelPoint(page, 8, 8);
      await page.mouse.click(a.x, a.y); // commit a green pixel at (8,8)
      await expect(await colorAt(page, 8, 8)).toContainText('#3fa34d');

      await page.getByLabel('HEX').fill('#0000ff');
      await page.getByLabel('HEX').press('Enter');
      const b = await texelPoint(page, 9, 8);
      await page.mouse.move(b.x, b.y);
      await page.mouse.down(); // blue stroke over (9,8)…
      await page.mouse.move(a.x, a.y, { steps: 2 }); // …and (8,8)
      await page.keyboard.press('Control+z'); // undo the green pixel mid-stroke
      await page.mouse.up();

      await expect(await colorAt(page, 8, 8)).toHaveText(original);
      await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
      await page.keyboard.press('Control+Shift+z');
      await expect(await colorAt(page, 8, 8)).toContainText('#3fa34d');
    });

    test('typing a HEX color, painting, then shortcuts all work (P2)', async ({
      page,
      isMobile,
    }) => {
      await page.goto('/editor');
      if (isMobile) await page.getByRole('radio', { name: 'Tools', exact: true }).click();
      const hex = page.getByLabel('HEX');
      await hex.click();
      await hex.press('Control+a');
      await hex.pressSequentially('#123456');
      await expect(hex).toHaveValue('#123456');
      if (isMobile) await page.getByRole('radio', { name: '2D texture' }).click();

      // No programmatic focus: a normal click on the texture.
      const p = await texelPoint(page, 12, 12);
      await page.mouse.click(p.x, p.y);
      await expect(await colorAt(page, 12, 12)).toContainText('#123456');
      await page.keyboard.press('Control+z');
      await expect(await colorAt(page, 12, 12)).not.toContainText('#123456');
      await page.keyboard.press('e');
      if (isMobile) {
        const strip = page.getByRole('toolbar', { name: 'Tools' });
        await expect(strip.getByRole('button', { name: 'Eraser' })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      } else {
        await expect(page.getByRole('button', { name: 'Eraser' })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      }
    });

    test('leaving mid-stroke leaves no phantom pixels (P2)', async ({ page, isMobile }) => {
      test.skip(isMobile, 'Uses the desktop header link.');
      await page.goto('/editor');
      await page.getByLabel('Start from').selectOption('blank');
      const p = await texelPoint(page, 10, 10);
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      // Navigate with the app's own link while the button is still down.
      await page.evaluate(() => {
        document.querySelector<HTMLAnchorElement>('header a[href="/settings"]')?.click();
      });
      await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
      await page.mouse.up();
      await page.getByRole('link', { name: 'Studio', exact: true }).first().click();
      await expect(await colorAt(page, 10, 10)).toContainText('Transparent');
      await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled(); // only the "blank" load
    });

    test('a pinch with the second finger beside the texture paints nothing (P2)', async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, 'Touch gestures run in the phone project.');
      await page.goto('/editor');
      const texture = page.getByRole('img', { name: /64×64 skin texture/ });
      await expect(texture).toBeVisible();
      const box = await texture.boundingBox();
      if (!box) throw new Error('texture not visible');
      const first = { x: box.x + box.width * 0.2, y: box.y + box.height * 0.2 };
      const second = { x: box.x - 8, y: box.y + box.height * 0.2 }; // workspace padding
      const cdp = await page.context().newCDPSession(page);
      const send = (
        type: 'touchStart' | 'touchMove' | 'touchEnd',
        points: { x: number; y: number; id: number }[],
      ) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
      await send('touchStart', [{ ...first, id: 1 }]);
      await send('touchStart', [
        { ...first, id: 1 },
        { ...second, id: 2 },
      ]);
      for (const d of [10, 20, 30, 40]) {
        await send('touchMove', [
          { x: first.x + d, y: first.y, id: 1 },
          { x: second.x - d, y: second.y, id: 2 },
        ]);
      }
      await send('touchEnd', []);
      await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
    });

    test('Space still toggles a focused switch (P3)', async ({ page, isMobile }) => {
      await page.goto('/editor');
      if (isMobile) await page.getByRole('radio', { name: 'Tools', exact: true }).click();
      const mirror = page.getByRole('switch', { name: 'Mirror drawing' });
      await mirror.focus();
      await page.keyboard.press('Space');
      await expect(mirror).toHaveAttribute('aria-checked', 'true');
    });

    test('moving within one texel does not recreate GPU textures (P3)', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop shows the 2D texture and the 3D preview side by side.');
      await page.addInitScript(() => {
        const counter = globalThis as unknown as { __textures: number };
        counter.__textures = 0;
        const proto = WebGL2RenderingContext.prototype;
        // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with apply
        const create = proto.createTexture;
        proto.createTexture = function (this: WebGL2RenderingContext) {
          counter.__textures++;
          return create.apply(this);
        };
      });
      await page.goto('/editor');
      const preview = page.getByRole('img', { name: '3D preview of your skin' });
      await expect(preview.locator('canvas')).toBeVisible();
      const p = await texelPoint(page, 10, 10);
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
      await page.waitForTimeout(300);
      const count = () =>
        page.evaluate(() => (globalThis as unknown as { __textures: number }).__textures);
      const before = await count();
      for (let i = 0; i < 20; i++) await page.mouse.move(p.x + (i % 2), p.y + (i % 2));
      await page.waitForTimeout(300);
      expect(await count()).toBe(before);
      await page.mouse.up();
      await expect(await colorAt(page, 10, 10)).toContainText('#3fa34d');
    });
  });

  test.describe('3D rendering accuracy', () => {
    /** RGB of the rendered 3D preview at an offset (in model units) from its center. */
    async function renderedColor(page: Page, unitsRight = 0, unitsUp = 0) {
      const canvas = page.getByRole('img', { name: '3D preview of your skin' }).locator('canvas');
      const box = await canvas.boundingBox();
      if (!box) throw new Error('3D preview not visible');
      // Camera: 35° vertical field of view, 68 units from the center; faces are ~2 units closer.
      const pxPerUnit = box.height / (2 * 66 * Math.tan((17.5 * Math.PI) / 180));
      const x = Math.round(box.width / 2 + unitsRight * pxPerUnit);
      const y = Math.round(box.height / 2 - unitsUp * pxPerUnit);
      const png = await canvas.screenshot();
      // Decode the screenshot in the page (no image library needed in the tests).
      return page.evaluate(
        async ({ data, x, y, cssWidth }) => {
          const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
          const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
          const c = document.createElement('canvas');
          c.width = bitmap.width;
          c.height = bitmap.height;
          const ctx = c.getContext('2d');
          if (!ctx) return [0, 0, 0];
          ctx.drawImage(bitmap, 0, 0);
          // Screenshots are in device pixels: scale the CSS position.
          const ratio = bitmap.width / cssWidth;
          const p = ctx.getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data;
          return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
        },
        { data: png.toString('base64'), x, y, cssWidth: box.width },
      );
    }

    /** Waits until the pixel matches `expected` (±10 per channel); reports what was seen. */
    async function expectColor(page: Page, expected: readonly number[], right = 0, up = 0) {
      let seen: number[] = [];
      await expect
        .poll(
          async () => {
            seen = await renderedColor(page, right, up);
            return seen.every((v, i) => Math.abs(v - (expected[i] ?? 0)) <= 10);
          },
          {
            timeout: 5000,
            message: `expected rgb(${expected.join(', ')}) at (${String(right)}, ${String(up)})`,
          },
        )
        .toBe(true)
        .catch((error: unknown) => {
          throw new Error(`${String(error)}
Saw rgb(${seen.join(', ')})`);
        });
    }

    async function fill(page: Page, hex: string, x: number, y: number) {
      await page.getByLabel('HEX').fill(hex);
      await page.getByLabel('HEX').press('Enter');
      const p = await texelPoint(page, x, y);
      await page.mouse.click(p.x, p.y);
    }

    type View = 'Front' | 'Back' | 'Left side' | 'Right side';

    /**
     * Rendered color where world point `p` (model units) appears from a camera
     * preset. Presets sit 68 units from the player's center (0, 16, 0).
     */
    async function colorAtPoint(page: Page, view: View, p: readonly [number, number, number]) {
      const [x, y, z] = p;
      const { right, depth } = {
        Front: { right: x, depth: 68 - z },
        Back: { right: -x, depth: 68 + z },
        'Left side': { right: -z, depth: 68 - x },
        'Right side': { right: z, depth: 68 + x },
      }[view];
      // renderedColor scales offsets for a depth of 66; convert to this depth.
      return renderedColor(page, (right * 66) / depth, ((y - 16) * 66) / depth);
    }

    async function expectPointColor(
      page: Page,
      view: View,
      p: readonly [number, number, number],
      expected: readonly number[],
    ) {
      let seen: number[] = [];
      await expect
        .poll(
          async () => {
            seen = await colorAtPoint(page, view, p);
            return seen.every((v, i) => Math.abs(v - (expected[i] ?? 0)) <= 10);
          },
          { timeout: 5000, message: `${view} at (${p.join(', ')})` },
        )
        .toBe(true)
        .catch((error: unknown) => {
          throw new Error(`${String(error)}\nSaw rgb(${seen.join(', ')})`);
        });
    }

    async function paintTexel(page: Page, hex: string, x: number, y: number) {
      await page.getByLabel('HEX').fill(hex);
      await page.getByLabel('HEX').press('Enter');
      const p = await texelPoint(page, x, y);
      await page.mouse.click(p.x, p.y);
    }

    const BLACK = [0, 0, 0]; // transparent base pixels render opaque black, as in Java

    test('single painted pixels appear on the exact spot of the body, live', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop shows the 2D texture and the 3D preview side by side.');
      await page.goto('/editor');
      await page.getByLabel('Start from').selectOption('blank');
      await page.getByRole('radio', { name: 'Off' }).click();
      await page.getByLabel('Lighting').selectOption({ label: 'Flat (exact colors)' });
      const view = async (name: View) => {
        await page.getByRole('button', { name, exact: true }).click();
      };

      // Head front, texel (9,10): column 1, row 2 of the face.
      await paintTexel(page, '#ff0000', 9, 10);
      await view('Front');
      await expectPointColor(page, 'Front', [-2.5, 29.5, 4], [255, 0, 0]);
      await expectPointColor(page, 'Front', [-1.5, 29.5, 4], BLACK); // the next column
      await expectPointColor(page, 'Front', [-2.5, 28.5, 4], BLACK); // the next row

      // Undo and redo reach the 3D texture.
      await page.keyboard.press('Control+z');
      await expectPointColor(page, 'Front', [-2.5, 29.5, 4], BLACK);
      await page.keyboard.press('Control+Shift+z');
      await expectPointColor(page, 'Front', [-2.5, 29.5, 4], [255, 0, 0]);

      // Left leg front (21,53) and the hat (outer layer) front (41,9).
      await paintTexel(page, '#ffff00', 21, 53);
      await expectPointColor(page, 'Front', [1.4, 10.5, 2], [255, 255, 0]);
      await paintTexel(page, '#ff00ff', 41, 9);
      const hat = [-2.8125, 30.8125, 4.5] as const;
      await expectPointColor(page, 'Front', hat, [255, 0, 255]);

      // Layer visibility: hiding the outer layer reveals the head underneath.
      await page.getByRole('switch', { name: 'Outer layer' }).click();
      await expectPointColor(page, 'Front', hat, BLACK);
      await page.getByRole('switch', { name: 'Outer layer' }).click();
      await expectPointColor(page, 'Front', hat, [255, 0, 255]);

      // Body back (33,22): from behind, texture column 1 is on the viewer's left (+x).
      await paintTexel(page, '#0000ff', 33, 22);
      await view('Back');
      await expectPointColor(page, 'Back', [2.5, 21.5, -2], [0, 0, 255]);

      // Head, player's right side (1,12): from the right, column 1 is toward the back.
      await paintTexel(page, '#00ff00', 1, 12);
      await view('Right side');
      await expectPointColor(page, 'Right side', [-4, 27.5, -2.5], [0, 255, 0]);

      // Alex: 3-wide right arm, half a pixel lower — (45,22) is column 1, row 2.
      await page.getByRole('radio', { name: 'Alex (slim)' }).click();
      await paintTexel(page, '#00ffff', 45, 22);
      await view('Front');
      await expectPointColor(page, 'Front', [-5.5, 21, 2], [0, 255, 255]);
    });

    test('a one-pixel edit uploads a 1×1 region, not the whole texture', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop shows the 2D texture and the 3D preview side by side.');
      await page.addInitScript(() => {
        const log = globalThis as unknown as { __uploads: [number, number][] };
        log.__uploads = [];
        const proto = WebGL2RenderingContext.prototype;
        // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with apply
        const sub = proto.texSubImage2D as (...a: unknown[]) => void;
        proto.texSubImage2D = function (this: WebGL2RenderingContext, ...args: unknown[]) {
          if (typeof args[4] === 'number' && typeof args[5] === 'number') {
            log.__uploads.push([args[4], args[5]]);
          }
          sub.apply(this, args);
        };
      });
      const uploads = () =>
        page.evaluate(() => (globalThis as unknown as { __uploads: [number, number][] }).__uploads);
      await page.goto('/editor');
      await page.getByRole('radio', { name: 'Off' }).click();
      await expect(
        page.getByRole('img', { name: '3D preview of your skin' }).locator('canvas'),
      ).toBeVisible();
      // The first upload is the whole 64×64 texture.
      await expect
        .poll(async () => (await uploads()).some(([w, h]) => w === 64 && h === 64))
        .toBe(true);
      await page.evaluate(() => {
        (globalThis as unknown as { __uploads: [number, number][] }).__uploads = [];
      });

      const p = await texelPoint(page, 10, 10);
      await page.mouse.click(p.x, p.y);
      await expect.poll(uploads).toEqual([[1, 1]]);
    });

    test('after a lost WebGL context, the whole skin comes back, with edits made meanwhile', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop shows the 2D texture and the 3D preview side by side.');
      await page.goto('/editor'); // Explorer sample: a multicolor skin
      await page.getByRole('radio', { name: 'Off' }).click();
      await page.getByLabel('Lighting').selectOption({ label: 'Flat (exact colors)' });
      await page.getByRole('button', { name: 'Front', exact: true }).click();

      // An untouched spot (body front) and the pixel we will edit (head front (10,10)).
      const body = [0.5, 18.5, 2] as const;
      const edited = [-1.5, 29.5, 4] as const;
      await expect
        .poll(async () => (await colorAtPoint(page, 'Front', body)).some((v) => v > 20))
        .toBe(true);
      const original = await colorAtPoint(page, 'Front', body);

      const canvas = page.getByRole('img', { name: '3D preview of your skin' }).locator('canvas');
      // Keep the extension: a lost context no longer hands it out.
      const loseContext = (action: 'loseContext' | 'restoreContext') =>
        canvas.evaluate((element: HTMLCanvasElement, name) => {
          const holder = element as HTMLCanvasElement & { __lose?: WEBGL_lose_context | null };
          holder.__lose ??=
            element.getContext('webgl2')?.getExtension('WEBGL_lose_context') ?? null;
          if (!holder.__lose) throw new Error('WEBGL_lose_context unavailable');
          holder.__lose[name]();
        }, action);

      await loseContext('loseContext');
      await page.waitForTimeout(300);
      // Edit while the 3D view has no GPU context.
      await paintTexel(page, '#ff0000', 10, 10);
      await loseContext('restoreContext');
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: 'Front', exact: true }).click();

      await expectPointColor(page, 'Front', edited, [255, 0, 0]);
      await expectPointColor(page, 'Front', body, original);
    });

    test('each face of a painted skin shows its own pixels from every side', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop shows the 2D texture and the 3D preview side by side.');
      await page.goto('/editor');
      await page.getByLabel('Start from').selectOption('blank');
      await page.getByRole('radio', { name: 'Off' }).click();
      await page.getByLabel('Lighting').selectOption({ label: 'Flat (exact colors)' });

      // Bucket-fill whole faces with distinct colors (bucket stays inside one face).
      await page.getByRole('button', { name: 'Bucket fill' }).first().click();
      await fill(page, '#ff0000', 22, 25); // body front
      await fill(page, '#0000ff', 35, 25); // body back
      await fill(page, '#00ff00', 41, 25); // right arm, outer (right) side
      await fill(page, '#ffff00', 41, 57); // left arm, outer (left) side
      // An asymmetric marker: the body front's left texture column (player's right side).
      await page.getByRole('button', { name: 'Line' }).first().click();
      await page.getByLabel('HEX').fill('#ff00ff');
      await page.getByLabel('HEX').press('Enter');
      const top = await texelPoint(page, 20, 20);
      const bottom = await texelPoint(page, 20, 31);
      await page.mouse.move(top.x, top.y);
      await page.mouse.down();
      await page.mouse.move(bottom.x, bottom.y, { steps: 3 });
      await page.mouse.up();

      await page.getByRole('button', { name: 'Front', exact: true }).click();
      await expectColor(page, [255, 0, 0]); // body front in the middle
      await expectColor(page, [255, 0, 255], -3.5); // marker on the viewer's left = player's right
      await expectColor(page, [255, 0, 0], 3.5); // not on the other side

      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await expectColor(page, [0, 0, 255]);

      await page.getByRole('button', { name: 'Right side', exact: true }).click();
      await expectColor(page, [0, 255, 0]);

      await page.getByRole('button', { name: 'Left side', exact: true }).click();
      await expectColor(page, [255, 255, 0]);
    });

    test('skin textures are freed on model switches and when leaving the Studio', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Desktop shows the model switch next to the 3D preview.');
      // Track live 64×64 textures (the rig's skin texture) separately from any
      // other texture the renderer may own: mark a texture as a skin when a
      // 64×64 image is allocated for it, and forget it when it is deleted.
      await page.addInitScript(() => {
        const state = globalThis as unknown as { __skinTextures: Set<WebGLTexture> };
        state.__skinTextures = new Set();
        const proto = WebGL2RenderingContext.prototype;
        const bound = new WeakMap<WebGL2RenderingContext, WebGLTexture | null>();
        // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with apply
        const bind = proto.bindTexture;
        proto.bindTexture = function (this: WebGL2RenderingContext, target, texture) {
          bound.set(this, texture);
          bind.apply(this, [target, texture]);
        };
        const mark = (gl: WebGL2RenderingContext, width: unknown, height: unknown) => {
          const texture = bound.get(gl);
          if (texture && width === 64 && height === 64) state.__skinTextures.add(texture);
        };
        // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with apply
        const storage = proto.texStorage2D;
        proto.texStorage2D = function (this: WebGL2RenderingContext, ...args) {
          mark(this, args[3], args[4]);
          storage.apply(this, args);
        };
        // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with apply
        const image = proto.texImage2D as (...a: unknown[]) => void;
        proto.texImage2D = function (this: WebGL2RenderingContext, ...args: unknown[]) {
          mark(this, args[3], args[4]);
          image.apply(this, args);
        };
        // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with apply
        const remove = proto.deleteTexture;
        proto.deleteTexture = function (this: WebGL2RenderingContext, texture) {
          if (texture) state.__skinTextures.delete(texture);
          remove.apply(this, [texture]);
        };
      });
      const liveSkinTextures = () =>
        page.evaluate(
          () =>
            (globalThis as unknown as { __skinTextures: Set<WebGLTexture> }).__skinTextures.size,
        );

      await page.goto('/editor');
      await expect(
        page.getByRole('img', { name: '3D preview of your skin' }).locator('canvas'),
      ).toBeVisible();
      await expect.poll(liveSkinTextures).toBe(1);

      // Each switch rebuilds the rig: a new texture replaces the old one.
      for (let i = 0; i < 3; i++) {
        await page.getByRole('radio', { name: 'Alex (slim)' }).click();
        await page.getByRole('radio', { name: 'Steve (classic)' }).click();
      }
      await page.getByRole('radio', { name: 'Alex (slim)' }).click();
      await page.waitForTimeout(300);
      await expect.poll(liveSkinTextures).toBe(1);

      // Leaving the Studio unmounts the viewer and frees the rig's texture.
      await page.getByRole('link', { name: 'Settings', exact: true }).first().click();
      await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
      await expect.poll(liveSkinTextures).toBe(0);
    });

    test('lighting presets and intensity apply; flat disables intensity', async ({
      page,
      isMobile,
    }) => {
      await page.goto('/editor');
      if (isMobile) await page.getByRole('radio', { name: '3D preview' }).click();
      const lighting = page.getByLabel('Lighting');
      const intensity = page.getByLabel('Light intensity');
      await expect(lighting).toHaveValue('studio');
      await lighting.selectOption({ label: 'Sunset' });
      await expect(lighting).toHaveValue('sunset');
      await intensity.fill('150');
      await expect(page.getByText('150%')).toBeVisible();
      await lighting.selectOption({ label: 'Flat (exact colors)' });
      await expect(intensity).toBeDisabled();
      await expect(page.getByText('No shading: every pixel shows its exact color.')).toBeVisible();
    });

    test('the 360° turntable keeps the model turning until switched off', async ({
      page,
      isMobile,
    }) => {
      await instrumentDraws(page);
      await page.goto('/editor');
      if (isMobile) await page.getByRole('radio', { name: '3D preview' }).click();
      await page.getByRole('radio', { name: 'Off' }).click();
      const preview = page.getByRole('img', { name: '3D preview of your skin' });
      await expect(preview).toHaveAttribute('data-frameloop', 'demand');
      await page.getByRole('switch', { name: '360° turntable' }).click();
      await expect(preview).toHaveAttribute('data-frameloop', 'always');
      expect(await drawsDuring(preview)).toBeGreaterThan(0);
      await page.getByRole('switch', { name: '360° turntable' }).click();
      await expect(preview).toHaveAttribute('data-frameloop', 'demand');
    });
  });

  test('phones keep the tools above the texture', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Phone layout only.');
    await page.goto('/editor');
    const strip = page.getByRole('toolbar', { name: 'Tools' });
    await expect(strip).toBeVisible();
    await strip.getByRole('button', { name: 'Eraser' }).click();
    await expect(strip.getByRole('button', { name: 'Eraser' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('view controls work; import, export and save are not offered yet', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/editor');
    if (isMobile) await page.getByRole('radio', { name: 'Tools', exact: true }).click();
    const head = page.getByRole('button', { name: 'Head', exact: true });
    await head.click();
    await expect(head).toHaveAttribute('aria-pressed', 'true');
    const outer = page.getByRole('switch', { name: 'Outer layer' });
    await outer.click();
    await expect(outer).toHaveAttribute('aria-checked', 'false');
    for (const name of [/^export/i, /^import/i, /^save$/i, /^download/i]) {
      await expect(page.getByRole('button', { name })).toHaveCount(0);
    }
  });

  test('renders the 3D preview with camera controls', async ({ page, isMobile }) => {
    await page.goto('/editor');
    if (isMobile) await page.getByRole('radio', { name: '3D preview' }).click();
    const preview = page.getByRole('img', { name: '3D preview of your skin' });
    await expect(preview.locator('canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('radio', { name: 'Walk' }).click();
    await expect(page.getByRole('radio', { name: 'Walk' })).toHaveAttribute('aria-checked', 'true');
  });
});

/**
 * Counts WebGL draw calls per canvas (in a `data-draws` attribute) so tests
 * can assert that a particular view is, or is not, rendering.
 */
async function instrumentDraws(page: Page) {
  await page.addInitScript(() => {
    const proto = WebGL2RenderingContext.prototype;
    const count = (gl: WebGL2RenderingContext) => {
      const canvas = gl.canvas;
      if (canvas instanceof HTMLCanvasElement) {
        canvas.dataset['draws'] = String(Number(canvas.dataset['draws'] ?? '0') + 1);
      }
    };
    // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with apply
    const drawElements = proto.drawElements;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with apply
    const drawArrays = proto.drawArrays;
    proto.drawElements = function (this: WebGL2RenderingContext, ...args) {
      count(this);
      drawElements.apply(this, args);
    };
    proto.drawArrays = function (this: WebGL2RenderingContext, ...args) {
      count(this);
      drawArrays.apply(this, args);
    };
  });
}

/** Draw calls the view's canvas issues during `ms`, after pending frames settle. */
async function drawsDuring(view: Locator, ms = 600) {
  const canvas = view.locator('canvas');
  const read = async () => Number((await canvas.getAttribute('data-draws')) ?? '0');
  await view.page().waitForTimeout(400);
  const before = await read();
  await view.page().waitForTimeout(ms);
  return (await read()) - before;
}

const HERO = /Interactive 3D preview of the Explorer/;

test.describe('3D motion and render budget', () => {
  test.beforeEach(async ({ page }) => {
    await instrumentDraws(page);
  });

  test('the hero animates with full motion and its pause button stops it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const hero = page.getByRole('img', { name: HERO });
    await expect(hero.locator('canvas')).toBeVisible();
    await expect(hero).toHaveAttribute('data-frameloop', 'always');
    expect(await drawsDuring(hero)).toBeGreaterThan(0);

    // Simulate a slow device (CI renders at ~10 fps): pausing must stop
    // drawing regardless of frame rate.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 8 });

    await page.getByRole('button', { name: 'Pause animation' }).first().click();
    await expect(hero).toHaveAttribute('data-frameloop', 'demand');
    expect(await drawsDuring(hero)).toBe(0);
    await expect(page.getByRole('button', { name: 'Play animation' }).first()).toBeVisible();
  });

  test('OS reduced motion stops the hero character', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const hero = page.getByRole('img', { name: HERO });
    await expect(hero.locator('canvas')).toBeVisible();
    await expect(hero).toHaveAttribute('data-frameloop', 'demand');
    expect(await drawsDuring(hero)).toBe(0);
    // Nothing moves, so there is nothing to pause.
    await expect(page.getByRole('button', { name: 'Pause animation' })).toHaveCount(0);

    // A live OS change resumes motion on the mounted view.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(hero).toHaveAttribute('data-frameloop', 'always');
  });

  test('the Reduced setting stops 3D motion even when the OS allows it', async ({
    page,
    isMobile,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/settings');
    await page.getByRole('radio', { name: 'Reduced' }).click();
    await page.goto('/');
    const hero = page.getByRole('img', { name: HERO });
    await expect(hero.locator('canvas')).toBeVisible();
    await expect(hero).toHaveAttribute('data-frameloop', 'demand');
    expect(await drawsDuring(hero)).toBe(0);

    await page.goto('/editor');
    if (isMobile) await page.getByRole('radio', { name: '3D preview' }).click();
    await expect(page.getByRole('radio', { name: 'Off' })).toHaveAttribute('aria-checked', 'true');
  });

  test('offscreen homepage viewers stop drawing and resume on return', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await page.locator('#characters').scrollIntoViewIfNeeded();
    const sample = page.getByRole('img', { name: /3D preview of Knight/ });
    await expect(sample.locator('canvas')).toBeVisible();

    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    const hero = page.getByRole('img', { name: HERO });
    await expect(sample).toHaveAttribute('data-frameloop', 'never');
    await expect(hero).toHaveAttribute('data-frameloop', 'never');
    expect(await drawsDuring(sample)).toBe(0);
    expect(await drawsDuring(hero)).toBe(0);

    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await expect(page.getByRole('img', { name: HERO })).toHaveAttribute('data-frameloop', 'always');
    expect(await drawsDuring(hero)).toBeGreaterThan(0);
  });

  test('a hidden Studio preview tab stops drawing', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Panels are tabs only on narrow screens.');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/editor');
    await page.getByRole('radio', { name: '3D preview' }).click();
    const preview = page.getByRole('img', { name: '3D preview of your skin' });
    await expect(preview.locator('canvas')).toBeVisible();
    expect(await drawsDuring(preview)).toBeGreaterThan(0);

    await page.getByRole('radio', { name: '2D texture' }).click();
    const hidden = page.getByRole('img', { name: '3D preview of your skin', includeHidden: true });
    await expect(hidden).toHaveAttribute('data-frameloop', 'never');
    expect(await drawsDuring(hidden)).toBe(0);
  });
});

test.describe('studio without WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with apply/call
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type.includes('webgl')) return null;
        return (getContext as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof getContext;
    });
  });

  test('the flat fallback follows layer and body-part settings', async ({ page, isMobile }) => {
    await page.goto('/editor?sample=knight');
    const flat = page.getByRole('img', {
      name: 'Flat front view of your skin',
      includeHidden: true,
    });
    await expect(flat).toBeAttached();
    const alpha = () =>
      flat.evaluate((canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return -1;
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let sum = 0;
        for (let i = 3; i < data.length; i += 4) sum += data[i] ?? 0;
        return sum;
      });
    const full = await alpha();
    expect(full).toBeGreaterThan(0);

    // Camera and animation do not apply to a flat view.
    await expect(page.getByRole('button', { name: 'Back', exact: true })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'Walk' })).toHaveCount(0);

    if (isMobile) await page.getByRole('radio', { name: 'Tools', exact: true }).click();
    await page.getByRole('button', { name: 'Head', exact: true }).click();
    await expect.poll(alpha).toBeLessThan(full);
    await page.getByRole('button', { name: 'Full skin' }).click();
    await page.getByRole('switch', { name: 'Outer layer' }).click();
    await page.getByRole('switch', { name: 'Inner layer' }).click();
    await expect.poll(alpha).toBe(0);
  });
});

test.describe('studio interactions', () => {
  test('Ctrl + wheel zooms the texture and is cancelled; plain wheel is not', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'Wheel gestures are desktop input.');
    await page.goto('/editor');
    const texture = page.getByRole('img', { name: /64×64 skin texture/ });
    await expect(texture).toBeVisible();
    await page.evaluate(() => {
      const state = globalThis as unknown as { __prevented: boolean[] };
      state.__prevented = [];
      window.addEventListener('wheel', (e) => state.__prevented.push(e.defaultPrevented));
    });
    const zoom = page.getByRole('region', { name: '2D texture' }).locator('output');
    const before = await zoom.textContent();

    await texture.hover();
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Control');
    await expect(zoom).not.toHaveText(before ?? '');

    const afterZoom = await zoom.textContent();
    await page.mouse.wheel(0, 100);
    await expect
      .poll(() =>
        page.evaluate(() => (globalThis as unknown as { __prevented: boolean[] }).__prevented),
      )
      .toEqual([true, false]);
    await expect(zoom).toHaveText(afterZoom ?? '');
  });

  test('a refused full-screen request shows a message, not an error', async ({
    page,
    isMobile,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => true });
      Element.prototype.requestFullscreen = () =>
        Promise.reject(new DOMException('Denied by test', 'NotAllowedError'));
    });
    await page.goto('/editor');
    if (isMobile) await page.getByRole('radio', { name: '3D preview' }).click();
    await page.getByRole('button', { name: 'Full screen' }).click();
    await expect(
      page.getByText("Full screen isn't available right now.", { exact: false }),
    ).toBeVisible();
    await expect(page.getByRole('img', { name: '3D preview of your skin' })).toBeVisible();
  });
});
