import { useEffect } from 'react';
import { redo, undo } from './editing';
import { useStudio, type ToolId } from './studio-store';

/** Keyboard shortcut per tool (shown in tooltips). */
export const TOOL_SHORTCUTS: Readonly<Record<ToolId, string>> = {
  pencil: 'B',
  eraser: 'E',
  bucket: 'G',
  eyedropper: 'I',
  line: 'L',
  rect: 'U',
  pan: 'H',
};

export const MIRROR_SHORTCUT = 'M';

/** True when keys typed at `target` belong to a text field or other form control. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag !== 'INPUT') return false;
  const type = (target as HTMLInputElement).type;
  return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'color'].includes(type);
}

/**
 * Studio shortcuts: Ctrl/⌘+Z undo, Ctrl/⌘+Shift+Z or Ctrl+Y redo, tool keys,
 * M mirror, + / − zoom, 0 fit. Ignored while typing in a field or when a
 * dialog is open.
 */
export function useStudioShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      if (document.querySelector('dialog[open]')) return;
      const key = event.key.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;
      if (mod && !event.altKey) {
        if (key === 'z') {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
        } else if (key === 'y') {
          event.preventDefault();
          redo();
        }
        return;
      }
      if (event.altKey || event.shiftKey) return;
      const ui = useStudio.getState();
      const tool = (Object.keys(TOOL_SHORTCUTS) as ToolId[]).find(
        (id) => TOOL_SHORTCUTS[id].toLowerCase() === key,
      );
      if (tool) {
        ui.setTool(tool);
      } else if (key === MIRROR_SHORTCUT.toLowerCase()) {
        ui.setMirror(!ui.mirror);
      } else if (key === '+' || key === '=') {
        ui.zoomTo(ui.zoom + 1);
      } else if (key === '-') {
        ui.zoomTo(ui.zoom - 1);
      } else if (key === '0') {
        ui.requestFit();
      } else {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
