import { COMET_TUNING } from "./sceneConfig";

export type SpineSample = {
  distance: number;
  x: number;
  y: number;
  nx: number;
  ny: number;
};

export type RibbonWaveOptions = Readonly<{
  amplitude: number;
  frequency: number;
  phase: number;
}>;

export function buildStarPoints(outer: number, inner: number) {
  return `0,${-outer} ${inner},${-inner} ${outer},0 ${inner},${inner} 0,${outer} ${-inner},${inner} ${-outer},0 ${-inner},${-inner}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function roundCoord(value: number) {
  return Math.round(value * 100) / 100;
}

type GradientOrbitAxis = Readonly<{
  amplitude: number;
  frequency: number;
  phase: number;
  rippleAmplitude: number;
  rippleFrequency: number;
  ripplePhase: number;
}>;

export function orbitGradientCoord(
  origin: number,
  angle: number,
  axis: GradientOrbitAxis,
) {
  const primary =
    Math.sin(angle * axis.frequency + axis.phase) * axis.amplitude -
    Math.sin(axis.phase) * axis.amplitude;
  const ripple =
    Math.cos(angle * axis.rippleFrequency + axis.ripplePhase) *
      axis.rippleAmplitude -
    Math.cos(axis.ripplePhase) * axis.rippleAmplitude;

  return origin + primary + ripple;
}

export function precomputeSpineSamples(
  path: SVGPathElement,
  totalLength: number,
  sampleCount: number,
) {
  const samples: SpineSample[] = [];

  for (let i = 0; i <= sampleCount; i += 1) {
    const distance = (i / sampleCount) * totalLength;
    const point = path.getPointAtLength(distance);
    const prev = path.getPointAtLength(Math.max(0, distance - 1));
    const next = path.getPointAtLength(Math.min(totalLength, distance + 1));
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const mag = Math.hypot(dx, dy) || 1;

    samples.push({
      distance,
      x: point.x,
      y: point.y,
      nx: -dy / mag,
      ny: dx / mag,
    });
  }

  return samples;
}

export function interpolateSpineSample(
  samples: SpineSample[],
  totalLength: number,
  distance: number,
) {
  const clampedDistance = clamp(distance, 0, totalLength);
  const maxIndex = samples.length - 1;

  if (maxIndex <= 0 || totalLength <= 0) {
    return { ...samples[0], distance: clampedDistance };
  }

  const position = (clampedDistance / totalLength) * maxIndex;
  const fromIndex = Math.floor(position);
  const toIndex = Math.min(maxIndex, fromIndex + 1);
  const t = position - fromIndex;
  const from = samples[fromIndex];
  const to = samples[toIndex];

  if (t <= 0) {
    return { ...from, distance: clampedDistance };
  }

  const nx = from.nx + (to.nx - from.nx) * t;
  const ny = from.ny + (to.ny - from.ny) * t;
  const normalMag = Math.hypot(nx, ny) || 1;

  return {
    distance: clampedDistance,
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    nx: nx / normalMag,
    ny: ny / normalMag,
  };
}

function ribbonWidth(u: number) {
  const growth = 1 - (1 - u) ** COMET_TUNING.ribbon.taperPower;
  return (
    COMET_TUNING.ribbon.minWidth +
    (COMET_TUNING.ribbon.maxWidth - COMET_TUNING.ribbon.minWidth) * growth
  );
}

function ribbonWaveOffset(
  u: number,
  distanceRatio: number,
  width: number,
  wave?: RibbonWaveOptions,
) {
  if (!wave || wave.amplitude <= 0 || wave.frequency <= 0) {
    return 0;
  }

  const widthRange = COMET_TUNING.ribbon.maxWidth - COMET_TUNING.ribbon.minWidth;
  const widthFactor =
    widthRange <= 0
      ? 1
      : clamp((width - COMET_TUNING.ribbon.minWidth) / widthRange, 0, 1);
  const taperFactor = clamp(u, 0, 1);

  return (
    Math.sin(distanceRatio * Math.PI * 2 * wave.frequency + wave.phase) *
    wave.amplitude *
    widthFactor *
    taperFactor
  );
}

export function buildRibbonSegmentPath(
  samples: SpineSample[],
  totalLength: number,
  headDistance: number,
  wave?: RibbonWaveOptions,
) {
  if (totalLength <= 0 || samples.length === 0) {
    return "";
  }

  const clampedHead = clamp(headDistance, 0, totalLength);
  const segmentLength = totalLength - clampedHead;

  if (segmentLength <= 0.5) {
    return "";
  }

  const sampleCount = Math.max(
    6,
    Math.ceil((segmentLength / totalLength) * (samples.length - 1)),
  );
  const left = new Array(sampleCount + 1);
  const right = new Array(sampleCount + 1);

  for (let i = 0; i <= sampleCount; i += 1) {
    const u = i / sampleCount;
    const distance = clampedHead + u * segmentLength;
    const sample = interpolateSpineSample(samples, totalLength, distance);
    const width = ribbonWidth(u);
    const waveOffset = ribbonWaveOffset(
      u,
      distance / totalLength,
      width,
      wave,
    );
    const centerX = sample.x + sample.nx * waveOffset;
    const centerY = sample.y + sample.ny * waveOffset;

    const half = width * 0.5;
    left[i] =
      `${roundCoord(centerX + sample.nx * half)},${roundCoord(centerY + sample.ny * half)}`;
    right[sampleCount - i] =
      `${roundCoord(centerX - sample.nx * half)},${roundCoord(centerY - sample.ny * half)}`;
  }

  return `M ${left.join(" L ")} L ${right.join(" L ")} Z`;
}
