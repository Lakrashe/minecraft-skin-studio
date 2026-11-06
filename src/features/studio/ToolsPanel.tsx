import type { ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useT } from '@/i18n';
import { cn, IconButton, Switch, type IconName } from '@/ui';
import { ColorPanel } from './ColorPanel';
import { MIRROR_SHORTCUT, TOOL_SHORTCUTS } from './shortcuts';
import { TOOLS, useStudio, type ToolId } from './studio-store';

const TOOL_ICONS: Readonly<Record<ToolId, IconName>> = {
  pencil: 'pencil',
  eraser: 'eraser',
  bucket: 'bucket',
  eyedropper: 'eyedropper',
  line: 'line',
  rect: 'square',
  pan: 'hand',
};

export function PanelGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-b border-line px-4 py-5 last:border-b-0">
      <legend className="float-left mb-1 w-full text-xs font-semibold tracking-wider text-subtle uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/** The tool buttons (a toggle group). `compact` is the strip shown above the texture on small screens. */
export function ToolButtons({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const tool = useStudio((s) => s.tool);
  const setTool = useStudio((s) => s.setTool);
  return (
    <div
      role="toolbar"
      aria-label={t('studio.toolsTitle')}
      className={cn('flex flex-wrap gap-1', !compact && 'gap-1.5')}
    >
      {TOOLS.map((id) => (
        <IconButton
          key={id}
          icon={TOOL_ICONS[id]}
          size={compact ? 'sm' : 'md'}
          label={t(`studio.tools.${id}`)}
          shortcut={TOOL_SHORTCUTS[id]}
          active={tool === id}
          aria-pressed={tool === id}
          className={cn(!compact && 'border border-line')}
          onClick={() => {
            setTool(id);
          }}
        />
      ))}
    </div>
  );
}

/** Left panel, top: tools, their options and the color. */
export function ToolsPanel() {
  const t = useT();
  const s = useStudio(
    useShallow((st) => ({
      tool: st.tool,
      mirror: st.mirror,
      rectFilled: st.rectFilled,
      setMirror: st.setMirror,
      setRectFilled: st.setRectFilled,
    })),
  );
  return (
    <>
      <PanelGroup title={t('studio.toolsTitle')}>
        <ToolButtons />
        <p className="text-xs text-muted" aria-live="polite">
          <span className="font-medium text-fg">{t(`studio.tools.${s.tool}`)}</span> ·{' '}
          {t(`studio.toolHints.${s.tool}`)}
        </p>
        {s.tool === 'rect' && (
          <Switch
            label={t('studio.rectFilled')}
            checked={s.rectFilled}
            onChange={s.setRectFilled}
          />
        )}
        <Switch
          label={t('studio.mirror')}
          description={`${t('studio.mirrorHint')} (${MIRROR_SHORTCUT})`}
          checked={s.mirror}
          onChange={s.setMirror}
        />
      </PanelGroup>
      <PanelGroup title={t('studio.color')}>
        <ColorPanel />
      </PanelGroup>
    </>
  );
}
