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
 *
 * Where the words resolve on screen is set here, not by the layout offset:
 * the trigger travels with the paragraph, so starting it later simply means
 * the paragraph is higher up when the first word begins to focus. That, plus
 * the shorter enter stagger below, lands the statement fully sharp above the
 * middle of the viewport and holds it there, instead of resolving down near
 * the bottom edge.
 *
 * `start` is tied to how tall the block is: the taller the statement, the
 * later it has to begin so the closing lines have climbed into view by the
 * time they come sharp. Raise the type scale and this has to come down too.
 *
 * `start` and `end` are near-mirrored around the same reference line — the top
 * edge passing 70%, the bottom edge passing 60% — so the range is the block's
 * own height plus a tenth of the viewport. Tying it to the height is what keeps
 * the dissolve on screen: the words exit in reading order, so the first line
 * has to finish dissolving before the top of the block clears the viewport, and
 * a height-relative range holds that whether the statement runs six lines or
 * ten. The extra tenth buys the dissolve some delay without spending the whole
 * margin.
 *
 * `end` is the dial for when the dissolve arrives, and it cuts both ways: a
 * lower percentage stretches the range past the block and pushes the dissolve
 * later, until it runs off the top edge undissolved; a higher one pulls it in
 * sooner. Below about 45% the first line stops finishing on screen.
 */
export const MISSION_STATEMENT_BLUR = {
  start: "top 70%",
  end: "bottom 60%",
  enter: {
    blur: 10,
    yPercent: 60,
    scale: 1.08,
    duration: 0.55,
    /** Shorter than the exit's read time — the line resolves as a phrase, not word by word */
    staggerAmount: 1.4,
    ease: "power2.out",
  },
  /**
   * Relative units held fully sharp between the enter and exit tweens. This is
   * the reading time — 71 words need a while — and raising it also delays the
   * dissolve, so it is the second dial to reach for alongside `end`.
   */
  hold: 2.2,
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
    enterStaggerAmount: 1.0,
    exitStaggerAmount: 0.9,
  },
} as const;

/**
 * Marks key words in the statement copy: a run between a pair of these receives
 * semibold emphasis while staying in the same sans-serif face as the rest of the
 * Mission section. A pair may span several words and may open or close mid-word.
 *
 * Markers have to be balanced. An odd count flips the emphasis for the rest of
 * that block rather than failing loudly.
 */
export const MISSION_KEY_WORD_DELIMITER = "*";

/**
 * Applied to the marked runs. Keep the explicit sans class here so future
 * typography changes elsewhere cannot reintroduce a serif into Mission copy.
 */
export const MISSION_KEY_WORD_CLASS = "font-sans font-semibold";

/**
 * Space above each hard-broken block of the statement (a newline in the copy).
 * In `em` so the gap tracks the responsive type scale instead of needing a
 * value per breakpoint — a shade under one line of leading, which reads as a
 * deliberate pause before the sign-off rather than as an empty line.
 */
export const MISSION_STATEMENT_LINE_GAP = "mt-[0.75em]";

/**
 * Ink strength ramp down the statement — the opening lines carry full-strength
 * ink and each one after that sits back a little further, so the block reads
 * top-down instead of as one flat slab.
 *
 * Values are `color-mix` percentages of `currentColor` against `transparent`,
 * applied per word in reading order. Because the ramp is expressed against the
 * inherited colour rather than a hardcoded one, it holds in both themes: on the
 * light mission surface the lower lines lift toward grey, and when the surface
 * flips dark the same ramp dims the white ink instead of brightening it.
 *
 * Word index is the ramp input, not measured line index: the statement rewraps
 * at every breakpoint, and with this many words each line spans only a few
 * percent of the ramp, so it reads as a clean line-to-line step anyway with no
 * measurement to keep in sync on resize.
 *
 * The ramp covers the body block only. A hard break (a newline in the copy)
 * starts a sign-off, which renders at `top` so it reads as the strongest line
 * on the screen against the faded body above it.
 */
export const MISSION_STATEMENT_INK = {
  /** First word */
  top: 100,
  /**
   * Last word. Widening this gap is what strengthens the top-to-bottom shift;
   * the floor is roughly 40, below which the closing line stops holding
   * comfortable contrast against the surface in either theme.
   */
  bottom: 60,
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

/**
 * Inverted cursor over the statement — a white disc that difference-blends
 * with the page under it, so the words it crosses punch through inverted while
 * the reader drags it across the copy.
 *
 * Diameter is the whole dial, and it decides what the effect reads as: under
 * about one line of leading it is just a fat pointer, and only once it clears
 * a line does it read as a lens with words inside it. 120px is a shade under
 * two lines at the 3.75rem desktop scale — large enough to always hold a word
 * or two, small enough that the statement is never mostly inverted.
 */
export const MISSION_STATEMENT_CURSOR = {
  size: 120,
} as const;
