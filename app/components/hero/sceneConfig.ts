export const HERO_SCENE_SCROLL = {
  start: "top top",
  end: "65% bottom",
  scrub: 0.2,
} as const;

export const HERO_COMET_SHADER = {
  fov: 45,
  pixelDensity: 1,
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
  /**
   * Sits the statement above dead center, clear of the skyline. Padding on the
   * centering container rather than a transform, since GSAP owns `transform`
   * on that element — the copy lifts by half this value.
   */
  textLift: "pb-[clamp(40px,10vh,120px)]",
} as const;

export const HERO_COPY = {
  /**
   * Kicker above the headline. Its italic treatment separates it from the
   * headline while keeping the site's Satoshi typography consistent.
   */
  eyebrow: "North America’s Largest 24 hour Collegiate Hackathon",
  headline: "Build something worth showing up for",
} as const;

/** Per-character scroll exit for the Hero copy. */
export const HERO_TEXT_EFFECT = {
  exit: {
    start: WHITEOUT_SCROLL.start,
    end: "84% bottom",
    blur: 10,
    y: -30,
    duration: 0.6,
    stagger: 0.015,
    ease: "power1.in",
  },
} as const;

export const HERO_WHITEOUT = {
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

/**
 * The live Dallas skyline (see DallasSkyline.tsx): the sticky hero viewport
 * is its pointer stage, and the scene's rows parallax by these SVG units as
 * the hero scrolls, far row up and front row down, so the city gains depth
 * while the copy leaves.
 */
export const HERO_CITY_STAGE_DATA_ATTR = "data-hero-city-stage";

export const HERO_CITY = {
  parallax: {
    start: HERO_SCENE_SCROLL.start,
    end: HERO_WHITEOUT.scene.start,
    sky: { x: -70, y: -14 },
    far: { x: 0, y: -10 },
    mid: { x: 0, y: 8 },
    near: { x: 0, y: 22 },
  },
  motion: {
    /** DART cars, in grid cells per second. */
    train: 1.25,
    /** Clouds drift in SVG units per second, scaled per cloud. */
    cloud: 4.5,
    /** Airliners cross in SVG units per second. */
    plane: 34,
    balloon: { rise: 26, sway: 10, period: 11 },
  },
  mobile: {
    clouds: 3,
    planes: 1,
    wallBoards: false,
    cranes: 1,
  },
} as const;

/**
 * The skyline band keeps the artwork readable on narrow phones and clear of the
 * hero copy on short landscape viewports. Its uncapped height matches the
 * artwork's aspect ratio so the skyline spans the viewport without side gaps.
 */
export const HERO_SKYLINE = {
  /**
   * Published as a custom property on the sticky viewport because the sky
   * elements size and place themselves off the band height too — one number
   * keeps the whole composition in proportion at every viewport.
   */
  heightVar: "--hero-skyline-h",
  /**
   * The artwork's own aspect (0.2841) of the band width. On phones the band is
   * wider than the viewport (`widthClass`), so the skyline draws larger and
   * the flanks crop off either side instead of the whole city shrinking to a
   * strip; from `md` up it spans the viewport edge to edge as before.
   */
  height: "min(max(calc(var(--hero-skyline-w) * 0.2841), 170px), 45vh)",
  /** Goes on the sticky viewport with `heightVar`. */
  widthClass: "[--hero-skyline-w:240vw] md:[--hero-skyline-w:100vw]",
  /**
   * Shared by the skyline band and the sky layer so the two boxes stay exactly
   * registered; the sky element coordinates are fractions of this box. The
   * small bottom offset keeps the building bases off the viewport edge. Below
   * `md` the box is centred on the viewport and overflows it.
   */
  layerBox:
    "h-[var(--hero-skyline-h)] bottom-[clamp(8px,3vh,36px)] w-[var(--hero-skyline-w)] left-[calc(50%-var(--hero-skyline-w)/2)] md:inset-x-0 md:w-auto",
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
    amplitude: 34,
    mobileAmplitude: 22,
    frequency: 2.6,
    duration: 2.4,
  },
  animation: {
    duration: 3,
    initialProgress: 0,
  },
  gradient: {
    x1: 735,
    y1: 870,
    x2: -60,
    y2: -28,
    stops: [
      { offset: "10%", color: "var(--color-amber)" },
      { offset: "30%", color: "var(--color-orange)" },
      { offset: "55%", color: "var(--color-pink)" },
      { offset: "100%", color: "var(--color-purple)" },
    ],
    drift: {
      duration: 24,
      x1: {
        amplitude: 58,
        frequency: 1,
        phase: 0.35,
        rippleAmplitude: 9,
        rippleFrequency: 5,
        ripplePhase: 1.1,
      },
      y1: {
        amplitude: 46,
        frequency: 2,
        phase: 1.25,
        rippleAmplitude: 7,
        rippleFrequency: 6,
        ripplePhase: 0.45,
      },
      x2: {
        amplitude: 96,
        frequency: 3,
        phase: 2.2,
        rippleAmplitude: 14,
        rippleFrequency: 7,
        ripplePhase: 1.7,
      },
      y2: {
        amplitude: 74,
        frequency: 4,
        phase: 0.8,
        rippleAmplitude: 11,
        rippleFrequency: 8,
        ripplePhase: 2.4,
      },
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
} as const;

export const MOBILE_SCRUB = 0.6;
export const MOBILE_RIBBON_SAMPLES = 80;
