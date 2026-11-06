import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const webgl = vi.hoisted(() => ({ available: true }));
const fiber = vi.hoisted(() => ({ fail: false }));

vi.mock('./webgl', () => ({ isWebGLAvailable: () => webgl.available }));
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: unknown }) => {
    if (fiber.fail) throw new Error('Error creating WebGL context.');
    return <div data-testid="r3f-canvas">{children as never}</div>;
  },
}));

const { default: SceneCanvas } = await import('./SceneCanvas');

const fallback = <p>3D unavailable</p>;

describe('SceneCanvas', () => {
  beforeEach(() => {
    webgl.available = true;
    fiber.fail = false;
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders the canvas when WebGL2 is available', () => {
    render(
      <SceneCanvas label="Preview" fallback={fallback}>
        {null}
      </SceneCanvas>,
    );
    expect(screen.getByTestId('r3f-canvas')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Preview' })).toBeTruthy();
  });

  it('renders the fallback when WebGL2 is unavailable', () => {
    webgl.available = false;
    render(
      <SceneCanvas label="Preview" fallback={fallback}>
        {null}
      </SceneCanvas>,
    );
    expect(screen.getByText('3D unavailable')).toBeTruthy();
    expect(screen.queryByTestId('r3f-canvas')).toBeNull();
  });

  it('renders the fallback when the renderer fails to initialize', () => {
    fiber.fail = true;
    render(
      <SceneCanvas label="Preview" fallback={fallback}>
        {null}
      </SceneCanvas>,
    );
    expect(screen.getByText('3D unavailable')).toBeTruthy();
  });
});

describe('SceneCanvas overlay', () => {
  beforeEach(() => {
    webgl.available = true;
    fiber.fail = false;
  });

  it('shows overlay controls with the 3D view but never with the fallback', () => {
    const overlay = <button type="button">Pause animation</button>;
    const { unmount } = render(
      <SceneCanvas label="Preview" fallback={fallback} overlay={overlay}>
        {null}
      </SceneCanvas>,
    );
    expect(screen.getByRole('button', { name: 'Pause animation' })).toBeTruthy();
    unmount();

    webgl.available = false;
    render(
      <SceneCanvas label="Preview" fallback={fallback} overlay={overlay}>
        {null}
      </SceneCanvas>,
    );
    expect(screen.queryByRole('button', { name: 'Pause animation' })).toBeNull();
  });
});
