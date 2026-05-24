/**
 * Page-level background crossfade config.
 *
 * A single fixed background element is painted once and its light layer's
 * opacity is driven by two scrubbed tweens:
 *   - WHITEOUT: dark → light, scoped to the Hero/Mission handoff
 *   - DARKEN:   light → dark, scoped to the Directors section handoff
 *
 * Timings keep the Mission statement on the light layer, then return the page
 * to the dark layer as the Directors content pins.
 */

export const PAGE_BG_WHITEOUT = {
  start: "70% bottom",
  end: "bottom bottom",
  ease: "power2.in",
  scrub: 0.2,
} as const;

export const PAGE_BG_DARKEN = {
  start: "top top",
  end: "+=500",
  ease: "power1.in",
  scrub: 1,
} as const;

export const PAGE_BG_MOBILE_WHITEOUT_SCRUB = 0.6;

export const HERO_SCENE_DATA_ATTR = "data-bg-hero-scene";
export const MISSION_SECTION_DATA_ATTR = "data-bg-mission-section";
export const DIRECTORS_SECTION_DATA_ATTR = "data-bg-directors-section";
