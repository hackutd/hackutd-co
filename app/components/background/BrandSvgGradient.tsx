type BrandSvgGradientProps = {
  animate?: boolean;
  duration?: number;
  height: number;
  id: string;
  width: number;
  x?: number;
  y?: number;
};

/**
 * Lightweight brand gradient for masked SVG artwork.
 *
 * Mobile WebKit can composite a hardware-accelerated canvas outside an SVG
 * foreignObject's mask and stacking context. Keeping the mobile fallback fully
 * inside SVG avoids that browser path while preserving gentle gradient motion.
 */
export default function BrandSvgGradient({
  animate = true,
  duration = 16,
  height,
  id,
  width,
  x = 0,
  y = 0,
}: BrandSvgGradientProps) {
  const driftX = Math.round(width * 0.14);
  const driftY = Math.round(height * 0.1);

  return (
    <linearGradient
      id={id}
      x1={x}
      y1={y + height}
      x2={x + width}
      y2={y}
      gradientUnits="userSpaceOnUse"
      spreadMethod="reflect"
    >
      <stop offset="0%" stopColor="#6c17fe" />
      <stop offset="34%" stopColor="#f31667" />
      <stop offset="68%" stopColor="#ff7a1b" />
      <stop offset="100%" stopColor="#ffa21f" />
      {animate && (
        <animateTransform
          attributeName="gradientTransform"
          type="translate"
          values={`0 0; ${driftX} ${-driftY}; 0 0`}
          keyTimes="0; 0.5; 1"
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
      )}
    </linearGradient>
  );
}
