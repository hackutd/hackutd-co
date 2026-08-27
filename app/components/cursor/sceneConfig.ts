/**
 * Site cursor — the drawn pointer that replaces the native one across the
 * page. Everything the shape and its motion are dialled with lives here; the
 * component is refs, events and tween wiring.
 *
 * Two states, one outline: a small disc at rest, and an arrowhead over
 * anything clickable. Both are drawn as a polygon with the same number of
 * points so one can be tweened into the other (see `cursorShape.ts`), and both
 * are painted white under `mix-blend-mode: difference`, so whatever the cursor
 * crosses shows through inverted — the disc reads as the opposite colour of
 * the pixel it is sitting on, whichever theme the section is wearing.
 */

/**
 * Set on `<html>` for exactly as long as the component is mounted and drawing
 * a replacement. `globals.css` hangs the `cursor: none` rule off it, so the
 * native pointer is only ever hidden while something else is on screen to aim
 * with.
 */
export const SITE_CURSOR_ACTIVE_ATTR = "data-site-cursor";

/**
 * The square the shape is drawn in, in px. Nothing about it is visible — it is
 * only the coordinate space the two outlines share — but it has to be large
 * enough to hold the arrow, which grows down and to the right of the hotspot
 * at its centre.
 */
export const CURSOR_BOX = 48;

/** Resting state: a disc centred on the hotspot. `radius` is in px. */
export const CURSOR_DOT = {
  radius: 7,
} as const;

/**
 * Hover state: an isosceles triangle with its tip on the hotspot and its body
 * running down-right, the way a native arrow sits under the hand.
 *
 * - `angle` — direction of the body, in degrees clockwise from the +x axis.
 *   65° puts the tip up-left at roughly the tilt of the system cursor.
 * - `length` — tip to base, in px.
 * - `halfWidth` — half the base, in px. Against a 17px length it gives a ~36°
 *   apex: sharp enough to read as a pointer, wide enough to hold its colour.
 */
export const CURSOR_POINTER = {
  angle: 65,
  length: 17,
  halfWidth: 5.5,
} as const;

/**
 * Points in each outline. They are matched one-to-one across the two shapes,
 * so this is both how round the disc is and how finely the morph is sampled.
 * 48 puts the disc's flat-to-arc error at well under a tenth of a pixel.
 */
export const CURSOR_POINT_COUNT = 48;

/**
 * How the shape chases the pointer. Short — a cursor that lags reads as a
 * dropped frame rather than as weight — but not zero, which is what keeps the
 * disc feeling like an object being dragged along.
 */
export const CURSOR_FOLLOW = {
  duration: 0.22,
  ease: "power3.out",
} as const;

/** Disc ⇄ arrowhead. Long enough to be seen as a shape change, not a swap. */
export const CURSOR_MORPH = {
  duration: 0.34,
  ease: "power3.out",
} as const;

/** Press feedback — the shape dips toward the click and comes back. */
export const CURSOR_PRESS = {
  scale: 0.78,
  duration: 0.18,
  ease: "power2.out",
} as const;

/** Fade used when the pointer leaves the window, or a section takes over. */
export const CURSOR_FADE = {
  duration: 0.25,
  ease: "power2.out",
} as const;

/**
 * What counts as clickable, and so what sharpens the disc into an arrowhead.
 *
 * Reading the DOM rather than the computed `cursor` value is deliberate: the
 * rule that hides the native pointer sets `cursor: none` on everything, so by
 * the time this runs there is no `pointer` left to find. `.cursor-pointer` is
 * in the list because that utility is how the JSX marks its own clickable
 * surfaces, and `[data-cursor-interactive]` is the opt-in for anything that is
 * clickable without looking like it — a canvas hit region, say.
 */
export const CURSOR_INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "summary",
  "select",
  "input",
  "textarea",
  "label[for]",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[contenteditable="true"]',
  ".cursor-pointer",
  "[data-cursor-interactive]",
].join(", ");
