import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { isSampleId, SAMPLE_CHARACTERS, type SampleId } from '@/content';
import { useT } from '@/i18n';
import { Badge, cn, Icon, SegmentedControl, Select, Tooltip } from '@/ui';
import { PreviewPanel } from './PreviewPanel';
import { StatusBar } from './StatusBar';
import { useStudio } from './studio-store';
import { TexturePanel } from './TexturePanel';
import { ViewPanel } from './ViewPanel';

type MobilePanel = 'texture' | 'preview' | 'view';

/**
 * The Studio. Layout per spec §25 — left tools/view panel, central 2D
 * workspace, right 3D preview, bottom status bar. Only working features are
 * shown (PROJECT_RULES §1.10): today it is a viewer; drawing tools, import,
 * save and export are added to these panels as they are built.
 */
export function StudioPage() {
  const t = useT();
  const sampleId = useStudio((s) => s.sampleId);
  const selectSample = useStudio((s) => s.selectSample);
  const [params, setParams] = useSearchParams();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('texture');

  // ?sample=<id> (e.g. from the homepage) selects the character.
  const requested = params.get('sample');
  useEffect(() => {
    if (isSampleId(requested) && requested !== useStudio.getState().sampleId) {
      selectSample(requested);
    }
  }, [requested, selectSample]);

  const chooseSample = (id: SampleId) => {
    selectSample(id);
    setParams({ sample: id }, { replace: true });
  };

  const sampleOptions = SAMPLE_CHARACTERS.map((s) => ({
    value: s.id,
    label: t(`samples.${s.id}.name`),
  }));
  const panelOptions: { value: MobilePanel; label: string }[] = [
    { value: 'texture', label: t('studio.panels.texture') },
    { value: 'preview', label: t('studio.panels.preview') },
    { value: 'view', label: t('studio.panels.view') },
  ];
  const hiddenOnMobile = (panel: MobilePanel) => mobilePanel !== panel && 'max-lg:hidden';

  return (
    <div className="flex flex-col lg:h-full lg:min-h-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line bg-bg-raised px-4 py-3">
        <h1 className="font-display text-lg font-semibold tracking-tight">{t('studio.title')}</h1>
        <div className="w-44">
          <Select
            label={t('studio.character')}
            value={sampleId}
            options={sampleOptions}
            onChange={chooseSample}
            className="h-9"
          />
        </div>
        <Badge tone="warning" className="max-w-full">
          {t('studio.viewerNotice')}
        </Badge>
        <div className="ml-auto max-md:hidden">
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
          label={t('studio.panels.view')}
          hideLabel
          value={mobilePanel}
          options={panelOptions}
          onChange={setMobilePanel}
        />
      </div>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)] lg:min-h-0 lg:grid-cols-[17rem_minmax(0,1fr)_minmax(20rem,32%)]">
        <aside
          aria-label={t('studio.panels.view')}
          className={cn(
            'overflow-y-auto border-line bg-surface lg:border-r',
            hiddenOnMobile('view'),
          )}
        >
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
