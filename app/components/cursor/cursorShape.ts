import {
  CURSOR_BOX,
  CURSOR_DOT,
  CURSOR_POINT_COUNT,
  CURSOR_POINTER,
} from "./sceneConfig";

/**
 * The two cursor outlines, and the interpolation between them.
 *
 * Both are closed polygons of `CURSOR_POINT_COUNT` points, wound clockwise on
 * screen and starting from corresponding places, so point *i* of the disc has
 * a partner at point *i* of the arrowhead and the morph is a straight lerp
 * between the two lists — no shape-matching library, no path parsing, and no
 * chance of the outline turning itself inside out halfway through.
 *
 * The result is handed to CSS `clip-path`, which is why the coordinates come
 * back out as percentages of the box rather than pixels.
 */

type Point = { x: number; y: number };

const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Where the cursor actually points. Both outlines are built around it: it is
 * the centre of the disc and the tip of the arrow, so the shape can change
 * without the aiming point moving.
 */
const HOTSPOT: Point = { x: CURSOR_BOX / 2, y: CURSOR_BOX / 2 };

/** Direction the arrow's body runs, in screen space (y grows downward). */
const AXIS_ANGLE = CURSOR_POINTER.angle * DEGREES_TO_RADIANS;
const AXIS: Point = { x: Math.cos(AXIS_ANGLE), y: Math.sin(AXIS_ANGLE) };
/** `AXIS` turned a quarter turn, i.e. along the arrow's base. */
const CROSS: Point = { x: -AXIS.y, y: AXIS.x };

function distance(from: Point, to: Point) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

/**
 * Splits the point budget across the triangle's three edges in proportion to
 * their length, handing the leftovers to the edges with the largest fractional
 * claim. Each edge then emits points from its own start corner, which is what
 * puts a real point on all three corners and keeps them sharp.
 */
function allocateEdgePoints(corners: Point[]): number[] {
  const lengths = corners.map((corner, index) =>
    distance(corner, corners[(index + 1) % corners.length]),
  );
  const perimeter = lengths.reduce((total, length) => total + length, 0);
  const exact = lengths.map(
    (length) => (length / perimeter) * CURSOR_POINT_COUNT,
  );
  const counts = exact.map((value) => Math.max(1, Math.floor(value)));

  const byRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder);

  let remaining =
    CURSOR_POINT_COUNT - counts.reduce((total, count) => total + count, 0);

  for (let step = 0; remaining > 0; step += 1) {
    counts[byRemainder[step % byRemainder.length].index] += 1;
    remaining -= 1;
  }

  return counts;
}

/**
 * The disc, walked clockwise from the point directly behind the arrow's body.
 *
 * That starting angle is the whole trick to the morph reading well: point 0 is
 * the one that travels to the tip, and starting it on the far side from the
 * body means the disc pinches in behind the hotspot while the rest of it
 * spills forward into the blade, instead of winding around itself.
 */
function buildDotRing(): Point[] {
  const start = AXIS_ANGLE + Math.PI;

  return Array.from({ length: CURSOR_POINT_COUNT }, (_, index) => {
    const angle = start + (index / CURSOR_POINT_COUNT) * Math.PI * 2;

    return {
      x: HOTSPOT.x + Math.cos(angle) * CURSOR_DOT.radius,
      y: HOTSPOT.y + Math.sin(angle) * CURSOR_DOT.radius,
    };
  });
}

/** The arrowhead, walked clockwise from the tip — point 0 again. */
function buildPointerRing(): Point[] {
  const baseCentre: Point = {
    x: HOTSPOT.x + AXIS.x * CURSOR_POINTER.length,
    y: HOTSPOT.y + AXIS.y * CURSOR_POINTER.length,
  };
  const corners: Point[] = [
    HOTSPOT,
    {
      x: baseCentre.x - CROSS.x * CURSOR_POINTER.halfWidth,
      y: baseCentre.y - CROSS.y * CURSOR_POINTER.halfWidth,
    },
    {
      x: baseCentre.x + CROSS.x * CURSOR_POINTER.halfWidth,
      y: baseCentre.y + CROSS.y * CURSOR_POINTER.halfWidth,
    },
  ];
  const counts = allocateEdgePoints(corners);
  const points: Point[] = [];

  corners.forEach((from, index) => {
    const to = corners[(index + 1) % corners.length];
    const count = counts[index];

    for (let step = 0; step < count; step += 1) {
      const along = step / count;

      points.push({
        x: from.x + (to.x - from.x) * along,
        y: from.y + (to.y - from.y) * along,
      });
    }
  });

  return points;
}

const DOT_RING = buildDotRing();
const POINTER_RING = buildPointerRing();

function toPercent(value: number) {
  return ((value / CURSOR_BOX) * 100).toFixed(2);
}

/**
 * The outline at `progress` — 0 is the disc, 1 the arrowhead — as a `clip-path`
 * polygon. Called once per frame while the morph runs.
 */
export function cursorClipPath(progress: number): string {
  const points = new Array<string>(CURSOR_POINT_COUNT);

  for (let index = 0; index < CURSOR_POINT_COUNT; index += 1) {
    const dot = DOT_RING[index];
    const pointer = POINTER_RING[index];

    points[index] =
      `${toPercent(dot.x + (pointer.x - dot.x) * progress)}% ` +
      `${toPercent(dot.y + (pointer.y - dot.y) * progress)}%`;
  }

  return `polygon(${points.join(", ")})`;
}

/** The resting outline, for the first paint before any tween has run. */
export const CURSOR_DOT_CLIP_PATH = cursorClipPath(0);
