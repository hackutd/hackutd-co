/** Shared scrub value — keeps scroll feel consistent across all Mission animations */
export const MISSION_SCRUB = 1;
export const MISSION_MOBILE_SCRUB = 1;

export const MISSION_LAYOUT = {
  sectionPadding: "px-8 py-32 md:px-12 md:py-40",
  sectionMinHeight: "min-h-screen",
  statementOffset: "-mt-[50svh] pt-[8svh] md:-mt-[56vh] md:pt-[10vh]",
  statementWrapMinHeight: "min-h-[88svh] md:min-h-[92vh]",
} as const;

/** Dark overlay fades in once mission is half-scrolled out of viewport */
export const MISSION_OVERLAY = {
  scrub: MISSION_SCRUB,
  start: "center top",
  end: "bottom top",
} as const;

/** Directors section pins at viewport top, content fades in, then unpins */
export const DIRECTORS_PIN = {
  scrub: MISSION_SCRUB,
  start: "top top",
  end: "+=500",
  initialYPercent: 12,
} as const;

export const DIRECTORS_NAVBAR_THEME_TRIGGER = {
  start: "top 60%",
  end: "bottom top",
  theme: "dark",
} as const;

export const MISSION_DECORATION_COUNT = 6;
