import { useSyncExternalStore } from 'react';
import { getSample, sampleSkin, type SampleId } from '@/content';
import { createDocument, DocumentStore, type SkinDocument, type StoreSnapshot } from '@/engine';

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

/** For tests: back to the initial sample with an empty history. */
export function resetStudioDocument(): void {
  studioDocument.load(sampleDocument(INITIAL_SAMPLE));
}
