"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import BrandShaderBackground from "../background/BrandShaderBackground";
import {
  COMET_TUNING,
  HERO_SCENE_SCROLL,
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

      const setReveal = (progress: number, wavePhase: number) => {
        const p = clamp(progress, 0, 1);
        const headDistance = (1 - p) * spineLength;
        const revealPath = buildRibbonSegmentPath(
          spineSamples,
          spineLength,
          headDistance,
          {
            amplitude: isMobile
              ? COMET_TUNING.wave.mobileAmplitude
              : COMET_TUNING.wave.amplitude,
            frequency: COMET_TUNING.wave.frequency,
            phase: wavePhase,
          },
        );

        maskPath.setAttribute("d", revealPath);
      };

      if (prefersReducedMotion) {
        setReveal(1, 0);
        return;
      }

      const revealState = {
        progress: COMET_TUNING.animation.initialProgress,
        wavePhase: 0,
      };

      const renderTrail = () => {
        setReveal(revealState.progress, revealState.wavePhase);
      };

      renderTrail();

      // The wave rebuilds a several-hundred-point ribbon path and writes it to
      // an SVG mask on every frame. Left unattended it keeps doing that for the
      // whole page, stealing frames from sections that are nowhere near the
      // hero — so it only runs while the hero is actually on screen.
      const wave = gsap.to(revealState, {
        wavePhase: Math.PI * 2,
        duration: COMET_TUNING.wave.duration,
        ease: "none",
        repeat: -1,
        onUpdate: renderTrail,
        paused: true,
      });

      const visibility = ScrollTrigger.create({
        trigger,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? wave.play() : wave.pause()),
      });

      // The hero is on screen at load, so start the tween from its initial
      // state rather than relying on onToggle firing for it.
      if (visibility.isActive) {
        wave.play();
      }

      gsap.to(revealState, {
        progress: 1,
        duration: COMET_TUNING.animation.duration,
        ease: "none",
        onUpdate: renderTrail,
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
      // The ribbon is re-sampled at the new breakpoint, so the previous trail
      // has to be reverted rather than left running alongside the new one.
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
          <mask id="cometShaderMask" maskUnits="userSpaceOnUse">
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
          mask="url(#cometShaderMask)"
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
