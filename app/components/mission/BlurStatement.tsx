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
  MISSION_KEY_WORD_CLASS,
  MISSION_KEY_WORD_DELIMITER,
  MISSION_MOBILE_SCRUB,
  MISSION_SCRUB,
  MISSION_STATEMENT_BLUR,
  MISSION_STATEMENT_INK,
  MISSION_STATEMENT_LINE_GAP,
} from "./sceneConfig";

configureScrollTrigger();

const WORD_ATTR = "data-blur-word";

/**
 * See MISSION_STATEMENT_INK. `currentColor` inside the `color` property
 * resolves to the inherited colour, so a word steps back from whatever ink the
 * statement is set in rather than from a fixed value — and GSAP's opacity
 * multiplies with this alpha instead of fighting it.
 *
 * Full strength returns nothing so the word simply inherits, rather than
 * carrying a `color-mix` that resolves to the colour it already had.
 */
function inkAt(strength: number) {
  return strength >= 100
    ? undefined
    : `color-mix(in srgb, currentColor ${strength.toFixed(1)}%, transparent)`;
}

function rampedInk(index: number, total: number) {
  const { top, bottom } = MISSION_STATEMENT_INK;
  const t = total > 1 ? index / (total - 1) : 0;
  return inkAt(top + (bottom - top) * t);
}

/** A run of characters within one word, and whether it is a serif key word */
type WordPart = { text: string; keyWord: boolean };

/**
 * Splits a block into words while tracking the MISSION_KEY_WORD_DELIMITER
 * pairs around them. Emphasis can open or close mid-word, so a word is a list
 * of parts rather than a string — that keeps punctuation attached to the word
 * it belongs to, and keeps the word a single span for the blur reveal to drive.
 */
function splitWords(block: string): WordPart[][] {
  const words: WordPart[][] = [];
  let current: WordPart[] = [];
  let keyWord = false;

  // Delimiters alternate the emphasis state; whitespace ends the current word.
  for (const segment of block.split(MISSION_KEY_WORD_DELIMITER)) {
    for (const chunk of segment.split(/(\s+)/)) {
      if (chunk === "") {
        continue;
      }
      if (/\s/.test(chunk)) {
        if (current.length > 0) {
          words.push(current);
          current = [];
        }
        continue;
      }
      current.push({ text: chunk, keyWord });
    }
    keyWord = !keyWord;
  }

  if (current.length > 0) {
    words.push(current);
  }

  return words;
}

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
  /** A newline starts a new spaced block; every other break is normal wrapping */
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

  // Newlines in the copy are hard breaks; everything else wraps normally.
  //
  // The ink ramp spans the body block only. Anything after a break is a
  // sign-off and comes back to full strength, so it lands as the statement's
  // last beat instead of as its faintest line.
  const lines = useMemo(() => {
    let id = 0;
    return text
      .split("\n")
      .map(splitWords)
      .filter((line) => line.length > 0)
      .map((line, lineIndex) =>
        line.map((parts, wordIndex) => ({
          parts,
          id: id++,
          ink:
            lineIndex === 0
              ? rampedInk(wordIndex, line.length)
              : inkAt(MISSION_STATEMENT_INK.top),
        })),
      );
  }, [text]);

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
      dependencies: [isMobile, prefersReducedMotion, lines],
      // A resize that flips `isMobile` must replace the timeline, not stack a
      // second one on top of the first and double every word's filter work.
      revertOnUpdate: true,
    },
  );

  return (
    <p ref={paragraphRef} className={className}>
      {children}
      {lines.map((line, lineIndex) => (
        // A block per hard break rather than a <br>, so the gap between them is
        // a margin we control instead of a bare line.
        <span
          key={line[0].id}
          className={
            lineIndex > 0 ? `block ${MISSION_STATEMENT_LINE_GAP}` : "block"
          }
        >
          {line.map(({ parts, id, ink }, positionInLine) => (
            // Plain space between spans, never inside them, so the statement
            // still wraps on word boundaries like ordinary text.
            <Fragment key={id}>
              {positionInLine > 0 ? " " : null}
              <span
                className="inline-block"
                style={{ color: ink }}
                {...{ [WORD_ATTR]: "" }}
              >
                {parts.map((part, partIndex) =>
                  part.keyWord ? (
                    <span key={partIndex} className={MISSION_KEY_WORD_CLASS}>
                      {part.text}
                    </span>
                  ) : (
                    <Fragment key={partIndex}>{part.text}</Fragment>
                  ),
                )}
              </span>
            </Fragment>
          ))}
        </span>
      ))}
    </p>
  );
}
