"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { HERO_LAYOUT, HERO_SKYLINE } from "@/app/components/hero/sceneConfig";
import { LogoDraw } from "./LogoDraw";
import { SkylineDraw } from "./SkylineDraw";
import { LOGO_DRAW, PRELOADER } from "./sceneConfig";

type Phase = "drawing" | "leaving" | "done";

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
      <LogoDraw className="relative w-[min(40vw,18rem)] -translate-y-[10vh]" />
      {/* Mirrors the hero's sticky viewport and skyline band one for one, so
          the finished drawing sits pixel-exact over the hero's own skyline
          when the overlay lifts. */}
      <div
        aria-hidden
        style={
          { [HERO_SKYLINE.heightVar]: HERO_SKYLINE.height } as CSSProperties
        }
        className={`pointer-events-none absolute inset-x-0 top-0 ${HERO_LAYOUT.stickyViewportHeight}`}
      >
        <div className={`absolute inset-x-0 ${HERO_SKYLINE.layerBox}`}>
          <SkylineDraw animate className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
