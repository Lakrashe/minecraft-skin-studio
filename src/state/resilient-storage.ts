import { create } from 'zustand';
import type { StateStorage } from 'zustand/middleware';

/**
 * Whether app preferences currently reach durable browser storage.
 * `false` after storage was unavailable at startup or any later read/write
 * failed (quota exceeded, storage blocked by policy, private mode).
 */
export const usePersistenceStatus = create<{ readonly persistent: boolean }>()(() => ({
  persistent: true,
}));

function markNotPersistent(): void {
  if (usePersistenceStatus.getState().persistent) {
    usePersistenceStatus.setState({ persistent: false });
  }
}

const PROBE_KEY = '__mss_probe__';

function probe(getBacking: () => Storage | undefined): Storage | undefined {
  try {
    const storage = getBacking();
    if (!storage || typeof storage.setItem !== 'function') return undefined;
    storage.setItem(PROBE_KEY, PROBE_KEY);
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return undefined;
  }
}

/**
 * Storage adapter that never throws. Every value is mirrored in memory, so if
 * the browser storage fails at any point the app keeps working from memory and
 * `onUnavailable` reports that changes are no longer saved.
 */
export function createResilientStorage(
  getBacking: () => Storage | undefined,
  onUnavailable: () => void = markNotPersistent,
): StateStorage {
  const memory = new Map<string, string>();
  let backing = probe(getBacking);
  if (!backing) onUnavailable();

  const fail = () => {
    backing = undefined;
    onUnavailable();
  };

  return {
    getItem: (key) => {
      if (backing) {
        try {
          const value = backing.getItem(key);
          if (value !== null) memory.set(key, value);
          return value;
        } catch {
          fail();
        }
      }
      return memory.get(key) ?? null;
    },
    setItem: (key, value) => {
      memory.set(key, value);
      if (!backing) return;
      try {
        backing.setItem(key, value);
      } catch {
        fail();
      }
    },
    removeItem: (key) => {
      memory.delete(key);
      if (!backing) return;
      try {
        backing.removeItem(key);
      } catch {
        fail();
      }
    },
  };
}

export const browserLocalStorage = (): Storage | undefined =>
  (globalThis as { localStorage?: Storage }).localStorage;
