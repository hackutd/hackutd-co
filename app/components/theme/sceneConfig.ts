/** Curtain that masks the site-wide light/dark swap. */
export const THEME_CURTAIN = {
  /**
   * Pixels of the top of the viewport the curtain already covers when the drop
   * begins — enough to clear the navbar at either breakpoint (56px on mobile,
   * 64px on desktop).
   *
   * The navbar sits above the curtain and switches to the new palette on the
   * click, so the strip behind it has to be the new color in that same frame.
   * Starting the curtain fully off-screen instead leaves the bar in its new
   * colors over the old background until the leading edge catches up, which
   * with an inOut ease is a good fraction of a second of unreadable navbar.
   */
  coverFromTop: 64,
  /** Seconds for one sweep — the drop and the lift each take this long. */
  sweepDuration: 0.8,
  /** Beat held at full cover after the theme swaps, before lifting. */
  holdDuration: 0.1,
  ease: "power4.inOut",
} as const;

/** Sun ↔ moon morph inside the toggle button. */
export const THEME_TOGGLE_ICON = {
  /**
   * Short enough to read as an answer to the click rather than an animation
   * the button is playing back. Set to 0 for a hard snap.
   */
  duration: 0.8,
  ease: "power2.inOut",
  /**
   * How far the mask slides to bite a crescent out of the disc, in SVG user
   * units (the icon's viewBox is 32×32).
   */
  maskOffset: { x: -11, y: 14 },
  /** The disc grows as it becomes the moon (r 8 → 10). */
  discScale: 1.25,
  /** Rays pull in toward the disc as they fade out. */
  rayScale: 0.5,
} as const;
