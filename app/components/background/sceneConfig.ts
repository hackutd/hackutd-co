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
export const SPONSORS_SECTION_DATA_ATTR = "data-bg-sponsors-section";

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

/**
 * Surface → the sponsor wall's own panel color, landing exactly as the wall's
 * top edge reaches the foot of the viewport.
 *
 * The wall is the one section pinned to a single color in both themes (see the
 * sponsor block in globals.css), so in the light theme it would otherwise meet
 * a near-black background at a hard edge. Crossfading the page to the panel
 * color first means both are the same white by the time that edge arrives and
 * the join never resolves as a line — the same handoff the hero makes to the
 * mission statement, one section's background becoming the next's.
 *
 * The ease is what keeps it off the timeline: `power3.in` is still under 4% a
 * third of the way in, so nothing washes over the rocket while it is finishing
 * its sweep (TIMELINE_SCROLL ends 30vh before the section does), and the whole
 * visible crossfade lands under the parked fuel plume that follows — which is
 * itself dissolving over the same stretch (TIMELINE_EXIT_FADE), so the plume
 * hands straight over to the sponsor wall's white with no edge in between.
 *
 * It runs in both themes, but only reads as a change in one. The light theme
 * crosses the whole way from near-black; the dark theme has already lightened
 * to #f2f2f2 by this point, so it travels the last few values to #ffffff —
 * imperceptible as motion, and the only thing that stops the wall's white from
 * meeting a not-quite-white page at a visible step.
 */
export const SPONSORS_PANEL_PHASE = {
  attr: SPONSORS_SECTION_DATA_ATTR,
  from: 0,
  to: 1,
  start: "top 140%",
  end: "top bottom",
  ease: "power3.in",
} as const satisfies PageBgPhase;

/**
 * Phases for the panel layer, evaluated exactly like PAGE_BG_PHASES but
 * written to the layer stacked above it.
 */
export const PAGE_BG_PANEL_PHASES: readonly PageBgPhase[] = [
  SPONSORS_PANEL_PHASE,
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
