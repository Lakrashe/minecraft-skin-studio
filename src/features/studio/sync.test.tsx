/**
 * The Studio streams pixel edits to the 3D view through a live skin source:
 * editing, undo and redo must not re-render the 3D viewer component (no full
 * scene re-render), while the source always reports the current texture.
 */
import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPixel, type PixelBuffer } from '@/engine';
import { I18nProvider } from '@/i18n';
import type * as Renderer3d from '@/renderer3d';
import type { PlayerViewerProps, SkinSource } from '@/renderer3d';

const viewer = vi.hoisted(() => ({
  renders: 0,
  props: null as PlayerViewerProps | null,
}));

// Replace the WebGL viewer with a probe; everything else stays real.
vi.mock('@/renderer3d', async (importActual) => {
  const actual = await importActual<typeof Renderer3d>();
  return {
    ...actual,
    isWebGLAvailable: () => true,
    LazyPlayerViewer: (props: PlayerViewerProps) => {
      viewer.renders++;
      viewer.props = props;
      return <div role="img" aria-label={props.label} />;
    },
  };
});

const { StudioPage } = await import('./StudioPage');
const { resetStudioDocument, studioDocument } = await import('./document');
const { loadSource, redo, setModel, undo } = await import('./editing');
const { beginStroke, endStroke, moveStroke } = await import('./stroke-controller');
const { useStudio, INITIAL_COLOR } = await import('./studio-store');
const { editMask } = await import('@/engine');

function renderStudio() {
  const router = createMemoryRouter([{ path: '/editor', Component: StudioPage }], {
    initialEntries: ['/editor'],
  });
  render(
    <I18nProvider language="en">
      <RouterProvider router={router} />
    </I18nProvider>,
  );
}

function liveSource(): SkinSource {
  const skin = viewer.props?.skin;
  if (!skin || !('getSkin' in skin)) throw new Error('the 3D view did not get a live source');
  return skin;
}

const draw = (x: number, y: number) => {
  beginStroke(
    'pencil',
    {
      color: INITIAL_COLOR,
      mask: editMask(studioDocument.document.model, 'all', ['inner', 'outer']),
      model: studioDocument.document.model,
      mirror: false,
    },
    { x, y },
  );
  moveStroke({ x: x + 3, y });
  endStroke();
};

beforeEach(() => {
  act(() => {
    useStudio.setState(useStudio.getInitialState());
    resetStudioDocument();
  });
  viewer.renders = 0;
  viewer.props = null;
});

describe('2D → 3D synchronization in the Studio', () => {
  it('pixel edits, undo and redo reach the 3D view without re-rendering it', async () => {
    renderStudio();
    await screen.findByRole('img', { name: '3D preview of your skin' });
    const source = liveSource();
    const onChange = vi.fn();
    source.subscribe(onChange);
    const rendersBefore = viewer.renders;

    act(() => {
      draw(8, 8);
    });
    let skin: PixelBuffer = source.getSkin();
    expect(getPixel(skin, 8, 8)).toEqual(INITIAL_COLOR);
    expect(getPixel(skin, 11, 8)).toEqual(INITIAL_COLOR);

    act(() => {
      undo();
    });
    skin = source.getSkin();
    expect(getPixel(skin, 8, 8)).not.toEqual(INITIAL_COLOR);
    act(() => {
      redo();
    });
    expect(getPixel(source.getSkin(), 8, 8)).toEqual(INITIAL_COLOR);

    expect(onChange).toHaveBeenCalled(); // the source notified the view…
    expect(viewer.renders).toBe(rendersBefore); // …which did not re-render
  });

  it('the live stroke preview flows through the source as the pointer moves', async () => {
    renderStudio();
    await screen.findByRole('img', { name: '3D preview of your skin' });
    const source = liveSource();
    act(() => {
      beginStroke(
        'pencil',
        {
          color: INITIAL_COLOR,
          mask: editMask('classic', 'all', ['inner', 'outer']),
          model: 'classic',
          mirror: false,
        },
        { x: 9, y: 10 },
      );
    });
    expect(getPixel(source.getSkin(), 9, 10)).toEqual(INITIAL_COLOR);
    expect(getPixel(studioDocument.document.pixels, 9, 10)).not.toEqual(INITIAL_COLOR);
    act(() => {
      endStroke();
    });
    expect(getPixel(studioDocument.document.pixels, 9, 10)).toEqual(INITIAL_COLOR);
  });

  it('only model and view changes re-render the viewer', async () => {
    renderStudio();
    await screen.findByRole('img', { name: '3D preview of your skin' });
    const before = viewer.renders;
    act(() => {
      setModel('slim');
    });
    expect(viewer.renders).toBeGreaterThan(before);
    expect(viewer.props?.model).toBe('slim');

    const afterModel = viewer.renders;
    act(() => {
      useStudio.getState().setShowOuter(false);
    });
    expect(viewer.renders).toBeGreaterThan(afterModel);
    expect(viewer.props?.showOuter).toBe(false);

    // Loading another skin replaces pixels: still no re-render needed.
    const afterLayers = viewer.renders;
    act(() => {
      loadSource('blank');
    });
    expect(viewer.renders).toBe(afterLayers);
    expect(
      liveSource()
        .getSkin()
        .data.every((v) => v === 0),
    ).toBe(true);
  });
});
