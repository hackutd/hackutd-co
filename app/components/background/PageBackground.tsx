"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  DIRECTORS_SECTION_DATA_ATTR,
  HERO_SCENE_DATA_ATTR,
  MISSION_SECTION_DATA_ATTR,
  PAGE_BG_DARKEN,
  PAGE_BG_MOBILE_WHITEOUT_SCRUB,
  PAGE_BG_WHITEOUT,
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

      gsap.set(lightLayer, { opacity: 0 });

      const heroScene = document.querySelector<HTMLElement>(
        `[${HERO_SCENE_DATA_ATTR}]`,
      );
      const missionSection = document.querySelector<HTMLElement>(
        `[${MISSION_SECTION_DATA_ATTR}]`,
      );
      const directorsSection = document.querySelector<HTMLElement>(
        `[${DIRECTORS_SECTION_DATA_ATTR}]`,
      );

      if (prefersReducedMotion) {
        const setLightLayer = (isLight: boolean) => {
          gsap.set(lightLayer, { opacity: isLight ? 1 : 0 });
        };

        const missionRect = missionSection?.getBoundingClientRect();
        const directorsRect = directorsSection?.getBoundingClientRect();
        const isMissionVisible =
          missionRect !== undefined &&
          missionRect.top < window.innerHeight &&
          missionRect.bottom > 0;
        const isDirectorsActive =
          directorsRect !== undefined && directorsRect.top <= 0;

        setLightLayer(isMissionVisible && !isDirectorsActive);

        if (missionSection) {
          ScrollTrigger.create({
            trigger: missionSection,
            start: "top bottom",
            end: "bottom top",
            onEnter: () => setLightLayer(true),
            onEnterBack: () => setLightLayer(true),
            onLeave: () => setLightLayer(false),
            onLeaveBack: () => setLightLayer(false),
          });
        }

        if (directorsSection) {
          ScrollTrigger.create({
            trigger: directorsSection,
            start: PAGE_BG_DARKEN.start,
            onEnter: () => setLightLayer(false),
            onEnterBack: () => setLightLayer(false),
            onLeaveBack: () => setLightLayer(true),
          });
        }

        return;
      }

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

      if (directorsSection) {
        gsap.fromTo(
          lightLayer,
          { opacity: 1 },
          {
            opacity: 0,
            ease: PAGE_BG_DARKEN.ease,
            immediateRender: false,
            scrollTrigger: {
              trigger: directorsSection,
              start: PAGE_BG_DARKEN.start,
              end: PAGE_BG_DARKEN.end,
              scrub: PAGE_BG_DARKEN.scrub,
            },
          },
        );
      }
    },
    { dependencies: [isMobile, prefersReducedMotion], revertOnUpdate: true },
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    >
      <div className="absolute inset-0 bg-background" />
      <div
        ref={lightLayerRef}
        className="absolute inset-0 bg-[var(--color-surface)] opacity-0"
      />
    </div>
  );
}
