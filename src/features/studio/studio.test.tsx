import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Profiler } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n';
import { StudioPage } from './StudioPage';
import { effectiveAnimation, useStudio } from './studio-store';
import { ViewPanel } from './ViewPanel';

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

  it('pointer moves within one texel do not notify subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = useStudio.subscribe(listener);
    useStudio.getState().setInspected({ x: 3, y: 4 });
    useStudio.getState().setInspected({ x: 3, y: 4 });
    useStudio.getState().setInspected({ x: 3, y: 4 });
    expect(listener).toHaveBeenCalledTimes(1);
    useStudio.getState().setInspected({ x: 4, y: 4 });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(useStudio.getState().inspected).toEqual({ x: 4, y: 4 });
    useStudio.getState().setInspected(null);
    useStudio.getState().setInspected(null);
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });

  it('defaults the animation to off under reduced motion; an explicit choice wins', () => {
    expect(useStudio.getState().animation).toBeNull();
    expect(effectiveAnimation(null, false)).toBe('idle');
    expect(effectiveAnimation(null, true)).toBe('none');
    expect(effectiveAnimation('walk', true)).toBe('walk');
  });
});

describe('StudioPage', () => {
  it('pixel inspection does not re-render the view panel', () => {
    let renders = 0;
    render(
      <I18nProvider language="en">
        <Profiler
          id="view"
          onRender={() => {
            renders++;
          }}
        >
          <ViewPanel />
        </Profiler>
      </I18nProvider>,
    );
    const before = renders;
    act(() => {
      useStudio.getState().setInspected({ x: 1, y: 1 });
      useStudio.getState().setInspected({ x: 2, y: 2 });
      useStudio.getState().setZoom(12);
    });
    expect(renders).toBe(before);
  });

  it('without WebGL, the flat fallback replaces the camera and animation controls', async () => {
    renderStudio('/editor?sample=knight');
    expect(await screen.findByRole('img', { name: 'Flat front view of Knight' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: 'Animation' })).toBeNull();
  });

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
