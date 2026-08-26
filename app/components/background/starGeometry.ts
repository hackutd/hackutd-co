export const STAR_SHAPE = {
  outer: 14,
  inner: 3,
} as const;

export function buildStarPoints(
  outer: number = STAR_SHAPE.outer,
  inner: number = STAR_SHAPE.inner,
) {
  return `0,${-outer} ${inner},${-inner} ${outer},0 ${inner},${inner} 0,${outer} ${-inner},${inner} ${-outer},0 ${-inner},${-inner}`;
}

function roundPercentage(value: number) {
  return Math.round(value * 1000) / 1000;
}

/** CSS equivalent of the SVG polygon used by the hero's comet head. */
export function buildStarClipPath(
  outer: number = STAR_SHAPE.outer,
  inner: number = STAR_SHAPE.inner,
) {
  const center = 50;
  const inset = (inner / outer) * center;
  const low = roundPercentage(center - inset);
  const high = roundPercentage(center + inset);

  return `polygon(50% 0%, ${high}% ${low}%, 100% 50%, ${high}% ${high}%, 50% 100%, ${low}% ${high}%, 0% 50%, ${low}% ${low}%)`;
}

export const STAR_CLIP_PATH = buildStarClipPath();
