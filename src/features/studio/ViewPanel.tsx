import type { ReactNode } from 'react';
import { getSample } from '@/content';
import { BODY_PARTS, type BodyPart, type SkinModel } from '@/engine';
import { useT } from '@/i18n';
import { cn, SegmentedControl, Switch } from '@/ui';
import { useStudio } from './studio-store';

function PanelGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-b border-line px-4 py-5 last:border-b-0">
      <legend className="float-left mb-1 w-full text-xs font-semibold tracking-wider text-subtle uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/** Left panel: view controls that work today (body-part focus, layers, canvas, model). */
export function ViewPanel() {
  const t = useT();
  const s = useStudio();
  const designedFor = getSample(s.sampleId).model;
  const parts: readonly (BodyPart | 'all')[] = ['all', ...BODY_PARTS];
  const modelOptions: { value: SkinModel; label: string }[] = [
    { value: 'classic', label: t('studio.classic') },
    { value: 'slim', label: t('studio.slim') },
  ];

  return (
    <div className="flex flex-col">
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
      </PanelGroup>

      <PanelGroup title={t('studio.canvas')}>
        <Switch label={t('studio.grid')} checked={s.grid} onChange={s.setGrid} />
        <Switch label={t('studio.outlines')} checked={s.outlines} onChange={s.setOutlines} />
      </PanelGroup>

      <PanelGroup title={t('studio.model')}>
        <SegmentedControl
          label={t('studio.model')}
          hideLabel
          value={s.model}
          options={modelOptions}
          onChange={s.setModel}
        />
        <p className="text-xs text-muted">{t('studio.modelHint')}</p>
        {s.model !== designedFor && (
          <p role="status" className="text-xs text-warning">
            {t('studio.modelMismatch', {
              model: t(designedFor === 'slim' ? 'studio.slim' : 'studio.classic').toLowerCase(),
            })}
          </p>
        )}
      </PanelGroup>
    </div>
  );
}
