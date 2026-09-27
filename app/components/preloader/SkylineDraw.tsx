import type { CSSProperties } from "react";

import { SKYLINE_PATHS, SKYLINE_VIEWBOX } from "./skylinePaths";

/**
 * The hero's Dallas skyline as traced outlines, stroked on left to right like
 * the wordmark via `.logo-draw-path`. `preserveAspectRatio="none"` stretches
 * it to its box exactly the way the hero's `mask-size: 100% 100%` stretches
 * the raster, so the two register when laid over each other.
 */
export function SkylineDraw({ className }: { className?: string }) {
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
          className="logo-draw-path skyline-draw-path"
          style={{ "--logo-i": i / last } as CSSProperties}
        />
      ))}
    </svg>
  );
}
