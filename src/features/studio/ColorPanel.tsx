import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BUILT_IN_PALETTES } from '@/content';
import { useT } from '@/i18n';
import {
  isPaletteColor,
  MAX_PALETTE_COLORS,
  MAX_PALETTE_NAME,
  MAX_PALETTES,
  usePalettes,
} from '@/state';
import {
  Button,
  cn,
  ColorPicker,
  Dialog,
  formatHexColor,
  Icon,
  IconButton,
  parseHexColor,
  Select,
  TextField,
} from '@/ui';
import { useStudio } from './studio-store';

const checker = 'repeating-conic-gradient(#363c44 0 25%, #2b3036 0 50%) 0 0 / 8px 8px';

function swatchStyle(hex: string) {
  return { background: `linear-gradient(${hex}, ${hex}), ${checker}` };
}

/** HEX field: edits locally, applies valid colors, explains invalid ones. */
function HexField() {
  const t = useT();
  const color = useStudio((s) => s.color);
  const setColor = useStudio((s) => s.setColor);
  const [text, setText] = useState(() => formatHexColor(color));
  const [invalid, setInvalid] = useState(false);

  // Follow color changes made elsewhere (picker, palette, eyedropper).
  useEffect(() => {
    setText(formatHexColor(color));
    setInvalid(false);
  }, [color]);

  const apply = (value: string) => {
    const parsed = parseHexColor(value);
    setInvalid(parsed === null);
    if (parsed) setColor(parsed);
  };

  return (
    <TextField
      label={t('studio.hex')}
      hint={t('studio.hexHint')}
      {...(invalid ? { error: t('studio.hexInvalid') } : {})}
      value={text}
      spellCheck={false}
      autoComplete="off"
      maxLength={9}
      className="font-mono"
      onChange={(event) => {
        setText(event.target.value);
        const parsed = parseHexColor(event.target.value);
        if (parsed) {
          setInvalid(false);
          setColor(parsed);
        }
      }}
      onBlur={(event) => {
        apply(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') apply(event.currentTarget.value);
      }}
    />
  );
}

type PaletteDialog =
  { kind: 'create' } | { kind: 'rename'; id: string } | { kind: 'delete'; id: string };

/** Built-in palettes plus the user's own (saved on this device). */
function Palettes() {
  const t = useT();
  const color = useStudio((s) => s.color);
  const setColor = useStudio((s) => s.setColor);
  const palettes = usePalettes(useShallow((s) => s.palettes));
  const actions = usePalettes(
    useShallow((s) => ({
      createPalette: s.createPalette,
      renamePalette: s.renamePalette,
      deletePalette: s.deletePalette,
      addColor: s.addColor,
      removeColor: s.removeColor,
    })),
  );
  const [selected, setSelected] = useState<string>(BUILT_IN_PALETTES[0]?.id ?? '');
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<PaletteDialog | null>(null);
  const [name, setName] = useState('');

  const custom = palettes.find((p) => p.id === selected);
  const builtIn = BUILT_IN_PALETTES.find((p) => p.id === selected);
  // A deleted or unknown selection falls back to the first built-in palette.
  useEffect(() => {
    if (!custom && !builtIn) setSelected(BUILT_IN_PALETTES[0]?.id ?? '');
  }, [custom, builtIn]);

  const colors = custom?.colors ?? builtIn?.colors ?? [];
  const current = formatHexColor(color);
  const options = [
    ...BUILT_IN_PALETTES.map((p) => ({
      value: p.id,
      label: t(`studio.palettes.builtIn.${p.id}`),
    })),
    ...palettes.map((p) => ({ value: p.id, label: p.name || t('studio.palettes.defaultName') })),
  ];
  const full = (custom?.colors.length ?? 0) >= MAX_PALETTE_COLORS;

  const closeDialog = () => {
    setDialog(null);
  };
  const submitName = () => {
    const value = name.trim() || t('studio.palettes.defaultName');
    if (dialog?.kind === 'create') {
      const id = actions.createPalette(value, isPaletteColor(current) ? [current] : []);
      if (id) setSelected(id);
    } else if (dialog?.kind === 'rename') {
      actions.renamePalette(dialog.id, value);
    }
    closeDialog();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-1">
        <div className="min-w-0 flex-1">
          <Select
            label={t('studio.palettes.choose')}
            value={selected}
            options={options}
            onChange={(id) => {
              setSelected(id);
              setEditing(false);
            }}
          />
        </div>
        <IconButton
          icon="plus"
          label={t('studio.palettes.create')}
          tooltipAlign="end"
          disabled={palettes.length >= MAX_PALETTES}
          onClick={() => {
            setName(t('studio.palettes.defaultName'));
            setDialog({ kind: 'create' });
          }}
        />
      </div>

      {colors.length === 0 ? (
        <p className="text-xs text-muted">{t('studio.palettes.empty')}</p>
      ) : (
        <ul className="grid grid-cols-8 gap-1" aria-label={t('studio.palettes.title')}>
          {colors.map((hex) => {
            const active = hex === current;
            const label = editing
              ? t('studio.palettes.removeSwatch', { hex })
              : t('studio.palettes.swatch', { hex });
            return (
              <li key={hex}>
                <button
                  type="button"
                  aria-label={label}
                  title={label}
                  aria-pressed={editing ? undefined : active}
                  onClick={() => {
                    if (editing && custom) actions.removeColor(custom.id, hex);
                    else {
                      const parsed = parseHexColor(hex);
                      if (parsed) setColor(parsed);
                    }
                  }}
                  className={cn(
                    'relative aspect-square w-full rounded-sm border border-line-strong',
                    active && !editing && 'ring-2 ring-accent ring-offset-1 ring-offset-surface',
                    editing &&
                      'after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-xs after:font-bold after:text-white after:content-["×"] after:[text-shadow:0_0_2px_#000]',
                  )}
                  style={swatchStyle(hex)}
                />
              </li>
            );
          })}
        </ul>
      )}

      {custom ? (
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            leadingIcon={<Icon name="plus" size={16} />}
            disabled={full || custom.colors.includes(current)}
            onClick={() => {
              actions.addColor(custom.id, current);
            }}
          >
            {t('studio.palettes.add')}
          </Button>
          {custom.colors.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={editing}
              onClick={() => {
                setEditing((e) => !e);
              }}
            >
              {editing ? t('studio.palettes.doneEditing') : t('studio.palettes.edit')}
            </Button>
          )}
          <IconButton
            icon="pencil"
            size="sm"
            label={t('studio.palettes.rename')}
            onClick={() => {
              setName(custom.name);
              setDialog({ kind: 'rename', id: custom.id });
            }}
          />
          <IconButton
            icon="trash"
            size="sm"
            label={t('studio.palettes.delete')}
            tooltipAlign="end"
            onClick={() => {
              setDialog({ kind: 'delete', id: custom.id });
            }}
          />
          {full && <p className="w-full text-xs text-muted">{t('studio.palettes.full')}</p>}
        </div>
      ) : (
        <p className="text-xs text-muted">{t('studio.palettes.readOnly')}</p>
      )}
      {palettes.length >= MAX_PALETTES && (
        <p className="text-xs text-muted">{t('studio.palettes.tooMany')}</p>
      )}

      <Dialog
        open={dialog?.kind === 'create' || dialog?.kind === 'rename'}
        onClose={closeDialog}
        title={
          dialog?.kind === 'rename'
            ? t('studio.palettes.renameTitle')
            : t('studio.palettes.createTitle')
        }
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog}>
              {t('studio.palettes.cancel')}
            </Button>
            <Button variant="primary" type="submit" form="palette-name-form">
              {t('studio.palettes.save')}
            </Button>
          </>
        }
      >
        <form
          id="palette-name-form"
          onSubmit={(event) => {
            event.preventDefault();
            submitName();
          }}
        >
          <TextField
            label={t('studio.palettes.name')}
            value={name}
            maxLength={MAX_PALETTE_NAME}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </form>
      </Dialog>

      <Dialog
        open={dialog?.kind === 'delete'}
        onClose={closeDialog}
        title={t('studio.palettes.deleteTitle', {
          name: palettes.find((p) => dialog?.kind === 'delete' && p.id === dialog.id)?.name ?? '',
        })}
        description={t('studio.palettes.deleteBody')}
        footer={
          <>
            <Button variant="ghost" onClick={closeDialog}>
              {t('studio.palettes.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (dialog?.kind === 'delete') actions.deletePalette(dialog.id);
                setEditing(false);
                closeDialog();
              }}
            >
              {t('studio.palettes.confirmDelete')}
            </Button>
          </>
        }
      />
    </div>
  );
}

/** Current color, HSV picker, HEX field and palettes. */
export function ColorPanel() {
  const t = useT();
  const s = useStudio(useShallow((st) => ({ color: st.color, setColor: st.setColor })));
  const hex = formatHexColor(s.color);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          role="img"
          aria-label={t('studio.currentColor', { hex })}
          className="size-10 shrink-0 rounded-control border border-line-strong"
          style={swatchStyle(hex)}
        />
        <span className="font-mono text-sm">{hex}</span>
      </div>
      <ColorPicker
        value={s.color}
        onChange={s.setColor}
        labels={{
          area: t('studio.picker.area'),
          areaValue: (sat, val) => t('studio.picker.areaValue', { s: sat, v: val }),
          hue: t('studio.picker.hue'),
          alpha: t('studio.picker.alpha'),
        }}
      />
      <HexField />
      <Palettes />
    </div>
  );
}
