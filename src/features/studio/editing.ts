/**
 * Connects the Studio UI to the editing engine: strokes from the 2D canvas
 * become engine commands on the document store; loading a starting skin and
 * switching the model are undoable commands too.
 */
import { useEffect, useMemo } from 'react';
import type { SampleId } from '@/content';
import type { Texel } from '@/editor2d';
import { blankDocument, editMask, pickColor, type SkinMask, type SkinModel } from '@/engine';
import { sampleDocument, studioDocument, useStudioDocument } from './document';
import { beginStroke, cancelStroke, endStroke, moveStroke } from './stroke-controller';
import { editableLayers, isDrawingTool, useStudio } from './studio-store';

/** Where tools may paint: the selected body part on the editable, visible layers. */
export function useEditMask(): SkinMask {
  const model = useStudioDocument().document.model;
  const focus = useStudio((s) => s.focus);
  const editLayer = useStudio((s) => s.editLayer);
  const showInner = useStudio((s) => s.showInner);
  const showOuter = useStudio((s) => s.showOuter);
  return useMemo(
    () => editMask(model, focus, editableLayers(editLayer, showInner, showOuter)),
    [model, focus, editLayer, showInner, showOuter],
  );
}

export interface StrokeHandlers {
  readonly onStrokeStart: (texel: Texel) => void;
  readonly onStrokeMove: (texel: Texel) => void;
  readonly onStrokeEnd: () => void;
  readonly onStrokeCancel: () => void;
  /** Keyboard: a single click of the current tool at `texel`. */
  readonly onActivate: (texel: Texel) => void;
}

/** Pointer strokes → live preview → one undoable command per stroke (see stroke-controller). */
export function useStrokeHandlers(): StrokeHandlers {
  // Leaving the Studio mid-stroke must not leave its preview in the shared document.
  useEffect(() => cancelStroke, []);

  return useMemo(() => {
    const start = (texel: Texel) => {
      const ui = useStudio.getState();
      const doc = studioDocument.document;
      if (ui.tool === 'eyedropper') {
        const color = pickColor(doc.pixels, texel);
        if (color) ui.setColor(color);
        return;
      }
      if (!isDrawingTool(ui.tool)) return;
      beginStroke(
        ui.tool,
        {
          color: ui.color,
          mask: editMask(
            doc.model,
            ui.focus,
            editableLayers(ui.editLayer, ui.showInner, ui.showOuter),
          ),
          model: doc.model,
          mirror: ui.mirror,
          filled: ui.rectFilled,
        },
        texel,
      );
    };
    return {
      onStrokeStart: start,
      onStrokeMove: moveStroke,
      onStrokeEnd: endStroke,
      onStrokeCancel: cancelStroke,
      onActivate: (texel) => {
        start(texel);
        endStroke();
      },
    };
  }, []);
}

/** Replaces the skin with a sample or a blank skin (undoable). */
export function loadSource(source: SampleId | 'blank'): void {
  cancelStroke();
  const before = studioDocument.document;
  const after = source === 'blank' ? blankDocument(before.model) : sampleDocument(source);
  studioDocument.dispatch({ kind: 'replace', before, after });
  useStudio.getState().setSource(source);
}

/** Switches the arm model (texture layout) without moving pixels (undoable). */
export function setModel(model: SkinModel): void {
  cancelStroke();
  const before = studioDocument.document.model;
  if (before === model) return;
  studioDocument.dispatch({ kind: 'setModel', before, after: model });
}

/** Undo/redo first cancel a stroke in progress (its pointer may still be down). */
export function undo(): void {
  cancelStroke();
  studioDocument.undo();
}

export function redo(): void {
  cancelStroke();
  studioDocument.redo();
}
