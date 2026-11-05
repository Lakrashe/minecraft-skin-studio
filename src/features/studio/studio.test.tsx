import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '@/i18n';
import { StudioPage } from './StudioPage';
import { useStudio } from './studio-store';

function renderStudio(url = '/editor') {
  const router = createMemoryRouter([{ path: '/editor', Component: StudioPage }], {
    initialEntries: [url],
  });
  render(
    <I18nProvider language="en">
      <RouterProvider router={router} />
    </I18nProvider>,
  );
  return router;
}

beforeEach(() => {
  act(() => {
    useStudio.setState(useStudio.getInitialState());
  });
});

describe('studio store', () => {
  it('switching character also switches to its designed model', () => {
    useStudio.getState().selectSample('mage');
    expect(useStudio.getState().model).toBe('slim');
    useStudio.getState().selectSample('knight');
    expect(useStudio.getState().model).toBe('classic');
  });

  it('re-requesting the same camera view increments the request counter', () => {
    useStudio.getState().showView('front');
    useStudio.getState().showView('front');
    expect(useStudio.getState().viewRequest).toBe(2);
  });

  it('changing animation resumes playback', () => {
    useStudio.getState().togglePaused();
    useStudio.getState().setAnimation('walk');
    expect(useStudio.getState()).toMatchObject({ animation: 'walk', paused: false });
  });
});

describe('StudioPage', () => {
  it('shows the honest viewer notice and no editing controls', () => {
    renderStudio();
    expect(screen.getByText(/Editing isn't available yet/)).toBeTruthy();
    for (const name of [/undo/i, /redo/i, /export/i, /import/i, /save/i, /pencil/i]) {
      expect(screen.queryByRole('button', { name })).toBeNull();
    }
  });

  it('selects the character from ?sample=', () => {
    renderStudio('/editor?sample=runner');
    expect(screen.getByLabelText<HTMLSelectElement>('Character').value).toBe('runner');
    expect(useStudio.getState().model).toBe('slim');
  });

  it('focuses a body part', () => {
    renderStudio();
    const panel = screen.getByRole('complementary', { name: 'View' });
    const head = within(panel).getByRole('button', { name: 'Head' });
    fireEvent.click(head);
    expect(head.getAttribute('aria-pressed')).toBe('true');
    expect(useStudio.getState().focus).toBe('head');
  });

  it('toggles skin layers', () => {
    renderStudio();
    fireEvent.click(screen.getByRole('switch', { name: 'Outer layer' }));
    expect(useStudio.getState().showOuter).toBe(false);
  });

  it('warns when the model differs from the skin design', () => {
    renderStudio();
    fireEvent.click(screen.getByRole('radio', { name: 'Slim' }));
    expect(screen.getByText('This skin was designed for classic arms.')).toBeTruthy();
  });

  it('inspects pixels with the keyboard and reports the region', () => {
    renderStudio();
    const texture = screen.getByRole('img', { name: /64×64 skin texture/ });
    // From (0,0) move right 8 and down 8 → head front, inner layer.
    fireEvent.keyDown(texture, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(texture, { key: 'ArrowDown', shiftKey: true });
    const status = screen.getAllByRole('status').find((el) => el.textContent.includes('Pixel'));
    expect(status?.textContent).toContain('Pixel 8, 8');
    expect(status?.textContent).toContain('Head · Front · Inner');
  });
});
