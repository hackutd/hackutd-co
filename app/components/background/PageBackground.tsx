"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  HERO_SCENE_DATA_ATTR,
  MISSION_STATEMENT_DATA_ATTR,
  PAGE_BG_DARKEN,
  PAGE_BG_SPONSORS_LIGHTEN,
  PAGE_BG_MOBILE_WHITEOUT_SCRUB,
  PAGE_BG_WHITEOUT,
  SPONSORS_SECTION_DATA_ATTR,
} from "./sceneConfig";

configureScrollTrigger();

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

      if (prefersReducedMotion) {
        gsap.set(lightLayer, { opacity: 0 });
        return;
      }

      gsap.set(lightLayer, { opacity: 0 });

      const heroScene = document.querySelector<HTMLElement>(
        `[${HERO_SCENE_DATA_ATTR}]`,
      );
      const missionStatement = document.querySelector<HTMLElement>(
        `[${MISSION_STATEMENT_DATA_ATTR}]`,
      );
      const sponsorsSection = document.querySelector<HTMLElement>(
        `[${SPONSORS_SECTION_DATA_ATTR}]`,
      );

      const whiteoutScrub = isMobile
        ? PAGE_BG_MOBILE_WHITEOUT_SCRUB
        : PAGE_BG_WHITEOUT.scrub;

      if (heroScene) {
        gsap.to(lightLayer, {
          opacity: 1,
          ease: PAGE_BG_WHITEOUT.ease,
          scrollTrigger: {
            trigger: heroScene,
            start: PAGE_BG_WHITEOUT.start,
            end: PAGE_BG_WHITEOUT.end,
            scrub: whiteoutScrub,
          },
        });
      }

      if (missionStatement) {
        gsap.fromTo(
          lightLayer,
          { opacity: 1 },
          {
            opacity: 0,
            ease: PAGE_BG_DARKEN.ease,
            immediateRender: false,
            scrollTrigger: {
              trigger: missionStatement,
              start: PAGE_BG_DARKEN.start,
              end: PAGE_BG_DARKEN.end,
              scrub: PAGE_BG_DARKEN.scrub,
            },
          },
        );
      }

      if (sponsorsSection) {
        gsap.to(lightLayer, {
          opacity: 1,
          ease: PAGE_BG_SPONSORS_LIGHTEN.ease,
          immediateRender: false,
          scrollTrigger: {
            trigger: sponsorsSection,
            start: PAGE_BG_SPONSORS_LIGHTEN.start,
            end: PAGE_BG_SPONSORS_LIGHTEN.end,
            scrub: PAGE_BG_SPONSORS_LIGHTEN.scrub,
          },
        });
      }
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
