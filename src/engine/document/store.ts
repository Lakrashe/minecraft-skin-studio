/**
 * DocumentStore: the only writer of the skin document (ARCHITECTURE §4.5–4.6).
 *
 * - Pixels change only through `dispatch`, `undo`, `redo` or `load`.
 * - Undo then redo restores byte-identical documents.
 * - Every change notifies subscribers with a strictly greater revision.
 * - A live stroke is shown through `setPreview` without touching the
 *   document or the history; the finished stroke is dispatched once.
 */
import type { PixelBuffer } from '../model/pixel-buffer';
import {
  applyCommand,
  invertCommand,
  withChanges,
  type Command,
  type PixelChanges,
  type SkinDocument,
} from './document';

export interface StoreSnapshot {
  readonly document: SkinDocument;
  /** The texture to display: the document's pixels with any live preview applied. */
  readonly texture: PixelBuffer;
  /** Increases on every change, preview included. */
  readonly revision: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export interface DocumentStoreOptions {
  /** Maximum undo steps kept; older ones are dropped (default 200). */
  readonly historyLimit?: number;
}

/** Whether `command` was made for `doc` (its "before" state is the current one). */
export function commandMatches(doc: SkinDocument, command: Command): boolean {
  switch (command.kind) {
    case 'pixels': {
      const { rect, before } = command.patch;
      for (let y = 0; y < rect.h; y++) {
        const row = ((rect.y + y) * doc.pixels.width + rect.x) * 4;
        for (let i = 0; i < rect.w * 4; i++) {
          if (doc.pixels.data[row + i] !== before[y * rect.w * 4 + i]) return false;
        }
      }
      return true;
    }
    case 'setModel':
      return doc.model === command.before;
    case 'replace':
      return doc === command.before;
  }
}

export class DocumentStore {
  private doc: SkinDocument;
  private preview: PixelChanges | null = null;
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private readonly historyLimit: number;
  private readonly listeners = new Set<() => void>();
  private revision = 0;
  private snapshot: StoreSnapshot;

  constructor(document: SkinDocument, options: DocumentStoreOptions = {}) {
    this.doc = document;
    this.historyLimit = Math.max(1, options.historyLimit ?? 200);
    this.snapshot = this.buildSnapshot();
  }

  /** Stable between changes (suitable for `useSyncExternalStore`). */
  getSnapshot = (): StoreSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  get document(): SkinDocument {
    return this.doc;
  }

  /**
   * Applies a command and records it for undo; clears the redo stack.
   * Refuses (returns `false`, changes nothing) a command whose "before" state
   * is not the current document — e.g. a stroke started before an undo — so
   * history always describes the real sequence of edits.
   */
  dispatch(command: Command): boolean {
    if (!commandMatches(this.doc, command)) return false;
    this.doc = applyCommand(this.doc, command);
    this.preview = null;
    this.undoStack.push(command);
    if (this.undoStack.length > this.historyLimit) this.undoStack.shift();
    this.redoStack.length = 0;
    this.changed();
    return true;
  }

  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    this.doc = applyCommand(this.doc, invertCommand(command));
    this.redoStack.push(command);
    this.preview = null;
    this.changed();
    return true;
  }

  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    this.doc = applyCommand(this.doc, command);
    this.undoStack.push(command);
    this.preview = null;
    this.changed();
    return true;
  }

  /** Shows pixels on top of the document without changing it (`null` clears). */
  setPreview(changes: PixelChanges | null): void {
    if (changes === null && this.preview === null) return;
    this.preview = changes && changes.size > 0 ? changes : null;
    this.changed();
  }

  /** Replaces the document without an undo step and clears the history. */
  load(document: SkinDocument): void {
    this.doc = document;
    this.preview = null;
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.changed();
  }

  get historySize(): number {
    return this.undoStack.length;
  }

  private buildSnapshot(): StoreSnapshot {
    return {
      document: this.doc,
      texture: this.preview ? withChanges(this.doc.pixels, this.preview) : this.doc.pixels,
      revision: this.revision,
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
    };
  }

  private changed(): void {
    this.revision++;
    this.snapshot = this.buildSnapshot();
    for (const listener of [...this.listeners]) listener();
  }
}
