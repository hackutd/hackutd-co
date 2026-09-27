"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import {
  HERO_LAYOUT,
  HERO_SKYLINE,
  HERO_SKYLINE_MASK,
  HERO_SKYLINE_STROKE_FILTER,
} from "@/app/components/hero/sceneConfig";
import { LogoDraw } from "./LogoDraw";
import { SkylineDraw } from "./SkylineDraw";
import { LOGO_DRAW, PRELOADER } from "./sceneConfig";

type Phase = "drawing" | "leaving" | "done";

/** Own copy of the hero's erode filter: the hero isn't in the DOM on every route. */
const STROKE_FILTER_ID = "preloader-skyline-thin-strokes";

const ORIGINAL_SKYLINE_STYLE: CSSProperties = {
  ...HERO_SKYLINE_MASK,
  filter: `url(#${STROKE_FILTER_ID})`,
};

/**
 * Full-screen overlay that draws the wordmark and the hero skyline once,
 * fades out and unmounts.
 *
 * It sits on top of the already-rendered page rather than replacing it, so
 * nothing reflows when it leaves and LCP is not held hostage by the timer.
 * Dismissal waits for the whole draw cycle so a fast load never shows a
 * half-drawn logo; under reduced motion the static logo just fades in and out.
 */
export function Preloader() {
  const [phase, setPhase] = useState<Phase>("drawing");
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const hold = prefersReducedMotion
      ? PRELOADER.reducedMotionHoldMs
      : LOGO_DRAW.settleSeconds * 1000;
    const leave = window.setTimeout(() => setPhase("leaving"), hold);
    const done = window.setTimeout(
      () => setPhase("done"),
      hold + PRELOADER.fadeMs,
    );

    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, [prefersReducedMotion]);

  if (phase === "done") return null;

  return (
    <div
      className="preloader"
      role="status"
      aria-live="polite"
      aria-busy={phase === "drawing"}
      data-leaving={phase === "leaving" ? "" : undefined}
    >
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <filter
            id={STROKE_FILTER_ID}
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
            colorInterpolationFilters="sRGB"
          >
            <feMorphology
              in="SourceGraphic"
              operator="erode"
              radius={HERO_SKYLINE_STROKE_FILTER.radius}
            />
          </filter>
        </defs>
      </svg>
      <LogoDraw className="relative w-[min(40vw,18rem)] -translate-y-[10vh]" />
      {/* Mirrors the hero's sticky viewport and skyline band one for one. The
          traced outlines draw on, then the hero's own masked artwork fades in
          over them (`.skyline-original`) as the strokes fade out, so the
          overlay lifts onto a pixel-identical skyline. On phones the band is
          a thin strip, so `.skyline-stage` draws it zoomed in on the centre
          (cropping the flanks) and eases back to 1:1 before the hand-off. */}
      <div
        aria-hidden
        style={
          {
            [HERO_SKYLINE.heightVar]: HERO_SKYLINE.height,
            "--skyline-zoom": PRELOADER.mobileSkylineZoom,
          } as CSSProperties
        }
        className={`pointer-events-none absolute inset-x-0 top-0 ${HERO_LAYOUT.stickyViewportHeight}`}
      >
        <div
          className={`skyline-stage absolute inset-x-0 md:[--skyline-zoom:1] ${HERO_SKYLINE.layerBox}`}
        >
          <SkylineDraw className="absolute inset-0 h-full w-full" />
          <div
            style={ORIGINAL_SKYLINE_STYLE}
            className="skyline-original absolute inset-0 bg-foreground"
          />
        </div>
      </div>
    </div>
  );
}
