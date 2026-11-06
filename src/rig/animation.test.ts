import { describe, expect, it } from 'vitest';
import {
  ANIMATIONS,
  NEUTRAL_POSE,
  RIG_PARTS,
  isAnimationId,
  sampleAnimation,
  type AnimationId,
} from './animation';

describe('sampleAnimation', () => {
  it('"none" is the neutral pose at any time', () => {
    expect(sampleAnimation('none', 0)).toEqual(NEUTRAL_POSE);
    expect(sampleAnimation('none', 12.3)).toEqual(NEUTRAL_POSE);
  });

  it.each([...ANIMATIONS])(
    '"%s" is deterministic and keeps joints within natural limits',
    (id: AnimationId) => {
      for (const t of [0, 0.25, 1, 3.7, 60]) {
        const pose = sampleAnimation(id, t);
        expect(sampleAnimation(id, t)).toEqual(pose);
        for (const part of RIG_PARTS) {
          const { x, y, z } = pose[part];
          for (const angle of [x, y, z]) {
            expect(Math.abs(angle)).toBeLessThanOrEqual(Math.PI / 4);
          }
        }
      }
    },
  );

  it('walk swings opposite arm and leg together', () => {
    const pose = sampleAnimation('walk', 0.3);
    expect(Math.sign(pose.rightArm.x)).toBe(-Math.sign(pose.rightLeg.x));
    expect(Math.sign(pose.rightArm.x)).toBe(-Math.sign(pose.leftArm.x));
  });

  it('validates animation ids', () => {
    expect(isAnimationId('walk')).toBe(true);
    expect(isAnimationId('dance')).toBe(false);
  });
});
