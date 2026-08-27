"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  TIMELINE_LIGHTEN_LEAD_PERCENT,
  TIMELINE_LIGHTEN_PHASE,
  TIMELINE_SECTION_DATA_ATTR,
} from "../background/sceneConfig";
import RocketTrailAnimation from "./RocketTrailAnimation";
import { TIMELINE_EXIT_FADE, TIMELINE_LAYOUT } from "./sceneConfig";

configureScrollTrigger();

export default function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      const heading = headingRef.current;
      if (!section || !sticky || !heading || prefersReducedMotion) {
        return;
      }

      // The section is still approaching while the page background crossfades.
      // Counter its remaining travel so the heading is already parked at its
      // final viewport coordinates, then reveal it over that same scroll range.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: TIMELINE_LIGHTEN_PHASE.start,
            end: TIMELINE_LIGHTEN_PHASE.end,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(
          heading,
          {
            y: () =>
              -(window.innerHeight * TIMELINE_LIGHTEN_LEAD_PERCENT) / 100,
          },
          { y: 0, duration: 1, ease: "none" },
          0,
        )
        .fromTo(
          heading,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 1,
            ease: TIMELINE_LIGHTEN_PHASE.ease,
          },
          0,
        );

      // Dissolve the parked fuel plume into the page background — the
      // crossfade that carries the scene into Sponsors.
      gsap.to(sticky, {
        autoAlpha: 0,
        ease: TIMELINE_EXIT_FADE.ease,
        scrollTrigger: {
          trigger: section,
          start: TIMELINE_EXIT_FADE.start,
          end: TIMELINE_EXIT_FADE.end,
          scrub: TIMELINE_EXIT_FADE.scrub,
        },
      });
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="history"
      aria-labelledby="history-heading"
      data-section-gradient="history"
      {...(prefersReducedMotion
        ? { "data-navbar-theme": "light" }
        : { [TIMELINE_SECTION_DATA_ATTR]: "" })}
      className={`relative ${prefersReducedMotion ? "bg-surface" : ""} ${TIMELINE_LAYOUT.minHeight}`}
    >
      <div
        ref={stickyRef}
        className={`sticky top-0 ${TIMELINE_LAYOUT.stickyViewportHeight}`}
      >
        <h2
          ref={headingRef}
          id="history-heading"
          className={`pointer-events-none absolute top-20 left-8 z-10 font-sans text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[0.9] tracking-[-0.045em] text-surface-foreground sm:left-10 md:top-24 lg:left-12 ${prefersReducedMotion ? "visible opacity-100" : "invisible opacity-0"}`}
        >
          History
        </h2>
        <RocketTrailAnimation />
      </div>
    </section>
  );
}
