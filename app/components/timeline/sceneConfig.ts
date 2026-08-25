// Trail path from RocketWithTrail.svg (viewBox: 0 0 1371 402)
export const TRAIL_PATH =
  "M1135.5 325.857C1299 362.357 1243 412.857 1369.5 396.857V3.85654C1272.5 3.85654 1294.84 52.5014 1098 35.8565C962 24.3565 873 -54.6435 659.5 74.8565L658.761 75.3051C597.987 112.17 557.968 136.446 381 88.3565C289 63.3565 251 159.856 202.5 152.856L202 213.857C278 221.857 252 309.857 342 302.857C432 295.857 520.5 436.357 700.5 384.357C846.048 342.309 872.12 267.059 1135.5 325.857Z";

/** The trail SVG's user space. Every trail dimension below is in these units. */
export const TRAIL_VIEWBOX = { width: 1371, height: 402 } as const;

/** Poyo artwork positioned in the original rocket's SVG-coordinate footprint. */
export const ROCKET_ART = {
  src: "/poyo_rocket.webp",
  x: 0,
  // Align Poyo's upper exhaust opening with the trail's narrow origin at y≈179.
  y: 40,
  width: 246,
  height: 207,
} as const;

/**
 * One uninterrupted sweep: Poyo enters from the right, carries the fuel trail
 * and every year marker across the viewport, and clears the left edge entirely
 * before Sponsors arrives. The whole assembly moves as a single unit, so the
 * markers stay welded to the trail for the full journey.
 */
export const ROCKET_SWEEP = {
  /** Extra px beyond each edge so nothing is caught mid-frame at either end. */
  overshoot: 32,
  /**
   * How far past its own left edge the assembly keeps travelling, as a multiple
   * of the SVG's layout width. A little over 1 clears Poyo and every marker;
   * 1.55 also carries the delayed flare fully across the viewport for the
   * Sponsors handoff without spending almost two extra widths offscreen.
   */
  plumeExit: 1.55,
} as const;

export type YearMarker = {
  year: string;
  name: string;
  // Coordinates in RocketWithTrail.svg space (0 0 1371 402)
  // The plume runs far past the viewBox: markers can sit anywhere from x≈450
  // out to x≈2500 and still clear the left edge before the sweep parks. Roughly
  // 165 units apart reads as one screen's worth every ~8 markers.
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
  // Parks the sweep on the exact frame the sticky stage stops being pinned. By
  // then Poyo and every marker have cleared the left edge and the plume has
  // grown past all four edges, so the scene comes to rest on a full-bleed wash
  // of gradient rather than on an empty stage — and the very next frame of
  // scroll starts carrying that wash off the top with Sponsors right behind it.
  end: "bottom bottom",
  scrub: 0.9,
} as const;

export const TIMELINE_LAYOUT = {
  // Give the sweep a longer runway so Poyo takes roughly one and a half
  // viewport-heights of scrolling to cross the screen on common viewports.
  //
  // The pin range is `minHeight - 100vh`, and TIMELINE_SCROLL now spends all of
  // it, so 400vh buys the sweep the same 300vh of scroll the old 430vh did with
  // its 30vh park — identical pacing, 30vh less page above Sponsors.
  minHeight: "min-h-[400vh]",
  stickyViewportHeight: "h-[100svh]",
} as const;

export const MOBILE_TIMELINE_SCRUB = 0.9;

/**
 * The handoff into Sponsors: the full-bleed plume dissolves uniformly, in
 * place, into a page background that PAGE_BG's sponsor phase is carrying to the
 * sponsor wall's own white over the same stretch (SPONSORS_PANEL_PHASE). Both
 * land together, so the whole frame simply becomes white — no edge crosses it,
 * and nothing is clipped or wiped.
 *
 * The window is set by where the wall is, not by where the sweep stops. A
 * `top-0` sticky of one viewport unpins a full viewport before its section
 * ends, and the wall's top edge is welded to that section's bottom edge — so
 * the wall reaches the foot of the frame at exactly `bottom bottom` and rises
 * from there. Ending the dissolve at `bottom 105%` puts the plume at zero a
 * beat *before* that edge arrives, which is what keeps the wall from cutting
 * across a still-lit plume: it rises into a frame that is already white, over a
 * background that is already the same white, so its own edge is invisible.
 *
 * The 50vh window is the dissolve itself. It starts while the tail is still
 * gliding, so the gradient never sits still and unfaded, and it is slow enough
 * to read as the scene fading out rather than being switched off.
 */
export const TIMELINE_EXIT_FADE = {
  start: "bottom 155%",
  end: "bottom 105%",
  ease: "power1.inOut",
  scrub: 0.3,
} as const;

/**
 * The fuel plume, described in absolute SVG units rather than a normalised
 * 0→1 position along the trail, so lengthening the tail can never reshape the
 * jet at the nozzle.
 *
 * Profile, left to right: pinched at Poyo's exhaust → continuously grows through
 * every year marker → reaches full bleed near the end. The whole length is
 * densely sampled so the travelling wave continues through the far plume too.
 */
export const TRAIL_WAVE = {
  /** Wave points spread evenly across the plume's complete visible length. */
  numPoints: 200,
  startX: 202,
  centerY: 179,
  halfWidthMin: 50,     // wider opening at the rocket nozzle
  /** Exponent above 1 keeps early growth controlled without creating a plateau. */
  growthPower: 1.15,
  /** The continuously growing profile reaches full viewport coverage here. */
  fullWidthX: 2300,
  /**
   * Far end of the plume. It remains densely sampled after reaching full width
   * so the travelling wave never turns into a straight polygon edge.
   */
  endX: 4200,
  maxAmplitude: 40,
  amplitudeRampLength: 360, // keeps the wave pinned cleanly to the nozzle
  wavelength: 480,          // just under three complete waves per viewport
  duration: 2.4,            // seconds for one crest to travel one wavelength
} as const;

export const MOBILE_TRAIL_WAVE = {
  ...TRAIL_WAVE,
  maxAmplitude: 50,
} as const;

/**
 * How wide "full-bleed" is. Measured at runtime rather than pinned to a
 * constant because the SVG is width-driven (`w-screen`, `height: auto`): one
 * SVG unit is worth ~1px on a laptop and ~0.28px on a phone, so no single
 * number could clear the top and bottom of both.
 */
export const TRAIL_FLARE = {
  /**
   * Plume half-height at full flare, as a multiple of the distance from the
   * trail's centreline to the furthest viewport edge. A small amount above 1
   * keeps the wavy edges outside the frame without substantially oversizing the
   * fuel band.
   */
  coverage: 1.05,
  /** Extra units of mask and gradient beyond the widest the plume ever gets. */
  margin: 32,
} as const;

/**
 * Size of the gradient canvas behind the plume, in SVG units, before it is
 * stretched to cover the whole plume. Fixed so the WebGL surface costs the same
 * no matter how far the plume grows, and kept at the plume's original ~16:9 so
 * the gradient keeps the framing it has always had — the stretch then reads as
 * motion smear rather than as a different gradient.
 */
export const TRAIL_GRADIENT = {
  render: { width: 1600, height: 900 },
  mobileRender: { width: 1100, height: 620 },
} as const;
