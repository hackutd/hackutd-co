import type { CSSProperties } from "react";

import { SKYLINE_PATHS, SKYLINE_VIEWBOX } from "./skylinePaths";

/**
 * The hero's Dallas skyline, stroked on left to right like the wordmark.
 * Each outline draws via `.logo-draw-path`; because the outlines trace the
 * original pen lines, the trailing fill fade lands on the hero's own artwork.
 */
export function SkylineDraw({ className }: { className?: string }) {
  const last = SKYLINE_PATHS.length - 1;

  return (
    <svg
      viewBox={SKYLINE_VIEWBOX}
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
