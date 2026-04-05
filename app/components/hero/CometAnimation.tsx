"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const COMET_TUNING = {
  spine: `
    M 720,870
    C 700,760 710,650 790,545
    C 905,395 1080,335 1260,285
    C 1410,245 1475,130 1320,85
    C 1020,5 690,95 435,78
    C 230,66 40,-8 -220,-140
  `,
  ribbon: {
    minWidth: 6,
    maxWidth: 220,
    samples: 220,
    taperPower: 1.6,
  },
  animation: {
    duration: 3,
    scrollStart: "top top",
    scrollEnd: "bottom bottom",
    scrub: 0.18,
  },
  gradient: {
    x1: 720,
    y1: 870,
    x2: -220,
    y2: -140,
    stops: [
      { offset: "10%", color: "#FFA21F" },
      { offset: "30%", color: "#FF7A1B" },
      { offset: "55%", color: "#F31667" },
      { offset: "100%", color: "#6C17FE" },
    ],
  },
  glow: {
    blurStdDev: 16,
    opacity: 0.28,
  },
  outline: {
    width: 1,
    opacity: 0.9,
  },
  star: {
    outer: 16,
    inner: 4,
  },
} as const;

type SpineSample = {
  distance: number;
  x: number;
  y: number;
  nx: number;
  ny: number;
};

function buildStarPoints(outer: number, inner: number) {
  return `0,${-outer} ${inner},${-inner} ${outer},0 ${inner},${inner} 0,${outer} ${-inner},${inner} ${-outer},0 ${-inner},${-inner}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundCoord(value: number) {
  return Math.round(value * 100) / 100;
}

function precomputeSpineSamples(
  path: SVGPathElement,
  totalLength: number,
  sampleCount: number,
) {
  const samples: SpineSample[] = [];

  for (let i = 0; i <= sampleCount; i += 1) {
    const distance = (i / sampleCount) * totalLength;
    const point = path.getPointAtLength(distance);
    const prev = path.getPointAtLength(Math.max(0, distance - 1));
    const next = path.getPointAtLength(Math.min(totalLength, distance + 1));
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const mag = Math.hypot(dx, dy) || 1;

    samples.push({
      distance,
      x: point.x,
      y: point.y,
      nx: -dy / mag,
      ny: dx / mag,
    });
  }

  return samples;
}

function interpolateSpineSample(
  samples: SpineSample[],
  totalLength: number,
  distance: number,
) {
  const clampedDistance = clamp(distance, 0, totalLength);
  const maxIndex = samples.length - 1;

  if (maxIndex <= 0 || totalLength <= 0) {
    return { ...samples[0], distance: clampedDistance };
  }

  const position = (clampedDistance / totalLength) * maxIndex;
  const fromIndex = Math.floor(position);
  const toIndex = Math.min(maxIndex, fromIndex + 1);
  const t = position - fromIndex;
  const from = samples[fromIndex];
  const to = samples[toIndex];

  if (t <= 0) {
    return { ...from, distance: clampedDistance };
  }

  const nx = from.nx + (to.nx - from.nx) * t;
  const ny = from.ny + (to.ny - from.ny) * t;
  const normalMag = Math.hypot(nx, ny) || 1;

  return {
    distance: clampedDistance,
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    nx: nx / normalMag,
    ny: ny / normalMag,
  };
}

function ribbonWidth(u: number) {
  const growth = 1 - (1 - u) ** COMET_TUNING.ribbon.taperPower;
  return (
    COMET_TUNING.ribbon.minWidth +
    (COMET_TUNING.ribbon.maxWidth - COMET_TUNING.ribbon.minWidth) * growth
  );
}

function buildRibbonSegmentPath(
  samples: SpineSample[],
  totalLength: number,
  headDistance: number,
) {
  if (totalLength <= 0 || samples.length === 0) {
    return "";
  }

  const clampedHead = clamp(headDistance, 0, totalLength);
  const segmentLength = totalLength - clampedHead;

  if (segmentLength <= 0.5) {
    return "";
  }

  const sampleCount = Math.max(
    6,
    Math.ceil((segmentLength / totalLength) * (samples.length - 1)),
  );
  const left = new Array(sampleCount + 1);
  const right = new Array(sampleCount + 1);

  for (let i = 0; i <= sampleCount; i += 1) {
    const u = i / sampleCount;
    const distance = clampedHead + u * segmentLength;
    const sample = interpolateSpineSample(samples, totalLength, distance);

    const half = ribbonWidth(u) * 0.5;
    left[i] = `${roundCoord(sample.x + sample.nx * half)},${roundCoord(sample.y + sample.ny * half)}`;
    right[sampleCount - i] =
      `${roundCoord(sample.x - sample.nx * half)},${roundCoord(sample.y - sample.ny * half)}`;
  }

  return `M ${left.join(" L ")} L ${right.join(" L ")} Z`;
}

export default function CometAnimation() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<SVGPathElement>(null);
  const revealMaskPathRef = useRef<SVGPathElement>(null);
  const cometBodyRef = useRef<SVGPathElement>(null);
  const cometGlowRef = useRef<SVGPathElement>(null);
  const cometOutlineRef = useRef<SVGPathElement>(null);
  const starRef = useRef<SVGGElement>(null);

  useGSAP(
    () => {
      const spine = spineRef.current;
      const revealMaskPath = revealMaskPathRef.current;
      const cometBody = cometBodyRef.current;
      const cometGlow = cometGlowRef.current;
      const cometOutline = cometOutlineRef.current;
      const star = starRef.current;
      const wrapper = wrapperRef.current;

      if (
        !spine ||
        !revealMaskPath ||
        !cometBody ||
        !cometGlow ||
        !cometOutline ||
        !star ||
        !wrapper
      ) {
        return;
      }

      const spineLength = spine.getTotalLength();
      const spineSamples = precomputeSpineSamples(
        spine,
        spineLength,
        COMET_TUNING.ribbon.samples,
      );
      const fullRibbonPath = buildRibbonSegmentPath(spineSamples, spineLength, 0);
      cometBody.setAttribute("d", fullRibbonPath);
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
        cometOutline.setAttribute("d", revealPath);

        const head = interpolateSpineSample(
          spineSamples,
          spineLength,
          headDistance,
        );
        star.setAttribute(
          "transform",
          `translate(${roundCoord(head.x)}, ${roundCoord(head.y)})`,
        );
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setReveal(1);
        gsap.set(star, { attr: { opacity: 1 } });
        return;
      }

      setReveal(0);
      gsap.set(star, { attr: { opacity: 1 } });

      const section = wrapper.closest("section") || wrapper.parentElement;
      const revealState = { progress: 0 };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: COMET_TUNING.animation.scrollStart,
          // Match sticky section lifetime so animation finishes before next section takes over.
          end: COMET_TUNING.animation.scrollEnd,
          scrub: COMET_TUNING.animation.scrub,
        },
      });

      tl.to(
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
    { scope: wrapperRef, dependencies: [] },
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

          <filter id="cometGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={COMET_TUNING.glow.blurStdDev} />
          </filter>

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
            filter="url(#cometGlow)"
            opacity={COMET_TUNING.glow.opacity}
          />
          <path ref={cometBodyRef} d="" fill="url(#cometGradient)" />
        </g>
        <path
          ref={cometOutlineRef}
          d=""
          fill="none"
          stroke="#fff"
          strokeOpacity={COMET_TUNING.outline.opacity}
          strokeWidth={COMET_TUNING.outline.width}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <g
          ref={starRef}
          transform={`translate(${COMET_TUNING.gradient.x2}, ${COMET_TUNING.gradient.y2})`}
          opacity="0"
        >
          <polygon
            points={buildStarPoints(
              COMET_TUNING.star.outer,
              COMET_TUNING.star.inner,
            )}
            fill="#fff"
          />
        </g>
      </svg>
    </div>
  );
}
