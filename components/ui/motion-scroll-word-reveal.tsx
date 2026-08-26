"use client";

import {
  Fragment,
  useId,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import InvertedCursor from "@/app/components/ui/InvertedCursor";
import "./motion-scroll-word-reveal-utils/index.css";

configureScrollTrigger();

const DEFAULT_TEXT =
  "Animation should never make you wait. It should reveal the next idea at exactly the moment you are ready to read it.";
const DEFAULT_REST_OPACITY = 0.15;
const DEFAULT_REVEAL_SPAN = 0.8;
const DEFAULT_WORD_WINDOW = 0.2;
const WORD_ATTR = "data-scroll-reveal-word";

type WordRange = { start: number; end: number };
type WordPart = { text: string; keyWord: boolean };

function getWordRange(
  index: number,
  count: number,
  revealSpan: number,
  wordWindow: number,
): WordRange {
  const start = count <= 1 ? 0 : (index / (count - 1)) * revealSpan;
  return { start, end: Math.min(1, start + wordWindow) };
}

export function getWordOpacity(
  progress: number,
  { start, end }: WordRange,
  rest = DEFAULT_REST_OPACITY,
) {
  if (progress <= start) return rest;
  if (progress >= end) return 1;
  const t = (progress - start) / (end - start);
  return rest + (1 - rest) * t;
}

function splitWords(block: string, delimiter: string): WordPart[][] {
  const words: WordPart[][] = [];
  let current: WordPart[] = [];
  let keyWord = false;

  for (const segment of block.split(delimiter)) {
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

type ScrollWordRevealProps = {
  text?: string;
  kicker?: string;
  className?: string;
  children?: ReactNode;
  invertedCursor?: boolean;
  cursorSize?: number;
  keyWordDelimiter?: string;
  keyWordClassName?: string;
  restOpacity?: number;
  revealSpan?: number;
  wordWindow?: number;
  scrub?: number;
  scrollHeight?: string;
};

/**
 * Keeps a statement in a sticky reading stage while its words brighten in
 * reading order. A single ScrollTrigger timeline owns both the words and the
 * progress rail, so the visual always follows the document scroll position.
 */
export function ScrollWordReveal({
  text = DEFAULT_TEXT,
  kicker = "Scroll to reveal",
  className,
  children,
  invertedCursor = false,
  cursorSize = 120,
  keyWordDelimiter = "*",
  keyWordClassName = "font-semibold",
  restOpacity = DEFAULT_REST_OPACITY,
  revealSpan = DEFAULT_REVEAL_SPAN,
  wordWindow = DEFAULT_WORD_WINDOW,
  scrub = 0.25,
  scrollHeight = "220svh",
}: ScrollWordRevealProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const reactId = useId();
  const headingId = `scroll-word-reveal-${reactId.replace(/:/g, "")}`;

  const lines = useMemo(
    () =>
      text
        .split("\n")
        .map((line) => splitWords(line, keyWordDelimiter))
        .filter((line) => line.length > 0),
    [keyWordDelimiter, text],
  );
  const wordCount = lines.reduce((count, line) => count + line.length, 0);
  const plainText = text.split(keyWordDelimiter).join("");

  useGSAP(
    () => {
      const target = targetRef.current;
      const progress = progressRef.current;
      const words = gsap.utils.toArray<HTMLElement>(`[${WORD_ATTR}]`);

      if (!target || !progress || words.length === 0) {
        return;
      }

      if (prefersReducedMotion) {
        gsap.set(words, { opacity: 1 });
        gsap.set(progress, { scaleY: 1, transformOrigin: "top center" });
        return;
      }

      gsap.set(words, { opacity: restOpacity });
      gsap.set(progress, { scaleY: 0, transformOrigin: "top center" });

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: target,
          start: "top top",
          end: "bottom bottom",
          scrub,
        },
      });

      timeline.to(progress, { scaleY: 1, duration: 1 }, 0);

      words.forEach((word, index) => {
        const range = getWordRange(
          index,
          words.length,
          revealSpan,
          wordWindow,
        );

        timeline.to(
          word,
          {
            opacity: 1,
            duration: Math.max(0.001, range.end - range.start),
          },
          range.start,
        );
      });
    },
    {
      scope: frameRef,
      dependencies: [
        prefersReducedMotion,
        restOpacity,
        revealSpan,
        scrub,
        wordCount,
        wordWindow,
      ],
      revertOnUpdate: true,
    },
  );

  const frameStyle = {
    "--scroll-word-reveal-height": scrollHeight,
  } as CSSProperties;

  return (
    <div
      ref={frameRef}
      className="scroll-word-reveal-frame"
      data-reduced-motion={prefersReducedMotion ? "true" : undefined}
      style={frameStyle}
    >
      <section
        ref={targetRef}
        className="scroll-word-reveal"
        aria-labelledby={headingId}
      >
        <div className="scroll-word-reveal__stage">
          <div className="scroll-word-reveal__layout">
            <div className="scroll-word-reveal__progress" aria-hidden="true">
              <span ref={progressRef} />
            </div>

            <div className="scroll-word-reveal__content">
              <p className="scroll-word-reveal__kicker">{kicker}</p>
              <h2
                ref={headingRef}
                id={headingId}
                className={
                  className
                    ? `scroll-word-reveal__heading ${className}`
                    : "scroll-word-reveal__heading"
                }
                aria-label={plainText}
              >
                {children}
                {lines.map((line, lineIndex) => (
                  <span
                    key={`${lineIndex}-${line[0][0]?.text}`}
                    className={
                      lineIndex > 0
                        ? "scroll-word-reveal__line scroll-word-reveal__line--spaced"
                        : "scroll-word-reveal__line"
                    }
                  >
                    {line.map((parts, wordIndex) => (
                      <Fragment key={`${wordIndex}-${parts[0]?.text}`}>
                        {wordIndex > 0 ? " " : null}
                        <span
                          className="scroll-word-reveal__word"
                          aria-hidden="true"
                          {...{ [WORD_ATTR]: "" }}
                        >
                          {parts.map((part, partIndex) =>
                            part.keyWord ? (
                              <strong
                                key={partIndex}
                                className={keyWordClassName}
                              >
                                {part.text}
                              </strong>
                            ) : (
                              <Fragment key={partIndex}>{part.text}</Fragment>
                            ),
                          )}
                        </span>
                      </Fragment>
                    ))}
                  </span>
                ))}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {invertedCursor ? (
        <InvertedCursor targetRef={headingRef} size={cursorSize} />
      ) : null}
    </div>
  );
}

export default ScrollWordReveal;
