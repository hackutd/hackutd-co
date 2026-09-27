/**
 * Timing for the logo draw-on. The CSS keyframes in globals.css read the same
 * numbers through the `--logo-*` custom properties; scripts/brand-assets.mts
 * imports them so the Lottie and video outros stay in lockstep.
 */
export const LOGO_DRAW = {
  /** How long one glyph takes to stroke on. */
  strokeSeconds: 0.8,
  /** Delay between the first and last glyph starting. */
  staggerSeconds: 1.2,
  /** When the last glyph finishes stroking. */
  drawTotalSeconds: 2,
  /** Fill fades in slightly before the stroke completes. */
  fillLeadSeconds: 0.4,
  fillSeconds: 0.6,
  /** Stroke fades on the same schedule as the fill so no outline ever fattens the glyphs. */
  unstrokeSeconds: 0.6,
  /** Draw + fades finished; the preloader may leave. */
  settleSeconds: 2.6,
} as const;

export const PRELOADER = {
  /** Static logo dwell before fading when reduced motion is on. */
  reducedMotionHoldMs: 700,
  /** Overlay opacity transition — mirrors `.preloader` in globals.css. */
  fadeMs: 400,
  /** Below `md` the skyline draws zoomed in on its centre, then eases to 1:1. */
  mobileSkylineZoom: 3,
} as const;

/** Hold on the finished logo at the end of the video outros. */
export const OUTRO_HOLD_SECONDS = 0.9;
