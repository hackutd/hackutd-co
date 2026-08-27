"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import useNavbarTheme from "../navbar/useNavbarTheme";
import type { NavbarTheme } from "../navbar/navbarThemeOverride";
import {
  applySiteTheme,
  settleSiteThemeRequest,
  subscribeSiteThemeRequest,
} from "./siteTheme";
import { THEME_CURTAIN } from "./sceneConfig";

/**
 * The color under the top of the viewport, named for the curtain's palette
 * (see the curtain-backdrop block in globals.css).
 *
 * The navbar phases already track exactly this — which of the page's three
 * colors the reader is currently on — so the curtain reads them rather than
 * working it out a second way and risking the two disagreeing.
 */
const CURTAIN_BACKDROP: Record<NavbarTheme, string> = {
  dark: "background",
  light: "surface",
  panel: "panel",
};

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
 * theme's `--theme-curtain` — a shade off the color the page is about to
 * become, held for the whole sweep. It has to differ from that color or the
 * lift reveals an identical one and reads as nothing happening.
 *
 * Which color that is depends on where the reader is: the page background at
 * the top, the lit surface further down, the sponsor wall's white below that.
 * `data-curtain-backdrop` names the one currently under the bar so the panel
 * takes its shade off that, instead of dropping a near-black sheet over a
 * white wall that is about to stay white.
 *
 * The panel translates rather than scaling, so its leading-edge shadow keeps
 * its shape instead of being squashed by the transform.
 */
export default function ThemeCurtain() {
  const curtainRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const backdrop = useNavbarTheme();
  // Held in a ref rather than read in the effect: this changes on scroll, and
  // as a dependency it would tear down and rebuild the request subscription
  // every time the reader crosses a section edge. Only the value at the moment
  // of the click matters.
  const backdropRef = useRef<NavbarTheme>(backdrop);

  useEffect(() => {
    backdropRef.current = backdrop;
  }, [backdrop]);

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
        curtain.dataset.curtainBackdrop = CURTAIN_BACKDROP[backdropRef.current];

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
      data-curtain-backdrop="background"
      className="invisible pointer-events-none fixed inset-0 z-40 bg-curtain will-change-transform"
    >
      {/* Shadow cast by the leading edge onto whatever it is sweeping over. */}
      <div className="absolute inset-x-0 top-full h-20 bg-gradient-to-b from-black/25 to-transparent" />
    </div>
  );
}
