import { describe, expect, it } from 'vitest';
import * as renderer3d from './index';

describe('renderer3d public API', () => {
  it('exposes a lazy canvas without loading three.js eagerly', () => {
    // React.lazy objects carry the $$typeof marker for lazy components.
    expect(String((renderer3d.LazySceneCanvas as { $$typeof?: symbol }).$$typeof)).toBe(
      'Symbol(react.lazy)',
    );
  });
});
