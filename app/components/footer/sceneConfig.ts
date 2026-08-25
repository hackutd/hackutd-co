/**
 * Footer reveal — the orbital wave extends the sponsor surface into the
 * transparent reveal spacer, replacing its straight lower edge with several
 * smooth, asymmetric curves. The SVG is wider than the viewport so its
 * horizontal drift never exposes an edge.
 */
export const FOOTER_ORBITAL_WAVE = {
  viewBox: "0 0 1200 64",
  path: [
    "M0 0H1200V18",
    "C1120 8 1060 45 970 42",
    "C880 39 835 10 745 18",
    "C650 27 620 51 520 44",
    "C420 37 375 8 285 20",
    "C190 32 105 51 0 26Z",
  ].join(" "),
  morphPath: [
    "M0 0H1200V34",
    "C1120 44 1060 10 970 18",
    "C880 26 835 52 745 43",
    "C650 34 620 8 520 19",
    "C420 30 375 52 285 42",
    "C190 31 105 8 0 20Z",
  ].join(" "),
  morphDuration: 3.8,
  morphEase: "sine.inOut",
  driftXPercent: {
    from: -2.5,
    to: 2.5,
  },
  scrub: 0.35,
  start: "top bottom",
  end: "bottom bottom",
} as const;
