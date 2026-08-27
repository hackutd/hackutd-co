"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useNearViewport } from "@/app/hooks/useNearViewport";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { BrandGradientRenderer } from "./brandGradientRenderer";
import {
  BRAND_GRADIENT_COLORS,
  BRAND_GRADIENT_DEFAULTS,
  type BrandGradientTuning,
} from "./brandGradientShader";

type BrandGradientBackgroundProps = {
  className?: string;
  /** Unmounts the canvas while it is away from the viewport. */
  lazyLoad?: boolean;
  rootMargin?: string;
  style?: CSSProperties;
  /** Per-section overrides on top of `BRAND_GRADIENT_DEFAULTS`. */
  tuning?: Partial<BrandGradientTuning>;
  /**
   * Fraction of CSS pixels the canvas actually renders. The gradient has no
   * detail near the pixel scale, so drawing it at half resolution and letting
   * the compositor scale it up is free quality-wise and quarters fill cost.
   */
  resolutionScale?: number;
  /** Frame cap. The drift is slow enough that 30fps is indistinguishable. */
  maxFps?: number;
};

/**
 * Static stand-in shown before the canvas paints and wherever WebGL is
 * unavailable. Approximate by design — it only ever shows for a frame or two.
 */
const fallbackBackground =
  `radial-gradient(120% 120% at 18% 12%, ${BRAND_GRADIENT_COLORS.color1} 0%, transparent 58%),` +
  `radial-gradient(120% 120% at 82% 34%, ${BRAND_GRADIENT_COLORS.color2} 0%, transparent 62%),` +
  `radial-gradient(140% 140% at 60% 100%, ${BRAND_GRADIENT_COLORS.color3} 0%, transparent 66%),` +
  BRAND_GRADIENT_COLORS.background;

export default function BrandGradientBackground({
  className,
  lazyLoad = true,
  rootMargin = "25%",
  style,
  tuning,
  resolutionScale = 0.5,
  maxFps = 30,
}: BrandGradientBackgroundProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isNearViewport = useNearViewport(wrapperRef, rootMargin);
  const shouldMountCanvas = !lazyLoad || isNearViewport;

  const mergedTuning = useMemo<BrandGradientTuning>(
    () => ({ ...BRAND_GRADIENT_DEFAULTS, ...tuning }),
    [tuning],
  );
  // The loop reads tuning through a ref so that retuning — including from a
  // caller that rebuilds the object every render — never tears down and
  // recreates the WebGL context.
  const tuningRef = useRef(mergedTuning);
  useEffect(() => {
    tuningRef.current = mergedTuning;
  }, [mergedTuning]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!shouldMountCanvas || !wrapper) {
      return;
    }

    const scale = Math.max(0.1, Math.min(resolutionScale, 1));
    const minFrameGap = 1000 / Math.max(1, maxFps);

    let canvas: HTMLCanvasElement | null = null;
    let renderer: BrandGradientRenderer | null = null;
    let frame = 0;
    let start = 0;
    let lastDrawn = -Infinity;
    let disposed = false;

    const applySize = () => {
      if (!renderer) {
        return;
      }
      const { width, height } = wrapper.getBoundingClientRect();
      renderer.resize(
        Math.max(1, Math.round(width * scale)),
        Math.max(1, Math.round(height * scale)),
      );
    };

    const draw = (now: number) => {
      if (!renderer || !canvas) {
        return;
      }
      if (!start) {
        start = now;
      }
      renderer.render((now - start) / 1000, tuningRef.current);
      lastDrawn = now;
      // Revealed imperatively on the first painted frame, so the fade-in costs
      // no re-render and a blank canvas never flashes over the fallback.
      canvas.style.opacity = "1";
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - lastDrawn < minFrameGap) {
        return;
      }
      draw(now);
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      // A lost context can never compile again, and `getContext` on the same
      // canvas keeps handing back that dead context — so the element itself is
      // replaced rather than reused.
      teardown();
      if (!disposed) {
        mount();
      }
    };

    /**
     * Each renderer gets a brand-new canvas element. Reusing one is unsafe:
     * `dispose` deliberately loses the context to free its drawing buffer, and
     * `getContext` on that same element returns the lost context forever after
     * — which in React's development double-invoked effects silently produced
     * a canvas that could not compile a shader.
     */
    const mount = () => {
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      canvas.className =
        "absolute inset-0 h-full w-full transition-opacity duration-500";
      canvas.style.opacity = "0";
      canvas.addEventListener("webglcontextlost", handleContextLost);
      wrapper.appendChild(canvas);

      renderer = new BrandGradientRenderer(canvas);
      if (!renderer.isSupported) {
        // Leaves the CSS fallback showing underneath.
        teardown();
        return;
      }

      start = 0;
      lastDrawn = -Infinity;
      applySize();

      if (prefersReducedMotion) {
        // One frame, then nothing: a still gradient rather than a blank panel.
        draw(performance.now());
      } else {
        frame = requestAnimationFrame(loop);
      }
    };

    const teardown = () => {
      cancelAnimationFrame(frame);
      renderer?.dispose();
      renderer = null;
      canvas?.removeEventListener("webglcontextlost", handleContextLost);
      canvas?.remove();
      canvas = null;
    };

    mount();

    const resizeObserver = new ResizeObserver(applySize);
    resizeObserver.observe(wrapper);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      teardown();
    };
  }, [maxFps, prefersReducedMotion, resolutionScale, shouldMountCanvas]);

  const wrapperClassName = [
    "pointer-events-none relative h-full w-full overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={wrapperRef}
      className={wrapperClassName}
      style={{ height: "100%", width: "100%", ...style }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: fallbackBackground }}
      />
    </div>
  );
}
