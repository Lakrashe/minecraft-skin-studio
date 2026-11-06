import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Profiler } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sampleSkin } from '@/content';
import { editMask, getPixel } from '@/engine';
import { I18nProvider } from '@/i18n';
import { usePalettes } from '@/state';
import { resetStudioDocument, studioDocument } from './document';
import { loadSource, redo, setModel, undo } from './editing';
import { beginStroke, endStroke, moveStroke, setGesture } from './stroke-controller';
import { StudioPage } from './StudioPage';
import { editableLayers, effectiveAnimation, INITIAL_COLOR, useStudio } from './studio-store';
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

function renderStudioWithUnmount() {
  const router = createMemoryRouter([{ path: '/editor', Component: StudioPage }], {
    initialEntries: ['/editor'],
  });
  return render(
    <I18nProvider language="en">
      <RouterProvider router={router} />
    </I18nProvider>,
  );
}

const texture = () => screen.getByRole('img', { name: /64×64 skin texture/ });

/** Moves the keyboard cursor from (0,0) to (x, y) and presses Enter. */
function clickTexel(x: number, y: number) {
  const canvas = texture();
  fireEvent.keyDown(canvas, { key: 'Escape' }); // clear the cursor
  fireEvent.keyDown(canvas, { key: 'ArrowLeft' }); // cursor now at (0,0)
  for (let i = 0; i < x; i++) fireEvent.keyDown(canvas, { key: 'ArrowRight' });
  for (let i = 0; i < y; i++) fireEvent.keyDown(canvas, { key: 'ArrowDown' });
  fireEvent.keyDown(canvas, { key: 'Enter' });
}

const pixel = (x: number, y: number) => getPixel(studioDocument.document.pixels, x, y);

beforeEach(() => {
  act(() => {
    useStudio.setState(useStudio.getInitialState());
    usePalettes.setState({ palettes: [] });
    resetStudioDocument();
  });
});

describe('studio store', () => {
  it('re-requesting the same camera view increments the request counter', () => {
    useStudio.getState().showView('front');
    useStudio.getState().showView('front');
    expect(useStudio.getState().viewRequest).toBe(2);
  });

  it('pointer moves within one texel do not notify subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = useStudio.subscribe(listener);
    useStudio.getState().setInspected({ x: 3, y: 4 });
    useStudio.getState().setInspected({ x: 3, y: 4 });
    expect(listener).toHaveBeenCalledTimes(1);
    useStudio.getState().setInspected({ x: 4, y: 4 });
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it('defaults the animation to off under reduced motion; an explicit choice wins', () => {
    expect(effectiveAnimation(null, false)).toBe('idle');
    expect(effectiveAnimation(null, true)).toBe('none');
    expect(effectiveAnimation('walk', true)).toBe('walk');
  });

  it('hidden skin layers are never editable', () => {
    expect(editableLayers('both', true, true)).toEqual(['inner', 'outer']);
    expect(editableLayers('both', true, false)).toEqual(['inner']);
    expect(editableLayers('outer', true, true)).toEqual(['outer']);
    expect(editableLayers('outer', true, false)).toEqual([]);
  });

  it('a manual zoom stops auto-fit; fit turns it back on', () => {
    useStudio.getState().zoomTo(100);
    expect(useStudio.getState()).toMatchObject({ zoom: 24, autoFit: false });
    useStudio.getState().requestFit();
    expect(useStudio.getState()).toMatchObject({ autoFit: true, fitRequest: 1 });
  });
});

describe('document actions', () => {
  it('loading a starting skin is undoable', () => {
    const before = new Uint8ClampedArray(studioDocument.document.pixels.data);
    loadSource('mage');
    expect(studioDocument.document.model).toBe('slim');
    expect(studioDocument.document.pixels.data).toEqual(sampleSkin('mage').data);
    loadSource('blank');
    expect(studioDocument.document.pixels.data.every((v) => v === 0)).toBe(true);
    studioDocument.undo();
    studioDocument.undo();
    expect(studioDocument.document.pixels.data).toEqual(before);
  });

  it('switching the model is undoable and keeps the pixels', () => {
    const before = new Uint8ClampedArray(studioDocument.document.pixels.data);
    setModel('slim');
    expect(studioDocument.document.model).toBe('slim');
    expect(studioDocument.document.pixels.data).toEqual(before);
    studioDocument.undo();
    expect(studioDocument.document.model).toBe('classic');
  });

  it('editing never modifies the shipped sample skin', () => {
    const original = new Uint8ClampedArray(sampleSkin('explorer').data);
    renderStudio();
    clickTexel(8, 8);
    expect(sampleSkin('explorer').data).toEqual(original);
  });
});

describe('StudioPage', () => {
  it('pencil writes the current color into the texture; undo and redo restore it', () => {
    renderStudio();
    const before = pixel(8, 8);
    clickTexel(8, 8);
    expect(pixel(8, 8)).toEqual(INITIAL_COLOR);
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(pixel(8, 8)).toEqual(before);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });
    expect(pixel(8, 8)).toEqual(INITIAL_COLOR);
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(pixel(8, 8)).toEqual(before);
  });

  it('eraser, eyedropper and tool shortcuts', () => {
    renderStudio();
    fireEvent.keyDown(window, { key: 'e' });
    expect(useStudio.getState().tool).toBe('eraser');
    clickTexel(8, 8);
    expect(pixel(8, 8)?.a).toBe(0);

    // jsdom ignores CSS, so the small-screen tool strip is present too: use the first.
    fireEvent.click(screen.getAllByRole('button', { name: 'Eyedropper' })[0] as HTMLElement);
    const sampled = getPixel(sampleSkin('explorer'), 20, 20);
    clickTexel(20, 20);
    expect(useStudio.getState().color).toEqual(sampled);
  });

  it('mirror drawing paints both sides', () => {
    renderStudio();
    fireEvent.click(screen.getByRole('switch', { name: 'Mirror drawing' }));
    clickTexel(44, 20); // right arm front
    expect(pixel(44, 20)).toEqual(INITIAL_COLOR);
    expect(pixel(39, 52)).toEqual(INITIAL_COLOR); // left arm front
  });

  it('body part selection restricts painting', () => {
    renderStudio();
    const panel = screen.getByRole('complementary', { name: 'Tools' });
    fireEvent.click(within(panel).getByRole('button', { name: 'Head' }));
    const body = pixel(20, 20);
    clickTexel(20, 20); // body front
    expect(pixel(20, 20)).toEqual(body);
    clickTexel(8, 8); // head front
    expect(pixel(8, 8)).toEqual(INITIAL_COLOR);
  });

  it('“Paint on: Outer” leaves the inner layer untouched', () => {
    renderStudio();
    fireEvent.click(screen.getByRole('radio', { name: 'Outer' }));
    const face = pixel(8, 8);
    clickTexel(8, 8); // inner head
    expect(pixel(8, 8)).toEqual(face);
    clickTexel(40, 8); // hat
    expect(pixel(40, 8)).toEqual(INITIAL_COLOR);
  });

  it('HEX input sets the color and rejects invalid values', () => {
    renderStudio();
    const field = screen.getByLabelText('HEX');
    fireEvent.change(field, { target: { value: '#ff000080' } });
    expect(useStudio.getState().color).toEqual({ r: 255, g: 0, b: 0, a: 128 });
    fireEvent.change(field, { target: { value: 'nope' } });
    fireEvent.blur(field);
    expect(screen.getByText('Enter a color like #3fa34d or #3fa34d80.')).toBeTruthy();
    expect(useStudio.getState().color).toEqual({ r: 255, g: 0, b: 0, a: 128 });
  });

  it('built-in palette swatches set the color', () => {
    renderStudio();
    fireEvent.click(screen.getByRole('button', { name: 'Use #b3312c' }));
    expect(useStudio.getState().color).toEqual({ r: 0xb3, g: 0x31, b: 0x2c, a: 255 });
  });

  it('creates a custom palette, adds and removes colors', () => {
    renderStudio();
    fireEvent.click(screen.getByRole('button', { name: 'New palette' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Armor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const [palette] = usePalettes.getState().palettes;
    expect(palette).toMatchObject({ name: 'Armor', colors: ['#3fa34d'] });

    // The new palette is selected and holds the color that was current.
    expect(screen.getByRole('button', { name: 'Use #3fa34d' })).toBeTruthy();
    act(() => {
      useStudio.getState().setColor({ r: 1, g: 2, b: 3, a: 255 });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add current color' }));
    expect(usePalettes.getState().palettes[0]?.colors).toEqual(['#3fa34d', '#010203']);

    fireEvent.click(screen.getByRole('button', { name: 'Remove colors' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove #3fa34d' }));
    expect(usePalettes.getState().palettes[0]?.colors).toEqual(['#010203']);
  });

  it('loads ?sample= once and clears it from the URL', () => {
    const router = renderStudio('/editor?sample=runner');
    expect(screen.getByLabelText<HTMLSelectElement>('Start from').value).toBe('runner');
    expect(studioDocument.document.model).toBe('slim');
    expect(router.state.location.search).toBe('');
  });

  it('the model switch shows Steve and Alex layouts', () => {
    renderStudio();
    fireEvent.click(screen.getByRole('radio', { name: 'Alex (slim)' }));
    expect(studioDocument.document.model).toBe('slim');
  });

  it('pixel inspection does not re-render the tools panel', () => {
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
      useStudio.getState().setZoom(12);
    });
    expect(renders).toBe(before);
  });

  it('without WebGL, the flat fallback replaces the camera and animation controls', async () => {
    renderStudio();
    expect(await screen.findByRole('img', { name: 'Flat front view of your skin' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('inspects pixels with the keyboard and reports the region', () => {
    renderStudio();
    fireEvent.keyDown(texture(), { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyDown(texture(), { key: 'ArrowDown', shiftKey: true });
    const status = screen.getAllByRole('status').find((el) => el.textContent.includes('Pixel'));
    expect(status?.textContent).toContain('Pixel 8, 8');
    expect(status?.textContent).toContain('Head · Front · Inner');
  });
});

describe('stroke lifecycle (audit)', () => {
  const opts = (color = INITIAL_COLOR) => ({
    color,
    mask: editMask('classic', 'all', ['inner', 'outer']),
    model: 'classic' as const,
    mirror: false,
  });
  const BLUE = { r: 0, g: 0, b: 255, a: 255 };

  it('undo while the pointer is still down cancels the stroke; history stays exact (P1)', () => {
    act(() => {
      loadSource('blank');
      beginStroke('pencil', opts(), { x: 8, y: 8 });
      endStroke();
      beginStroke('pencil', opts(BLUE), { x: 9, y: 8 });
      moveStroke({ x: 8, y: 8 });
      undo(); // the red pixel goes; the blue stroke is cancelled
      moveStroke({ x: 7, y: 8 });
      endStroke(); // pointer released: nothing to commit
    });
    expect(pixel(8, 8)?.a).toBe(0);
    expect(pixel(9, 8)?.a).toBe(0);
    expect(studioDocument.getSnapshot().texture).toBe(studioDocument.document.pixels);
    act(() => {
      redo();
    });
    expect(pixel(8, 8)).toEqual(INITIAL_COLOR);
  });

  it('loading a skin or switching the model mid-stroke cancels the stroke', () => {
    act(() => {
      beginStroke('pencil', opts(BLUE), { x: 8, y: 8 });
      setModel('slim');
      endStroke();
    });
    expect(pixel(8, 8)).not.toEqual(BLUE);
    act(() => {
      beginStroke('pencil', opts(BLUE), { x: 8, y: 8 });
      loadSource('knight');
      endStroke();
    });
    expect(pixel(8, 8)).toEqual(getPixel(sampleSkin('knight'), 8, 8));
  });

  it('leaving the Studio mid-stroke leaves no preview behind (P2)', () => {
    const { unmount } = renderStudioWithUnmount();
    act(() => {
      beginStroke('pencil', opts(BLUE), { x: 10, y: 10 });
    });
    expect(studioDocument.getSnapshot().texture).not.toBe(studioDocument.document.pixels);
    unmount();
    expect(studioDocument.getSnapshot().texture).toBe(studioDocument.document.pixels);
    expect(studioDocument.getSnapshot().canUndo).toBe(false);
  });

  it('a multi-touch gesture cancels drawing until every finger lifts (P2)', () => {
    act(() => {
      beginStroke('pencil', opts(BLUE), { x: 8, y: 8 });
      setGesture(true);
      endStroke();
      beginStroke('pencil', opts(BLUE), { x: 9, y: 8 }); // ignored during the gesture
      endStroke();
      setGesture(false);
    });
    expect(studioDocument.getSnapshot().canUndo).toBe(false);
    act(() => {
      beginStroke('pencil', opts(BLUE), { x: 9, y: 8 });
      endStroke();
    });
    expect(pixel(9, 8)).toEqual(BLUE);
  });
});

describe('HEX field (audit P2)', () => {
  it('typing #123456 one key at a time gives exactly #123456', () => {
    renderStudio();
    const field = screen.getByLabelText<HTMLInputElement>('HEX');
    fireEvent.focus(field);
    for (const value of ['', '#', '#1', '#12', '#123', '#1234', '#12345', '#123456']) {
      fireEvent.change(field, { target: { value } });
      expect(field.value).toBe(value);
    }
    expect(useStudio.getState().color).toEqual({ r: 0x12, g: 0x34, b: 0x56, a: 255 });
    fireEvent.blur(field);
    expect(field.value).toBe('#123456');
  });

  it('normalizes shorthand on Enter and follows outside changes when not editing', () => {
    renderStudio();
    const field = screen.getByLabelText<HTMLInputElement>('HEX');
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'F80' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(field.value).toBe('#ff8800');
    fireEvent.blur(field);
    act(() => {
      useStudio.getState().setColor({ r: 1, g: 2, b: 3, a: 128 });
    });
    expect(field.value).toBe('#01020380');
  });
});

describe('mirror and body part (audit P2)', () => {
  it('with only the right arm selected, mirror drawing leaves the left arm alone', () => {
    renderStudio();
    const panel = screen.getByRole('complementary', { name: 'Tools' });
    fireEvent.click(within(panel).getByRole('button', { name: 'Right arm' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Mirror drawing' }));
    const left = pixel(39, 52);
    clickTexel(44, 20);
    expect(pixel(44, 20)).toEqual(INITIAL_COLOR);
    expect(pixel(39, 52)).toEqual(left);
  });
});
