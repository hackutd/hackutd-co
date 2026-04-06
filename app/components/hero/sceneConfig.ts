export const HERO_SCENE_SCROLL = {
  start: "top top",
  end: "bottom bottom",
  scrub: 0.2,
} as const;

export const COMET_TUNING = {
  spine: `
    M 735,870
    C 735,780 775,690 850,600
    C 920,490 1000,420 1110,345
    C 1210,285 1250,215 1140,155
    C 920,78 710,116 500,128
    C 300,134 120,72 -140,-80
  `,
  ribbon: {
    minWidth: 6,
    maxWidth: 220,
    samples: 220,
    taperPower: 1,
  },
  animation: {
    duration: 3,
    initialProgress: 0,
  },
  gradient: {
    x1: 735,
    y1: 870,
    x2: -140,
    y2: -80,
    stops: [
      { offset: "10%", color: "#FFA21F" },
      { offset: "30%", color: "#FF7A1B" },
      { offset: "55%", color: "#F31667" },
      { offset: "100%", color: "#6C17FE" },
    ],
    grain: {
      baseFrequency: 0.5,
      numOctaves: 2,
      opacity: 0.4,
    },
  },
  glow: {
    blurStdDev: 24,
    opacity: 0.28,
  },
  outline: {
    width: 1,
    opacity: 0.9,
  },
  star: {
    outer: 14,
    inner: 3,
  },
} as const;
