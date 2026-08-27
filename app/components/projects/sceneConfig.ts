export const PROJECTS_LAYOUT = {
  section: "relative px-4 pb-24 pt-64 md:px-8 md:pb-28 md:pt-72",
  container: "mx-auto w-full max-w-[1200px]",
  grid: "grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8",
} as const;

export const PROJECT_ART = {
  Harp: {
    accent: "#ffa21f",
    imageClassName: "w-[min(24%,120px)]",
    imageTreatmentClassName: "invert",
  },
  Jury: {
    accent: "#6c17fe",
    imageClassName: "w-[min(22%,110px)]",
    imageTreatmentClassName: "",
  },
  "HackUTD Docs": {
    accent: "#f31667",
    imageClassName: "w-[min(24%,120px)]",
    imageTreatmentClassName: "brightness-0",
  },
  "HackUTD Guide": {
    accent: "#ff7a1b",
    imageClassName: "w-[min(24%,120px)]",
    imageTreatmentClassName: "invert",
  },
} as const satisfies Record<
  string,
  {
    accent: string;
    imageClassName: string;
    imageTreatmentClassName?: string;
  }
>;

/** Scroll-in reveal for the project cards. */
export const PROJECTS_REVEAL = {
  from: {
    autoAlpha: 0,
    y: 40,
  },
  duration: 0.8,
  stagger: 0.11,
  ease: "power2.out",
  start: "top 75%",
} as const;
