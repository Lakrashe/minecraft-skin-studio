import { useShallow } from 'zustand/react/shallow';
import type { ReactNode } from 'react';
import { getPixel, regionAt } from '@/engine';
import { useT } from '@/i18n';
import { useStudioDocument } from './document';
import { useStudio } from './studio-store';

const hex2 = (n: number) => n.toString(16).padStart(2, '0');

/** Bottom bar: inspected pixel, its region and color, and the zoom level. */
export function StatusBar() {
  const t = useT();
  const { inspected, zoom } = useStudio(
    useShallow((s) => ({ inspected: s.inspected, zoom: s.zoom })),
  );
  const { texture, document } = useStudioDocument();
  const model = document.model;

  let detail: ReactNode = <span className="text-subtle">{t('studio.status.none')}</span>;
  if (inspected) {
    const region = regionAt(inspected.x, inspected.y, model);
    const pixel = getPixel(texture, inspected.x, inspected.y);
    const regionText = region
      ? [
          t(`studio.parts.${region.part}`),
          t(`studio.status.faces.${region.face}`),
          t(region.layer === 'inner' ? 'studio.status.layerInner' : 'studio.status.layerOuter'),
        ].join(' · ')
      : t('studio.status.unused');
    const colorText =
      !pixel || pixel.a === 0
        ? t('studio.status.transparent')
        : `#${hex2(pixel.r)}${hex2(pixel.g)}${hex2(pixel.b)}${pixel.a < 255 ? ` · α ${String(pixel.a)}` : ''}`;
    detail = (
      <>
        <span className="font-mono tabular-nums">
          {t('studio.status.pixel', { x: inspected.x, y: inspected.y })}
        </span>
        <span>{regionText}</span>
        <span className="flex items-center gap-1.5 font-mono">
          {pixel && pixel.a > 0 && (
            <span
              aria-hidden="true"
              className="size-3 rounded-sm border border-line-strong"
              style={{
                backgroundColor: `rgba(${String(pixel.r)}, ${String(pixel.g)}, ${String(pixel.b)}, ${String(pixel.a / 255)})`,
              }}
            />
          )}
          {colorText}
        </span>
      </>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-9 flex-wrap items-center gap-x-5 gap-y-1 border-t border-line bg-bg-raised px-4 py-1.5 text-xs text-muted"
    >
      {detail}
      <span className="ml-auto font-mono tabular-nums">{t('studio.zoomLevel', { zoom })}</span>
    </div>
  );
}
