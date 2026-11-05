import { describe, expect, it, vi } from 'vitest';
import * as renderer3d from './index';
import { detectWebGL2 } from './webgl';

type Ctx = 'webgl2' | 'webgl';

function canvasWith(available: readonly Ctx[], loseContext = vi.fn()) {
  const getContext = vi.fn((id: Ctx) =>
    available.includes(id)
      ? ({ getExtension: () => ({ loseContext }) } as unknown as WebGL2RenderingContext)
      : null,
  );
  return { canvas: { getContext }, getContext, loseContext };
}

describe('detectWebGL2', () => {
  it('is false without any WebGL', () => {
    const { canvas } = canvasWith([]);
    expect(detectWebGL2(() => canvas)).toBe(false);
  });

  it('is false for WebGL1-only devices (Three.js requires WebGL2)', () => {
    const { canvas, getContext } = canvasWith(['webgl']);
    expect(detectWebGL2(() => canvas)).toBe(false);
    expect(getContext).not.toHaveBeenCalledWith('webgl');
  });

  it('is true with WebGL2 and releases the probe context', () => {
    const { canvas, loseContext } = canvasWith(['webgl2', 'webgl']);
    expect(detectWebGL2(() => canvas)).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
  });

  it('is false when context creation throws', () => {
    expect(
      detectWebGL2(() => ({
        getContext: () => {
          throw new Error('blocked');
        },
      })),
    ).toBe(false);
  });
});

describe('renderer3d public API', () => {
  it('exposes a lazy canvas without loading three.js eagerly', () => {
    expect(String((renderer3d.LazySceneCanvas as { $$typeof?: symbol }).$$typeof)).toBe(
      'Symbol(react.lazy)',
    );
  });
});
