/** Scroll-in reveal for the project cards. */
export const PROJECTS_REVEAL = {
  /** Initial offset/state each card animates from */
  from: {
    autoAlpha: 0,
    y: 40,
  },
  duration: 0.8,
  stagger: 0.12,
  ease: "power2.out",
  /** Trigger window on the projects section */
  start: "top 75%",
} as const;
