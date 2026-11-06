/** Camera presets around a player whose center is at y = 16 (pure data). */
export const CAMERA_VIEWS = ['front', 'back', 'left', 'right', 'top', 'reset'] as const;
export type CameraView = (typeof CAMERA_VIEWS)[number];

export const PLAYER_CENTER: readonly [number, number, number] = [0, 16, 0];
const DISTANCE = 68;

/**
 * Camera position per preset. The player faces +z; their left side is +x.
 * `left` shows the player's left side, `right` their right side.
 */
export function cameraPosition(view: CameraView): readonly [number, number, number] {
  const [, cy] = PLAYER_CENTER;
  switch (view) {
    case 'front':
      return [0, cy, DISTANCE];
    case 'back':
      return [0, cy, -DISTANCE];
    case 'left':
      return [DISTANCE, cy, 0];
    case 'right':
      return [-DISTANCE, cy, 0];
    case 'top':
      // Slightly in front so "up" stays well defined for the orbit controls.
      return [0, cy + DISTANCE, 0.01];
    case 'reset':
      return [36, cy + 8, 57];
  }
}
