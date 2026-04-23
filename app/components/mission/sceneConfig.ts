/** Shared scrub value — keeps scroll feel consistent across all Mission animations */
export const MISSION_SCRUB = 1;
export const MISSION_MOBILE_SCRUB = 1;

export const MISSION_LAYOUT = {
  sectionPadding: "px-8 py-32 md:px-12 md:py-40",
  sectionMinHeight: "min-h-screen",
  statementOffset: "-mt-[50svh] pt-[8svh] md:-mt-[56vh] md:pt-[10vh]",
  statementWrapMinHeight: "min-h-[88svh] md:min-h-[92vh]",
} as const;

/** Directors card scales up from 92% to 100% and fades in */
export const DIRECTORS_CARD = {
  scrub: MISSION_SCRUB,
  start: "top 85%",
  end: "top 30%",
  initialScale: 0.92,
  initialOpacity: 0.4,
} as const;

export const DIRECTORS_NAVBAR_THEME_TRIGGER = {
  start: "top 60%",
  end: "bottom top",
  theme: "light",
} as const;

export const MISSION_DECORATION_COUNT = 6;
