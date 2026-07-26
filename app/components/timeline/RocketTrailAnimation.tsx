"use client";

import { useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";
import BrandShaderBackground from "@/app/components/background/BrandShaderBackground";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  MOBILE_TIMELINE_SCRUB,
  MOBILE_TRAIL_WAVE,
  ROCKET_FILL_PATH,
  ROCKET_STROKE_PATH,
  ROCKET_SLIDE_EASE,
  TIMELINE_SCROLL,
  TIMELINE_WAVE_SPEED,
  TRAIL_WAVE,
  YEAR_MARKERS,
} from "./sceneConfig";

configureScrollTrigger();

// Width profile: narrow at rocket → spikes to peak → settles → bursts at tail.
// (t/peakT)·exp(1 − t/peakT) is a spike function that equals exactly 1 at t=peakT.
// The offset term forces hw(0) = hwMin regardless of hwEnd.
// The tailBurst term adds a dramatic flare in the last portion of the trail.
function trailHW(t: number, hwMin: number, hwPeak: number, hwEnd: number, peakT: number, hwTailBurst: number, tailSharpness: number): number {
  const spike     = (hwPeak - hwEnd) * (t / peakT) * Math.exp(1 - t / peakT);
  const offset    = (hwMin  - hwEnd) * Math.exp(-20 * t);
  const tailBurst = (hwTailBurst - hwEnd) * Math.exp(-tailSharpness * (1 - t));
  return hwEnd + spike + offset + tailBurst;
}

export default function RocketTrailAnimation() {
  const reactId = useId();
  const safeReactId = reactId.replace(/:/g, "");
  const trailMaskId = `timelineTrailMask-${safeReactId}`;
  const markerImageFilterId = `timelineMarkerImageFilter-${safeReactId}`;
  const clipRef = useRef<HTMLDivElement>(null);
  const assemblyRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<SVGGElement>(null);
  const trailPolyRef = useRef<SVGPolygonElement>(null);
  // Individual refs for each marker <g> so GSAP can wave them in sync with the trail
  const markerRefs = useRef<(SVGGElement | null)[]>([]);

  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const assembly = assemblyRef.current;
      const markers = markersRef.current;
      const clip = clipRef.current;
      const trailPoly = trailPolyRef.current;
      if (!assembly || !markers || !clip || !trailPoly) return;

      const trigger = clip.closest("section") ?? clip.parentElement;
      if (!trigger) return;

      const svg = trailPoly.ownerSVGElement;
      if (!svg) return;

      const { numPoints, startX, endX, centerY, halfWidthMin, halfWidthPeak, halfWidthEnd, peakT, maxAmplitude, staggerEach, duration, hwTailBurst, tailSharpness } = isMobile ? MOBILE_TRAIL_WAVE : TRAIL_WAVE;

      // Build polygon: top edge (left→right) then bottom edge (right→left) = closed band
      while (trailPoly.points.numberOfItems > 0) trailPoly.points.removeItem(0);

      const step = (endX - startX) / (numPoints - 1);

      for (let i = 0; i < numPoints; i++) {
        const p = trailPoly.points.appendItem(svg.createSVGPoint());
        const t = i / (numPoints - 1);
        const hw = trailHW(t, halfWidthMin, halfWidthPeak, halfWidthEnd, peakT, hwTailBurst, tailSharpness);
        p.x = startX + i * step;
        p.y = centerY - hw;
      }
      for (let i = numPoints - 1; i >= 0; i--) {
        const p = trailPoly.points.appendItem(svg.createSVGPoint());
        const t = i / (numPoints - 1);
        const hw = trailHW(t, halfWidthMin, halfWidthPeak, halfWidthEnd, peakT, hwTailBurst, tailSharpness);
        p.x = startX + i * step;
        p.y = centerY + hw;
      }

      // Position each marker group via GSAP so it owns the SVG transform
      // (children use group-relative coordinates, GSAP then animates y in the wave)
      const markerYOffset = isMobile ? -30 : 0;
      YEAR_MARKERS.forEach((marker, i) => {
        const el = markerRefs.current[i];
        if (el) gsap.set(el, { x: marker.x, y: marker.y + markerYOffset });
      });

      if (prefersReducedMotion) {
        gsap.set(assembly, { x: 0 });
        gsap.set(markers, { opacity: 1 });
        return;
      }

      // Scroll animation: rocket slides in from right
      gsap.set(assembly, { x: "100vw" });
      gsap.set(markers, { opacity: 1 });

      // --- Wave animation (created first so scroll callbacks can reference it) ---
      const topEdge: SVGPoint[] = [];
      for (let i = 0; i < numPoints; i++) topEdge.push(trailPoly.points.getItem(i));
      const bottomEdge: SVGPoint[] = [];
      for (let i = 0; i < numPoints; i++) bottomEdge.push(trailPoly.points.getItem(2 * numPoints - 1 - i));

      const waveY = (i: number): string => {
        const t = i / (numPoints - 1);
        const hw = trailHW(t, halfWidthMin, halfWidthPeak, halfWidthEnd, peakT, hwTailBurst, tailSharpness);
        const factor = Math.min(1, (hw - halfWidthMin) / (halfWidthPeak - halfWidthMin));
        return `+=${maxAmplitude * factor}`;
      };
      const staggerCfg = { each: staggerEach, repeat: -1, yoyo: true };

      const topWave = gsap.to(topEdge,    { y: waveY, stagger: staggerCfg, ease: "sine.inOut", duration, paused: true });
      const botWave = gsap.to(bottomEdge, { y: waveY, stagger: staggerCfg, ease: "sine.inOut", duration, paused: true });

      // Marker tweens — each marker syncs to the trail point at its x position.
      // Matching the stagger delay (idx * staggerEach) keeps it phase-locked with the polygon.
      const markerTweens: gsap.core.Tween[] = [];
      YEAR_MARKERS.forEach((marker, i) => {
        const el = markerRefs.current[i];
        if (!el) return;
        const idx = Math.max(0, Math.min(numPoints - 1, Math.round((marker.x - startX) / step)));
        const t   = idx / (numPoints - 1);
        const hw  = trailHW(t, halfWidthMin, halfWidthPeak, halfWidthEnd, peakT, hwTailBurst, tailSharpness);
        const amp = maxAmplitude * Math.min(1, (hw - halfWidthMin) / (halfWidthPeak - halfWidthMin));
        markerTweens.push(
          gsap.to(el, { y: `+=${amp}`, delay: idx * staggerEach, duration, ease: "sine.inOut", repeat: -1, yoyo: true, paused: true }),
        );
      });

      // Collect all wave tweens so speed control is applied uniformly
      const allWaveTweens = [topWave, botWave, ...markerTweens];
      allWaveTweens.forEach(tw => tw.timeScale(TIMELINE_WAVE_SPEED.active));

      // Run the wave tweens only while the timeline section is on screen
      ScrollTrigger.create({
        trigger,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => allWaveTweens.forEach(tw => tw.paused(!self.isActive)),
      });

      let rocketDone = false;
      const setWaveSpeed = (slow: boolean) => {
        const ts = slow ? TIMELINE_WAVE_SPEED.settled : TIMELINE_WAVE_SPEED.active;
        allWaveTweens.forEach(tw =>
          gsap.to(tw, {
            timeScale: ts,
            duration: TIMELINE_WAVE_SPEED.transitionDuration,
            ease: "power1.inOut",
            overwrite: true,
          }),
        );
      };

      // --- Scroll-driven rocket slide ---
      const scrub = isMobile ? MOBILE_TIMELINE_SCRUB : TIMELINE_SCROLL.scrub;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: TIMELINE_SCROLL.start,
          end: TIMELINE_SCROLL.end,
          scrub,
          onUpdate(self) {
            const done = self.progress >= 0.88;
            if (done !== rocketDone) { rocketDone = done; setWaveSpeed(done); }
          },
          onLeave()      { if (!rocketDone) { rocketDone = true;  setWaveSpeed(true);  } },
          onEnterBack()  {                    rocketDone = false; setWaveSpeed(false); },
          onLeaveBack()  {                    rocketDone = false; setWaveSpeed(false); },
        },
      });

      tl.to(assembly, { x: 0, ease: CustomEase.create("rocketSlide", ROCKET_SLIDE_EASE), duration: 0.88 }, 0);
    },
    { scope: clipRef, dependencies: [isMobile, prefersReducedMotion] },
  );

  // Font sizes scale with the SVG (which scales with viewport width).
  // SVG viewBox is 1371 wide. At typical 1440px desktop the scale ≈ 1.
  // On mobile (390px) scale ≈ 0.28, so we use larger SVG-unit values.
  const yearFontSize = isMobile ? 26 : 18;
  const nameFontSize = isMobile ? 18 : 9;
  const nameLetterSpacing = isMobile ? 2.0 : 1.5;

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
          className="w-screen text-foreground"
          style={{ height: "auto", minWidth: isMobile ? "300px" : "900px", overflow: "visible" }}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask
              id={trailMaskId}
              maskUnits="userSpaceOnUse"
              x="0"
              y="-180"
              width="1371"
              height="760"
            >
              <rect x="0" y="-180" width="1371" height="760" fill="black" />
              <polygon ref={trailPolyRef} fill="white" />
            </mask>

            <filter
              id={markerImageFilterId}
              x="-60%"
              y="-60%"
              width="220%"
              height="220%"
            >
              <feDropShadow
                dx="0"
                dy="6"
                stdDeviation="4"
                floodColor="#000000"
                floodOpacity="0.35"
              />
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor="#ffffff"
                floodOpacity="0.2"
              />
            </filter>
          </defs>

          <foreignObject
            x="0"
            y="-180"
            width="1371"
            height="760"
            mask={`url(#${trailMaskId})`}
          >
            <div
              className="h-full w-full"
              style={{ height: "100%", width: "100%" }}
            >
              <BrandShaderBackground />
            </div>
          </foreignObject>

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

          {/* Year markers ride with the rocket trail as the assembly slides in */}
          <g ref={markersRef}>
            {YEAR_MARKERS.map((marker, i) => {
              // ref lets GSAP set translate(marker.x, marker.y) and then wave the y
              // children use group-relative coords (origin = marker center)
              const labelBaseY = marker.imageHeight / 2 + yearFontSize * 1.2;
              const inner = (
                <>
                  <image
                    href={marker.image}
                    x={-marker.imageWidth / 2}
                    y={-marker.imageHeight / 2}
                    width={marker.imageWidth}
                    height={marker.imageHeight}
                    preserveAspectRatio="xMidYMid meet"
                    filter={`url(#${markerImageFilterId})`}
                  />
                  <text
                    x={0}
                    y={labelBaseY}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize={yearFontSize}
                    fontWeight="700"
                    fontFamily="var(--font-satoshi, sans-serif)"
                  >
                    {marker.year}
                  </text>
                  <text
                    x={0}
                    y={labelBaseY + nameFontSize * 1.6}
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize={nameFontSize}
                    fontWeight="600"
                    letterSpacing={nameLetterSpacing}
                    fontFamily="var(--font-satoshi, sans-serif)"
                  >
                    {marker.name}
                  </text>
                </>
              );

              return (
                <g key={marker.year} ref={el => { markerRefs.current[i] = el; }}>
                  {marker.href ? (
                    <a
                      href={marker.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ pointerEvents: "auto", cursor: "pointer" }}
                    >
                      {inner}
                    </a>
                  ) : inner}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
