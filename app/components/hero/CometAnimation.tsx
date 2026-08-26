"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { buildStarPoints } from "../background/starGeometry";
import {
  COMET_TUNING,
  HERO_SCENE_SCROLL,
  MOBILE_SCRUB,
  MOBILE_RIBBON_SAMPLES,
} from "./sceneConfig";
import {
  buildRibbonSegmentPath,
  clamp,
  interpolateSpineSample,
  orbitGradientCoord,
  precomputeSpineSamples,
  roundCoord,
} from "./cometGeometry";

configureScrollTrigger();

export default function CometAnimation() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<SVGPathElement>(null);
  const revealMaskPathRef = useRef<SVGPathElement>(null);
  const cometGlowRef = useRef<SVGPathElement>(null);
  const starRef = useRef<SVGGElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);

  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const spine = spineRef.current;
      const revealMaskPath = revealMaskPathRef.current;
      const cometGlow = cometGlowRef.current;
      const star = starRef.current;
      const wrapper = wrapperRef.current;

      if (
        !spine ||
        !revealMaskPath ||
        !cometGlow ||
        !star ||
        !wrapper
      ) {
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
      const fullRibbonPath = buildRibbonSegmentPath(
        spineSamples,
        spineLength,
        0,
      );
      cometGlow.setAttribute("d", fullRibbonPath);

      const setReveal = (progress: number) => {
        const p = clamp(progress, 0, 1);
        const headDistance = (1 - p) * spineLength;
        const revealPath = buildRibbonSegmentPath(
          spineSamples,
          spineLength,
          headDistance,
        );

        revealMaskPath.setAttribute("d", revealPath);

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
        setReveal(1);
        return;
      }

      setReveal(COMET_TUNING.animation.initialProgress);

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
            setReveal(revealState.progress);
          },
        },
        0,
      );

    },
    {
      scope: wrapperRef,
      dependencies: [isMobile, prefersReducedMotion],
      // As with the trail background: a breakpoint cross rebuilds the reveal, so
      // the previous timeline must be reverted instead of stacking.
      revertOnUpdate: true,
    },
  );

  useGSAP(
    () => {
      const gradientEl = gradientRef.current;
      const wrapper = wrapperRef.current;
      if (!gradientEl || !wrapper) {
        return;
      }

      const trigger = wrapper.closest("section") ?? wrapper.parentElement;

      const { x1, y1, x2, y2, drift } = COMET_TUNING.gradient;

      const setGradientEndpoints = (
        nextX1: number,
        nextY1: number,
        nextX2: number,
        nextY2: number,
      ) => {
        gradientEl.setAttribute("x1", String(roundCoord(nextX1)));
        gradientEl.setAttribute("y1", String(roundCoord(nextY1)));
        gradientEl.setAttribute("x2", String(roundCoord(nextX2)));
        gradientEl.setAttribute("y2", String(roundCoord(nextY2)));
      };

      const resetGradientEndpoints = () => {
        setGradientEndpoints(x1, y1, x2, y2);
      };

      if (prefersReducedMotion) {
        resetGradientEndpoints();
        return;
      }

      const setGradientOrbit = (progress: number) => {
        const angle = progress * Math.PI * 2;

        setGradientEndpoints(
          orbitGradientCoord(x1, angle, drift.x1),
          orbitGradientCoord(y1, angle, drift.y1),
          orbitGradientCoord(x2, angle, drift.x2),
          orbitGradientCoord(y2, angle, drift.y2),
        );
      };

      setGradientOrbit(0);

      // Moving the gradient invalidates a path behind a full-viewport
      // feGaussianBlur, so every frame of this costs a large re-raster. Park it
      // whenever the hero is off screen instead of paying for it page-wide.
      const orbitState = { progress: 0 };
      const orbit = gsap.to(orbitState, {
        progress: 1,
        duration: drift.duration,
        ease: "none",
        repeat: -1,
        onUpdate: () => {
          setGradientOrbit(orbitState.progress);
        },
        paused: true,
      });

      if (!trigger) {
        orbit.play();
        return;
      }

      const visibility = ScrollTrigger.create({
        trigger,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? orbit.play() : orbit.pause()),
      });

      // The hero is on screen at load, so start the tween from its initial
      // state rather than relying on onToggle firing for it.
      if (visibility.isActive) {
        orbit.play();
      }
    },
    { scope: wrapperRef, dependencies: [prefersReducedMotion] },
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
          <linearGradient
            ref={gradientRef}
            id="cometGradient"
            x1={COMET_TUNING.gradient.x1}
            y1={COMET_TUNING.gradient.y1}
            x2={COMET_TUNING.gradient.x2}
            y2={COMET_TUNING.gradient.y2}
            gradientUnits="userSpaceOnUse"
          >
            {COMET_TUNING.gradient.stops.map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </linearGradient>

          {!isMobile && (
            <filter id="cometGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={COMET_TUNING.glow.blurStdDev} />
            </filter>
          )}

          <mask id="cometRevealMask" maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="1440" height="900" fill="black" />
            <path ref={revealMaskPathRef} d="" fill="white" />
          </mask>
        </defs>

        <path ref={spineRef} d={COMET_TUNING.spine} fill="none" opacity="0" />

        <g mask="url(#cometRevealMask)">
          <path
            ref={cometGlowRef}
            d=""
            fill="url(#cometGradient)"
            filter={isMobile ? undefined : "url(#cometGlow)"}
            opacity={isMobile ? 0.15 : COMET_TUNING.glow.opacity}
          />
        </g>

        <g
          ref={starRef}
          transform={`translate(${COMET_TUNING.gradient.x2}, ${COMET_TUNING.gradient.y2})`}
          opacity="0"
        >
          <polygon points={buildStarPoints()} fill="var(--color-amber)" />
        </g>
      </svg>
    </div>
  );
}
