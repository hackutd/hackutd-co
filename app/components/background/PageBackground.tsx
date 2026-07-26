"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  dispatchNavbarThemeOverride,
  type NavbarTheme,
} from "../navbar/navbarThemeOverride";
import {
  NAVBAR_LIGHT_THRESHOLD,
  PAGE_BG_PHASES,
  PAGE_BG_SMOOTHING,
  PAGE_BG_SNAP_DELTA,
} from "./sceneConfig";

configureScrollTrigger();

/**
 * Owns the page background and the navbar light/dark theme.
 *
 * The light layer's opacity is a pure function of scroll position: each
 * phase gets a plain ScrollTrigger (no tween) and on every update the last
 * phase in page order with progress > 0 determines the value. A single
 * quickTo writer applies it with a short catch-up for the scrub feel, so
 * there are never competing tweens fighting over the same property and the
 * background can't get stuck in the wrong state after a fast scroll.
 */
export default function PageBackground() {
  const lightLayerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const lightLayer = lightLayerRef.current;
      if (!lightLayer) {
        return;
      }

      gsap.set(lightLayer, { opacity: 0 });

      if (prefersReducedMotion) {
        // Reduced-motion fallbacks paint their own section backgrounds and
        // declare data-navbar-theme, which useNavbarTheme observes directly.
        return;
      }

      const smoothing = isMobile
        ? PAGE_BG_SMOOTHING.mobile
        : PAGE_BG_SMOOTHING.desktop;
      const setOpacity = gsap.quickTo(lightLayer, "opacity", {
        duration: smoothing,
        ease: "none",
      });

      let navbarTheme: NavbarTheme | null = null;

      const phases: {
        from: number;
        to: number;
        easeFn: gsap.EaseFunction;
        trigger: ScrollTrigger;
      }[] = [];

      for (const phase of PAGE_BG_PHASES) {
        const el = document.querySelector<HTMLElement>(`[${phase.attr}]`);
        if (!el) {
          continue;
        }

        phases.push({
          from: phase.from,
          to: phase.to,
          easeFn: gsap.parseEase(phase.ease),
          trigger: ScrollTrigger.create({
            trigger: el,
            start: phase.start,
            end: phase.end,
            onUpdate: () => update(),
            onRefresh: () => update(),
          }),
        });
      }

      function update() {
        let value = 0;
        for (const phase of phases) {
          const { progress } = phase.trigger;
          if (progress > 0) {
            value = gsap.utils.interpolate(
              phase.from,
              phase.to,
              phase.easeFn(progress),
            );
          }
        }

        const current = Number(gsap.getProperty(lightLayer, "opacity"));
        if (Math.abs(value - current) >= PAGE_BG_SNAP_DELTA) {
          gsap.set(lightLayer, { opacity: value });
        }
        setOpacity(value);

        const nextTheme: NavbarTheme =
          value >= NAVBAR_LIGHT_THRESHOLD ? "light" : "dark";
        if (nextTheme !== navbarTheme) {
          navbarTheme = nextTheme;
          dispatchNavbarThemeOverride(nextTheme);
        }
      }

      update();

      return () => {
        dispatchNavbarThemeOverride(null);
      };
    },
    { dependencies: [isMobile, prefersReducedMotion], revertOnUpdate: true },
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-background" />
      <div
        ref={lightLayerRef}
        className="absolute inset-0 bg-(--color-surface) opacity-0"
      />
    </div>
  );
}
