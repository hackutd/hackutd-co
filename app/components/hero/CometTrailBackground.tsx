"use client";

import type { ComponentProps } from "react";
import { useRef } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
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

type ShaderGradientProps = ComponentProps<typeof ShaderGradient> & {
  axesHelper?: string;
  bgColor1?: string;
  bgColor2?: string;
  destination?: string;
  embedMode?: string;
  fov?: number;
  format?: string;
  frameRate?: number;
  gizmoHelper?: string;
  pixelDensity?: number;
};

const shaderGradientProps: ShaderGradientProps = {
  animate: "on",
  axesHelper: "off",
  bgColor1: "#000000",
  bgColor2: "#000000",
  brightness: 1.5,
  cAzimuthAngle: 110,
  cDistance: 7.1,
  cPolarAngle: 104,
  cameraZoom: 10.5,
  color1: "#6C17FE",
  color3: "#FFA21F",
  color2: "#F31667",
  destination: "onCanvas",
  embedMode: "off",
  envPreset: "dawn",
  format: "gif",
  fov: 45,
  frameRate: 10,
  gizmoHelper: "hide",
  grain: "on",
  lightType: "3d",
  pixelDensity: 1,
  positionX: 0,
  positionY: -0.05,
  positionZ: 0,
  range: "disabled",
  rangeEnd: 40,
  rangeStart: 0,
  reflection: 0.1,
  rotationX: 28,
  rotationY: -18,
  rotationZ: -32,
  shader: "defaults",
  type: "sphere",
  uAmplitude: 2.2,
  uDensity: 1.7,
  uFrequency: 5.5,
  uSpeed: 0.18,
  uStrength: 0.85,
  uTime: 0,
  wireframe: false,
};

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

      gsap.to(revealState, {
        wavePhase: Math.PI * 2,
        duration: COMET_TUNING.wave.duration,
        ease: "none",
        repeat: -1,
        onUpdate: renderTrail,
      });

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
            <ShaderGradientCanvas
              className="h-full w-full"
              style={{ height: "100%", width: "100%" }}
              pixelDensity={shaderGradientProps.pixelDensity}
              fov={shaderGradientProps.fov}
              pointerEvents="none"
            >
              <ShaderGradient {...shaderGradientProps} />
            </ShaderGradientCanvas>
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}
