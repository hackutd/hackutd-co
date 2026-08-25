import type { CSSProperties } from "react";

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
   * Kicker above the headline. Set in Petrona (the serif token), contrasting
   * with the Satoshi headline so the two lines read as separate voices.
   */
  eyebrow: "North America’s Largest 24 hour Hackathon",
  headline: "Building something worth showing up for.",
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
  height: "min(max(28.41vw, 170px), 45vh)",
  /**
   * Shared by the skyline band and the sky layer so the two boxes stay exactly
   * registered; the sky element coordinates are fractions of this box. The
   * small bottom offset keeps the building bases off the viewport edge.
   */
  layerBox: "h-[var(--hero-skyline-h)] bottom-[clamp(8px,3vh,36px)]",
} as const;

/**
 * The skyline is line art, so it is drawn as a painted rectangle masked by the
 * artwork's alpha rather than as an `<img>`. That takes one asset instead of a
 * black plate and a white plate: the fill is `--color-foreground`, which the
 * theme already flips from white to near-black, so the buildings recolor
 * themselves with no second file and no swap logic.
 *
 * The mask fills the shared skyline band so the full artwork reaches both
 * viewport edges while staying registered with the animated sky elements. The
 * `-webkit-` pairs are kept for older Safari, matching the masked navbar seam.
 */
const SKYLINE_ART = "url(/hero/skyline.png)";

/** SVG morphology filter used to delicately erode the rendered line weight. */
export const HERO_SKYLINE_STROKE_FILTER = {
  id: "hero-skyline-thin-strokes",
  radius: 0.9,
} as const;

export const HERO_SKYLINE_MASK: CSSProperties = {
  maskImage: SKYLINE_ART,
  WebkitMaskImage: SKYLINE_ART,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskPosition: "bottom center",
  WebkitMaskPosition: "bottom center",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  filter: `url(#${HERO_SKYLINE_STROKE_FILTER.id})`,
};

export type HeroSkyMotion = "drift-left" | "drift-right" | "cross" | "rise";

export type HeroSkyElement = {
  id: string;
  art: string;
  /** Intrinsic width ÷ height of the trimmed artwork. */
  aspect: number;
  /** Center of the element, as a fraction of the skyline band's box. */
  fx: number;
  fy: number;
  /** Width as a multiple of the band height, so it scales with the buildings. */
  width: number;
  motion: HeroSkyMotion;
  /** Seconds per drift leg. Varied per cloud so the flock never beats as one. */
  duration?: number;
  /** Extra viewport-relative lift for elements that sit above the cloud band. */
  verticalLift?: string;
  /** Thins the flock out on small screens. */
  className?: string;
};

const CLOUD_LEFT = {
  art: "/hero/dallas_cloud_left_transparent.png",
  aspect: 3.4861,
} as const;

const CLOUD_RIGHT = {
  art: "/hero/dallas_cloud_right_transparent.png",
  aspect: 4.1379,
} as const;

/**
 * `fx`/`fy` are the element's center as a fraction of the skyline band. The
 * clouds alternate between an upper and lower row around the hero copy so their
 * line art frames the headline instead of running through it. The left and
 * right groups drift toward one another before reversing.
 */
/**
 * Raises the whole flock off the rooflines, as a multiple of the band height so
 * the lift scales with the composition. Applied uniformly in
 * `heroSkyElementStyle`, which keeps the `fy` values above readable as the
 * reference plate's own proportions.
 */
export const HERO_SKY_LIFT = 0.32;

/** Uniform size reduction for the cloud flock. */
export const HERO_CLOUD_SCALE = 0.85;

export const HERO_SKY_ELEMENTS: HeroSkyElement[] = [
  {
    id: "plane",
    art: "/hero/dallas_airplane_transparent.png",
    aspect: 3.2821,
    fx: 0.16,
    fy: 0.09,
    width: 0.285,
    motion: "cross",
    verticalLift: "clamp(130px, 26svh, 260px)",
  },
  {
    id: "cloud-a",
    ...CLOUD_LEFT,
    fx: 0.09,
    fy: 0.49,
    width: 0.4 * HERO_CLOUD_SCALE,
    motion: "drift-right",
    duration: 17,
  },
  {
    id: "cloud-b",
    ...CLOUD_RIGHT,
    fx: 0.22,
    fy: -0.16,
    width: 0.34 * HERO_CLOUD_SCALE,
    motion: "drift-right",
    duration: 20,
    className: "hidden sm:block",
  },
  {
    id: "cloud-c",
    ...CLOUD_LEFT,
    fx: 0.42,
    fy: -0.2,
    width: 0.32 * HERO_CLOUD_SCALE,
    motion: "drift-right",
    duration: 15,
  },
  {
    id: "cloud-d",
    ...CLOUD_RIGHT,
    fx: 0.65,
    fy: 0.51,
    width: 0.3 * HERO_CLOUD_SCALE,
    motion: "drift-left",
    duration: 19,
    className: "hidden sm:block",
  },
  {
    id: "cloud-e",
    ...CLOUD_LEFT,
    fx: 0.755,
    fy: 0.47,
    width: 0.36 * HERO_CLOUD_SCALE,
    motion: "drift-left",
    duration: 22,
  },
  {
    id: "cloud-f",
    ...CLOUD_RIGHT,
    fx: 0.905,
    fy: -0.12,
    width: 0.38 * HERO_CLOUD_SCALE,
    motion: "drift-left",
    duration: 16,
    className: "hidden md:block",
  },
  {
    id: "balloon",
    art: "/hero/dallas_hot_air_balloon_transparent.png",
    aspect: 0.7143,
    fx: 0.82,
    fy: -0.05,
    width: 0.13,
    motion: "rise",
  },
];

export const HERO_SKY_MOTION = {
  /**
   * Clouds breathe in and out of their reference spot rather than crossing the
   * screen. A linear leg removes the eased pause that previously made each
   * reversal read as stop-and-go motion.
   */
  cloud: { xPercent: 40, ease: "none" },
  /**
   * The plane flies in one direction and wraps edge-to-edge. Its exact x range
   * is measured in `SkyElements` because the artwork scales with the skyline.
   */
  plane: {
    duration: 48,
    ease: "none",
    direction: "right-to-left",
  },
  /**
   * `from`/`to` are multiples of the band height. The balloon begins in view
   * and floats back down instead of fading out and jumping to its start.
   */
  balloon: {
    from: 0,
    to: -0.65,
    duration: 28,
    swayPercent: 22,
    swayDuration: 8,
  },
} as const;

/**
 * Same stencil trick as the skyline — the artwork supplies only the alpha and
 * `bg-foreground` supplies the ink, so every sky element recolors with the
 * theme. Each box is cut to its art's aspect, hence `100% 100%` rather than the
 * band's `cover`.
 */
export function heroSkyElementStyle(element: HeroSkyElement): CSSProperties {
  const art = `url(${element.art})`;
  const band = `var(${HERO_SKYLINE.heightVar})`;
  const halfWidth = element.width / 2;
  const rise = element.width / element.aspect / 2 + HERO_SKY_LIFT;

  return {
    width: `calc(${band} * ${element.width})`,
    aspectRatio: `${element.aspect}`,
    left: `calc(${(element.fx * 100).toFixed(2)}% - ${band} * ${halfWidth})`,
    top: `calc(${(element.fy * 100).toFixed(2)}% - ${band} * ${rise.toFixed(5)} - ${element.verticalLift ?? "0px"})`,
    maskImage: art,
    WebkitMaskImage: art,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    willChange: "transform",
  };
}

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
  star: {
    outer: 14,
    inner: 3,
  },
} as const;

export const MOBILE_SCRUB = 0.6;
export const MOBILE_RIBBON_SAMPLES = 80;

function createHeroStars(count: number): HeroStar[] {
  let seed = 27;

  const next = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  return Array.from({ length: count }, (_, index) => ({
    id: index,
    size: 6 + next() * 5.6,
    top: 8 + next() * 56,
    left: 4 + next() * 92,
    opacity: 0.35 + next() * 0.5,
    duration: 2.6 + next() * 3.8,
    delay: next() * 4,
  }));
}

export const HERO_STARS = createHeroStars(28);
