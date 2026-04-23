"use client";

import { useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  MOBILE_TIMELINE_SCRUB,
  ROCKET_FILL_PATH,
  ROCKET_STROKE_PATH,
  ROCKET_SLIDE_EASE,
  TIMELINE_SCROLL,
  TRAIL_GRADIENT_STOPS,
  TRAIL_PATH,
  YEAR_MARKERS,
} from "./sceneConfig";

configureScrollTrigger();

export default function RocketTrailAnimation() {
  const clipRef = useRef<HTMLDivElement>(null);
  const assemblyRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<SVGGElement>(null);

  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const assembly = assemblyRef.current;
      const markers = markersRef.current;
      const clip = clipRef.current;
      if (!assembly || !markers || !clip) return;

      const trigger = clip.closest("section") ?? clip.parentElement;
      if (!trigger) return;

      const scrub = isMobile ? MOBILE_TIMELINE_SCRUB : TIMELINE_SCROLL.scrub;

      if (prefersReducedMotion) {
        gsap.set(assembly, { x: 0 });
        gsap.set(markers, { opacity: 1 });
        return;
      }

      // Markers hidden until the rocket finishes sliding in
      gsap.set(assembly, { x: "100vw" });
      gsap.set(markers, { opacity: 0 });

      // Single scrubbed timeline: rocket slides in for 88%, then markers fade in
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: TIMELINE_SCROLL.start,
          end: TIMELINE_SCROLL.end,
          scrub,
        },
      });

      tl.to(assembly, { x: 0, ease: CustomEase.create("rocketSlide", ROCKET_SLIDE_EASE), duration: 0.88 }, 0);
      tl.to(markers, { opacity: 1, ease: "power2.out", duration: 0.12 }, 0.88);
    },
    { scope: clipRef, dependencies: [isMobile, prefersReducedMotion] },
  );

  // Font sizes scale with the SVG (which scales with viewport width).
  // SVG viewBox is 1371 wide. At typical 1440px desktop the scale ≈ 1.
  // On mobile (390px) scale ≈ 0.28, so we use larger SVG-unit values.
  const yearFontSize = isMobile ? 60 : 18;
  const nameFontSize = isMobile ? 32 : 9;
  const nameLetterSpacing = isMobile ? 4 : 1.5;

  return (
    <div
      ref={clipRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* assemblyRef is what GSAP translates horizontally */}
      <div
        ref={assemblyRef}
        className="absolute top-1/2 left-0 -translate-y-1/2"
      >
        <svg
          viewBox="0 0 1371 402"
          className="w-screen"
          style={{ height: "auto", minWidth: "900px" }}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Horizontal gradient: amber (left/rocket end) → purple (right/oldest end) */}
            <linearGradient
              id="timelineTrailGradient"
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0.5"
              x2="1"
              y2="0.5"
            >
              {TRAIL_GRADIENT_STOPS.map((stop) => (
                <stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.color}
                />
              ))}
            </linearGradient>

            {/* Subtle grain overlay — desktop only for performance */}
            {!isMobile && (
              <filter
                id="timelineGrain"
                x="-5%"
                y="-5%"
                width="110%"
                height="110%"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.5"
                  numOctaves="2"
                  stitchTiles="stitch"
                  result="noise"
                />
                <feColorMatrix
                  type="saturate"
                  values="0"
                  in="noise"
                  result="grain"
                />
                <feComponentTransfer in="grain" result="grainAlpha">
                  <feFuncA type="table" tableValues="0 0.3" />
                </feComponentTransfer>
                <feBlend
                  in="SourceGraphic"
                  in2="grainAlpha"
                  mode="overlay"
                  result="blended"
                />
                {/* Clip result to the original shape's alpha to prevent gray bleed outside the path */}
                <feComposite in="blended" in2="SourceGraphic" operator="in" />
              </filter>
            )}
          </defs>

          {/* Trail shape */}
          <path
            d={TRAIL_PATH}
            fill="url(#timelineTrailGradient)"
            filter={isMobile ? undefined : "url(#timelineGrain)"}
          />

          {/* Rocket body fill */}
          <path d={ROCKET_FILL_PATH} fill="#242425" />

          {/* Rocket outline */}
          <path
            d={ROCKET_STROKE_PATH}
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Year markers — hidden until rocket finishes sliding in */}
          <g ref={markersRef}>
            {YEAR_MARKERS.map((marker) => (
              <g key={marker.year}>
                <ellipse
                  cx={marker.x}
                  cy={marker.y}
                  rx={marker.rx}
                  ry={marker.ry}
                  fill="white"
                />
                <text
                  x={marker.x}
                  y={marker.y + marker.ry + yearFontSize * 1.2}
                  textAnchor="middle"
                  fill="white"
                  fontSize={yearFontSize}
                  fontWeight="600"
                  fontFamily="var(--font-satoshi, sans-serif)"
                >
                  {marker.year}
                </text>
                <text
                  x={marker.x}
                  y={marker.y + marker.ry + yearFontSize * 1.2 + nameFontSize * 1.6}
                  textAnchor="middle"
                  fill="white"
                  fontSize={nameFontSize}
                  letterSpacing={nameLetterSpacing}
                  fontFamily="var(--font-satoshi, sans-serif)"
                >
                  {marker.name}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
