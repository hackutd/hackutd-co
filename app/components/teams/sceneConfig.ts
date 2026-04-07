export type AmbientStar = {
  id: number;
  top: number;
  left: number;
  size: number;
  opacity: number;
};

export type ConstellationBox = {
  width: number;
  height: number;
  padding: number;
  verticalBias: number;
  leadNodeSize: number;
  nodeSize: number;
};

export const TEAMS_COPY = {
  eyebrow: "HACKUTD",
  heading: ["The", "Constellation"],
} as const;

export const TEAMS_LAYOUT = {
  desktopSectionMinHeight: "min-h-[560vh]",
  mobileSectionPadding: "px-5 py-24 sm:px-6",
  desktopViewportHeight: "h-[100svh] md:h-screen",
  desktopContainer: "mx-auto flex h-full w-full max-w-[1800px] items-center gap-8 px-5 md:px-8 lg:gap-10 lg:px-12",
  introWidth: "w-[240px] shrink-0 lg:w-[300px]",
  desktopTrackViewport: "relative min-w-0 flex-1 overflow-x-hidden overflow-y-visible",
} as const;

export const TEAMS_SCROLL = {
  smoothing: 0.22,
  desktopGap: 10,
  desktopTrailingSpace: 180,
  desktopPeekWidth: 150,
  separatorWidth: 170,
  firstConstellationOffset: 320,
  tooltipCloseDelayMs: 140,
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
    width: 272,
    height: 208,
    padding: 24,
    verticalBias: 10,
    leadNodeSize: 52,
    nodeSize: 38,
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
    width: clamp(trackViewportWidth * 0.78, 760, 1240),
    height: clamp(viewportHeight * 0.5, 340, 500),
    padding: clamp(trackViewportWidth * 0.028, 34, 52),
    verticalBias: 22,
    leadNodeSize: 72,
    nodeSize: 50,
  };
}

function createAmbientStars(count: number): AmbientStar[] {
  let seed = 71;

  const next = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  return Array.from({ length: count }, (_, index) => ({
    id: index,
    top: 8 + next() * 82,
    left: 2 + next() * 96,
    size: 1 + next() * 2.8,
    opacity: 0.16 + next() * 0.4,
  }));
}

export const TEAMS_BACKGROUND_STARS = createAmbientStars(34);
