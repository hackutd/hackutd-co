"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { LogoDraw } from "./LogoDraw";
import { LOGO_DRAW, PRELOADER } from "./sceneConfig";

type Phase = "drawing" | "leaving" | "done";

/** Marks the navbar's wordmark so the drawn logo can sit exactly over it. */
const NAVBAR_LOGO_SELECTOR = "[data-navbar-logo] img";

/**
 * Full-screen overlay that draws the wordmark once, fades out and unmounts.
 * The hero's live skyline (DallasSkyline) is already running underneath, so
 * the overlay simply lifts off it.
 *
 * It sits on top of the already-rendered page rather than replacing it, so
 * nothing reflows when it leaves and LCP is not held hostage by the timer.
 * Dismissal waits for the whole draw cycle so a fast load never shows a
 * half-drawn logo; under reduced motion the static logo just fades in and out.
 *
 * The wordmark is laid over the navbar's own logo, measured from the DOM
 * rather than mirrored in classes (its vertical offset depends on the height
 * of the controls beside it), so the overlay lifts onto the real logo at any
 * screen size.
 */
export function Preloader() {
  const [phase, setPhase] = useState<Phase>("drawing");
  const prefersReducedMotion = usePrefersReducedMotion();
  const logoRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const logo = logoRef.current;
    const target = document.querySelector<HTMLElement>(NAVBAR_LOGO_SELECTOR);
    if (!logo || !target) return;

    const place = () => {
      const { left, top, width, height } = target.getBoundingClientRect();
      Object.assign(logo.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        visibility: "visible",
      });
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(target);
    window.addEventListener("resize", place);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

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
      {/* Hidden until placed over the navbar logo, so it never flashes at a
          guessed position before hydration. */}
      <div ref={logoRef} className="invisible absolute">
        <LogoDraw className="block h-full w-full" />
      </div>
    </div>
  );
}
