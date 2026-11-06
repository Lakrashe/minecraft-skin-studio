import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { isSampleId, SAMPLE_CHARACTERS, type SampleId } from '@/content';
import { useT } from '@/i18n';
import { cn, Icon, IconButton, SegmentedControl, Select, toast, Tooltip } from '@/ui';
import { useStudioSelector } from './document';
import { loadSource, redo, undo } from './editing';
import { PreviewPanel } from './PreviewPanel';
import { useStudioShortcuts } from './shortcuts';
import { StatusBar } from './StatusBar';
import { useStudio } from './studio-store';
import { TexturePanel } from './TexturePanel';
import { ToolsPanel } from './ToolsPanel';
import { ViewPanel } from './ViewPanel';

type MobilePanel = 'texture' | 'preview' | 'tools';

/**
 * Undo/redo buttons. They subscribe to the history themselves, so a pixel
 * edit re-renders only these two buttons, not the whole page.
 */
function UndoRedo() {
  const t = useT();
  const canUndo = useStudioSelector((s) => s.canUndo);
  const canRedo = useStudioSelector((s) => s.canRedo);
  return (
    <div className="flex items-center gap-1">
      <IconButton
        icon="undo"
        label={t('studio.undo')}
        shortcut="Ctrl+Z"
        disabled={!canUndo}
        onClick={undo}
      />
      <IconButton
        icon="redo"
        label={t('studio.redo')}
        shortcut="Ctrl+Shift+Z"
        disabled={!canRedo}
        onClick={redo}
      />
    </div>
  );
}
type Source = SampleId | 'blank';

/**
 * The Studio: a 64×64 pixel editor. Layout per spec §25 — left tools panel,
 * central 2D workspace, right 3D preview, bottom status bar (tabs on phones).
 */
export function StudioPage() {
  const t = useT();
  const source = useStudio((s) => s.source);
  const [params, setParams] = useSearchParams();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('texture');
  useStudioShortcuts();

  const choose = (next: Source) => {
    loadSource(next);
    const name = next === 'blank' ? t('studio.blank') : t(`samples.${next}.name`);
    toast.info(t('studio.loaded', { name }));
  };

  // ?sample=<id> (from the homepage) loads that character once, then leaves the
  // URL so returning to the page never replaces the skin being edited.
  const requested = params.get('sample');
  useEffect(() => {
    if (!isSampleId(requested)) return;
    if (requested !== useStudio.getState().source) loadSource(requested);
    setParams({}, { replace: true });
  }, [requested, setParams]);

  const sourceOptions: { value: Source; label: string }[] = [
    { value: 'blank', label: t('studio.blank') },
    ...SAMPLE_CHARACTERS.map((s) => ({ value: s.id, label: t(`samples.${s.id}.name`) })),
  ];
  const panelOptions: { value: MobilePanel; label: string }[] = [
    { value: 'texture', label: t('studio.panels.texture') },
    { value: 'preview', label: t('studio.panels.preview') },
    { value: 'tools', label: t('studio.panels.tools') },
  ];
  const hiddenOnMobile = (panel: MobilePanel) => mobilePanel !== panel && 'max-lg:hidden';

  return (
    <div className="flex flex-col lg:h-full lg:min-h-0">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3 border-b border-line bg-bg-raised px-4 py-3">
        <h1 className="self-center font-display text-lg font-semibold tracking-tight">
          {t('studio.title')}
        </h1>
        <div className="w-44">
          <Select
            label={t('studio.startFrom')}
            value={source}
            options={sourceOptions}
            onChange={choose}
            className="h-9"
          />
        </div>
        <UndoRedo />
        <div className="ml-auto self-center max-md:hidden">
          <Tooltip content={t('nav.settings')} align="end">
            <Link
              to="/settings"
              aria-label={t('nav.settings')}
              className="inline-flex size-10 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <Icon name="settings" />
            </Link>
          </Tooltip>
        </div>
      </div>

      <div className="border-b border-line p-3 lg:hidden">
        <SegmentedControl
          label={t('studio.panels.tools')}
          hideLabel
          value={mobilePanel}
          options={panelOptions}
          onChange={setMobilePanel}
        />
      </div>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)] lg:min-h-0 lg:grid-cols-[18rem_minmax(0,1fr)_minmax(20rem,30%)]">
        <aside
          aria-label={t('studio.panels.tools')}
          className={cn(
            'flex flex-col overflow-y-auto border-line bg-surface lg:border-r',
            hiddenOnMobile('tools'),
          )}
        >
          <ToolsPanel />
          <ViewPanel />
        </aside>
        <section
          aria-label={t('studio.panels.texture')}
          className={cn('min-h-0', hiddenOnMobile('texture'))}
        >
          <TexturePanel />
        </section>
        <section
          aria-label={t('studio.panels.preview')}
          className={cn(
            'min-h-0 border-line lg:overflow-y-auto lg:border-l',
            hiddenOnMobile('preview'),
          )}
        >
          <PreviewPanel />
        </section>
      </div>

      <StatusBar />
    </div>
  );
}
