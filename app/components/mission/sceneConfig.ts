/**
 * Shared scrub value — keeps scroll feel consistent across all Mission
 * animations. This is the number of seconds the playhead takes to catch up to
 * the scroll position, so it is also the amount of lag the reader feels after
 * they stop scrolling. Keep it short enough to read as momentum rather than
 * as the page falling behind.
 */
export const MISSION_SCRUB = 0.35;
export const MISSION_MOBILE_SCRUB = 0.3;

export const MISSION_LAYOUT = {
  sectionPadding: "px-8 py-32 sm:px-10 md:py-40 lg:px-12",
  sectionMinHeight: "min-h-screen",
  statementOffset: "-mt-[50svh] pt-[8svh] md:-mt-[56vh] md:pt-[10vh]",
  statementWrapMinHeight: "min-h-[88svh] md:min-h-[92vh]",
} as const;

/**
 * Mission statement — cinematic per-word blur reveal.
 *
 * One scrubbed timeline owns the whole read cycle: words resolve out of a blur
 * in reading order, hold sharp while the statement crosses the middle of the
 * viewport, then dissolve back into blur as it scrolls away.
 *
 * Timeline values are relative units, not seconds — scrub stretches the total
 * across the scroll range below, so what matters is their proportion to each
 * other. `staggerAmount` is the span the whole stagger occupies, which keeps
 * the pacing identical no matter how many words the statement has.
 *
 * The range is anchored to the paragraph's own box (`bottom`, not `top`) so a
 * statement that wraps to more lines on a narrow viewport gets a
 * proportionally longer scroll range and still finishes dissolving on screen.
 */
export const MISSION_STATEMENT_BLUR = {
  start: "top 92%",
  end: "bottom 38%",
  enter: {
    blur: 10,
    yPercent: 60,
    scale: 1.08,
    duration: 0.55,
    staggerAmount: 1.8,
    ease: "power2.out",
  },
  /** Relative units held fully sharp between the enter and exit tweens */
  hold: 1.4,
  exit: {
    blur: 9,
    yPercent: -45,
    scale: 0.97,
    duration: 0.5,
    staggerAmount: 1.3,
    ease: "power2.in",
  },
  /** Softer blur and a tighter stagger on phones — blur filters are costly there */
  mobile: {
    enterBlur: 7,
    exitBlur: 6,
    enterStaggerAmount: 1.2,
    exitStaggerAmount: 0.9,
  },
} as const;

/**
 * Cost controls for the per-word `filter: blur()`.
 *
 * A filtered element gets its own render surface, sized to the word's box grown
 * by roughly three times the blur radius on every side, and it is re-rasterised
 * whenever the radius changes. With one span per word that is the single most
 * expensive thing on the page, so two rules keep it affordable:
 *
 * - `dropBelow` — a word whose radius has fallen under this is visually sharp,
 *   so the filter is removed outright rather than left at `blur(0px)`, which
 *   would still allocate a surface. Only the words actually mid-transition pay.
 * - `stepPx` — the radius is quantised, so a word holds the same radius across
 *   consecutive frames and the browser can reuse the blur it already rendered
 *   instead of recomputing one for every sub-pixel change.
 */
export const MISSION_BLUR_COST = {
  dropBelow: 0.4,
  stepPx: 0.5,
} as const;

/** Directors section pins at viewport top, content fades in, then unpins */
export const DIRECTORS_PIN = {
  scrub: MISSION_SCRUB,
  start: "top top",
  end: "+=500",
  initialYPercent: 12,
} as const;

/**
 * Directors card — the photo overhangs the card's top edge. Every offset is a
 * percentage of the card width (percentage margins/padding always resolve
 * against the containing block's width), so the whole composition scales as one
 * unit at any breakpoint.
 */
export const DIRECTORS_CARD = {
  /** Card width, also clamped by viewport height so the pinned card never overflows */
  width: "w-full max-w-[min(42rem,78vh)]",
  /** 16:9 photo, slightly narrower than the card */
  photo: "w-[86%] aspect-[16/9] rounded-2xl",
  /** Photo is 86% of a card that never exceeds 42rem — cap the served width there */
  photoSizes: "(max-width: 640px) 86vw, 580px",
  /** Pulls the card up under the photo, leaving ~8% of the card width exposed above it */
  overlap: "-mt-[40%]",
  /** Top padding clears the overlapped photo plus breathing room before the label */
  padding: "pt-[47%] px-8 pb-16 sm:px-12 md:pb-20",
} as const;
