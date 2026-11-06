/**
 * The one live stroke in the Studio (at most one at a time).
 *
 * A stroke is drawn against the document it started on. Anything else that
 * changes the document (undo, redo, loading a skin, switching the model)
 * cancels it first, and a stroke whose starting document is no longer current
 * is discarded rather than committed, so history always matches the edits the
 * user actually made. Leaving the Studio and multi-touch gestures cancel it too.
 */
import type { Texel } from '@/editor2d';
import { Stroke, type DrawingTool, type SkinDocument, type ToolOptions } from '@/engine';
import { studioDocument } from './document';

interface ActiveStroke {
  readonly stroke: Stroke;
  /** The document the stroke was drawn on. */
  readonly startedOn: SkinDocument;
}

let active: ActiveStroke | null = null;
/** True while a multi-touch gesture (pinch) is in progress: no new strokes. */
let gesture = false;

export function beginStroke(tool: DrawingTool, options: ToolOptions, texel: Texel): void {
  cancelStroke();
  if (gesture) return;
  const startedOn = studioDocument.document;
  const stroke = new Stroke(tool, startedOn.pixels, options, texel);
  active = { stroke, startedOn };
  studioDocument.setPreview(stroke.changes);
}

export function moveStroke(texel: Texel): void {
  if (!active) return;
  // Publish a preview only when the stroke's pixels actually changed.
  if (active.stroke.move(texel)) studioDocument.setPreview(active.stroke.changes);
}

/** Commits the stroke as one undoable command — unless the document changed since it began. */
export function endStroke(): void {
  const current = active;
  active = null;
  if (!current) return;
  const command = studioDocument.document === current.startedOn ? current.stroke.finish() : null;
  if (!command || !studioDocument.dispatch(command)) studioDocument.setPreview(null);
}

/** Drops the live stroke and its preview (no effect when nothing is being drawn). */
export function cancelStroke(): void {
  if (!active) return;
  active = null;
  studioDocument.setPreview(null);
}

export function isStroking(): boolean {
  return active !== null;
}

/** A multi-touch gesture started (cancels drawing) or ended (drawing allowed again). */
export function setGesture(inProgress: boolean): void {
  gesture = inProgress;
  if (inProgress) cancelStroke();
}
