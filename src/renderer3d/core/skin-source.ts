/**
 * Live skin input for the 3D view (ARCHITECTURE §6).
 *
 * The editor's document store changes on every stroke. Passing each new
 * texture down as a React prop would re-render the whole 3D component tree per
 * pixel. Instead the rig subscribes to a `SkinSource` and copies changes into
 * its texture directly; React only re-renders when the model, layers or
 * camera change.
 */
import type { PixelBuffer } from '@/engine';
import type { PlayerRig } from './player-rig';

export interface SkinSource {
  /** The current 64×64 texture. Return the same object while nothing changed. */
  getSkin(): PixelBuffer;
  /** Calls `onChange` after every change; returns the unsubscribe function. */
  subscribe(onChange: () => void): () => void;
}

/** A source for a skin that never changes (e.g. a sample character). */
export function staticSkinSource(skin: PixelBuffer): SkinSource {
  return {
    getSkin: () => skin,
    subscribe: () => () => undefined,
  };
}

export function isSkinSource(value: PixelBuffer | SkinSource): value is SkinSource {
  return 'getSkin' in value && 'subscribe' in value;
}

/**
 * Keeps `rig`'s texture equal to `source`: copies the skin now and after every
 * change, calling `onUpdated` when pixels actually changed (e.g. to request a
 * frame). Returns the function that disconnects it.
 */
export function connectSkinSource(
  rig: PlayerRig,
  source: SkinSource,
  onUpdated?: () => void,
): () => void {
  let current: PixelBuffer | null = null;
  const sync = () => {
    const skin = source.getSkin();
    if (skin === current) return;
    current = skin;
    if (rig.setSkin(skin)) onUpdated?.();
  };
  sync();
  return source.subscribe(sync);
}
