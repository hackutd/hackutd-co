import type { CSSProperties } from "react";

import { LOGO_ACCENT, LOGO_PATHS, LOGO_VIEWBOX } from "./logoPaths";

/**
 * The HackUTD wordmark as bare paths that stroke on left to right, then fill.
 * Motion lives entirely in `.logo-draw-path` (globals.css); each path just
 * carries its normalized position in the stagger via `--logo-i`.
 *
 * `pathLength={1}` normalizes every glyph so one `stroke-dasharray: 1`
 * keyframe draws all of them regardless of real length.
 */
export function LogoDraw({
  className,
  title = "HackUTD",
}: {
  className?: string;
  title?: string;
}) {
  const last = LOGO_PATHS.length - 1;

  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {LOGO_PATHS.map((p, i) => (
        <path
          key={i}
          d={p.d}
          transform={`translate(${p.x} ${p.y})`}
          pathLength={1}
          className="logo-draw-path"
          style={
            {
              "--logo-i": i / last,
              color: p.accent ? LOGO_ACCENT : undefined,
            } as CSSProperties
          }
        />
      ))}
    </svg>
  );
}
