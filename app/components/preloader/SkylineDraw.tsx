import type { CSSProperties } from "react";

import { SKYLINE_PATHS, SKYLINE_VIEWBOX } from "./skylinePaths";

/**
 * The Dallas skyline as vector outlines, stroked in `currentColor`.
 *
 * `animate` strokes it on left to right through `.logo-draw-path`; otherwise
 * it renders fully drawn. The hero shows the static version in the same band
 * the preloader animates it in, so the overlay lifts onto an identical frame.
 * The band's box (not the art's ratio) sets the size, as the raster mask did.
 */
export function SkylineDraw({
  className,
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  const last = SKYLINE_PATHS.length - 1;

  return (
    <svg
      viewBox={SKYLINE_VIEWBOX}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {SKYLINE_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          className={
            animate ? "logo-draw-path skyline-draw-path" : "skyline-line"
          }
          style={
            animate ? ({ "--logo-i": i / last } as CSSProperties) : undefined
          }
        />
      ))}
    </svg>
  );
}
