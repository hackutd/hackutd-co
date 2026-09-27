"use client";

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import sectionGradient from "@/app/assets/background/section-gradient.webp";
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
      {/* Same baked artwork and placement as background/SectionGradient, so
          the page's own gradient appears to already be in place when the
          overlay lifts. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 h-[clamp(34rem,max(62vw,78svh),58rem)] w-[clamp(56rem,118vw,125rem)] scale-[1.04] opacity-80"
        style={{
          bottom: "clamp(-8rem, -15svh, -3rem)",
          backgroundImage: `url(${sectionGradient.src})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      />
      <LogoDraw className="relative w-[min(40vw,18rem)] -translate-y-[10vh]" />
      {/* Same band the hero paints its skyline into, so the drawing is already
          in place when the overlay lifts. */}
      <SkylineDraw className="pointer-events-none absolute inset-x-0 bottom-[clamp(8px,3vh,36px)] w-full" />
    </div>
  );
}
