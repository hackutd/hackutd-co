"use client";

import type { ReactNode } from "react";
import { Fragment, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  MISSION_BLUR_COST,
  MISSION_MOBILE_SCRUB,
  MISSION_SCRUB,
  MISSION_STATEMENT_BLUR,
} from "./sceneConfig";

configureScrollTrigger();

const WORD_ATTR = "data-blur-word";

/**
 * Rewrites every `filter` value GSAP is about to commit. See
 * MISSION_BLUR_COST: sharp words shed the filter entirely instead of holding a
 * `blur(0px)` render surface, and the surviving radii are quantised so the
 * browser can reuse a blur across frames.
 */
function quantizeBlur(value: string) {
  const radius = Number.parseFloat(value.slice(value.indexOf("(") + 1));

  if (!Number.isFinite(radius) || radius < MISSION_BLUR_COST.dropBelow) {
    return "none";
  }

  const { stepPx } = MISSION_BLUR_COST;
  return `blur(${Math.round(radius / stepPx) * stepPx}px)`;
}

type BlurStatementProps = {
  text: string;
  className?: string;
  /** Rendered inside the paragraph ahead of the words — e.g. a scroll anchor */
  children?: ReactNode;
};

/**
 * Splits a statement into per-word spans and drives them with a single
 * scroll-scrubbed timeline: each word focuses in out of a blur, holds, then
 * dissolves back into one as the statement leaves the viewport.
 *
 * Words are real text in the server-rendered HTML — only the transform,
 * opacity and filter are applied on the client, and the reduced-motion path
 * skips GSAP entirely and leaves the statement plainly legible.
 */
export default function BlurStatement({
  text,
  className,
  children,
}: BlurStatementProps) {
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  useGSAP(
    () => {
      const paragraph = paragraphRef.current;

      if (!paragraph || prefersReducedMotion) {
        return;
      }

      const wordElements = Array.from(
        paragraph.querySelectorAll<HTMLElement>(`[${WORD_ATTR}]`),
      );

      if (wordElements.length === 0) {
        return;
      }

      const { start, end, enter, hold, exit, mobile } = MISSION_STATEMENT_BLUR;

      const enterBlur = isMobile ? mobile.enterBlur : enter.blur;
      const exitBlur = isMobile ? mobile.exitBlur : exit.blur;
      const enterStagger = isMobile
        ? mobile.enterStaggerAmount
        : enter.staggerAmount;
      const exitStagger = isMobile
        ? mobile.exitStaggerAmount
        : exit.staggerAmount;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: paragraph,
          start,
          end,
          scrub: isMobile ? MISSION_MOBILE_SCRUB : MISSION_SCRUB,
        },
      });

      // `autoAlpha`, not `opacity`: a word that has not resolved yet, or has
      // already dissolved, goes `visibility: hidden` and stops being painted
      // and filtered altogether. Only the words mid-transition cost anything.
      timeline
        .fromTo(
          wordElements,
          {
            autoAlpha: 0,
            filter: `blur(${enterBlur}px)`,
            yPercent: enter.yPercent,
            scale: enter.scale,
          },
          {
            autoAlpha: 1,
            filter: "blur(0px)",
            yPercent: 0,
            scale: 1,
            duration: enter.duration,
            ease: enter.ease,
            force3D: true,
            modifiers: { filter: quantizeBlur },
            stagger: { amount: enterStagger, from: "start" },
          },
        )
        .to(
          wordElements,
          {
            autoAlpha: 0,
            filter: `blur(${exitBlur}px)`,
            yPercent: exit.yPercent,
            scale: exit.scale,
            duration: exit.duration,
            ease: exit.ease,
            force3D: true,
            modifiers: { filter: quantizeBlur },
            stagger: { amount: exitStagger, from: "start" },
          },
          `>+=${hold}`,
        );
    },
    {
      scope: paragraphRef,
      dependencies: [isMobile, prefersReducedMotion, words],
      // A resize that flips `isMobile` must replace the timeline, not stack a
      // second one on top of the first and double every word's filter work.
      revertOnUpdate: true,
    },
  );

  return (
    <p ref={paragraphRef} className={className}>
      {children}
      {words.map((word, index) => (
        // Plain space between spans, never inside them, so the statement still
        // wraps on word boundaries like ordinary text.
        <Fragment key={`${index}-${word}`}>
          {index > 0 ? " " : null}
          <span className="inline-block" {...{ [WORD_ATTR]: "" }}>
            {word}
          </span>
        </Fragment>
      ))}
    </p>
  );
}
