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
  /** Season + year the hackathon ran, shown in the hover card */
  date: string;
  // Coordinates in RocketWithTrail.svg space (0 0 1371 402)
  // Trail occupies x≈202–1370, center-of-trail y varies
  x: number;
  y: number;
  /** Render image URL shown at the marker point */
  image: string;
  imageWidth: number;
  imageHeight: number;
  /** Recap card image (from the legacy org site) shown on hover */
  card: string;
  /** Optional URL the marker links to when clicked */
  href?: string;
};

export const YEAR_MARKERS: YearMarker[] = [
  // Listed newest to oldest, laid out left-to-right across the trail.
  { year: "2024", name: "RIPPLE EFFECT",      date: "Fall 2024",   x: 330,  y: 150, image: "/timeline/logos/ripple-2024.png",             imageWidth: 110, imageHeight: 25, card: "/timeline/cards/ripple-2024.png",             href: "https://ripple.hackutd.co" },
  { year: "2023", name: "HACKUTD X",          date: "Fall 2023",   x: 408,  y: 198, image: "/hackX.png",                                  imageWidth: 64,  imageHeight: 80, card: "/timeline/cards/hackutd-x-2023.png",          href: "https://x.hackutd.co" },
  { year: "2023", name: "AXXESS HACKATHON",   date: "Spring 2023", x: 486,  y: 146, image: "/timeline/logos/axxess-2023.png",             imageWidth: 100, imageHeight: 29, card: "/timeline/cards/axxess-2023.png",             href: "https://www.axxess.com/hackathon" },
  { year: "2022", name: "HACKUTD IX",         date: "Fall 2022",   x: 564,  y: 198, image: "/hackIX.png",                                 imageWidth: 78,  imageHeight: 77, card: "/timeline/cards/hackutd-ix-2022.png",         href: "https://ix.hackutd.co/" },
  { year: "2021", name: "HACKUTD VIII",       date: "Fall 2021",   x: 642,  y: 148, image: "/hackVIII.png",                               imageWidth: 68,  imageHeight: 79, card: "/timeline/cards/hackutd-viii-2021.png",       href: "https://viii.hackutd.co/" },
  { year: "2021", name: "HACKUTD VII",        date: "Spring 2021", x: 720,  y: 200, image: "/hackVII.png",                                imageWidth: 60,  imageHeight: 80, card: "/timeline/cards/hackutd-vii-2021.png",        href: "https://vii.hackutd.co/" },
  { year: "2020", name: "GAME JAM",           date: "Fall 2020",   x: 798,  y: 150, image: "/timeline/logos/gamejam-2020.png",            imageWidth: 84,  imageHeight: 47, card: "/timeline/cards/gamejam-2020.png",            href: "https://gamejam.hackutd.co/" },
  { year: "2019", name: "HACKUTD VI",         date: "Fall 2019",   x: 876,  y: 198, image: "/hackVI.png",                                 imageWidth: 62,  imageHeight: 80, card: "/timeline/cards/hackutd-vi-2019.png",         href: "https://hackutd-vi.devpost.com/" },
  { year: "2019", name: "HACKUTD 19",         date: "Spring 2019", x: 954,  y: 146, image: "/timeline/logos/hackutd-2019.png",            imageWidth: 100, imageHeight: 43, card: "/timeline/cards/hackutd-2019.png",            href: "https://hackutd2019.devpost.com/" },
  { year: "2018", name: "HACKS FOR HUMANITY", date: "Fall 2018",   x: 1032, y: 198, image: "/timeline/logos/hacks-for-humanity-2018.png", imageWidth: 84,  imageHeight: 45, card: "/timeline/cards/hacks-for-humanity-2018.png", href: "https://hfhutd18.devpost.com/" },
  { year: "2018", name: "HACKUTD 18",         date: "Spring 2018", x: 1110, y: 148, image: "/timeline/logos/hackutd-2018.png",            imageWidth: 104, imageHeight: 34, card: "/timeline/cards/hackutd-2018.png",            href: "https://hackutd18.devpost.com/" },
  { year: "2017", name: "HACKUTD 17",         date: "Spring 2017", x: 1188, y: 198, image: "/timeline/logos/hackutd-2017.png",            imageWidth: 104, imageHeight: 33, card: "/timeline/cards/hackutd-2017.png",            href: "https://hackutd17.devpost.com/" },
  { year: "2016", name: "HACKUTD 16",         date: "Spring 2016", x: 1266, y: 148, image: "/timeline/logos/hackutd-2016.png",            imageWidth: 110, imageHeight: 22, card: "/timeline/cards/hackutd-2016.png",            href: "https://hackutd16.devpost.com/" },
  { year: "2015", name: "HACKUTD",            date: "Spring 2015", x: 1340, y: 196, image: "/timeline/logos/hackutd-2015.png",            imageWidth: 116, imageHeight: 20, card: "/timeline/cards/hackutd-2015.png",            href: "https://hackutd.devpost.com/" },
];

// Hover card that previews the legacy recap image above a marker (px values)
export const CARD_POPOVER = {
  width: 320,
  gap: 14,
  edgeMargin: 12,
  topMargin: 8,
} as const;

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

// Fade the sticky rocket scene before the opaque Sponsors section arrives.
export const TIMELINE_EXIT_FADE = {
  start: "72% bottom",
  end: "90% bottom",
  ease: "power1.in",
  scrub: 0.3,
} as const;

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
