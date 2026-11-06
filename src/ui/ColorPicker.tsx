import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { hsvToRgb, rgbToHsv, type Hsv, type Rgba } from './color';
import { Slider } from './fields';

export interface ColorPickerLabels {
  /** Accessible name of the saturation/brightness area. */
  readonly area: string;
  /** e.g. "Saturation {s}%, brightness {v}%" already filled in by the caller. */
  readonly areaValue: (saturation: number, brightness: number) => string;
  readonly hue: string;
  readonly alpha: string;
}

export interface ColorPickerProps {
  readonly value: Rgba;
  readonly onChange: (color: Rgba) => void;
  readonly labels: ColorPickerLabels;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const sameRgb = (a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) =>
  a.r === b.r && a.g === b.g && a.b === b.b;

/**
 * HSV color picker: a saturation/brightness area (pointer or arrow keys),
 * a hue slider and an alpha slider. Hue is kept while the color is gray so
 * dragging to the edge and back does not lose it.
 */
export function ColorPicker({ value, onChange, labels }: ColorPickerProps) {
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(value));
  const areaRef = useRef<HTMLDivElement>(null);

  // Follow external changes (eyedropper, palette, HEX field), keeping our hue for grays.
  useEffect(() => {
    setHsv((current) => {
      if (sameRgb(hsvToRgb(current), value)) return current;
      const next = rgbToHsv(value);
      return next.s === 0 || next.v === 0 ? { ...next, h: current.h } : next;
    });
  }, [value]);

  const commit = (next: Hsv, alpha = value.a) => {
    setHsv(next);
    onChange({ ...hsvToRgb(next), a: alpha });
  };

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    commit({
      h: hsv.h,
      s: clamp01((event.clientX - rect.left) / rect.width),
      v: clamp01(1 - (event.clientY - rect.top) / rect.height),
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, readonly [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    commit({ h: hsv.h, s: clamp01(hsv.s + move[0]), v: clamp01(hsv.v + move[1]) });
  };

  const hueColor = hsvToRgb({ h: hsv.h, s: 1, v: 1 });
  const s = Math.round(hsv.s * 100);
  const v = Math.round(hsv.v * 100);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={areaRef}
        role="slider"
        tabIndex={0}
        aria-label={labels.area}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={s}
        aria-valuetext={labels.areaValue(s, v)}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          fromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event);
        }}
        onKeyDown={onKeyDown}
        className="relative h-32 w-full cursor-crosshair touch-none rounded-control"
        style={{
          backgroundColor: `rgb(${String(hueColor.r)}, ${String(hueColor.g)}, ${String(hueColor.b)})`,
          backgroundImage:
            'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
          style={{ left: `${String(hsv.s * 100)}%`, bottom: `${String(hsv.v * 100)}%` }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Slider
          label={labels.hue}
          min={0}
          max={359}
          value={Math.round(hsv.h)}
          formatValue={(h) => `${String(h)}°`}
          onChange={(h) => {
            commit({ ...hsv, h });
          }}
        />
        <div
          aria-hidden="true"
          className="h-1.5 rounded-full"
          style={{
            background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
          }}
        />
      </div>
      <Slider
        label={labels.alpha}
        min={0}
        max={255}
        value={value.a}
        formatValue={(a) => `${String(Math.round((a / 255) * 100))}%`}
        onChange={(a) => {
          commit(hsv, a);
        }}
      />
    </div>
  );
}
