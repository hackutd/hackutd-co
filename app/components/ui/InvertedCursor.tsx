"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useHasFinePointer } from "@/app/hooks/useHasFinePointer";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";

/**
 * How the disc chases the pointer. Short enough to feel attached to the hand,
 * long enough that the trailing edge reads as weight rather than as lag.
 */
const FOLLOW = { duration: 0.4, ease: "power3.out" } as const;

/** Above the navbar's z-50 — the disc has to invert whatever it crosses */
const DISC_CLASS =
  "pointer-events-none fixed left-0 top-0 z-[100] rounded-full bg-white mix-blend-difference will-change-transform";

type Point = { x: number; y: number };

type InvertedCursorProps = {
  /**
   * The element the disc belongs to. It replaces the native cursor only while
   * the pointer is inside this element, and its box is the whole hover
   * region — so pass the element that wraps the content tightly.
   */
  targetRef: RefObject<HTMLElement | null>;
  /** Diameter in px */
  size?: number;
  className?: string;
};

/**
 * A white disc that follows the pointer over one element and difference-blends
 * with everything beneath it, so the content it crosses punches through
 * inverted.
 *
 * It renders into `document.body` rather than inside the target: `mix-blend-mode`
 * only blends against the backdrop of its own stacking context, and the target
 * sits inside one (the page's `z-10` section wrapper). Painted from the body it
 * blends against the whole page — the copy *and* the background layer behind
 * it — which is the only place the inversion actually reads.
 *
 * It exists only while the pointer is inside the target, and it mounts already
 * positioned under the pointer, so there is no idle blend surface on the page
 * and no disc flying in from the corner on the first hover.
 *
 * Gated on a fine pointer: on touch there is no cursor to replace, and hiding
 * one that a reader is aiming with would be worse than not running at all.
 */
export default function InvertedCursor({
  targetRef,
  size = 60,
  className,
}: InvertedCursorProps) {
  const discRef = useRef<HTMLDivElement>(null);
  /** Where the disc mounts — non-null exactly while the pointer is inside the target */
  const [origin, setOrigin] = useState<Point | null>(null);
  const hasFinePointer = useHasFinePointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Enter and leave own the disc's lifetime, and the native cursor is hidden
  // for exactly as long as this component is around to draw a replacement.
  useEffect(() => {
    const target = targetRef.current;

    if (!target || !hasFinePointer) {
      return;
    }

    const handleEnter = (event: PointerEvent) => {
      setOrigin({ x: event.clientX - size / 2, y: event.clientY - size / 2 });
    };

    const handleLeave = () => {
      setOrigin(null);
    };

    target.addEventListener("pointerenter", handleEnter);
    target.addEventListener("pointerleave", handleLeave);
    target.style.cursor = "none";

    return () => {
      target.removeEventListener("pointerenter", handleEnter);
      target.removeEventListener("pointerleave", handleLeave);
      target.style.cursor = "";
      setOrigin(null);
    };
  }, [hasFinePointer, size, targetRef]);

  // Tracking. Moves are read from the window rather than the target so the
  // disc keeps up with the pointer for the whole frame it is leaving on,
  // instead of stopping at the last move the target itself saw.
  useEffect(() => {
    const disc = discRef.current;

    if (!origin || !disc) {
      return;
    }

    // Reduced motion gets the disc pinned to the pointer: still a cursor,
    // with none of the easing that makes it drift on its own.
    const moveTo = prefersReducedMotion
      ? (x: number, y: number) => {
          gsap.set(disc, { x, y });
        }
      : (() => {
          const toX = gsap.quickTo(disc, "x", FOLLOW);
          const toY = gsap.quickTo(disc, "y", FOLLOW);
          return (x: number, y: number) => {
            toX(x);
            toY(y);
          };
        })();

    const handleMove = (event: PointerEvent) => {
      moveTo(event.clientX - size / 2, event.clientY - size / 2);
    };

    window.addEventListener("pointermove", handleMove);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      gsap.killTweensOf(disc);
    };
  }, [origin, prefersReducedMotion, size]);

  // Nothing renders until a pointer has entered, which is both what keeps the
  // server and first client render identical and what makes `document` safe to
  // reach for here.
  if (!hasFinePointer || !origin) {
    return null;
  }

  return createPortal(
    <div
      ref={discRef}
      aria-hidden="true"
      className={className ? `${DISC_CLASS} ${className}` : DISC_CLASS}
      style={{
        width: size,
        height: size,
        // Mount under the pointer. `origin` is held for the whole hover, so
        // React never rewrites the transform GSAP is driving from here.
        transform: `translate3d(${origin.x}px, ${origin.y}px, 0)`,
      }}
    />,
    document.body,
  );
}
