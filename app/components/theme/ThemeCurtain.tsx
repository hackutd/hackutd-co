"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import {
  applySiteTheme,
  settleSiteThemeRequest,
  subscribeSiteThemeRequest,
} from "./siteTheme";
import { THEME_CURTAIN } from "./sceneConfig";

/**
 * Solid panel that drops over the page while the site theme swaps, then lifts
 * back up. The swap happens under full cover, so no section has to cross-fade
 * its own colors on screen.
 *
 * It deliberately sits below the navbar (z-40 against the navbar's z-50) so
 * the toggle stays visible and its sun/moon morph reads while the curtain
 * sweeps past.
 *
 * `data-theme` is set to the incoming theme before each run: the theme blocks
 * in globals.css are plain attribute selectors, so the panel picks up that
 * theme's `--theme-curtain` — a shade off the background the page is about to
 * become, held for the whole sweep. It has to differ from that background or
 * the lift reveals an identical color and reads as nothing happening.
 *
 * The panel translates rather than scaling, so its leading-edge shadow keeps
 * its shape instead of being squashed by the transform.
 */
export default function ThemeCurtain() {
  const curtainRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const curtain = curtainRef.current;
      if (!curtain) {
        return;
      }

      let timeline: gsap.core.Timeline | null = null;

      const unsubscribe = subscribeSiteThemeRequest((next) => {
        if (prefersReducedMotion) {
          applySiteTheme(next);
          settleSiteThemeRequest();
          return;
        }

        curtain.dataset.theme = next;

        // Enters already covering the navbar, but exits clear of the viewport:
        // on the way out the page underneath is the new theme, so the bar can
        // be uncovered without anything appearing to change.
        const restingY = THEME_CURTAIN.coverFromTop - window.innerHeight;

        timeline = gsap
          .timeline({ onComplete: settleSiteThemeRequest })
          .set(curtain, { autoAlpha: 1, y: restingY })
          .to(curtain, {
            y: 0,
            duration: THEME_CURTAIN.sweepDuration,
            ease: THEME_CURTAIN.ease,
          })
          .add(() => applySiteTheme(next))
          .to(
            curtain,
            {
              y: -window.innerHeight,
              duration: THEME_CURTAIN.sweepDuration,
              ease: THEME_CURTAIN.ease,
            },
            `+=${THEME_CURTAIN.holdDuration}`,
          )
          .set(curtain, { autoAlpha: 0 });
      });

      return () => {
        unsubscribe();
        if (timeline?.isActive()) {
          // Unmounting mid-sweep would otherwise leave the request pending
          // forever and lock out every later toggle.
          timeline.kill();
          settleSiteThemeRequest();
        }
      };
    },
    { dependencies: [prefersReducedMotion] },
  );

  return (
    <div
      ref={curtainRef}
      aria-hidden="true"
      data-theme="dark"
      className="invisible pointer-events-none fixed inset-0 z-40 bg-curtain will-change-transform"
    >
      {/* Shadow cast by the leading edge onto whatever it is sweeping over. */}
      <div className="absolute inset-x-0 top-full h-20 bg-gradient-to-b from-black/25 to-transparent" />
    </div>
  );
}
