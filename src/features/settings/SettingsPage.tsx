import { useState, type ReactNode } from 'react';
import { LANGUAGES, useT, type Language } from '@/i18n';
import {
  ACCENT_PRESETS,
  usePersistenceStatus,
  useSettings,
  type MotionPreference,
  type ThemePreference,
} from '@/state';
import { Button, cn, Dialog, Icon, Panel, SegmentedControl, Select, toast, Tooltip } from '@/ui';

function AccentPicker() {
  const t = useT();
  const accent = useSettings((s) => s.accent);
  const setAccent = useSettings((s) => s.setAccent);
  const isPreset = ACCENT_PRESETS.some((p) => p.hex === accent);

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium">{t('settings.accent')}</legend>
      <p className="text-xs text-muted">{t('settings.accentHint')}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2.5">
        {ACCENT_PRESETS.map((preset) => {
          const name = t(`settings.accentNames.${preset.id}`);
          const selected = preset.hex === accent;
          return (
            <Tooltip key={preset.id} content={name} side="top">
              <button
                type="button"
                aria-label={name}
                aria-pressed={selected}
                onClick={() => {
                  setAccent(preset.hex);
                }}
                className={cn(
                  'flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition-transform duration-150 hover:scale-110',
                  selected && 'ring-2 ring-fg',
                )}
                style={{ backgroundColor: preset.hex }}
              >
                {selected && <Icon name="check" size={16} className="text-black/70" />}
              </button>
            </Tooltip>
          );
        })}
        <Tooltip content={t('settings.accentCustom')} side="top">
          <label
            className={cn(
              'relative flex size-9 cursor-pointer items-center justify-center rounded-full border border-dashed border-line-strong text-muted ring-offset-2 ring-offset-surface hover:text-fg',
              !isPreset && 'border-solid ring-2 ring-fg',
            )}
            style={isPreset ? undefined : { backgroundColor: accent }}
          >
            <Icon name="palette" size={16} className={isPreset ? undefined : 'text-black/70'} />
            <input
              type="color"
              aria-label={t('settings.accentCustom')}
              value={accent}
              onChange={(event) => {
                setAccent(event.target.value);
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </Tooltip>
      </div>
    </fieldset>
  );
}

export function SettingsPage() {
  const t = useT();
  const { theme, language, motion, setTheme, setLanguage, setMotion, reset } = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);
  const persistent = usePersistenceStatus((s) => s.persistent);

  const themeOptions: { value: ThemePreference; label: string; icon: ReactNode }[] = [
    { value: 'dark', label: t('settings.themeDark'), icon: <Icon name="moon" size={16} /> },
    { value: 'light', label: t('settings.themeLight'), icon: <Icon name="sun" size={16} /> },
    { value: 'system', label: t('settings.themeSystem'), icon: <Icon name="monitor" size={16} /> },
  ];
  const motionOptions: { value: MotionPreference; label: string }[] = [
    { value: 'system', label: t('settings.motionSystem') },
    { value: 'reduced', label: t('settings.motionReduced') },
    { value: 'full', label: t('settings.motionFull') },
  ];
  const languageOptions = LANGUAGES.map((code: Language) => ({
    value: code,
    label: t(`languages.${code}`),
  }));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 animate-fade-in">
        <h1 className="font-display text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        {persistent ? (
          <p className="mt-2 text-muted">{t('settings.intro')}</p>
        ) : (
          <p
            role="status"
            className="mt-3 flex items-start gap-2 rounded-control border border-warning/40 bg-warning/10 p-3 text-sm text-fg"
          >
            <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-warning" />
            {t('settings.notSaved')}
          </p>
        )}
      </header>

      <div className="flex flex-col gap-6">
        <Panel title={t('settings.appearance')}>
          <div className="flex flex-col gap-7">
            <SegmentedControl
              label={t('settings.theme')}
              value={theme}
              options={themeOptions}
              onChange={setTheme}
            />
            <AccentPicker />
            <div className="flex flex-col gap-1.5">
              <SegmentedControl
                label={t('settings.motion')}
                value={motion}
                options={motionOptions}
                onChange={setMotion}
              />
              <p className="text-xs text-muted">{t('settings.motionHint')}</p>
            </div>
          </div>
        </Panel>

        <Panel title={t('settings.language')}>
          <div className="max-w-xs">
            <Select
              label={t('settings.language')}
              hint={t('settings.languageHint')}
              value={language}
              options={languageOptions}
              onChange={setLanguage}
            />
          </div>
        </Panel>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            leadingIcon={<Icon name="refresh" size={16} />}
            onClick={() => {
              setConfirmReset(true);
            }}
          >
            {t('settings.reset')}
          </Button>
        </div>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => {
          setConfirmReset(false);
        }}
        title={t('settings.resetTitle')}
        description={t('settings.resetDescription')}
        footer={
          <>
            <Button
              onClick={() => {
                setConfirmReset(false);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                reset();
                setConfirmReset(false);
                toast.success(t('settings.resetDone'));
              }}
            >
              {t('settings.resetConfirm')}
            </Button>
          </>
        }
      />
    </div>
  );
}
