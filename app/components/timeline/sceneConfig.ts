// Trail path from RocketWithTrail.svg (viewBox: 0 0 1371 402)
export const TRAIL_PATH =
  "M1135.5 325.857C1299 362.357 1243 412.857 1369.5 396.857V3.85654C1272.5 3.85654 1294.84 52.5014 1098 35.8565C962 24.3565 873 -54.6435 659.5 74.8565L658.761 75.3051C597.987 112.17 557.968 136.446 381 88.3565C289 63.3565 251 159.856 202.5 152.856L202 213.857C278 221.857 252 309.857 342 302.857C432 295.857 520.5 436.357 700.5 384.357C846.048 342.309 872.12 267.059 1135.5 325.857Z";

/** The trail SVG's user space. Every trail dimension below is in these units. */
export const TRAIL_VIEWBOX = { width: 1371, height: 402 } as const;

/** Poyo artwork positioned in the original rocket's SVG-coordinate footprint. */
export const ROCKET_ART = {
  src: "/poyo_rocket.webp",
  // Tuck the plume beneath the rear engine bells so it appears to originate
  // from Poyo's rocket instead of beginning beside the artwork.
  x: 18,
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
   * of the SVG's layout width. The mobile exit is longer because its marker
   * pitch is substantially wider. Both values leave enough room for the final
   * logo to clear before the Sponsors handoff.
   */
  plumeExit: {
    desktop: 2.15,
    mobile: 2.75,
  },
} as const;

export type YearMarker = {
  year: string;
  name: string;
  /** Season + year the hackathon ran, shown in the hover card */
  date: string;
  // Coordinates in RocketWithTrail.svg space (0 0 1371 402)
  // These are base positions; MARKER_SPACING expands them responsively while
  // keeping them inside the plume and the configured sweep exit.
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
  // Base coordinates are spaced 165 units apart from x=450. Responsive pitch
  // multipliers below spread those coordinates further apart at render time.
  { year: "2024", name: "RIPPLE EFFECT",      date: "Fall 2024",   x: 450,  y: 150, image: "/timeline/logos/ripple-2024.png",             imageWidth: 110, imageHeight: 25, card: "/timeline/cards/ripple-2024.png",             href: "https://ripple.hackutd.co" },
  { year: "2023", name: "HACKUTD X",          date: "Fall 2023",   x: 615,  y: 198, image: "/hackX.png",                                  imageWidth: 64,  imageHeight: 80, card: "/timeline/cards/hackutd-x-2023.png",          href: "https://x.hackutd.co" },
  { year: "2023", name: "AXXESS HACKATHON",   date: "Spring 2023", x: 780,  y: 146, image: "/timeline/logos/axxess-2023.png",             imageWidth: 100, imageHeight: 29, card: "/timeline/cards/axxess-2023.png",             href: "https://www.axxess.com/hackathon" },
  { year: "2022", name: "HACKUTD IX",         date: "Fall 2022",   x: 945,  y: 198, image: "/hackIX.png",                                 imageWidth: 78,  imageHeight: 77, card: "/timeline/cards/hackutd-ix-2022.png",         href: "https://ix.hackutd.co/" },
  { year: "2021", name: "HACKUTD VIII",       date: "Fall 2021",   x: 1110, y: 148, image: "/hackVIII.png",                               imageWidth: 68,  imageHeight: 79, card: "/timeline/cards/hackutd-viii-2021.png",       href: "https://viii.hackutd.co/" },
  { year: "2021", name: "HACKUTD VII",        date: "Spring 2021", x: 1275, y: 200, image: "/hackVII.png",                                imageWidth: 60,  imageHeight: 80, card: "/timeline/cards/hackutd-vii-2021.png",        href: "https://vii.hackutd.co/" },
  { year: "2020", name: "GAME JAM",           date: "Fall 2020",   x: 1440, y: 150, image: "/timeline/logos/gamejam-2020.png",            imageWidth: 84,  imageHeight: 47, card: "/timeline/cards/gamejam-2020.png",            href: "https://gamejam.hackutd.co/" },
  { year: "2019", name: "HACKUTD VI",         date: "Fall 2019",   x: 1605, y: 198, image: "/hackVI.png",                                 imageWidth: 62,  imageHeight: 80, card: "/timeline/cards/hackutd-vi-2019.png",         href: "https://hackutd-vi.devpost.com/" },
  { year: "2019", name: "HACKUTD 19",         date: "Spring 2019", x: 1770, y: 146, image: "/timeline/logos/hackutd-2019.png",            imageWidth: 100, imageHeight: 43, card: "/timeline/cards/hackutd-2019.png",            href: "https://hackutd2019.devpost.com/" },
  { year: "2018", name: "HACKS FOR HUMANITY", date: "Fall 2018",   x: 1935, y: 198, image: "/timeline/logos/hacks-for-humanity-2018.png", imageWidth: 84,  imageHeight: 45, card: "/timeline/cards/hacks-for-humanity-2018.png", href: "https://hfhutd18.devpost.com/" },
  { year: "2018", name: "HACKUTD 18",         date: "Spring 2018", x: 2100, y: 148, image: "/timeline/logos/hackutd-2018.png",            imageWidth: 104, imageHeight: 34, card: "/timeline/cards/hackutd-2018.png",            href: "https://hackutd18.devpost.com/" },
  { year: "2017", name: "HACKUTD 17",         date: "Spring 2017", x: 2265, y: 198, image: "/timeline/logos/hackutd-2017.png",            imageWidth: 104, imageHeight: 33, card: "/timeline/cards/hackutd-2017.png",            href: "https://hackutd17.devpost.com/" },
  { year: "2016", name: "HACKUTD 16",         date: "Spring 2016", x: 2430, y: 148, image: "/timeline/logos/hackutd-2016.png",            imageWidth: 110, imageHeight: 22, card: "/timeline/cards/hackutd-2016.png",            href: "https://hackutd16.devpost.com/" },
  { year: "2015", name: "HACKUTD",            date: "Spring 2015", x: 2595, y: 196, image: "/timeline/logos/hackutd-2015.png",            imageWidth: 116, imageHeight: 20, card: "/timeline/cards/hackutd-2015.png",            href: "https://hackutd.devpost.com/" },
];

/**
 * Marker artwork scales independently from the width-driven timeline SVG.
 * Without the stronger mobile multiplier, logos that are 60–116 SVG units
 * wide render at only about 17–33 physical pixels on a 390px viewport.
 */
export const MARKER_IMAGE_SCALE = {
  desktop: 1.2,
  mobile: 1.75,
} as const;

/** Keep the first marker anchored while increasing every following gap. */
export const MARKER_SPACING = {
  anchorX: 450,
  desktopScale: 1.1,
  mobileScale: 1.45,
} as const;

// Hover card that previews the legacy recap image above a marker (px values)
export const CARD_POPOVER = {
  width: 320,
  gap: 14,
  edgeMargin: 12,
  /** Recap images are 1035x561; the name/date caption under them adds ~44px. */
  imageAspect: 1035 / 561,
  captionHeight: 44,
  /**
   * Grace period before a card is torn down. The markers are never completely
   * still — they ride the plume's wave and the scrubbed sweep — so a pointer
   * held perfectly still can still fall outside a marker for a frame or two.
   * Without a delay that reads as the card flickering on and off; with one, the
   * pointer coming straight back cancels the teardown and nothing is seen.
   */
  hideDelay: 180,
  /**
   * Invisible padding around each marker's artwork and labels, in SVG units,
   * that also counts as hovering it. A marker drifting by a few units under a
   * stationary cursor stays inside its own hit area instead of slipping out.
   */
  hitPadX: 18,
  hitPadY: 12,
} as const;

/**
 * How much of the plume's wave the year markers actually follow.
 *
 * At 1 they tracked the fuel exactly — but the wave repeats forever, so at
 * desktop scale that is ~84px of continuous vertical travel, about a marker's
 * own height, with no scrolling involved at all. Markers kept sliding out from
 * under a stationary cursor. A quarter keeps them visibly drifting with the
 * plume they sit in while making them a target that can be hovered.
 */
export const MARKER_WAVE_FOLLOW = 0.25;

export const TIMELINE_SCROLL = {
  start: "top top",
  // Parks the sweep on the exact frame the sticky stage stops being pinned. By
  // then Poyo and every marker have cleared the left edge, leaving a full-bleed
  // gradient handoff on every viewport. The next frame starts carrying the
  // stage off the top with Sponsors right behind it.
  end: "bottom bottom",
  scrub: 0.9,
} as const;

export const TIMELINE_LAYOUT = {
  // The pin range is `minHeight - 100vh`. Mobile gets a longer runway to pay
  // for its wider marker pitch without making the sweep move faster.
  minHeight: "min-h-[600vh] md:min-h-[520vh]",
  stickyViewportHeight: "h-[100svh]",
} as const;

export const MOBILE_TIMELINE_SCRUB = 0.9;

/**
 * The handoff into Sponsors: the plume dissolves uniformly, in place, into a
 * page background that PAGE_BG's sponsor phase is carrying to the sponsor
 * wall's own white over the same stretch (SPONSORS_PANEL_PHASE). The plume is
 * full bleed on every viewport so no hard edge appears during the crossfade.
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
 * every year marker → reaches its maximum width near the end. That maximum is
 * full bleed on every viewport. The whole length is densely sampled so the
 * travelling wave continues through the far plume too.
 */
export const TRAIL_WAVE = {
  /** Wave points spread evenly across the plume's complete visible length. */
  numPoints: 200,
  startX: 202,
  centerY: 179,
  // Width of the plume exactly where it leaves Poyo's exhaust. The wave's
  // amplitude ramps up from zero over amplitudeRampLength, so at this one point
  // the visible band is this value alone — nothing else narrows or widens it.
  halfWidthMin: 46,
  /**
   * Exponent on the 0->1 growth between the nozzle and fullWidthX. Below 1 the
   * plume opens fastest as it leaves the nozzle and eases off further out,
   * which is what lets the opening be pinched tight without the body behind it
   * going thin with it: paired with halfWidthMin 46, the band is 41% narrower
   * at the nozzle yet back to its previous width by the first year marker.
   * Still strictly increasing, so there is no plateau.
   */
  growthPower: 0.85,
  /** The continuously growing profile reaches its configured maximum here. */
  fullWidthX: 2300,
  /**
   * Far end of the plume. It remains densely sampled after reaching full width
   * so the travelling wave never turns into a straight polygon edge.
   */
  endX: 4200,
  maxAmplitude: 26,         // crest-to-trough is twice this; a shallow roll
  amplitudeRampLength: 360, // keeps the wave pinned cleanly to the nozzle
  wavelength: 480,          // just under three complete waves per viewport
  // Seconds for one crest to travel one wavelength. The plume reads as a slow
  // drift rather than a ripple, so a crest takes ~13s to cross a viewport. This
  // is also the marker bob's phase driver, so slowing it settles the markers
  // further on top of MARKER_WAVE_FOLLOW.
  duration: 4.5,
} as const;

export const MOBILE_TRAIL_WAVE = {
  ...TRAIL_WAVE,
  // Mobile's wider marker spacing gives the sweep a longer exit than desktop.
  // Keep the finite tail beyond the viewport until the exit fade is complete,
  // so its straight polygon edge can never cut into the white handoff.
  endX: 5400,
  // A unit is worth ~a quarter of a desktop pixel here, so the wave needs more
  // units to read as the same depth on screen.
  maxAmplitude: 32,
} as const;

/**
 * Runtime plume-width limits. Measured rather than pinned to a constant because
 * the SVG is width-driven (`w-screen`, `height: auto`): one SVG unit is worth
 * ~1px on a laptop and ~0.28px on a phone.
 */
export const TRAIL_FLARE = {
  /**
   * Plume half-height at full flare, as a multiple of the distance from the
   * trail's centreline to the furthest viewport edge. A small amount above 1
   * keeps the wavy edges outside the frame without substantially oversizing the
   * fuel band. Mobile uses a slightly tighter margin while still covering the
   * screen throughout the travelling wave.
   */
  coverage: {
    desktop: 1.05,
    mobile: 1.03,
  },
  /** Extra units of mask and gradient beyond the widest the plume ever gets. */
  margin: 32,
} as const;

/**
 * Size of the desktop gradient canvas behind the plume, in SVG units, before it
 * is stretched to cover the whole plume. Fixed so the WebGL surface costs the
 * same no matter how far the plume grows, and kept at the plume's original
 * ~16:9 so the stretch reads as motion smear rather than a different gradient.
 * Mobile uses the native SVG gradient instead and never mounts this canvas.
 */
export const TRAIL_GRADIENT = {
  render: { width: 1600, height: 900 },
} as const;
