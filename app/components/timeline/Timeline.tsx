"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  TIMELINE_LIGHTEN_PHASE,
  TIMELINE_SECTION_DATA_ATTR,
} from "../background/sceneConfig";
import RocketTrailAnimation from "./RocketTrailAnimation";
import { TIMELINE_EXIT_FADE, TIMELINE_LAYOUT } from "./sceneConfig";

configureScrollTrigger();

export default function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const sticky = stickyRef.current;
      if (!section || !sticky || prefersReducedMotion) {
        return;
      }

      // Fade the sticky scene out in step with the page background's
      // dark → light crossfade so white trail text never sits on a light
      // background.
      gsap.to(sticky, {
        autoAlpha: 0,
        ease: TIMELINE_EXIT_FADE.ease,
        scrollTrigger: {
          trigger: section,
          start: TIMELINE_LIGHTEN_PHASE.start,
          end: TIMELINE_LIGHTEN_PHASE.end,
          scrub: TIMELINE_EXIT_FADE.scrub,
        },
      });
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      id="hackathons"
      {...{ [TIMELINE_SECTION_DATA_ATTR]: "" }}
      className={`relative ${TIMELINE_LAYOUT.minHeight}`}
    >
      <div
        ref={stickyRef}
        className={`sticky top-0 overflow-hidden ${TIMELINE_LAYOUT.stickyViewportHeight}`}
      >
        <RocketTrailAnimation />
      </div>
    </section>
  );
}
