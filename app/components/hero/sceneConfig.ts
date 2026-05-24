export type HeroStar = {
  id: number;
  size: number;
  top: number;
  left: number;
  opacity: number;
  duration: number;
  delay: number;
};

export const HERO_SCENE_SCROLL = {
  start: "top top",
  end: "65% bottom",
  scrub: 0.2,
} as const;

export const HERO_COMET_SHADER = {
  reveal: {
    start: HERO_SCENE_SCROLL.start,
    end: HERO_SCENE_SCROLL.end,
    ease: "power1.out",
  },
} as const;

export const WHITEOUT_SCROLL = {
  start: "65% bottom",
  end: "bottom bottom",
} as const;

export const HERO_LAYOUT = {
  minHeight: "min-h-[250vh] md:min-h-[400vh]",
  stickyViewportHeight: "h-[100svh] md:h-screen",
} as const;

export const HERO_COPY = {
  heading: "The Largest 24-Hour Hackathon in Texas.",
  body: "Join hundreds of hackers, creators, and innovators for a weekend of coding, collaboration, and chaos where ideas become reality.",
  ctaLabel: "Coming Soon",
} as const;

export const HERO_WHITEOUT = {
  text: {
    start: WHITEOUT_SCROLL.start,
    end: "78% bottom",
    ease: "power1.in",
  },
  overlay: {
    start: "70% bottom",
    end: WHITEOUT_SCROLL.end,
    ease: "power2.in",
  },
  scene: {
    start: "72% bottom",
    end: "92% bottom",
    ease: "power2.in",
  },
} as const;

export const HERO_SKYLINE_PARALLAX = {
  start: "top top",
  end: "65% bottom",
  backY: -40,
  ease: "none",
} as const;

export const HERO_NAVBAR_THEME_TRIGGER = {
  start: "84% bottom",
  end: "bottom top",
  theme: "light",
} as const;

export const COMET_TUNING = {
  spine: `
    M 735,870
    C 735,780 775,690 850,600
    C 920,490 1000,420 1110,345
    C 1210,285 1250,215 1140,155
    C 920,78 710,116 500,128
    C 300,134 120,72 -60,-28
  `,
  ribbon: {
    minWidth: 8,
    maxWidth: 260,
    samples: 220,
    taperPower: 1,
  },
  wave: {
    samplePoints: 80,
    maxAmplitude: 40,
    staggerEach: 0.08,
    duration: 1.2,
  },
  animation: {
    duration: 3,
    initialProgress: 0,
  },
  star: {
    outer: 14,
    inner: 3,
  },
} as const;

export const MOBILE_SCRUB = 0.6;
export const MOBILE_RIBBON_SAMPLES = 80;

export const MOBILE_COMET_WAVE = {
  ...COMET_TUNING.wave,
  maxAmplitude: 50,
} as const;

function createHeroStars(count: number): HeroStar[] {
  let seed = 27;

  const next = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  return Array.from({ length: count }, (_, index) => ({
    id: index,
    size: 4 + next() * 4.2,
    top: 8 + next() * 56,
    left: 4 + next() * 92,
    opacity: 0.35 + next() * 0.5,
    duration: 2.6 + next() * 3.8,
    delay: next() * 4,
  }));
}

export const HERO_STARS = createHeroStars(28);
