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

      const { numPoints, startX, endX, centerY, halfWidthMin, halfWidthPeak, halfWidthEnd, peakT, maxAmplitude, staggerEach, duration, hwTailBurst, tailSharpness } = TRAIL_WAVE;

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
      YEAR_MARKERS.forEach((marker, i) => {
        const el = markerRefs.current[i];
        if (el) gsap.set(el, { x: marker.x, y: marker.y });
      });

      if (prefersReducedMotion) {
        gsap.set(assembly, { x: 0 });
        gsap.set(markers, { opacity: 1 });
        return;
      }

      // Scroll animation: rocket slides in from right
      gsap.set(assembly, { x: "100vw" });
      gsap.set(markers, { opacity: 0 });

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

      const topWave = gsap.to(topEdge,    { y: waveY, stagger: staggerCfg, ease: "sine.inOut", duration });
      const botWave = gsap.to(bottomEdge, { y: waveY, stagger: staggerCfg, ease: "sine.inOut", duration });

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
          gsap.to(el, { y: `+=${amp}`, delay: idx * staggerEach, duration, ease: "sine.inOut", repeat: -1, yoyo: true }),
        );
      });

      // Collect all wave tweens so speed control is applied uniformly
      const FAST_TS = 1.6;
      const SLOW_TS = 0.35;
      const allWaveTweens = [topWave, botWave, ...markerTweens];
      allWaveTweens.forEach(tw => tw.timeScale(FAST_TS));

      let rocketDone = false;
      const setWaveSpeed = (slow: boolean) => {
        const ts = slow ? SLOW_TS : FAST_TS;
        allWaveTweens.forEach(tw =>
          gsap.to(tw, { timeScale: ts, duration: 1.2, ease: "power1.inOut", overwrite: true }),
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
          style={{ height: "auto", minWidth: "900px", overflow: "visible" }}
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

          {/* Animated wave trail polygon — points built imperatively in useGSAP */}
          <polygon
            ref={trailPolyRef}
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
            {YEAR_MARKERS.map((marker, i) => (
              // ref lets GSAP set translate(marker.x, marker.y) and then wave the y
              // children use group-relative coords (origin = marker center)
              <g key={marker.year} ref={el => { markerRefs.current[i] = el; }}>
                <ellipse cx={0} cy={0} rx={marker.rx} ry={marker.ry} fill="white" />
                <text
                  x={0}
                  y={marker.ry + yearFontSize * 1.2}
                  textAnchor="middle"
                  fill="white"
                  fontSize={yearFontSize}
                  fontWeight="600"
                  fontFamily="var(--font-satoshi, sans-serif)"
                >
                  {marker.year}
                </text>
                <text
                  x={0}
                  y={marker.ry + yearFontSize * 1.2 + nameFontSize * 1.6}
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
