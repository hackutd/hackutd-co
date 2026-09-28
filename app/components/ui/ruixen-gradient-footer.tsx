"use client";

// Ruixen Gradient Footer — a normal footer that sits at the bottom of the page.
// Its content reads first; the blurred rainbow is pinned to the bottom of the
// viewport and stretches up from the floor over the last stretch of scroll,
// hitting full height exactly when you reach the end of the page.
// One inline <svg> — no canvas, no giant scroll spacer.
//
// Gradient design inspired by Dia Browser — https://www.diabrowser.com

import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";

configureScrollTrigger();

export type Stop = { offset: number; color: string };

const VBW = 1271;
const VBH = 599;

// Ruixen's stops, floor (0) → top (1): dark ember → blue → near-white → yellow
// → red-orange → magenta → transparent pink.
const RUIXEN_STOPS: Stop[] = [
  { offset: 0, color: "#340B05" },
  { offset: 0.1827, color: "#0358F7" },
  { offset: 0.2837, color: "#5092C7" },
  { offset: 0.4135, color: "#E1ECFE" },
  { offset: 0.5866, color: "#FFD400" },
  { offset: 0.6827, color: "#FA3D1D" },
  { offset: 0.8029, color: "#FD02F5" },
  { offset: 1, color: "#FFC0FD00" },
];

// Height curve: a gentle power falloff, giving the flatter, pyramid-like rise of
// the original footer (short edges, tallest middle).
function bellHeights(n: number, peak: number, valley: number): number[] {
  const out: number[] = [];
  const mid = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    const t = mid === 0 ? 0 : Math.abs(i - mid) / mid; // 0 center → 1 edge
    const eased = 1 - Math.pow(t, 1.24);
    out.push(peak * VBH * (valley + (1 - valley) * eased));
  }
  return out;
}

export interface RuixenGradientFooterProps {
  /** Footer content — links, wordmark, copyright — shown above the glow. */
  children?: ReactNode;
  /**
   * Height of the glow band pinned to the viewport bottom. Doubles as the
   * scroll distance the reveal takes, and the room reserved under the content.
   */
  gradientHeight?: string;
  /**
   * Resting height of the glow, as a fraction of the band — a thin, flat strip
   * of rainbow along the bottom edge before the scroll reveal starts. `0` keeps
   * it hidden until the last screen.
   */
  minReveal?: number;
  /** Number of blurred columns. */
  bars?: number;
  /** Blur in viewBox units. */
  blur?: number;
  /** Peak height as a fraction of the viewBox. */
  peak?: number;
  /** Edge height as a fraction of the peak (0..1). */
  valley?: number;
  /** Vertical rainbow gradient stops, floor (0) → top (1). */
  stops?: Stop[];
  className?: string;
  style?: CSSProperties;
}

export function RuixenGradientFooter({
  children,
  gradientHeight = "65vh",
  minReveal = 0.045,
  bars = 9,
  blur = 15,
  peak = 0.98,
  valley = 0.55,
  stops = RUIXEN_STOPS,
  className,
  style,
}: RuixenGradientFooterProps) {
  // React 19's useId wraps its ids in guillemets (`«r0»`) where React 18 used
  // colons, and neither belongs in a `url(#…)` reference — strip everything
  // that isn't safe in a fragment identifier rather than just the colons.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bandRef = useRef<HTMLDivElement>(null);

  // minReveal = a flat strip on the floor, 1 = risen to full height, reached
  // exactly as the page bottoms out. The rise starts once the scroll left is
  // within the band's own height.
  //
  // A scrubbed ScrollTrigger rather than a scroll listener: the listener ran
  // on every scroll event anywhere on the page, read `scrollHeight` (forcing a
  // layout between GSAP's writes) and set React state. ScrollTrigger measures
  // once per refresh and writes the transform directly.
  useGSAP(
    () => {
      const el = bandRef.current;
      if (!el) return;

      gsap.fromTo(
        el,
        { scaleY: minReveal },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            // offsetHeight ignores the transform, so the band can measure itself.
            start: () => ScrollTrigger.maxScroll(window) - el.offsetHeight,
            end: () => ScrollTrigger.maxScroll(window),
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { dependencies: [minReveal], revertOnUpdate: true },
  );

  const colW = VBW / bars;

  return (
    // The glow is pinned to the viewport, so the footer reserves the same
    // height beneath its content for the glow to land in.
    <footer
      className={className}
      style={{ paddingBottom: gradientHeight, ...style }}
    >
      {children}

      {/* ponytail: fixed to the viewport — a transformed/filtered ancestor
          would capture it. Give the footer a plain containing block. */}
      <div
        ref={bandRef}
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: gradientHeight,
          pointerEvents: "none",
          transformOrigin: "bottom",
          // GSAP owns the transform from here; this only covers first paint.
          transform: `scaleY(${minReveal})`,
          willChange: "transform",
        }}
      >
        <svg
          style={{ height: "100%", width: "100%", display: "block" }}
          viewBox={`0 0 ${VBW} ${VBH}`}
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`grad-${uid}`} x1="0" y1="1" x2="0" y2="0">
              {stops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
            <filter
              id={`blur-${uid}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation={blur} />
            </filter>
          </defs>
          {/* One filter over the whole row rather than one per bar: each
              filter is its own offscreen surface, so the per-bar version paid
              for `bars` full-height blurs every time the band re-rasterised. */}
          <g filter={`url(#blur-${uid})`}>
            {bellHeights(bars, peak, valley).map((barH, i) => (
              <rect
                key={i}
                x={i * colW}
                y={VBH - barH}
                width={colW * 1.23}
                height={barH}
                fill={`url(#grad-${uid})`}
              />
            ))}
          </g>
        </svg>
      </div>
    </footer>
  );
}
