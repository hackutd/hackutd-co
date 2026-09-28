// sceneConfig.ts — All static configuration for the Teams section: TypeScript types,
// Tailwind layout classes, scroll/animation constants, constellation box dimensions
// (both fixed presets and the responsive desktop calculator).
// Nothing in this file is React — it is pure data consumed by Teams.tsx.

export type ConstellationBox = {
  width: number;
  height: number;
  padding: number;
  verticalBias: number;
  leadNodeSize: number;
  nodeSize: number;
};

export const TEAMS_COPY = {
  heading: ["The", "Team"],
} as const;

export const TEAM_GRADIENT_LABEL_OVERRIDES: Record<string, string> = {
  tech: "Technology",
};

export const TEAMS_LAYOUT = {
  desktopSectionMinHeight: "min-h-[420vh]",
  mobileSectionMinHeight: "min-h-[420vh]",
  mobileSectionMinHeightAndroid: "min-h-[480vh]",
  mobileSectionPadding: "px-5 py-24 sm:px-6",
  mobileViewportHeight: "h-[100svh]",
  mobileViewportHeightAndroid: "h-[100dvh]",
  desktopViewportHeight: "h-[100svh] md:h-screen",
  desktopContainer: "mx-auto flex h-full w-full max-w-[1800px] items-start pt-28 gap-8 px-5 md:px-8 lg:gap-10 lg:px-12",
  introWidth: "w-[320px] shrink-0 lg:w-[400px]",
  desktopHeading: "font-sans text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[0.9] tracking-[-0.045em]",
  mobileHeading: "font-sans text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[0.9] tracking-[-0.045em]",
  desktopTrackViewport: "relative min-w-0 flex-1 overflow-x-clip overflow-y-visible",
} as const;

export const TEAM_GROUP_PHOTO = {
  // Sizing lives on the per-context wrapper so each layout can cap the frame
  // against its own vertical budget; `frame` only carries the shared chrome.
  frame:
    "relative overflow-hidden border border-foreground/10 bg-foreground/[0.04]",
  innerRing:
    "pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10",
  crossfade: "transition-opacity duration-[600ms] ease-out",
  desktopWrapper: "mt-24 aspect-[3/2] max-h-[34svh] w-full lg:mt-28",
  desktopSizes: "(min-width: 1024px) 400px, 320px",
  // Keep the source photos' full 3:2 ratio on mobile. A viewport-height cap
  // would flatten the frame on shorter screens and make object-cover crop heads.
  mobileWrapper: "mt-14 aspect-[3/2] w-[78%] max-w-[300px]",
  mobileSizes: "(max-width: 767px) 78vw, 300px",
  gridSizes: "(min-width: 1280px) 360px, (min-width: 768px) 44vw, 88vw",
} as const;

export const TEAMS_SCROLL = {
  /** Seconds the scroll-driven track takes to catch up to the scroll position. */
  scrub: 0.25,
  desktopGap: 0,
  desktopTrailingSpace: 96,
  desktopPeekWidth: 150,
  separatorWidth: 380,
  firstConstellationOffset: 48,
  tooltipCloseDelayMs: 140,
} as const;

export const TEAM_TOOLTIP = {
  // The photo is square, so width drives most of the card's height: trimming width
  // shortens the print without squeezing the three-line quote out of the caption.
  width: 240,
  height: 358,
  gap: 14,
  edgeMargin: 12,
  follow: { duration: 0.3, ease: "power3" },
  reveal: { duration: 0.22, ease: "power2.out", scaleFrom: 0.94 },
} as const;

// Polaroid print styling for the officer hover card: square photo at the top, caption
// below, on fixed warm-white stock (a print is white in either site theme). Keep the
// print rotation-free while the GSAP-driven shell owns the pointer-follow transform.
export const TEAM_POLAROID = {
  print:
    "flex h-full w-full rotate-0 flex-col border border-black/10 bg-[#f7f5ef] p-[13px] pb-0 shadow-[0_28px_70px_rgba(0,0,0,0.55)]",
  photo: "relative aspect-square w-full shrink-0 overflow-hidden bg-[#e6e2d8]",
  initials:
    "flex h-full w-full items-center justify-center text-3xl font-medium tracking-[-0.03em] text-black/25",
  caption: "flex min-h-0 flex-1 flex-col justify-start px-0.5 pt-3 pb-4",
  name: "truncate text-[1.02rem] font-semibold leading-tight text-[#171614]",
  role: "mt-1 truncate text-[0.6rem] uppercase leading-relaxed tracking-[0.16em] text-black/45",
  quote: "mt-2 line-clamp-3 text-[0.76rem] italic leading-[1.32] text-black/60",
} as const;

export const TEAM_CLUSTER_BOX = {
  desktop: {
    width: 980,
    height: 380,
    padding: 42,
    verticalBias: 22,
    leadNodeSize: 72,
    nodeSize: 50,
  },
  mobile: {
    width: 310,
    height: 260,
    padding: 30,
    verticalBias: 14,
    leadNodeSize: 62,
    nodeSize: 46,
  },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getDesktopConstellationBox(
  trackViewportWidth: number,
  viewportHeight: number,
): ConstellationBox {
  return {
    width: clamp(trackViewportWidth * 0.78, 680, 1120),
    height: clamp(viewportHeight * 0.66, 420, 600),
    padding: clamp(trackViewportWidth * 0.028, 60, 80),
    verticalBias: 50,
    leadNodeSize: 74,
    nodeSize: 56,
  };
}
