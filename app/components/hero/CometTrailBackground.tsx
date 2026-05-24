"use client";

import { useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import BrandShaderBackground from "@/app/components/background/BrandShaderBackground";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  COMET_TUNING,
  HERO_SCENE_SCROLL,
  MOBILE_COMET_WAVE,
  MOBILE_RIBBON_SAMPLES,
  MOBILE_SCRUB,
} from "./sceneConfig";
import {
  buildRibbonSegmentPath,
  clamp,
  precomputeSpineSamples,
} from "./cometGeometry";

configureScrollTrigger();

export default function CometTrailBackground() {
  const reactId = useId();
  const maskId = `cometShaderMask-${reactId.replace(/:/g, "")}`;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<SVGPathElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      const spine = spineRef.current;
      const maskPath = maskPathRef.current;

      if (!wrapper || !spine || !maskPath) {
        return;
      }

      const trigger = wrapper.closest("section") ?? wrapper.parentElement;
      if (!trigger) {
        return;
      }

      const sampleCount = isMobile
        ? MOBILE_RIBBON_SAMPLES
        : COMET_TUNING.ribbon.samples;
      const spineLength = spine.getTotalLength();
      const spineSamples = precomputeSpineSamples(
        spine,
        spineLength,
        sampleCount,
      );
      const wave = isMobile ? MOBILE_COMET_WAVE : COMET_TUNING.wave;
      const trailState: {
        progress: number;
        elapsed: number;
      } = {
        progress: COMET_TUNING.animation.initialProgress,
        elapsed: 0,
      };

      const renderTrail = (withWave = true) => {
        const p = clamp(trailState.progress, 0, 1);
        const headDistance = (1 - p) * spineLength;
        const revealPath = buildRibbonSegmentPath(
          spineSamples,
          spineLength,
          headDistance,
          withWave
            ? {
                ...wave,
                elapsed: trailState.elapsed,
              }
            : undefined,
        );

        maskPath.setAttribute("d", revealPath);
      };

      if (prefersReducedMotion) {
        trailState.progress = 1;
        renderTrail(false);
        return;
      }

      renderTrail();

      gsap.to(trailState, {
        elapsed: wave.duration * 2,
        duration: wave.duration * 2,
        ease: "none",
        repeat: -1,
        onUpdate: renderTrail,
      });

      gsap.to(trailState, {
        progress: 1,
        duration: COMET_TUNING.animation.duration,
        ease: "none",
        onUpdate: () => {
          renderTrail();
        },
        scrollTrigger: {
          trigger,
          start: HERO_SCENE_SCROLL.start,
          end: HERO_SCENE_SCROLL.end,
          scrub: isMobile ? MOBILE_SCRUB : HERO_SCENE_SCROLL.scrub,
        },
      });
    },
    {
      scope: wrapperRef,
      dependencies: [isMobile, prefersReducedMotion],
      revertOnUpdate: true,
    },
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
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1440" height="900" fill="black" />
            <path ref={maskPathRef} d="" fill="white" />
          </mask>
        </defs>

        <path ref={spineRef} d={COMET_TUNING.spine} fill="none" opacity="0" />

        <foreignObject
          x="0"
          y="0"
          width="1440"
          height="900"
          mask={`url(#${maskId})`}
        >
          <div
            className="h-full w-full"
            style={{ height: "100%", width: "100%" }}
          >
            <BrandShaderBackground />
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
