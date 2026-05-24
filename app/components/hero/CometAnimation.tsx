"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  COMET_TUNING,
  HERO_SCENE_SCROLL,
  MOBILE_SCRUB,
  MOBILE_RIBBON_SAMPLES,
} from "./sceneConfig";
import {
  buildStarPoints,
  clamp,
  interpolateSpineSample,
  precomputeSpineSamples,
  roundCoord,
} from "./cometGeometry";

configureScrollTrigger();

export default function CometAnimation() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<SVGPathElement>(null);
  const starRef = useRef<SVGGElement>(null);

  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const spine = spineRef.current;
      const star = starRef.current;
      const wrapper = wrapperRef.current;

      if (!spine || !star || !wrapper) {
        return;
      }

      const trigger = wrapper.closest("section") ?? wrapper.parentElement;
      if (!trigger) {
        return;
      }

      const sampleCount = isMobile
        ? MOBILE_RIBBON_SAMPLES
        : COMET_TUNING.ribbon.samples;
      const scrubValue = isMobile ? MOBILE_SCRUB : HERO_SCENE_SCROLL.scrub;

      const spineLength = spine.getTotalLength();
      const spineSamples = precomputeSpineSamples(
        spine,
        spineLength,
        sampleCount,
      );

      const setStarProgress = (progress: number) => {
        const p = clamp(progress, 0, 1);
        const headDistance = (1 - p) * spineLength;
        const head = interpolateSpineSample(
          spineSamples,
          spineLength,
          headDistance,
        );
        star.setAttribute(
          "transform",
          `translate(${roundCoord(head.x)}, ${roundCoord(head.y)})`,
        );
        star.setAttribute("opacity", p <= 0 ? "0" : "1");
      };

      if (prefersReducedMotion) {
        setStarProgress(1);
        return;
      }

      setStarProgress(COMET_TUNING.animation.initialProgress);

      const revealState = {
        progress: COMET_TUNING.animation.initialProgress,
      };

      const revealTimeline = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: HERO_SCENE_SCROLL.start,
          end: HERO_SCENE_SCROLL.end,
          scrub: scrubValue,
        },
      });

      revealTimeline.to(
        revealState,
        {
          progress: 1,
          duration: COMET_TUNING.animation.duration,
          ease: "none",
          onUpdate: () => {
            setStarProgress(revealState.progress);
          },
        },
        0,
      );
    },
    { scope: wrapperRef, dependencies: [isMobile, prefersReducedMotion] },
  );

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none h-full w-full overflow-hidden"
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        <path ref={spineRef} d={COMET_TUNING.spine} fill="none" opacity="0" />

        <g ref={starRef} opacity="0">
          <polygon
            points={buildStarPoints(
              COMET_TUNING.star.outer,
              COMET_TUNING.star.inner,
            )}
            fill="var(--color-foreground)"
          />
        </g>
      </svg>
    </div>
  );
}
