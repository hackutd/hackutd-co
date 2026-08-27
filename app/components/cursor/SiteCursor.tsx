"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useHasFinePointer } from "@/app/hooks/useHasFinePointer";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { CURSOR_DOT_CLIP_PATH, cursorClipPath } from "./cursorShape";
import {
  CURSOR_BOX,
  CURSOR_FADE,
  CURSOR_FOLLOW,
  CURSOR_INTERACTIVE_SELECTOR,
  CURSOR_MORPH,
  CURSOR_PRESS,
  SITE_CURSOR_ACTIVE_ATTR,
} from "./sceneConfig";
import {
  SITE_CURSOR_SUPPRESSION_EVENT,
  isSiteCursorSuppressed,
  type SiteCursorSuppressionEvent,
} from "./siteCursorSuppression";

/** Disabled controls are still `button`s; they just are not clickable. */
function isInert(element: Element) {
  return (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  );
}

/**
 * The page's own pointer: a small white disc under `mix-blend-mode:
 * difference`, so it always shows as the inverse of whatever is beneath it —
 * dark on the light sections, light on the dark ones, and picking up the
 * complement of any artwork it crosses. Over anything clickable it sharpens
 * into an arrowhead with its tip on the hotspot, morphing between the two
 * outlines rather than swapping shapes.
 *
 * It lives in `<body>` rather than inside the page wrapper: `mix-blend-mode`
 * only blends against the backdrop of its own stacking context, and the
 * wrapper is one — painted from the body it blends against the whole page,
 * background layer included, which is the only place the inversion reads.
 *
 * Gated on a fine pointer: on touch there is no cursor to replace, and the
 * `cursor: none` rule that hangs off `SITE_CURSOR_ACTIVE_ATTR` is only ever
 * applied while this is mounted and drawing a replacement.
 */
export default function SiteCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const hasFinePointer = useHasFinePointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    const shape = shapeRef.current;

    if (!hasFinePointer || !root || !shape) {
      return;
    }

    document.documentElement.setAttribute(SITE_CURSOR_ACTIVE_ATTR, "");

    // The shape's single dial: 0 is the disc, 1 the arrowhead. The morph tween
    // drives it and every frame redraws the outline from it.
    const outline = { progress: 0 };
    const drawOutline = () => {
      shape.style.clipPath = cursorClipPath(outline.progress);
    };

    /** Pointer is over the document at all — false once it leaves the window. */
    let isPresent = false;
    /** Set until the pointer has been seen once, so it never flies in from 0,0. */
    let isUnplaced = true;
    let isSuppressed = isSiteCursorSuppressed();
    let isInteractive = false;
    let lastTarget: Element | null = null;

    // Reduced motion gets every state this draws, with none of the travel
    // between them: the cursor is pinned to the pointer and changes shape on
    // the frame it crosses a link.
    const moveTo = prefersReducedMotion
      ? (x: number, y: number) => {
          gsap.set(root, { x, y });
        }
      : (() => {
          const toX = gsap.quickTo(root, "x", CURSOR_FOLLOW);
          const toY = gsap.quickTo(root, "y", CURSOR_FOLLOW);

          return (x: number, y: number) => {
            toX(x);
            toY(y);
          };
        })();

    const syncVisibility = () => {
      const opacity = isPresent && !isSuppressed ? 1 : 0;

      if (prefersReducedMotion) {
        gsap.set(root, { opacity });
        return;
      }

      gsap.to(root, {
        opacity,
        duration: CURSOR_FADE.duration,
        ease: CURSOR_FADE.ease,
        overwrite: "auto",
      });
    };

    const morphTo = (progress: number) => {
      gsap.killTweensOf(outline);

      if (prefersReducedMotion) {
        outline.progress = progress;
        drawOutline();
        return;
      }

      gsap.to(outline, {
        progress,
        duration: CURSOR_MORPH.duration,
        ease: CURSOR_MORPH.ease,
        onUpdate: drawOutline,
      });
    };

    // Hit-testing is keyed on the element under the pointer rather than run
    // every frame: `pointermove` carries the same target for the whole time
    // the pointer is inside one element, and `pointerover` covers the case
    // where a scroll slides a new element under a pointer that has not moved.
    const syncInteractive = (eventTarget: EventTarget | null) => {
      const target = eventTarget instanceof Element ? eventTarget : null;

      if (target === lastTarget) {
        return;
      }

      lastTarget = target;

      const hit = target?.closest(CURSOR_INTERACTIVE_SELECTOR) ?? null;
      const nextInteractive = hit !== null && !isInert(hit);

      if (nextInteractive === isInteractive) {
        return;
      }

      isInteractive = nextInteractive;
      morphTo(isInteractive ? 1 : 0);
    };

    const handleMove = (event: PointerEvent) => {
      // A pointer arriving for the first time, or coming back after leaving
      // the window, is placed outright; everything after that eases. The move
      // still runs on that first frame — it retargets the follow tween from
      // where the cursor was just put, so a chase left over from the exit
      // cannot drag it back out.
      if (isUnplaced) {
        isUnplaced = false;
        gsap.set(root, { x: event.clientX, y: event.clientY });
      }

      moveTo(event.clientX, event.clientY);

      if (!isPresent) {
        isPresent = true;
        syncVisibility();
      }

      syncInteractive(event.target);
    };

    const handleOver = (event: PointerEvent) => {
      syncInteractive(event.target);
    };

    // `relatedTarget` is null only when the pointer has left the document
    // itself, rather than crossed from one element into another.
    const handleOut = (event: PointerEvent) => {
      if (event.relatedTarget !== null) {
        return;
      }

      isPresent = false;
      lastTarget = null;
      // Whatever it comes back on, it comes back *at* — a cursor that slides
      // across the page to meet a pointer that re-entered elsewhere reads as
      // a stray object, not as the pointer.
      isUnplaced = true;
      syncVisibility();
    };

    const pressTo = (scale: number) => {
      if (prefersReducedMotion) {
        gsap.set(shape, { scale });
        return;
      }

      gsap.to(shape, {
        scale,
        duration: CURSOR_PRESS.duration,
        ease: CURSOR_PRESS.ease,
        overwrite: "auto",
      });
    };

    const handleDown = () => {
      pressTo(CURSOR_PRESS.scale);
    };

    const handleUp = () => {
      pressTo(1);
    };

    const handleSuppression = (event: Event) => {
      isSuppressed = (event as SiteCursorSuppressionEvent).detail.suppressed;
      syncVisibility();
    };

    const listenerOptions = { passive: true } as const;

    window.addEventListener("pointermove", handleMove, listenerOptions);
    window.addEventListener("pointerover", handleOver, listenerOptions);
    window.addEventListener("pointerout", handleOut, listenerOptions);
    window.addEventListener("pointerdown", handleDown, listenerOptions);
    window.addEventListener("pointerup", handleUp, listenerOptions);
    window.addEventListener("pointercancel", handleUp, listenerOptions);
    window.addEventListener(SITE_CURSOR_SUPPRESSION_EVENT, handleSuppression);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
      window.removeEventListener("pointerout", handleOut);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener(
        SITE_CURSOR_SUPPRESSION_EVENT,
        handleSuppression,
      );

      gsap.killTweensOf([root, shape, outline]);
      document.documentElement.removeAttribute(SITE_CURSOR_ACTIVE_ATTR);
    };
  }, [hasFinePointer, prefersReducedMotion]);

  // Nothing is drawn — and nothing hides the native cursor — until a pointer
  // that can hover is known to be present. `false` on the server and on the
  // hydrating render, so the markup matches either way.
  if (!hasFinePointer) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] h-0 w-0 opacity-0 mix-blend-difference will-change-transform"
    >
      {/* Offset by half the box so the hotspot at its centre — the disc's
          centre, and the arrowhead's tip — sits on the pointer. Kept in `left`
          and `top` rather than a transform so GSAP owns the element's
          transform outright and the press scale has nothing to fight with. */}
      <div
        ref={shapeRef}
        className="absolute bg-white"
        style={{
          width: CURSOR_BOX,
          height: CURSOR_BOX,
          left: -CURSOR_BOX / 2,
          top: -CURSOR_BOX / 2,
          clipPath: CURSOR_DOT_CLIP_PATH,
        }}
      />
    </div>
  );
}
