/**
 * Connects the Studio UI to the editing engine: strokes from the 2D canvas
 * become engine commands on the document store; loading a starting skin and
 * switching the model are undoable commands too.
 */
import { useMemo, useRef } from 'react';
import type { SampleId } from '@/content';
import type { Texel } from '@/editor2d';
import {
  blankDocument,
  editMask,
  pickColor,
  Stroke,
  type SkinMask,
  type SkinModel,
} from '@/engine';
import { sampleDocument, studioDocument, useStudioDocument } from './document';
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

/** Pointer strokes → live preview → one undoable command per stroke. */
export function useStrokeHandlers(): StrokeHandlers {
  const stroke = useRef<Stroke | null>(null);

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
      stroke.current = new Stroke(
        ui.tool,
        doc.pixels,
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
      studioDocument.setPreview(stroke.current.changes);
    };
    const move = (texel: Texel) => {
      const current = stroke.current;
      if (!current) return;
      current.move(texel);
      studioDocument.setPreview(current.changes);
    };
    const end = () => {
      const current = stroke.current;
      stroke.current = null;
      if (!current) return;
      const command = current.finish();
      if (command) studioDocument.dispatch(command);
      else studioDocument.setPreview(null);
    };
    const cancel = () => {
      stroke.current = null;
      studioDocument.setPreview(null);
    };
    return {
      onStrokeStart: start,
      onStrokeMove: move,
      onStrokeEnd: end,
      onStrokeCancel: cancel,
      onActivate: (texel) => {
        start(texel);
        end();
      },
    };
  }, []);
}

/** Replaces the skin with a sample or a blank skin (undoable). */
export function loadSource(source: SampleId | 'blank'): void {
  const before = studioDocument.document;
  const after = source === 'blank' ? blankDocument(before.model) : sampleDocument(source);
  studioDocument.dispatch({ kind: 'replace', before, after });
  useStudio.getState().setSource(source);
}

/** Switches the arm model (texture layout) without moving pixels (undoable). */
export function setModel(model: SkinModel): void {
  const before = studioDocument.document.model;
  if (before === model) return;
  studioDocument.dispatch({ kind: 'setModel', before, after: model });
}

export function undo(): void {
  studioDocument.undo();
}

export function redo(): void {
  studioDocument.redo();
}
