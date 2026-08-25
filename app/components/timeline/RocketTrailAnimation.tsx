"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import BrandShaderBackground from "@/app/components/background/BrandShaderBackground";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { useNearViewport } from "@/app/hooks/useNearViewport";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  MOBILE_TIMELINE_SCRUB,
  MOBILE_TRAIL_WAVE,
  ROCKET_ART,
  ROCKET_SWEEP,
  TIMELINE_SCROLL,
  TRAIL_FLARE,
  TRAIL_GRADIENT,
  TRAIL_VIEWBOX,
  TRAIL_WAVE,
  YEAR_MARKERS,
} from "./sceneConfig";

configureScrollTrigger();

type TrailShape = typeof TRAIL_WAVE | typeof MOBILE_TRAIL_WAVE;

/** 0→1 ramp with zero slope at both ends, so the flare has no visible kink. */
function smoothstep(t: number): number {
  const s = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return s * s * (3 - 2 * s);
}

// Half-height of the plume at SVG x. The power curve is strictly increasing
// between the nozzle and fullWidthX, so there is no constant-width middle band
// followed by a separate flare. Values beyond fullWidthX remain full bleed,
// but are still densely sampled and animated by the travelling wave.
function trailHW(x: number, cfg: TrailShape, halfWidthFull: number): number {
  const progress = Math.max(
    0,
    Math.min(1, (x - cfg.startX) / (cfg.fullWidthX - cfg.startX)),
  );
  const growth = Math.pow(progress, cfg.growthPower);
  return cfg.halfWidthMin +
    (halfWidthFull - cfg.halfWidthMin) * growth;
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
  // The trail canvas is parked a full viewport to the right inside an
  // overflow-hidden box, so the canvas's own lazy observer can't see it until
  // the rocket has already slid into frame — by which point the trail shows the
  // page background instead of the gradient. Watching the unclipped section box
  // instead mounts it while the section is still approaching, and the rocket
  // only starts moving once that section reaches the top of the viewport.
  const shaderActive = useNearViewport(clipRef);

  const cfg = isMobile ? MOBILE_TRAIL_WAVE : TRAIL_WAVE;

  // How wide the plume has to open, in SVG units, to bleed past the top and
  // bottom of this particular viewport. Measured rather than fixed: the SVG
  // scales with viewport *width*, so a unit is worth a very different number of
  // pixels on a laptop and on a phone.
  const [halfWidthFull, setHalfWidthFull] = useState<number>(cfg.halfWidthMin);

  useLayoutEffect(() => {
    const clip = clipRef.current;
    const assembly = assemblyRef.current;
    if (!clip || !assembly) return;

    const measure = () => {
      // The assembly is a plain box wrapped around the SVG, so its width is the
      // SVG's layout width — unlike the SVG itself it can't be confused by the
      // plume overflowing the viewBox on every side.
      const pxPerUnit = assembly.getBoundingClientRect().width / TRAIL_VIEWBOX.width;
      if (!pxPerUnit) return;

      // The assembly is centred on the clip box, and the trail's centreline sits
      // a little above the middle of the viewBox, so the plume has further to
      // reach downwards than up. Size it for the longer of the two.
      const centreOffset = Math.abs(TRAIL_VIEWBOX.height / 2 - cfg.centerY);
      const reachUnits = clip.clientHeight / (2 * pxPerUnit) + centreOffset;
      const next = Math.max(cfg.halfWidthMin, reachUnits * TRAIL_FLARE.coverage);

      // Rebuilding the polygon and its tweens isn't free, so ignore the
      // few-pixel churn a mobile URL bar throws off while scrolling.
      setHalfWidthFull((prev) => (Math.abs(prev - next) < 8 ? prev : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(clip);
    return () => observer.disconnect();
  }, [cfg]);

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

      const {
        numPoints,
        startX,
        endX,
        centerY,
        maxAmplitude,
        amplitudeRampLength,
        wavelength,
        duration,
      } = cfg;

      // Sample the entire plume rather than replacing the full-width tail with
      // one endpoint. Every part of both edges can now take part in the wave.
      const step = (endX - startX) / (numPoints - 1);
      const xs: number[] = [];
      for (let i = 0; i < numPoints; i++) xs.push(startX + i * step);
      const pointCount = xs.length;

      // Build polygon: top edge (left→right) then bottom edge (right→left) = closed band
      while (trailPoly.points.numberOfItems > 0) trailPoly.points.removeItem(0);

      for (let i = 0; i < pointCount; i++) {
        const p = trailPoly.points.appendItem(svg.createSVGPoint());
        p.x = xs[i];
        p.y = centerY - trailHW(xs[i], cfg, halfWidthFull);
      }
      for (let i = pointCount - 1; i >= 0; i--) {
        const p = trailPoly.points.appendItem(svg.createSVGPoint());
        p.x = xs[i];
        p.y = centerY + trailHW(xs[i], cfg, halfWidthFull);
      }

      // Position each marker group via GSAP so it owns the SVG transform
      // (children use group-relative coordinates, GSAP then animates y in the wave)
      const markerYOffset = isMobile ? -30 : 0;
      YEAR_MARKERS.forEach((marker, i) => {
        const el = markerRefs.current[i];
        if (el) gsap.set(el, { x: marker.x, y: marker.y + markerYOffset });
      });

      if (prefersReducedMotion) {
        gsap.set(assembly, { autoAlpha: 1, x: 0 });
        gsap.set(markers, { opacity: 1 });
        return;
      }

      // x is owned by the sweep tween below (function-based, remeasured on refresh)
      gsap.set(assembly, { autoAlpha: 1 });
      gsap.set(markers, { opacity: 1 });

      // --- Wave animation (created first so scroll callbacks can reference it) ---
      const topEdge: SVGPoint[] = [];
      for (let i = 0; i < pointCount; i++) topEdge.push(trailPoly.points.getItem(i));
      const bottomEdge: SVGPoint[] = [];
      for (let i = 0; i < pointCount; i++) {
        bottomEdge.push(trailPoly.points.getItem(2 * pointCount - 1 - i));
      }

      const topBaseY = topEdge.map((point) => point.y);
      const bottomBaseY = bottomEdge.map((point) => point.y);
      const waveState = { phase: 0 };
      const phasePerUnit = (Math.PI * 2) / wavelength;

      const amplitudeAt = (x: number) =>
        maxAmplitude * smoothstep((x - startX) / amplitudeRampLength);
      const offsetAt = (x: number) =>
        Math.sin((x - startX) * phasePerUnit - waveState.phase) *
        amplitudeAt(x);

      const renderWave = () => {
        for (let i = 0; i < pointCount; i++) {
          const offset = offsetAt(xs[i]);
          topEdge[i].y = topBaseY[i] + offset;
          bottomEdge[i].y = bottomBaseY[i] + offset;
        }

        YEAR_MARKERS.forEach((marker, i) => {
          const el = markerRefs.current[i];
          if (el) {
            gsap.set(el, {
              y: marker.y + markerYOffset + offsetAt(marker.x),
            });
          }
        });
      };

      // Start with a complete wave already drawn, then advance one wavelength
      // per cycle. One phase driver keeps both edges and all markers locked.
      renderWave();
      const waveTween = gsap.to(waveState, {
        phase: Math.PI * 2,
        duration,
        ease: "none",
        repeat: -1,
        paused: true,
        onUpdate: renderWave,
      });

      // Run the wave tweens only while the timeline section is on screen
      const waveVisibility = ScrollTrigger.create({
        trigger,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => waveTween.paused(!self.isActive),
      });

      // A reload restores scroll position, so the section can already be in
      // view here — start from that state rather than relying on onToggle.
      if (waveVisibility.isActive) {
        waveTween.paused(false);
      }

      // --- Scroll-driven sweep ---
      // One tween on the assembly div carries the trail, the rocket and the year
      // markers together, right edge → left edge, in a single unbroken motion.
      // Measured in px rather than vw so the SVG's min-width floor (which makes
      // it wider than the viewport on narrow screens) is still cleared fully.
      // The exit runs far enough past the SVG's left edge to clear every marker
      // and carry the delayed full-bleed portion into place for the handoff.
      const enterX = () => clip.clientWidth + ROCKET_SWEEP.overshoot;
      const exitX = () =>
        -(assembly.getBoundingClientRect().width * ROCKET_SWEEP.plumeExit + ROCKET_SWEEP.overshoot);

      const scrub = isMobile ? MOBILE_TIMELINE_SCRUB : TIMELINE_SCROLL.scrub;
      gsap.fromTo(
        assembly,
        { x: enterX },
        {
          x: exitX,
          // A scrubbed horizontal sweep must stay linear: equal amounts of
          // document scroll should always move the assembly by equal amounts.
          ease: "none",
          scrollTrigger: {
            trigger,
            start: TIMELINE_SCROLL.start,
            end: TIMELINE_SCROLL.end,
            scrub,
            // Re-measure enterX/exitX on resize so the sweep always clears both edges
            invalidateOnRefresh: true,
          },
        },
      );
    },
    {
      scope: clipRef,
      dependencies: [cfg, isMobile, prefersReducedMotion, halfWidthFull],
      revertOnUpdate: true,
    },
  );

  // Font sizes scale with the SVG (which scales with viewport width).
  // SVG viewBox is 1371 wide. At typical 1440px desktop the scale ≈ 1.
  // On mobile (390px) scale ≈ 0.28, so we use larger SVG-unit values.
  const yearFontSize = isMobile ? 26 : 18;
  const nameFontSize = isMobile ? 18 : 9;
  const nameLetterSpacing = isMobile ? 2.0 : 1.5;

  // Mask and gradient bounds have to contain the whole plume — which now runs
  // more than two viewports past the SVG's right edge and past its top and
  // bottom as well. Everything outside these bounds is unmasked, i.e. invisible.
  const plumeHalf = halfWidthFull + cfg.maxAmplitude + TRAIL_FLARE.margin;
  const bounds = {
    x: 0,
    y: cfg.centerY - plumeHalf,
    width: cfg.endX + TRAIL_FLARE.margin,
    height: plumeHalf * 2,
  };
  const gradientRender = isMobile ? TRAIL_GRADIENT.mobileRender : TRAIL_GRADIENT.render;

  return (
    <div
      ref={clipRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* assemblyRef is what GSAP translates horizontally */}
      <div
        ref={assemblyRef}
        className="invisible absolute top-1/2 left-0 -translate-y-1/2"
      >
        <svg
          viewBox={`0 0 ${TRAIL_VIEWBOX.width} ${TRAIL_VIEWBOX.height}`}
          className="w-screen text-surface-foreground"
          style={{ height: "auto", minWidth: isMobile ? "300px" : "900px", overflow: "visible" }}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask
              id={trailMaskId}
              maskUnits="userSpaceOnUse"
              x={bounds.x}
              y={bounds.y}
              width={bounds.width}
              height={bounds.height}
            >
              <rect x={bounds.x} y={bounds.y} width={bounds.width} height={bounds.height} fill="black" />
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

          {/* Trail + rocket. Translated only by the assembly above, so the
              year markers below never drift out of sync with the fuel. */}
          <g>
            <foreignObject
              x={bounds.x}
              y={bounds.y}
              width={bounds.width}
              height={bounds.height}
              mask={`url(#${trailMaskId})`}
            >
              {/* The gradient renders at a fixed size and is stretched across
                  the plume, so the WebGL surface stays the same cost however
                  large the plume grows. Scaling a soft gradient reads as smear,
                  not as blur. */}
              <div
                style={{
                  width: gradientRender.width,
                  height: gradientRender.height,
                  transform: `scale(${bounds.width / gradientRender.width}, ${bounds.height / gradientRender.height})`,
                  transformOrigin: "0 0",
                }}
              >
                {shaderActive && <BrandShaderBackground lazyLoad={false} />}
              </div>
            </foreignObject>

            {/* Poyo is line art — a white-furred body with black outlines, not a
                flat glyph — so --logo-invert does not apply to it: inverting
                would turn the fur black. Rendered as drawn, white in every theme. */}
            <image
              href={ROCKET_ART.src}
              x={ROCKET_ART.x}
              y={ROCKET_ART.y}
              width={ROCKET_ART.width}
              height={ROCKET_ART.height}
              preserveAspectRatio="xMidYMid meet"
            />
          </g>

          {/* Year markers ride with the rocket trail for the whole sweep */}
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
