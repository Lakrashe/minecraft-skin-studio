import { cn } from './cn';

/**
 * Logo mark: an isometric cube split into a 2×2 pixel grid with one
 * "freshly painted" pixel. Follows the user's accent color.
 * Original artwork — intentionally not resembling any Mojang logo or block.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <g style={{ fill: 'var(--accent)' }}>
        <path d="M16 2 29 9.5 16 17 3 9.5Z" />
        <path d="M3 9.5 16 17v14L3 23.5Z" />
        <path d="M16 17 29 9.5v14L16 31Z" />
      </g>
      {/* face shading */}
      <path d="M3 9.5 16 17v14L3 23.5Z" fill="#000" fillOpacity="0.28" />
      <path d="M16 17 29 9.5v14L16 31Z" fill="#000" fillOpacity="0.5" />
      {/* painted pixel */}
      <path d="M16 2 22.5 5.75 16 9.5 9.5 5.75Z" fill="#fff" fillOpacity="0.55" />
      {/* pixel grid */}
      <g stroke="#000" strokeOpacity="0.35" strokeWidth="0.75" fill="none">
        <path d="M22.5 5.75 9.5 13.25M9.5 5.75 22.5 13.25" />
        <path d="M9.5 13.25v14M3 16.5 16 24" />
        <path d="M22.5 13.25v14M16 24 29 16.5" />
      </g>
    </svg>
  );
}

export function Logo({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[15px] leading-tight font-semibold tracking-tight">
        {name}
      </span>
    </span>
  );
}
