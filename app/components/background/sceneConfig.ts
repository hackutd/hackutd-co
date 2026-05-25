/**
 * Page-level background crossfade config.
 *
 * A single fixed background element is painted once and its light layer's
 * opacity is driven by scrubbed tweens:
 *   - WHITEOUT: dark → light, scoped to the Hero section
 *   - DARKEN:   light → dark, scoped to the Mission statement section
 *   - SPONSORS_LIGHTEN: dark → light, scoped to the Timeline/Sponsors handoff
 *
 * Timings match what Hero and Mission previously controlled locally, so the
 * visual rhythm is unchanged — only the owning DOM node is unified.
 */

export const PAGE_BG_WHITEOUT = {
  start: "70% bottom",
  end: "bottom bottom",
  ease: "power2.in",
  scrub: 0.2,
} as const;

export const PAGE_BG_DARKEN = {
  start: "center top",
  end: "bottom top",
  ease: "power1.in",
  scrub: 1,
} as const;

export const PAGE_BG_SPONSORS_LIGHTEN = {
  start: "top bottom",
  end: "top center",
  ease: "power1.out",
  scrub: 1,
} as const;

export const PAGE_BG_MOBILE_WHITEOUT_SCRUB = 0.6;

export const HERO_SCENE_DATA_ATTR = "data-bg-hero-scene";
export const MISSION_STATEMENT_DATA_ATTR = "data-bg-mission-statement";
export const SPONSORS_SECTION_DATA_ATTR = "data-bg-sponsors-section";
