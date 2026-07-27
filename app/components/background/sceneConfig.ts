/**
 * Page-level background crossfade config.
 *
 * A single fixed background element is painted once. Its light layer's
 * opacity is computed deterministically from the scroll position by
 * PageBackground: the phases below are evaluated in page order and the
 * last phase with progress > 0 owns the value. This guarantees the
 * background always matches the scroll position, no matter how fast the
 * user scrolls in either direction.
 *
 * The navbar light/dark theme is derived from the same value, so the
 * background and navbar can never disagree.
 */

export const HERO_SCENE_DATA_ATTR = "data-bg-hero-scene";
export const MISSION_STATEMENT_DATA_ATTR = "data-bg-mission-statement";
export const TIMELINE_SECTION_DATA_ATTR = "data-bg-timeline-section";

export type PageBgPhase = {
  /** Data attribute identifying the section that drives this phase */
  attr: string;
  /** Light-layer opacity at phase progress 0 */
  from: number;
  /** Light-layer opacity at phase progress 1 */
  to: number;
  start: string;
  end: string;
  ease: string;
};

/**
 * Base → surface as the rocket slides in.
 *
 * `start` matches TIMELINE_SCROLL.start ("top top") so the lighten begins on
 * the same scroll frame the rocket starts entering from the right, and runs
 * for a further 30vh of scroll while the rocket travels across the viewport.
 */
export const TIMELINE_LIGHTEN_PHASE = {
  attr: TIMELINE_SECTION_DATA_ATTR,
  from: 0,
  to: 1,
  start: "top top",
  end: "top -30%",
  ease: "power1.inOut",
} as const satisfies PageBgPhase;

/** Phases in page order: hero whiteout → mission darken → timeline lighten */
export const PAGE_BG_PHASES: readonly PageBgPhase[] = [
  {
    attr: HERO_SCENE_DATA_ATTR,
    from: 0,
    to: 1,
    start: "70% bottom",
    end: "bottom bottom",
    ease: "power2.in",
  },
  {
    attr: MISSION_STATEMENT_DATA_ATTR,
    from: 1,
    to: 0,
    start: "center top",
    end: "bottom top",
    ease: "power1.in",
  },
  TIMELINE_LIGHTEN_PHASE,
] as const;

/** Seconds for the light layer to catch up to the computed value (scrub feel) */
export const PAGE_BG_SMOOTHING = {
  desktop: 0.2,
  mobile: 0.6,
} as const;

/**
 * When a scroll jump moves the computed value by more than this in one
 * update (e.g. Home/End or a fast fling), the layer snaps instead of
 * easing so an opaque section edge is never crossed mid-catch-up.
 */
export const PAGE_BG_SNAP_DELTA = 0.35;

/** Light-layer opacity at which the navbar switches to its light theme */
export const NAVBAR_LIGHT_THRESHOLD = 0.5;
