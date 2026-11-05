import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '@/i18n';
import { NAV_ITEMS } from './navigation';
import { createRoutes } from './routes';
import { resolveMotion, resolveTheme } from './theme';

function renderAt(path: string, language: 'en' | 'it' = 'en') {
  const router = createMemoryRouter(createRoutes(), { initialEntries: [path] });
  render(
    <I18nProvider language={language}>
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  return router;
}

describe('routing', () => {
  it('renders the home page headline', async () => {
    renderAt('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Create Your Own Minecraft Identity.' }),
    ).toBeTruthy();
  });

  it('renders the settings page', async () => {
    renderAt('/settings');
    expect(await screen.findByRole('heading', { level: 1, name: 'Settings' })).toBeTruthy();
  });

  it('renders a 404 page for unknown routes', async () => {
    renderAt('/does-not-exist');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeTruthy();
  });

  it('translates the UI', async () => {
    renderAt('/settings', 'it');
    expect(await screen.findByRole('heading', { level: 1, name: 'Impostazioni' })).toBeTruthy();
  });

  it('has a route for every navigation item', () => {
    const children = createRoutes()[0]?.children ?? [];
    const paths = children.map((r) => (r.index === true ? '/' : `/${r.path ?? ''}`));
    for (const item of NAV_ITEMS) expect(paths).toContain(item.to);
  });
});

describe('theme resolution', () => {
  it('follows the system only when set to system', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveMotion('system', true)).toBe('reduced');
    expect(resolveMotion('full', true)).toBe('full');
  });
});
