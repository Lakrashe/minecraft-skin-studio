/** Core skin vocabulary. See docs/MINECRAFT_SKIN_FORMAT.md. */

/** `classic` = 4 px arms (Steve), `slim` = 3 px arms (Alex). */
export type SkinModel = 'classic' | 'slim';
export const SKIN_MODELS: readonly SkinModel[] = ['classic', 'slim'];

/** Minecraft's two skin layers: inner (base) and outer (hat, jacket, sleeves, pants). */
export type SkinLayer = 'inner' | 'outer';
export const SKIN_LAYERS: readonly SkinLayer[] = ['inner', 'outer'];

/** "Right"/"left" limbs are the player's own right/left. */
export type BodyPart = 'head' | 'body' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg';
export const BODY_PARTS: readonly BodyPart[] = [
  'head',
  'body',
  'rightArm',
  'leftArm',
  'rightLeg',
  'leftLeg',
];

/** Cuboid faces as named in the UV net (format doc §3). */
export type Face = 'top' | 'bottom' | 'right' | 'front' | 'left' | 'back';
export const FACES: readonly Face[] = ['top', 'bottom', 'right', 'front', 'left', 'back'];

/** Axis-aligned rectangle in texture pixels, origin top-left. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Straight-alpha RGBA, each channel an integer 0–255. */
export interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export const SKIN_WIDTH = 64;
export const SKIN_HEIGHT = 64;
