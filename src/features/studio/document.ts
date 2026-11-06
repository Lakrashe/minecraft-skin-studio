import { useSyncExternalStore } from 'react';
import { getSample, sampleSkin, type SampleId } from '@/content';
import {
  createDocument,
  DocumentStore,
  type SkinDocument,
  type SkinModel,
  type StoreSnapshot,
} from '@/engine';
import type { SkinSource } from '@/renderer3d';

export const INITIAL_SAMPLE: SampleId = 'explorer';

/** A new document from a sample character (its own copy of the pixels). */
export function sampleDocument(id: SampleId): SkinDocument {
  return createDocument(sampleSkin(id), getSample(id).model);
}

/**
 * The skin being edited. One store per browser tab: it survives navigating
 * away from the Studio and back, but not a page reload (saving projects is a
 * later milestone).
 */
export const studioDocument = new DocumentStore(sampleDocument(INITIAL_SAMPLE));

export function useStudioDocument(): StoreSnapshot {
  return useSyncExternalStore(
    studioDocument.subscribe,
    studioDocument.getSnapshot,
    studioDocument.getSnapshot,
  );
}

/**
 * Subscribes to one value of the document snapshot. The component re-renders
 * only when that value changes (compare with `Object.is`), not on every edit —
 * so return primitives or stable objects.
 */
export function useStudioSelector<T>(select: (snapshot: StoreSnapshot) => T): T {
  const get = () => select(studioDocument.getSnapshot());
  return useSyncExternalStore(studioDocument.subscribe, get, get);
}

export function useStudioModel(): SkinModel {
  return useStudioSelector((s) => s.document.model);
}

/**
 * The edited texture (document + live stroke preview) as a live source for
 * the 3D view: edits reach its texture directly, without React re-renders.
 */
export const studioSkinSource: SkinSource = {
  getSkin: () => studioDocument.getSnapshot().texture,
  subscribe: (onChange) => studioDocument.subscribe(onChange),
};

/** For tests: back to the initial sample with an empty history. */
export function resetStudioDocument(): void {
  studioDocument.load(sampleDocument(INITIAL_SAMPLE));
}
