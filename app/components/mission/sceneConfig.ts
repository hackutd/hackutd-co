export const MISSION_LAYOUT = {
  animatedSectionMinHeight: "min-h-[340vh] md:min-h-[420vh]",
  staticIntroPadding: "px-8 py-32 md:px-12 md:py-40",
  animatedIntroPadding: "px-8 py-40 md:px-12",
  directorsPadding: "px-8 py-24 opacity-0 md:px-12",
} as const;

export const MISSION_SCENE_SCROLL = {
  start: "top top",
  end: "bottom bottom",
  scrub: 0.7,
  mobileScrubMultiplier: 1.35,
} as const;

export const MISSION_TIMELINE = {
  intro: {
    initialYPercent: 0,
    initialOpacity: 1,
    settleAt: 0,
    exitAt: 0.52,
    fadeOutAt: 0.86,
    exitYPercent: -118,
  },
  overlay: {
    fadeInAt: 0.87,
  },
  directors: {
    fadeInAt: 0.93,
  },
} as const;

export const MISSION_NAVBAR_THEME_TRIGGER = {
  start: "64% top",
  end: "bottom top",
  theme: "dark",
} as const;

export const MISSION_DECORATION_COUNT = 6;
