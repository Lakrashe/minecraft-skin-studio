import { useShallow } from 'zustand/react/shallow';
import { BODY_PARTS, type BodyPart, type SkinModel } from '@/engine';
import { useT } from '@/i18n';
import { cn, SegmentedControl, Switch } from '@/ui';
import { useStudioModel } from './document';
import { setModel } from './editing';
import { useStudio, type EditLayer } from './studio-store';
import { PanelGroup } from './ToolsPanel';

/** Left panel, bottom: what to edit and see — body part, skin layers, canvas, model. */
export function ViewPanel() {
  const t = useT();
  // Narrow subscription: pixel inspection and zoom must not re-render this panel.
  const s = useStudio(
    useShallow((st) => ({
      focus: st.focus,
      editLayer: st.editLayer,
      showInner: st.showInner,
      showOuter: st.showOuter,
      grid: st.grid,
      outlines: st.outlines,
      labels: st.labels,
      setFocus: st.setFocus,
      setEditLayer: st.setEditLayer,
      setShowInner: st.setShowInner,
      setShowOuter: st.setShowOuter,
      setGrid: st.setGrid,
      setOutlines: st.setOutlines,
      setLabels: st.setLabels,
    })),
  );
  const model = useStudioModel();
  const parts: readonly (BodyPart | 'all')[] = ['all', ...BODY_PARTS];
  const modelOptions: { value: SkinModel; label: string }[] = [
    { value: 'classic', label: t('studio.classic') },
    { value: 'slim', label: t('studio.slim') },
  ];
  const paintOnOptions: { value: EditLayer; label: string }[] = [
    { value: 'both', label: t('studio.paintOnBoth') },
    { value: 'inner', label: t('studio.paintOnInner') },
    { value: 'outer', label: t('studio.paintOnOuter') },
  ];

  return (
    <>
      <PanelGroup title={t('studio.bodyPart')}>
        <div className="grid grid-cols-2 gap-1.5">
          {parts.map((part) => {
            const active = s.focus === part;
            return (
              <button
                key={part}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  s.setFocus(part);
                }}
                className={cn(
                  'rounded-control border px-2.5 py-2 text-left text-sm transition-colors duration-150',
                  part === 'all' && 'col-span-2',
                  active
                    ? 'border-accent/60 bg-accent/12 text-fg'
                    : 'border-line text-muted hover:border-line-strong hover:text-fg',
                )}
              >
                {t(`studio.parts.${part}`)}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">{t('studio.bodyPartHint')}</p>
      </PanelGroup>

      <PanelGroup title={t('studio.layers')}>
        <Switch
          label={t('studio.inner')}
          description={t('studio.innerHint')}
          checked={s.showInner}
          onChange={s.setShowInner}
        />
        <Switch
          label={t('studio.outer')}
          description={t('studio.outerHint')}
          checked={s.showOuter}
          onChange={s.setShowOuter}
        />
        <SegmentedControl
          label={t('studio.paintOn')}
          value={s.editLayer}
          options={paintOnOptions}
          onChange={s.setEditLayer}
        />
        {(!s.showInner || !s.showOuter) && (
          <p className="text-xs text-muted">{t('studio.hiddenNotEditable')}</p>
        )}
      </PanelGroup>

      <PanelGroup title={t('studio.canvas')}>
        <Switch label={t('studio.grid')} checked={s.grid} onChange={s.setGrid} />
        <Switch label={t('studio.outlines')} checked={s.outlines} onChange={s.setOutlines} />
        <Switch
          label={t('studio.faceLabels')}
          description={t('studio.faceLabelsHint')}
          checked={s.labels}
          onChange={s.setLabels}
        />
      </PanelGroup>

      <PanelGroup title={t('studio.model')}>
        <SegmentedControl
          label={t('studio.model')}
          hideLabel
          value={model}
          options={modelOptions}
          onChange={setModel}
        />
        <p className="text-xs text-muted">{t('studio.modelHint')}</p>
      </PanelGroup>
    </>
  );
}
