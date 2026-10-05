/**
 * A tiny isometric line-drawing kit in the manner of Lucas Marques' hairline
 * figures (lucasmarkes.com/lab/hairline): rounded footprints lifted into
 * solids, drawn as one silhouette stroke plus a crease on the lid, with
 * critically damped springs for anything that moves.
 *
 * Shared by the hero's Dallas skyline. Nothing here touches React.
 */

export type Pt = [number, number];
export type Sample = { u: number; v: number; nu: number; nv: number };
export type Spring = { x: number; v: number; t: number; k: number; c: number };

// ---- camera: the 2:1 isometric view, azimuth 45° -------------------------
const AZ = Math.PI / 4;
const K = 0.5;
const ZF = Math.sqrt(1 - K * K);
const SC = Math.cos(AZ);
const SS = Math.sin(AZ);
const S = 1.9;

export const P = (x: number, y: number, z: number): Pt => [
  S * (x * SC - y * SS),
  S * ((x * SS + y * SC) * K - z * ZF),
];
export const unproj = (sx: number, sy: number, z: number): Pt => {
  const X = sx / S;
  const Y = (sy / S + z * ZF) / K;
  return [X * SC + Y * SS, -X * SS + Y * SC];
};
/** A sample faces the camera when its normal points toward the viewer. */
export const front = (q: Sample) => q.nu * SS + q.nv * SC > 0;

// ---- rings and paths -----------------------------------------------------
export const r2 = (n: number) => Math.round(n * 100) / 100;
export const poly = (pts: Pt[]) =>
  "M" + pts.map((p) => `${r2(p[0])} ${r2(p[1])}`).join("L") + "Z";
export const open = (pts: Pt[]) =>
  pts.length < 2
    ? ""
    : "M" + pts.map((p) => `${r2(p[0])} ${r2(p[1])}`).join("L");
export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function rrect(
  u0: number,
  v0: number,
  u1: number,
  v1: number,
  r: number,
  n = 4,
): Sample[] {
  r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
  const out: Sample[] = [];
  const corners: [number, number, number][] = [
    [u1 - r, v1 - r, 0],
    [u0 + r, v1 - r, 90],
    [u0 + r, v0 + r, 180],
    [u1 - r, v0 + r, 270],
  ];
  for (const [cu, cv, a0] of corners)
    for (let k = 0; k <= n; k++) {
      const a = ((a0 + (90 * k) / n) * Math.PI) / 180;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      out.push({ u: cu + r * ca, v: cv + r * sa, nu: ca, nv: sa });
    }
  return out;
}
/** A rounded rectangle centred on (cx, cy), sx long along `ang` and sy across it. */
export function rotRect(
  cx: number,
  cy: number,
  sx: number,
  sy: number,
  r: number,
  ang: number,
): Sample[] {
  return turn(rrect(-sx / 2, -sy / 2, sx / 2, sy / 2, r), cx, cy, ang);
}
/** Any ring, rotated by `ang` about the origin and moved to (cx, cy). */
export function turn(ring: Sample[], cx: number, cy: number, ang: number) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return ring.map((q) => ({
    u: cx + q.u * c - q.v * s,
    v: cy + q.u * s + q.v * c,
    nu: q.nu * c - q.nv * s,
    nv: q.nu * s + q.nv * c,
  }));
}
export function circ(cx: number, cy: number, R: number, n = 12): Sample[] {
  const out: Sample[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    out.push({
      u: cx + R * Math.cos(a),
      v: cy + R * Math.sin(a),
      nu: Math.cos(a),
      nv: Math.sin(a),
    });
  }
  return out;
}
/** A regular polygon footprint (3 = triangle, 6 = hexagon ...). */
export function ngon(cx: number, cy: number, R: number, n: number, rot = 0) {
  const out: Sample[] = [];
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * Math.PI * 2;
    out.push({
      u: cx + R * Math.cos(a),
      v: cy + R * Math.sin(a),
      nu: Math.cos(a),
      nv: Math.sin(a),
    });
  }
  return out;
}
export const ringAt = (ring: Sample[], z: number) =>
  ring.map((q) => P(q.u, q.v, z));
export function run(ring: Sample[], keep: (q: Sample) => boolean) {
  const n = ring.length;
  let s = -1;
  for (let i = 0; i < n; i++)
    if (keep(ring[i]) && !keep(ring[(i + n - 1) % n])) {
      s = i;
      break;
    }
  if (s < 0) return keep(ring[0]) ? ring.slice() : [];
  const out: Sample[] = [];
  for (let k = 0; k < n && keep(ring[(s + k) % n]); k++)
    out.push(ring[(s + k) % n]);
  return out;
}
export function hull(input: Pt[]): Pt[] {
  const pts = input
    .slice()
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .filter(
      (p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1],
    );
  if (pts.length < 3) return pts;
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    )
      lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    )
      upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
export type Shape = { sil: string; crease: string };
/** A solid standing from z0 to z1: its silhouette and one crease on the lid. */
export function prism(
  ring: Sample[],
  inner: Sample[] | null,
  z0: number,
  z1: number,
): Shape {
  return {
    sil: poly(hull(ringAt(ring, z1).concat(ringAt(ring, z0)))),
    crease: inner ? open(ringAt(run(inner, front), z1)) : "",
  };
}
/** A solid whose top differs from its foot. */
export function taper(
  foot: Sample[],
  top: Sample[],
  inner: Sample[] | null,
  z0: number,
  z1: number,
): Shape {
  return {
    sil: poly(hull(ringAt(foot, z0).concat(ringAt(top, z1)))),
    crease: inner ? open(ringAt(run(inner, front), z1)) : "",
  };
}
/** A ball: its outline plus a lit equator crease. */
export function ball(cx: number, cy: number, cz: number, R: number): Shape {
  const pts: Pt[] = [];
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    pts.push([
      P(cx, cy, cz)[0] + R * S * Math.cos(a),
      P(cx, cy, cz)[1] + R * S * Math.sin(a),
    ]);
  }
  return {
    sil: poly(pts),
    crease: open(ringAt(run(circ(cx, cy, R, 24), front), cz)),
  };
}
export const inset = (ring: Sample[], b: number) =>
  ring.map((q) => ({ ...q, u: q.u - q.nu * b, v: q.v - q.nv * b }));
/** Grow a ring outward: a negative inset. */
export const outset = (ring: Sample[], b: number) => inset(ring, -b);

// ---- the clocks ----------------------------------------------------------
export const spring = (x: number, k = 100, c = 18): Spring => ({
  x,
  v: 0,
  t: x,
  k,
  c,
});
export function stepS(sp: Spring, dt: number, snap: boolean) {
  if (snap) {
    sp.x = sp.t;
    sp.v = 0;
    return false;
  }
  const n = Math.max(1, Math.ceil(dt * 240));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    sp.v += (-sp.k * (sp.x - sp.t) - sp.c * sp.v) * h;
    sp.x += sp.v * h;
  }
  if (Math.abs(sp.x - sp.t) < 0.01 && Math.abs(sp.v) < 0.1) {
    sp.x = sp.t;
    sp.v = 0;
    return false;
  }
  return true;
}
/** Terrain's falloff: 1 at the pointer, .31 at 42% of the radius, .09 beyond. */
export const falloff = (u: number) =>
  u <= 0
    ? 1
    : u <= 0.417
      ? 1 - (u / 0.417) * 0.6875
      : u <= 1
        ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185
        : 0.094;

/** A small deterministic PRNG so the city is the same on every render. */
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- drawing -------------------------------------------------------------
const NS = "http://www.w3.org/2000/svg";
export type Solid = { g: SVGGElement; sil: SVGPathElement; cr: SVGPathElement };
export function mk<T extends SVGElement>(
  tag: string,
  parent: Element,
  cls = "",
) {
  const e = document.createElementNS(NS, tag) as T;
  if (cls) e.setAttribute("class", cls);
  parent.appendChild(e);
  return e;
}
export function solid(parent: Element, cls = ""): Solid {
  const g = mk<SVGGElement>("g", parent, cls);
  return {
    g,
    sil: mk<SVGPathElement>("path", g, "sil"),
    cr: mk<SVGPathElement>("path", g, "cr"),
  };
}
export function put(s: Solid, p: Shape) {
  s.sil.setAttribute("d", p.sil);
  s.cr.setAttribute("d", p.crease);
}
export function hide(s: Solid) {
  s.sil.removeAttribute("d");
  s.cr.removeAttribute("d");
}
/** A sagging cable between two screen points. */
export function cable(a: Pt, b: Pt, sag: number) {
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag];
  return `M${r2(a[0])} ${r2(a[1])}Q${r2(m[0])} ${r2(m[1])} ${r2(b[0])} ${r2(b[1])}`;
}
