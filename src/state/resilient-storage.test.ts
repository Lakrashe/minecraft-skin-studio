import { describe, expect, it, vi } from 'vitest';
import { createResilientStorage } from './resilient-storage';

/** Minimal in-memory Storage whose methods can be made to throw on demand. */
function fakeStorage() {
  const data = new Map<string, string>();
  const failing = { get: false, set: false, remove: false };
  const storage = {
    get length() {
      return data.size;
    },
    clear: () => {
      data.clear();
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => {
      if (failing.get) throw new DOMException('denied', 'SecurityError');
      return data.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (failing.set) throw new DOMException('full', 'QuotaExceededError');
      data.set(k, v);
    },
    removeItem: (k: string) => {
      if (failing.remove) throw new DOMException('denied', 'SecurityError');
      data.delete(k);
    },
  } satisfies Storage;
  return { storage, data, failing };
}

describe('createResilientStorage', () => {
  it('uses browser storage when it works', () => {
    const { storage, data } = fakeStorage();
    const onUnavailable = vi.fn();
    const s = createResilientStorage(() => storage, onUnavailable);
    void s.setItem('k', 'v');
    expect(data.get('k')).toBe('v');
    expect(s.getItem('k')).toBe('v');
    expect(onUnavailable).not.toHaveBeenCalled();
  });

  it('falls back to memory when storage is denied at startup', () => {
    const onUnavailable = vi.fn();
    const s = createResilientStorage(() => {
      throw new DOMException('denied', 'SecurityError');
    }, onUnavailable);
    expect(onUnavailable).toHaveBeenCalledOnce();
    void s.setItem('k', 'v');
    expect(s.getItem('k')).toBe('v');
  });

  it('falls back to memory when storage is missing', () => {
    const onUnavailable = vi.fn();
    const s = createResilientStorage(() => undefined, onUnavailable);
    expect(onUnavailable).toHaveBeenCalledOnce();
    expect(s.getItem('missing')).toBeNull();
  });

  it('never throws when a later write fails, and keeps the value in memory', () => {
    const { storage, failing } = fakeStorage();
    const onUnavailable = vi.fn();
    const s = createResilientStorage(() => storage, onUnavailable);
    failing.set = true;
    expect(() => s.setItem('k', 'new')).not.toThrow();
    expect(onUnavailable).toHaveBeenCalledOnce();
    expect(s.getItem('k')).toBe('new');
  });

  it('never throws when a later read or remove fails', () => {
    const { storage, failing } = fakeStorage();
    const onUnavailable = vi.fn();
    const s = createResilientStorage(() => storage, onUnavailable);
    void s.setItem('k', 'v');
    failing.get = true;
    failing.remove = true;
    expect(s.getItem('k')).toBe('v');
    expect(() => s.removeItem('k')).not.toThrow();
    expect(s.getItem('k')).toBeNull();
    expect(onUnavailable).toHaveBeenCalled();
  });

  it('stops using browser storage after the first failure', () => {
    const { storage, failing, data } = fakeStorage();
    const s = createResilientStorage(
      () => storage,
      () => undefined,
    );
    failing.set = true;
    void s.setItem('a', '1');
    failing.set = false;
    void s.setItem('b', '2');
    // Writes after a failure stay in memory instead of silently half-persisting.
    expect(data.has('b')).toBe(false);
    expect(s.getItem('b')).toBe('2');
  });
});
