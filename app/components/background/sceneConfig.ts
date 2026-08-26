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
 * The navbar theme is derived from the same values, so the background and
 * navbar can never disagree.
 */

export const HERO_SCENE_DATA_ATTR = "data-bg-hero-scene";
export const ABOUT_EXIT_DATA_ATTR = "data-bg-about-exit";
export const TIMELINE_SECTION_DATA_ATTR = "data-bg-timeline-section";
export const SPONSORS_SECTION_DATA_ATTR = "data-bg-sponsors-section";
export const SECTION_GRADIENT_DATA_ATTR = "data-section-gradient";
export const SECTION_GRADIENT_END_ID = "footer";

/**
 * Page-order labels for the persistent lower-left gradient. Each matching
 * section carries SECTION_GRADIENT_DATA_ATTR with the corresponding id.
 */
export const SECTION_GRADIENT_SECTIONS = [
  { id: "mission", label: "Mission" },
  { id: "about", label: "About" },
  { id: "directors", label: "Directors" },
  { id: "teams", label: "Teams" },
  { id: "projects", label: "Projects" },
  { id: "history", label: "History" },
  { id: "sponsors", label: "Sponsors" },
] as const;

export const SECTION_GRADIENT_MOTION = {
  /**
   * Anchored to the Mission section, which is pulled up by one viewport so its
   * stage pins the moment the hero's releases (MISSION_WORD_REVEAL.pullUp).
   * These offsets are shifted by that same viewport so the artwork still fades
   * in at the scroll position it always has — a beat after the hero has finished
   * whiting out, not while the comet is still leaving. Moving the section up
   * must not drag the gradient with it.
   */
  revealStart: "top top",
  revealEnd: "top -30%",
  revealScrub: 0.45,
  pullStart: "top bottom",
  pullEnd: "top top",
  pullScrub: true,
  transitionStart: "top 64%",
  transitionEnd: "top 42%",
  transitionScrub: 0.45,
  labelTravelPercent: 22,
  parallaxScrub: 0.8,
  parallax: {
    fromXPercent: -1,
    fromYPercent: 3,
    toXPercent: 2,
    toYPercent: -4,
  },
} as const;

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
 * The 15vh crossfade now leads TIMELINE_SCROLL.start ("top top"), completing
 * on the same scroll frame the rocket starts entering from the right. Starting
 * while History is approaching makes the Projects → History handoff happen
 * at the section boundary instead of over the opening rocket sweep.
 */
export const TIMELINE_LIGHTEN_LEAD_PERCENT = 15;

export const TIMELINE_LIGHTEN_PHASE = {
  attr: TIMELINE_SECTION_DATA_ATTR,
  from: 0,
  to: 1,
  start: `top ${TIMELINE_LIGHTEN_LEAD_PERCENT}%`,
  end: "top top",
  ease: "power1.inOut",
} as const satisfies PageBgPhase;

/** Phases in page order: hero whiteout → post-About reset → timeline lighten */
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
    attr: ABOUT_EXIT_DATA_ATTR,
    from: 1,
    to: 0,
    // The surface the hero whites out to carries the mission statement *and*
    // About — the two read as one lit stretch of page with no palette step
    // between them. The base palette only comes back on the way out of About,
    // as the directors' message arrives.
    //
    // The attribute sits on the About section itself and the range is anchored
    // to its bottom edge, which is also the top of the directors' section, so
    // one number places the crossfade in the gap between the two. It opens
    // once that edge is above the reading line — by then ABOUT_EXIT_FADE has
    // the block most of the way dissolved — and lands while the directors card
    // is still climbing into view, so nothing inked for the light surface is
    // still legible while the page changes underneath it, and the card is
    // never lit by a white page behind it.
    start: "bottom 70%",
    end: "bottom 30%",
    ease: "power1.in",
  },
  TIMELINE_LIGHTEN_PHASE,
] as const;

/** Each About block fades inward when that block reaches the viewport. */
export const ABOUT_ENTER_REVEAL = {
  start: "top 88%",
  distance: 44,
  duration: 0.85,
  ease: "power2.out",
  toggleActions: "play none none reverse",
} as const;

/**
 * About dissolves as it leaves, ahead of the palette handoff above.
 *
 * A palette flip cannot happen under copy that is still readable: ink inked
 * for the light surface passes through the background's own value on its way
 * out, and for a moment the block is invisible in a way that reads as a bug
 * rather than as a transition. Everywhere else on the page the section leaves
 * before the page changes; About is a static block, so it dissolves on exit
 * instead — the same trick the hero copy uses, one section later.
 *
 * The range is anchored to the same edge as the phase above and runs ahead of
 * it: the block is at zero by the time the crossfade is a third of the way
 * through, which is also what keeps the gap between About and the directors
 * card from reading as empty scroll — the copy is still dissolving as the card
 * starts to rise.
 */
export const ABOUT_EXIT_FADE = {
  start: "bottom 80%",
  end: "bottom 45%",
  ease: "power1.in",
  scrub: 0.4,
} as const;

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
 * its sweep, and the visible part of the crossfade runs underneath the plume,
 * landing a beat *before* TIMELINE_EXIT_FADE finishes so the plume always
 * dissolves onto a page that is already fully white rather than revealing one
 * still on its way there.
 *
 * The anchors read oddly for a phase that has to finish before its own section
 * arrives, and that is the point: the wall is pulled 50vh up into the timeline's
 * tail (see the negative margin in Sponsors.tsx), so `top bottom` is the frame
 * its transparent leading band enters on, not the frame its white does. The
 * offsets are chosen to hold the crossfade at the same absolute scroll position
 * it has always run at — moving the wall up must not drag the background with
 * it, or the page whitens while the rocket is still sweeping.
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
  start: "top bottom",
  end: "top 60%",
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

/**
 * Panel-layer opacity at which the navbar switches to its panel theme —
 * the sponsor wall's pinned white, which it holds for the rest of the page.
 *
 * Read from the panel layer for the same reason the light theme is read from
 * the light layer: it is the layer the bar is sitting on, so the two can't
 * disagree. It outranks the light threshold — this layer is stacked above the
 * other, and once it is more than half opaque it is what the bar is over.
 *
 * That matters in the light theme, where the layer beneath is near-black:
 * without this the bar would keep wearing the theme's dark surface all the way
 * down a wall the theme doesn't reach.
 */
export const NAVBAR_PANEL_THRESHOLD = 0.5;

export type AmbientStar = Readonly<{
  id: number;
  top: number;
  left: number;
  size: number;
  opacity: number;
  dimOpacity: number;
  duration: number;
  delay: number;
  hideOnMobile: boolean;
}>;

export type ShootingStarRoute = Readonly<{
  wait: number;
  startLeft: number;
  startTop: number;
  travelX: number;
  travelY: number;
  duration: number;
}>;

export const STAR_FIELD_TUNING = {
  count: 24,
  seed: 137,
  top: { min: 6, range: 88 },
  left: { min: 3, range: 94 },
  size: { min: 6.5, range: 6.5 },
  opacity: { min: 0.32, range: 0.46 },
  duration: { min: 3.6, range: 3.2 },
} as const;

function roundStarValue(value: number) {
  return Math.round(value * 100) / 100;
}

function createAmbientStars(): AmbientStar[] {
  let seed = STAR_FIELD_TUNING.seed;

  const next = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  return Array.from({ length: STAR_FIELD_TUNING.count }, (_, index) => {
    const duration =
      STAR_FIELD_TUNING.duration.min +
      next() * STAR_FIELD_TUNING.duration.range;
    const opacity =
      STAR_FIELD_TUNING.opacity.min +
      next() * STAR_FIELD_TUNING.opacity.range;

    return {
      id: index,
      top: roundStarValue(
        STAR_FIELD_TUNING.top.min + next() * STAR_FIELD_TUNING.top.range,
      ),
      left: roundStarValue(
        STAR_FIELD_TUNING.left.min + next() * STAR_FIELD_TUNING.left.range,
      ),
      size: roundStarValue(
        STAR_FIELD_TUNING.size.min + next() * STAR_FIELD_TUNING.size.range,
      ),
      opacity: roundStarValue(opacity),
      dimOpacity: roundStarValue(opacity * 0.45),
      duration: roundStarValue(duration),
      delay: roundStarValue(-next() * duration),
      hideOnMobile: index % 2 === 1,
    };
  });
}

/** Stable across server and client renders; no stars jump after hydration. */
export const STAR_FIELD_STARS = createAmbientStars();

/**
 * One shooting-star element follows these routes in sequence. The varied gaps
 * make the cycle feel occasional without runtime randomness or React updates.
 */
export const SHOOTING_STAR_ROUTES: readonly ShootingStarRoute[] = [
  {
    wait: 8,
    startLeft: -8,
    startTop: 12,
    travelX: 50,
    travelY: 27,
    duration: 0.95,
  },
  {
    wait: 15,
    startLeft: 42,
    startTop: -8,
    travelX: 50,
    travelY: 27,
    duration: 1.1,
  },
  {
    wait: 18,
    startLeft: -10,
    startTop: 46,
    travelX: 42,
    travelY: 23,
    duration: 0.9,
  },
  {
    wait: 12,
    startLeft: 68,
    startTop: -8,
    travelX: 40,
    travelY: 22,
    duration: 0.85,
  },
  {
    wait: 21,
    startLeft: 12,
    startTop: -8,
    travelX: 45,
    travelY: 25,
    duration: 1,
  },
] as const;
