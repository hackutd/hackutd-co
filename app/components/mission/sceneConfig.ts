export const MISSION_LAYOUT = {
  animatedSectionMinHeight: "min-h-[250vh] md:min-h-[310vh]",
  stickyViewportHeight: "h-[100svh] md:h-screen",
  staticIntroPadding: "px-8 py-32 md:px-12 md:py-40",
  animatedIntroPadding: "px-8 py-40 md:px-12",
  directorsPadding: "px-8 py-24 opacity-0 md:px-12",
} as const;

export const MISSION_SCENE_SCROLL = {
  start: "top top",
  end: "bottom bottom",
  scrub: 0.9,
  mobileScrubMultiplier: 1.35,
} as const;

export const MISSION_TIMELINE = {
  intro: {
    initialYPercent: 0,
    initialOpacity: 1,
    settleAt: 0,
    settleDuration: 0.1,
    exitAt: 0.22,
    exitDuration: 0.22,
    fadeOutAt: 0.46,
    fadeOutDuration: 0.14,
    exitYPercent: -96,
  },
  overlay: {
    fadeInAt: 0.38,
    fadeInDuration: 0.22,
  },
  directors: {
    fadeInAt: 0.52,
    fadeInDuration: 0.2,
    initialYPercent: 8,
  },
} as const;

export const MISSION_NAVBAR_THEME_TRIGGER = {
  darkAtProgress: 0.48,
  theme: "dark",
} as const;

export const MISSION_DECORATION_COUNT = 6;
