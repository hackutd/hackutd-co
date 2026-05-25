// Trail path from RocketWithTrail.svg (viewBox: 0 0 1371 402)
export const TRAIL_PATH =
  "M1135.5 325.857C1299 362.357 1243 412.857 1369.5 396.857V3.85654C1272.5 3.85654 1294.84 52.5014 1098 35.8565C962 24.3565 873 -54.6435 659.5 74.8565L658.761 75.3051C597.987 112.17 557.968 136.446 381 88.3565C289 63.3565 251 159.856 202.5 152.856L202 213.857C278 221.857 252 309.857 342 302.857C432 295.857 520.5 436.357 700.5 384.357C846.048 342.309 872.12 267.059 1135.5 325.857Z";

// Rocket paths from RocketWithTrail.svg (vertically centered in the 402-unit viewBox)
export const ROCKET_FILL_PATH =
  "M229.533 262.035L201.038 227.68L201.706 182.838L201.706 142.424L244.458 103.885L169.617 107.257L139.427 137.966C99.9283 136.753 71.8132 134.856 55.3588 144.356C27.2133 160.607 8.54468 174.272 1.50001 180.071C46.0035 216.153 80.2702 223.505 98.0776 225.348C105.802 226.147 121.715 226.59 139.378 226.883C147.626 238.768 160.107 251.119 165.317 255.809L229.533 262.035Z";

export const ROCKET_STROKE_PATH =
  "M201.038 227.68L229.533 262.035L165.317 255.809C160.107 251.119 147.626 238.768 139.378 226.883M201.038 227.68L201.706 182.838L201.706 142.424M201.038 227.68C186.035 227.38 161.352 227.248 139.378 226.883M139.378 226.883C121.715 226.59 105.802 226.147 98.0776 225.348C80.2702 223.505 46.0035 216.153 1.50001 180.071C8.54468 174.272 27.2133 160.607 55.3588 144.356C71.8132 134.856 99.9283 136.753 139.427 137.966M201.706 142.424L244.458 103.885L169.617 107.257L139.427 137.966M201.706 142.424L139.427 137.966";

export type YearMarker = {
  year: string;
  name: string;
  // Coordinates in RocketWithTrail.svg space (0 0 1371 402)
  // Trail occupies x≈202–1370, center-of-trail y varies
  x: number;
  y: number;
  /** Render image URL shown at the marker point */
  image: string;
  imageWidth: number;
  imageHeight: number;
  /** Optional URL the marker links to when clicked */
  href?: string;
};

export const YEAR_MARKERS: YearMarker[] = [
  // Listed newest to oldest, laid out left-to-right across the trail.
  { year: "2023", name: "HACKUTD X",    x: 500,  y: 158, image: "/hackX.png",    imageWidth: 82,  imageHeight: 102 },
  { year: "2022", name: "HACKUTD IX",   x: 665,  y: 178, image: "/hackIX.png",   imageWidth: 102, imageHeight: 100 },
  { year: "2021", name: "HACKUTD VIII", x: 830,  y: 164, image: "/hackVIII.png", imageWidth: 88,  imageHeight: 102 },
  { year: "2020", name: "HACKUTD VII",  x: 995,  y: 182, image: "/hackVII.png",  imageWidth: 78,  imageHeight: 104 },
  { year: "2019", name: "HACKUTD VI",   x: 1160, y: 154, image: "/hackVI.png",   imageWidth: 80,  imageHeight: 104 },
];

export const TIMELINE_SCROLL = {
  start: "top top",
  end: "bottom bottom",
  scrub: 0.3,
} as const;

// Cubic Bezier for the rocket slide: fast entry from the right, smooth deceleration
// Equivalent to CSS cubic-bezier(0.22, 1, 0.36, 1)
export const ROCKET_SLIDE_EASE = "M0,0 C0.22,1,0.36,1,1,1";

export const TIMELINE_LAYOUT = {
  minHeight: "min-h-[300vh]",
  stickyViewportHeight: "h-[100svh]",
} as const;

export const MOBILE_TIMELINE_SCRUB = 0.6;

export const TRAIL_WAVE = {
  numPoints: 80,
  startX: 202,
  endX: 1370,
  centerY: 179,
  halfWidthMin: 12,     // very narrow at rocket nozzle (t=0)
  halfWidthPeak: 115,   // cone width once fully open
  halfWidthEnd: 140,    // baseline width after the spike settles
  peakT: 0.15,          // cone opens up in first 15% of trail, then holds
  maxAmplitude: 40,     // wave amplitude scales with width (0 at rocket, peaks then settles)
  staggerEach: 0.12,    // large stagger → ~2–3 visible sine crests across trail
  duration: 1.8,
  hwTailBurst: 240,     // dramatic flare width at the very far end of the trail
  tailSharpness: 6,     // how concentrated the burst is near t=1 (higher = sharper)
} as const;

export const MOBILE_TRAIL_WAVE = {
  ...TRAIL_WAVE,
  halfWidthPeak: 145,
  halfWidthEnd: 155,
  hwTailBurst: 270,
  maxAmplitude: 50,
} as const;

export const TIMELINE_WAVE_SPEED = {
  active: 1,
  settled: 0.28,
  transitionDuration: 1.4,
} as const;
