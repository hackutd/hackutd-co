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
  PAGE_BG_PANEL_PHASES,
  PAGE_BG_PHASES,
  PAGE_BG_SMOOTHING,
  PAGE_BG_SNAP_DELTA,
  type PageBgPhase,
} from "./sceneConfig";

configureScrollTrigger();

/** A configured phase paired with the ScrollTrigger reporting its progress. */
type LivePhase = {
  from: number;
  to: number;
  easeFn: gsap.EaseFunction;
  trigger: ScrollTrigger;
};

/**
 * Owns the page background and the navbar light/dark theme.
 *
 * Each layer's opacity is a pure function of scroll position: each phase gets
 * a plain ScrollTrigger (no tween) and on every update the last phase in page
 * order with progress > 0 determines that layer's value. A single quickTo
 * writer per layer applies it with a short catch-up for the scrub feel, so
 * there are never competing tweens fighting over the same property and the
 * background can't get stuck in the wrong state after a fast scroll.
 *
 * Two layers stack on the base background, each with its own phase list: the
 * light layer carries the page between the base and surface colors, and above
 * it the panel layer carries it the rest of the way to the sponsor wall's
 * fixed white as that section approaches, landing on exactly the color the
 * wall paints itself. They are kept separate so the wall's arrival can't
 * disturb the light layer the navbar theme is read from.
 */
export default function PageBackground() {
  const lightLayerRef = useRef<HTMLDivElement>(null);
  const panelLayerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const lightLayer = lightLayerRef.current;
      const panelLayer = panelLayerRef.current;
      if (!lightLayer || !panelLayer) {
        return;
      }

      gsap.set([lightLayer, panelLayer], { opacity: 0 });

      if (prefersReducedMotion) {
        // Reduced-motion fallbacks paint their own section backgrounds and
        // declare data-navbar-theme, which useNavbarTheme observes directly.
        return;
      }

      const smoothing = isMobile
        ? PAGE_BG_SMOOTHING.mobile
        : PAGE_BG_SMOOTHING.desktop;
      /**
       * One layer's opacity writer. Eases toward the value for the scrub feel,
       * but snaps when a scroll jump moves it more than PAGE_BG_SNAP_DELTA in
       * a single update, so an opaque section edge is never crossed mid-catch-up.
       */
      const createLayerWriter = (layer: HTMLElement) => {
        const setOpacity = gsap.quickTo(layer, "opacity", {
          duration: smoothing,
          ease: "none",
        });

        return (value: number) => {
          const current = Number(gsap.getProperty(layer, "opacity"));
          if (Math.abs(value - current) >= PAGE_BG_SNAP_DELTA) {
            gsap.set(layer, { opacity: value });
          }
          setOpacity(value);
        };
      };

      const writeLight = createLayerWriter(lightLayer);
      const writePanel = createLayerWriter(panelLayer);

      let navbarTheme: NavbarTheme | null = null;

      /**
       * Both lists are declared up front and filled in place rather than
       * returned: ScrollTrigger.create() refreshes synchronously, so the first
       * trigger built calls update() — which reads both — before the last one
       * exists. Empty or half-built is fine there (a phase yet to be created
       * reads as progress 0); binding the lists afterwards is not, and leaves
       * update() reaching into the temporal dead zone.
       */
      const phases: LivePhase[] = [];
      const panelPhases: LivePhase[] = [];

      const createPhases = (
        configs: readonly PageBgPhase[],
        live: LivePhase[],
      ) => {
        for (const phase of configs) {
          const el = document.querySelector<HTMLElement>(`[${phase.attr}]`);
          if (!el) {
            continue;
          }

          live.push({
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
      };

      /** Last phase in page order with progress > 0 owns the value. */
      const resolve = (live: LivePhase[]) => {
        let value = 0;

        for (const phase of live) {
          const { progress } = phase.trigger;
          if (progress > 0) {
            value = gsap.utils.interpolate(
              phase.from,
              phase.to,
              phase.easeFn(progress),
            );
          }
        }

        return value;
      };

      createPhases(PAGE_BG_PHASES, phases);
      createPhases(PAGE_BG_PANEL_PHASES, panelPhases);

      function update() {
        const value = resolve(phases);
        writeLight(value);
        writePanel(resolve(panelPhases));

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
      {/* Above the light layer: the sponsor wall's own panel color, painted
          from the same token the wall itself uses so the two can never differ
          by the step that made the join visible. */}
      <div
        ref={panelLayerRef}
        className="absolute inset-0 bg-(--sponsor-panel) opacity-0"
      />
    </div>
  );
}
