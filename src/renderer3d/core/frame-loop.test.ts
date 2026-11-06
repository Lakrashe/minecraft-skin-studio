import { describe, expect, it } from 'vitest';
import { viewerFrameLoop } from './frame-loop';

const base = { active: true, autoRotate: false, animation: 'none', paused: false } as const;

describe('viewerFrameLoop', () => {
  it('draws nothing while the view is inactive (offscreen or hidden)', () => {
    expect(viewerFrameLoop({ ...base, active: false, autoRotate: true, animation: 'walk' })).toBe(
      'never',
    );
  });

  it('renders continuously only while something moves', () => {
    expect(viewerFrameLoop({ ...base, autoRotate: true })).toBe('always');
    expect(viewerFrameLoop({ ...base, animation: 'idle' })).toBe('always');
  });

  it('renders on demand when still: no animation, or paused without rotation', () => {
    expect(viewerFrameLoop(base)).toBe('demand');
    expect(viewerFrameLoop({ ...base, animation: 'walk', paused: true })).toBe('demand');
  });
});
