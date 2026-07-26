/**
 * Project card artwork.
 *
 * Width is set explicitly rather than left `auto`: a replaced element in a flex
 * row takes its intrinsic width as its automatic minimum size, so an `auto`
 * logo refuses to shrink and overflows the card. `clamp` scales the art with
 * the viewport between a floor and a cap, and `h-auto` lets the height follow
 * so the aspect ratio is preserved at every size.
 */
export const PROJECT_IMAGE = {
  featured: "h-auto w-[clamp(200px,32vw,520px)] max-w-full object-contain",
  compact: "h-auto w-[clamp(72px,9vw,140px)] object-contain",
  /**
   * Replaces the `compact` ramp outright for marks that read heavier than the
   * rest at the shared width. A narrower width cannot just be appended: two
   * width utilities of equal specificity resolve by stylesheet order, not by
   * the order they appear in `className`.
   */
  sizeOverrides: {
    Jury: "h-auto w-[clamp(56px,7vw,104px)] object-contain",
  } as Record<string, string | undefined>,
  /**
   * Additive per-project treatment. Harp's mark is a flat black glyph on
   * transparency, so it is inverted to white on the dark palette and left as
   * drawn on the light one.
   */
  treatments: {
    Harp: "invert-[var(--logo-invert)]",
  } as Record<string, string | undefined>,
} as const;

/**
 * The cards sit side by side only once there is room for the tall compact
 * cards next to the featured one; below that they stack 1 / 2 / 3 in source
 * order, and the top padding that reserves space for the oversized index
 * numeral shrinks with them.
 */
export const PROJECTS_LAYOUT = {
  grid: "grid grid-cols-1 gap-6 lg:grid-cols-2",
  compactCardPadding: "px-6 pb-8 pt-32 sm:px-8 lg:pt-48",
  featuredNumeral: "text-[96px] sm:text-[128px] lg:text-[160px]",
  compactNumeral: "text-6xl sm:text-7xl lg:text-8xl",
} as const;

/** Scroll-in reveal for the project cards. */
export const PROJECTS_REVEAL = {
  /** Initial offset/state each card animates from */
  from: {
    autoAlpha: 0,
    y: 40,
  },
  duration: 0.8,
  stagger: 0.12,
  ease: "power2.out",
  /** Trigger window on the projects section */
  start: "top 75%",
} as const;
