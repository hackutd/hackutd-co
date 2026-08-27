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

export const TEAMS_SCROLL = {
  smoothing: 0.22,
  desktopGap: 0,
  desktopTrailingSpace: 96,
  desktopPeekWidth: 150,
  separatorWidth: 380,
  firstConstellationOffset: 48,
  tooltipCloseDelayMs: 140,
} as const;

export const TEAM_TOOLTIP = {
  width: 300,
  height: 176,
  gap: 14,
  edgeMargin: 12,
  follow: { duration: 0.3, ease: "power3" },
  reveal: { duration: 0.22, ease: "power2.out", scaleFrom: 0.94 },
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
