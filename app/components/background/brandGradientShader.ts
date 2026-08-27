/**
 * Brand gradient — 2D replacement for the WebGL sphere the site used to render
 * through three.js/@shadergradient.
 *
 * The 3D version built its look from a subdivided sphere whose vertices were
 * displaced by noise, lit by an environment map and viewed through a zoomed
 * camera. Every call site cropped so far into that sphere that none of the
 * geometry read as a sphere — what was visible was the flowing colour field on
 * its surface. That field is reproduced here directly in screen space: two
 * rounds of domain warping stand in for the vertex displacement, and the
 * magnitude of the warp stands in for the light falloff the env map gave the
 * displaced surface.
 *
 * The result is one fullscreen triangle and one shader program: no scene
 * graph, no geometry, no environment texture, no PMREM pass.
 */

export const BRAND_GRADIENT_COLORS = {
  color1: "#6C17FE",
  color2: "#F31667",
  color3: "#FFA21F",
  background: "#000000",
} as const;

export type BrandGradientTuning = {
  /** Scale of the noise field. Higher shows more of the pattern at once. */
  zoom: number;
  /** Pans the field, in the same units as `zoom`. */
  offsetX: number;
  offsetY: number;
  /** How hard each domain-warp pass displaces the field. */
  warp: number;
  /**
   * Direction of the colour ramp, in degrees counter-clockwise from +x.
   * Colour 1 sits at the low end, colour 3 at the high end.
   */
  axisAngle: number;
  /** How far the ramp is stretched across the frame. Larger is a softer sweep. */
  axisSpan: number;
  /** How far the noise is allowed to push a pixel along the ramp. */
  noiseAmount: number;
  /** Overall speed of the drift. */
  speed: number;
  /**
   * Full palette rotations per second. Each brand colour slides out of the
   * ramp as the next slides in, so the gradient travels the whole palette and
   * returns to where it started. 0 pins the palette in place.
   */
  cycleSpeed: number;
  /** Output gain, applied before the vignette. */
  brightness: number;
  /** How strongly the frame edge falls off to the background colour. */
  vignette: number;
  /** Dither/film grain. Small values also break up 8-bit banding. */
  grain: number;
};

export const BRAND_GRADIENT_DEFAULTS: BrandGradientTuning = {
  zoom: 0.6,
  offsetX: 0,
  offsetY: -0.05,
  warp: 0.5,
  axisAngle: 28,
  axisSpan: 3.1,
  noiseAmount: 0.28,
  speed: 0.18,
  cycleSpeed: 0.014,
  brightness: 1.1,
  vignette: 0.45,
  grain: 0.016,
};

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uBackground;
uniform vec2 uOffset;
uniform float uZoom;
uniform float uWarp;
uniform vec2 uAxis;
uniform float uAxisSpan;
uniform float uNoiseAmount;
uniform float uCycle;
uniform float uBrightness;
uniform float uVignette;
uniform float uGrain;

// Simplex noise — Ashima Arts / Stefan Gustavson, MIT licensed.
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Three octaves is enough: the field is viewed close up, so a fourth octave
// lands below a pixel and only costs fill rate.
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p);
    p = p * 2.03 + vec2(37.1, 11.7);
    amplitude *= 0.42;
  }
  return value;
}

/**
 * The three brand colours as one cyclic ramp: t wraps at 1.0, so sampling
 * three points a third apart always yields the palette in order, whatever the
 * phase. Advancing the phase rotates colours through the gradient rather than
 * fading toward some off-brand hue.
 */
vec3 paletteAt(float t) {
  float x = fract(t) * 3.0;
  float i = floor(x);
  // Steep, so each brand colour holds and the blend between two of them —
  // which is necessarily less saturated than either — passes quickly.
  float f = smoothstep(0.30, 0.70, fract(x));
  vec3 a = mix(mix(uColor1, uColor2, step(0.5, i)), uColor3, step(1.5, i));
  vec3 b = mix(mix(uColor2, uColor3, step(0.5, i)), uColor1, step(1.5, i));
  return mix(a, b, f);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / min(uResolution.x, uResolution.y);
  vec2 p = uv * uZoom + uOffset;
  float t = uTime;

  vec2 q = vec2(
    fbm(p + 0.060 * t),
    fbm(p + vec2(5.2, 1.3) - 0.050 * t)
  );

  vec2 r = vec2(
    fbm(p + uWarp * q + vec2(1.7, 9.2) + 0.045 * t),
    fbm(p + uWarp * q + vec2(8.3, 2.8) - 0.038 * t)
  );

  float f = fbm(p + uWarp * r);

  // The colours run along a fixed axis and the noise only pushes pixels back
  // and forth along it. Deriving the ramp from noise alone left the palette
  // wherever the field happened to land; this keeps the sweep deliberate while
  // the warping keeps the boundaries organic.
  float axis = dot(uv, uAxis) / uAxisSpan + 0.5;
  float band = clamp(axis + f * uNoiseAmount, 0.0, 1.0);

  vec3 rampLow = paletteAt(uCycle);
  vec3 rampMid = paletteAt(uCycle + 1.0 / 3.0);
  vec3 rampHigh = paletteAt(uCycle + 2.0 / 3.0);

  vec3 color = mix(rampLow, rampMid, smoothstep(0.06, 0.58, band));
  // The high stop never fully lands: in the 3D original the third colour only
  // ever showed as a glow at one corner, never as a field of its own.
  color = mix(color, rampHigh, smoothstep(0.78, 1.16, band));

  // The displaced sphere got its shading from how far the surface moved under
  // the light. The warp magnitude is the 2D equivalent of that displacement.
  float lift = clamp(length(r) * 0.95, 0.0, 1.0);
  color = mix(color * 0.92, color, 0.70 + 0.30 * lift);

  // Warm sheen along the ridges, standing in for the env-map reflection.
  color += vec3(1.0, 0.93, 0.86) * pow(smoothstep(0.55, 1.0, band), 2.0) * 0.16;

  color *= uBrightness;

  float falloff = smoothstep(0.38, 1.20, length(uv * vec2(1.0, 1.18)));
  color = mix(color, uBackground, clamp(uVignette * falloff, 0.0, 1.0));

  if (uGrain > 0.0) {
    float noise = fract(
      sin(dot(gl_FragCoord.xy + fract(t), vec2(12.9898, 78.233))) * 43758.5453
    );
    color += (noise - 0.5) * uGrain;
  }

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

/** `#rrggbb` to the 0..1 triple the shader wants. */
export function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}
