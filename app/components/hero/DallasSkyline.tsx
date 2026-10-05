"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import logoArt from "@/app/assets/brand/white-hackutd-logo.svg";
import { HERO_SCENE_DATA_ATTR } from "../background/sceneConfig";
import {
  HERO_CITY,
  HERO_CITY_STAGE_DATA_ATTR,
  HERO_SCENE_SCROLL,
  MOBILE_SCRUB,
} from "./sceneConfig";
import {
  type Pt,
  type Sample,
  type Solid,
  type Spring,
  P,
  ball,
  cable,
  circ,
  clamp,
  falloff,
  front,
  hide,
  inset,
  mk,
  mulberry,
  ngon,
  open,
  poly,
  prism,
  put,
  r2,
  ringAt,
  rotRect,
  rrect,
  run,
  solid,
  spring,
  stepS,
  taper,
  unproj,
} from "./hairline";

configureScrollTrigger();

/**
 * DallasSkyline: downtown Dallas as a live isometric line drawing, in the
 * manner of Lucas Marques' hairline figures — a diorama seen from above at an
 * angle, four rows of blocks deep with streets between them. Reunion Tower,
 * Bank of America Plaza, Renaissance Tower, Comerica, Energy Plaza, Fountain
 * Place, Chase Tower, Trammell Crow Center, the Omni and the Margaret Hunt
 * Hill bridge stand among dense filler blocks and low-rises; UTD's ECSW sits
 * front and center under a HackUTD billboard. A DART train runs the front,
 * tower cranes swing, rooftop and wall billboards turn, wires sag between the
 * roofs and a helicopter patrols overhead. (Clouds, plane and balloon are the
 * plate's own artwork in `SkyElements`, far above all this.)
 *
 * Everything is one stroke colour (`currentColor`) with the page background
 * as fill, so the figure follows the site theme like the body text does.
 *
 * The pointer is the weather: towers rise under it and settle behind it, the
 * nearest one lights up, billboards turn toward it, cranes near it start
 * sweeping left and right, the helicopter keeps its distance, the Omni's
 * facade ripples from it, Reunion's ball lights in its direction, and holding
 * it near the track slows the train. Scroll parallaxes the rows. The loop
 * sleeps when the hero is off screen, the tab is hidden, or the reader asked
 * for reduced motion.
 */

// ---- the grid ------------------------------------------------------------
// u runs along the city (left to right, a few degrees downhill), v across it
// toward the viewer. Footprints stay square to the world axes.
const CELL = 18;
const UANG = -Math.PI / 4 + 0.085;
const UX = Math.cos(UANG);
const UY = Math.sin(UANG);
const W = (u: number, v: number): Pt => [
  (u * UX - v * UY) * CELL,
  (u * UY + v * UX) * CELL,
];
const Winv = (x: number, y: number): Pt => [
  (x * UX + y * UY) / CELL,
  (-x * UY + y * UX) / CELL,
];
const RISE = 10;
const RADIUS = 3 * CELL;
/** Row centres across the city, back to front, with the DART between the
 * mid row and the low-rise strip along the front. */
const ROW_V = [-1.35, 0, 1.25, 2.9] as const;
/** The DART cuts diagonally through downtown, back-left to front-right,
 * between Renaissance Tower and Comerica; lots keep clear of its corridor. */
const DART_SLOPE = 1.5;
const DART_U = (v: number) => 12.8 + DART_SLOPE * (v - 1);
const DART_HALF = 1.0;
/** Height of the viaduct deck: the line rides over the low-rises. */
const DART_Z = 5.2;
const onTrack = (u: number, v: number, half: number) =>
  Math.abs(u - DART_U(v)) < DART_HALF + half;
const DART_V0 = -3.3;
const DART_V1 = 4.5;
const N = 30;
const rowOf = (v: number) => (v < -0.6 ? 0 : v < 0.6 ? 1 : v < 2.0 ? 2 : 3);
/** The Trinity cuts across the west end on a slant; nothing is built on it. */
const RIVER_U = (v: number) => -3.7 - 0.3 * (v - 1);
const RIVER_HALF = 1.35;
const onRiver = (u: number, v: number, half: number) =>
  Math.abs(u - RIVER_U(v)) < RIVER_HALF + half + 0.2;
const U_WEST = -12.5;

type Kind =
  | "box"
  | "tiered"
  | "chamfer"
  | "crown"
  | "barrel"
  | "tri"
  | "prismatic"
  | "stadium"
  | "pyramid";

type Tower = {
  cx: number;
  cy: number;
  sx: number;
  sy: number;
  h: number;
  kind: Kind;
  rot: number;
  parts: Solid[];
  lines: SVGPathElement[];
  wall: 0 | 1 | 2;
  sp: Spring;
  drawn: number;
  landmark: boolean;
};
type Roof = { cx: number; cy: number; z: number; row: number; t: Tower };

// Stroke weights, as presentation styles so the figure needs no stylesheet.
const INK = {
  sil: { w: 1.15, fill: true },
  cr: { w: 0.7, fill: false },
  lo: { w: 0.55, fill: false },
  hi: { w: 2, fill: true },
} as const;
function ink(el: SVGElement, k: keyof typeof INK, dash = "") {
  el.style.stroke = "currentColor";
  el.style.strokeWidth = `${INK[k].w}px`;
  el.style.fill = INK[k].fill ? "var(--color-background)" : "none";
  el.style.strokeLinejoin = "round";
  el.style.strokeLinecap = "round";
  el.setAttribute("vector-effect", "non-scaling-stroke");
  if (dash) el.style.strokeDasharray = dash;
}
function inkSolid(s: Solid) {
  ink(s.sil, "sil");
  ink(s.cr, "cr");
}
function body(parent: Element) {
  const s = solid(parent);
  inkSolid(s);
  return s;
}
function line(parent: Element, dash = "") {
  const p = mk<SVGPathElement>("path", parent);
  ink(p, "lo", dash);
  return p;
}
function dot(parent: Element, r: number) {
  const c = mk<SVGCircleElement>("circle", parent);
  c.setAttribute("r", String(r));
  c.style.fill = "currentColor";
  c.style.stroke = "none";
  return c;
}
const seg = (a: Pt, b: Pt) =>
  `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}`;

export default function DallasSkyline() {
  const ref = useRef<SVGSVGElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const stage: HTMLElement =
      svg.closest<HTMLElement>(`[${HERO_CITY_STAGE_DATA_ATTR}]`) ??
      svg.parentElement ??
      document.body;
    const section = svg.closest<HTMLElement>(`[${HERO_SCENE_DATA_ATTR}]`);
    const rnd = mulberry(1972);
    const lite = isMobile;
    const still = prefersReducedMotion;

    const root = mk<SVGGElement>("g", svg);
    const defs = mk<SVGDefsElement>("defs", root);
    const ground = mk<SVGGElement>("g", root);
    const back = mk<SVGGElement>("g", root);
    const far = mk<SVGGElement>("g", root);
    const mid = mk<SVGGElement>("g", root);
    const near = mk<SVGGElement>("g", root);
    const air = mk<SVGGElement>("g", root);
    const rowG = [back, far, mid, near] as const;

    // Streets between the rows: a dashed centre line each, under everything.
    for (const [v, g] of [
      [(ROW_V[0] + ROW_V[1]) / 2, far],
      [(ROW_V[1] + ROW_V[2]) / 2, mid],
    ] as const) {
      const bank = RIVER_HALF + 0.5;
      let d = "";
      for (const [u0, u1] of [
        [U_WEST, RIVER_U(v) - bank],
        [RIVER_U(v) + bank, N + 1.5],
      ]) {
        const a = W(u0, v);
        const b = W(u1, v);
        d += seg(P(a[0], a[1], 0), P(b[0], b[1], 0));
      }
      line(g, "2 4").setAttribute("d", d);
    }

    // -- towers: the landmarks first, then filler blocks in the free lots ----
    const towers: Tower[] = [];
    const roofs: Roof[] = [];
    // Occupied u-intervals per row, so lots never overlap whatever their size.
    const used: [number, number][][] = [[], [], [], []];
    const free = (row: number, a: number, b: number) =>
      !used[row].some(([x, y]) => a < y && b > x);
    const claim = (row: number, a: number, b: number) => used[row].push([a, b]);
    function tower(
      u: number,
      v: number,
      sx: number,
      sy: number,
      h: number,
      kind: Kind,
      opts: { rot?: number; landmark?: boolean; wall?: 0 | 1 | 2 } = {},
    ) {
      const [cx, cy] = W(u, v);
      const row = rowOf(v);
      const g = rowG[row];
      const parts = [body(g), body(g), body(g), body(g)];
      const lines: SVGPathElement[] = [];
      const t: Tower = {
        cx,
        cy,
        sx,
        sy,
        h,
        kind,
        rot: opts.rot ?? 0,
        parts,
        lines,
        wall: opts.wall ?? 0,
        sp: spring(h),
        drawn: NaN,
        landmark: opts.landmark ?? false,
      };
      if (kind === "chamfer") for (let i = 0; i < 6; i++) lines.push(line(g));
      if (kind === "crown") for (let i = 0; i < 4; i++) lines.push(line(g));
      towers.push(t);
      roofs.push({ cx, cy, z: h, row, t });
      const half = sx / 2 / CELL + 0.08;
      claim(row, u - half, u + half);
      return t;
    }
    // West to east, the way the plate reads.
    tower(3.6, 0.1, 30, 15, 26, "tiered", { landmark: true }); // Hyatt Regency
    const bofa = tower(8.2, 0.05, 17, 17, 110, "chamfer", { landmark: true });
    const ren = tower(11.4, 1.3, 14, 14, 92, "crown", { landmark: true });
    tower(14.6, 0, 16, 15, 82, "barrel", { landmark: true }); // Comerica
    tower(17.3, 0.05, 11, 11, 70, "tri", { landmark: true, rot: 0.3 }); // Energy Plaza
    tower(19.9, 0.05, 15, 15, 90, "prismatic", { landmark: true }); // Fountain Place
    tower(22.8, 1.25, 20, 9, 84, "stadium", { landmark: true }); // Chase Tower
    tower(25.6, 0.05, 15, 15, 78, "pyramid", { landmark: true }); // Trammell Crow
    tower(28.3, 1.3, 14, 12, 62, "box", { landmark: true }); // Thanksgiving Tower
    const omni = tower(31.6, 1.2, 30, 9, 30, "stadium", { landmark: true }); // Omni
    const ECSW_U = 17.05;
    claim(2, ECSW_U - 2.85, ECSW_U + 2.85); // ECSW, built below
    claim(1, -7.6, 0.6); // the bridge and its landings, built below
    claim(2, -7.6, 0.6);

    const wallChance = lite ? (HERO_CITY.mobile.wallBoards ? 0.5 : 0) : 0.5;
    const pickWall = (p: number): 0 | 1 | 2 =>
      rnd() < p ? (rnd() < 0.5 ? 1 : 2) : 0;
    // Blocks: a tall back row, the main far row and a lower mid row.
    for (const row of [
      {
        v: ROW_V[0],
        min: 22,
        max: 58,
        fp: [10, 16] as const,
        gap: 0.08,
        wall: 0.3,
      },
      {
        v: ROW_V[1],
        min: 24,
        max: 62,
        fp: [10, 16] as const,
        gap: 0.1,
        wall: 1,
      },
      {
        v: ROW_V[2],
        min: 10,
        max: 34,
        fp: [8, 12] as const,
        gap: 0.14,
        wall: 1,
      },
    ]) {
      const r = rowOf(row.v);
      for (let i = U_WEST + 0.5; i < N + 1; i += 0.5) {
        const sx = row.fp[0] + rnd() * (row.fp[1] - row.fp[0]);
        const half = sx / 2 / CELL + 0.08;
        if (!free(r, i - half, i + half)) continue;
        if (onRiver(i, row.v, half)) continue;
        if (onTrack(i, row.v, half)) continue;
        if (rnd() < row.gap) continue;
        const sy = sx * (0.75 + rnd() * 0.5);
        // The west bank is lower: a neighbourhood, not downtown.
        const env =
          i < RIVER_U(row.v)
            ? row.min * 0.7 + (row.max - row.min) * 0.25
            : row.min +
              (row.max - row.min) * Math.sin(((i + 1) / (N + 2)) * Math.PI);
        const h = env * (0.65 + rnd() * 0.6);
        const kind: Kind = r < 2 && rnd() < 0.3 ? "tiered" : "box";
        tower(i, row.v + (rnd() - 0.5) * 0.08, sx, sy, h, kind, {
          wall: pickWall(wallChance * row.wall),
        });
      }
    }
    // Low-rises in whatever gaps are left, and a proper near-side row along the
    // front of the track, so the blocks read as a city and not a row of towers.
    const lowGap = lite ? HERO_CITY.mobile.lowriseGap : 0.28;
    for (let r = 0; r < 4; r++) {
      const frontRow = r === 3;
      const u1 = frontRow ? N + 3 : N + 1.5;
      for (let i = U_WEST; i < u1; i += 0.25) {
        const v = ROW_V[r];
        const sx = frontRow ? 7 + rnd() * 6 : 5 + rnd() * 5;
        const half = sx / 2 / CELL + 0.05;
        if (!free(r, i - half, i + half)) continue;
        if (onRiver(i, v, half)) continue;
        if (onTrack(i, v, half)) continue;
        if (rnd() < (frontRow ? 0.18 : lowGap)) continue;
        const sy = frontRow ? 6 + rnd() * 5 : 5 + rnd() * 5;
        const h = frontRow ? 6 + rnd() * 24 : 5 + rnd() * 10;
        const kind: Kind = rnd() < (frontRow ? 0.3 : 0.2) ? "tiered" : "box";
        tower(i, v + (rnd() - 0.5) * 0.12, sx, sy, h, kind);
      }
    }

    function drawTower(t: Tower) {
      const h = t.sp.x;
      if (h === t.drawn) return;
      t.drawn = h;
      const r = Math.min(2, t.sx / 5);
      const [p0, p1, p2, p3] = t.parts;
      const box = (f: number, du = 0, dv = 0, rr = r) =>
        rrect(
          t.cx - (t.sx * f) / 2 + du,
          t.cy - (t.sy * f) / 2 + dv,
          t.cx + (t.sx * f) / 2 + du,
          t.cy + (t.sy * f) / 2 + dv,
          rr,
        );
      hide(p1);
      hide(p2);
      switch (t.kind) {
        case "box": {
          const ring = box(1);
          put(p0, prism(ring, inset(ring, 0.9), 0, h));
          const b = rrect(
            t.cx + t.sx * 0.05,
            t.cy - t.sy * 0.3,
            t.cx + t.sx * 0.35,
            t.cy,
            1,
          );
          put(p1, prism(b, inset(b, 0.5), h, h + 2.4));
          break;
        }
        case "tiered": {
          const h1 = h * 0.58;
          const h2 = h * 0.86;
          put(p0, prism(box(1), inset(box(1), 0.9), 0, h1));
          put(
            p1,
            prism(box(0.72, 1, -1), inset(box(0.72, 1, -1), 0.7), h1, h2),
          );
          put(
            p2,
            prism(
              box(0.44, 1.6, -1.6),
              inset(box(0.44, 1.6, -1.6), 0.5),
              h2,
              h,
            ),
          );
          break;
        }
        case "chamfer": {
          // Bank of America Plaza: notched corners and lit vertical edges.
          const ring = rrect(
            t.cx - t.sx / 2,
            t.cy - t.sy / 2,
            t.cx + t.sx / 2,
            t.cy + t.sy / 2,
            t.sx * 0.24,
            1,
          );
          put(p0, prism(ring, inset(ring, 0.9), 0, h));
          const cap = box(0.5);
          put(p1, prism(cap, inset(cap, 0.5), h, h + 3));
          const mast = rrect(
            t.cx - 0.6,
            t.cy - 0.6,
            t.cx + 0.6,
            t.cy + 0.6,
            0.3,
          );
          put(p2, prism(mast, null, h + 3, h + 16));
          const edges = ring.filter(front);
          t.lines.forEach((l, i) => {
            const q = edges[i];
            l.setAttribute("d", q ? seg(P(q.u, q.v, 0), P(q.u, q.v, h)) : "");
          });
          break;
        }
        case "crown": {
          // Renaissance Tower: X-braced faces and twin rooftop spires.
          const ring = box(1);
          put(p0, prism(ring, inset(ring, 0.9), 0, h));
          const cap = box(0.4);
          put(p1, prism(cap, inset(cap, 0.4), h, h + 4));
          const m1 = rrect(
            t.cx - 3.2,
            t.cy - 3.2 - 0.5,
            t.cx - 2.2,
            t.cy - 3.2 + 0.5,
            0.25,
          );
          const m2 = rrect(
            t.cx + 2.2,
            t.cy + 3.2 - 0.5,
            t.cx + 3.2,
            t.cy + 3.2 + 0.5,
            0.25,
          );
          put(p2, prism(m1, null, h, h + 22));
          put(p3, prism(m2, null, h, h + 17));
          const fx = [t.cx + t.sx / 2, t.cx + t.sx / 2];
          const fy = [t.cy - t.sy / 2, t.cy + t.sy / 2];
          const gx = [t.cx - t.sx / 2, t.cx + t.sx / 2];
          const gy = [t.cy + t.sy / 2, t.cy + t.sy / 2];
          const faces: [number, number, number, number][] = [
            [fx[0], fy[0], fx[1], fy[1]],
            [gx[0], gy[0], gx[1], gy[1]],
          ];
          t.lines.forEach((l, i) => {
            const f = faces[Math.floor(i / 2)];
            const [ax, ay, bx, by] = f;
            const z0 = h * 0.2;
            const z1 = h * 0.95;
            l.setAttribute(
              "d",
              i % 2 === 0
                ? seg(P(ax, ay, z0), P(bx, by, z1))
                : seg(P(ax, ay, z1), P(bx, by, z0)),
            );
          });
          break;
        }
        case "barrel": {
          // Comerica Bank Tower: setbacks and a vaulted roof.
          put(p0, prism(box(1), inset(box(1), 0.9), 0, h * 0.72));
          put(p1, prism(box(0.78), inset(box(0.78), 0.7), h * 0.72, h * 0.88));
          const ridge = rrect(
            t.cx - t.sx * 0.39,
            t.cy - 0.6,
            t.cx + t.sx * 0.39,
            t.cy + 0.6,
            0.4,
          );
          put(p2, taper(box(0.78), ridge, null, h * 0.88, h));
          break;
        }
        case "tri": {
          const R = t.sx * 0.62;
          const ring = ngon(t.cx, t.cy, R, 3, t.rot);
          put(p0, prism(ring, inset(ring, 1), 0, h));
          const cap = ngon(t.cx, t.cy, R * 0.35, 3, t.rot);
          put(p1, prism(cap, null, h, h + 2));
          break;
        }
        case "prismatic": {
          // Fountain Place: a glass wedge rising to a ridge on its far edge.
          const foot = box(1, 0, 0, 0.6);
          const ridge = rrect(
            t.cx - t.sx / 2,
            t.cy + t.sy / 2 - 1.4,
            t.cx + t.sx / 2,
            t.cy + t.sy / 2,
            0.5,
          );
          put(p0, taper(foot, ridge, inset(ridge, 0.4), 0, h));
          break;
        }
        case "stadium": {
          const ring = box(1, 0, 0, t.sy / 2);
          put(p0, prism(ring, inset(ring, 0.9), 0, h));
          if (!t.landmark || t.h > 60) {
            const cap = box(0.5, 0, 0, t.sy / 4);
            put(p1, prism(cap, inset(cap, 0.5), h, h + 2.6));
          }
          break;
        }
        case "pyramid": {
          // Trammell Crow Center: a tower under a four-sided pyramid.
          put(p0, prism(box(1), inset(box(1), 0.9), 0, h * 0.84));
          const apex = rrect(
            t.cx - 0.4,
            t.cy - 0.4,
            t.cx + 0.4,
            t.cy + 0.4,
            0.2,
          );
          put(p1, taper(box(1), apex, null, h * 0.84, h));
          put(p2, prism(apex, null, h, h + 8));
          break;
        }
      }
      // A billboard standing off a camera-facing wall, riding the tower's height.
      if (t.wall) {
        const w = Math.max(6, (t.wall === 1 ? t.sy : t.sx) * 0.62);
        const ph = clamp(h * 0.3, 5, 10);
        const z0 = t.kind === "tiered" ? h * 0.2 : h * 0.4;
        const ring =
          t.wall === 1
            ? rrect(
                t.cx + t.sx / 2 + 0.5,
                t.cy - w / 2,
                t.cx + t.sx / 2 + 1.3,
                t.cy + w / 2,
                0.3,
              )
            : rrect(
                t.cx - w / 2,
                t.cy + t.sy / 2 + 0.5,
                t.cx + w / 2,
                t.cy + t.sy / 2 + 1.3,
                0.3,
              );
        put(p3, prism(ring, inset(ring, 0.5), z0, z0 + ph));
      } else if (t.kind !== "crown") hide(p3);
    }

    // -- UTD's ECSW: two winged slabs on colonnades around a glass core, with
    //    the HackUTD billboard on the roof -----------------------------------
    {
      const g = mid;
      const [cx, cy] = W(ECSW_U, ROW_V[2] + 0.05);
      // a: along the row; n: toward the viewer.
      const at = (a: number, n: number): Pt => [
        cx + UX * a - UY * n,
        cy + UY * a + UX * n,
      ];
      const block = (
        a: number,
        n: number,
        la: number,
        ln: number,
        rr = 0.6,
      ) => {
        const [x, y] = at(a, n);
        return rotRect(x, y, la, ln, rr, UANG);
      };
      // A window grid on the camera-facing wall between A and B.
      const grid = (
        A: Pt,
        B: Pt,
        z0: number,
        z1: number,
        cols: number,
        rows: number,
      ) => {
        let d = "";
        for (let k = 1; k < cols; k++) {
          const f = k / cols;
          const x = A[0] + (B[0] - A[0]) * f;
          const y = A[1] + (B[1] - A[1]) * f;
          d += seg(P(x, y, z0), P(x, y, z1));
        }
        for (let j = 1; j < rows; j++) {
          const z = z0 + (z1 - z0) * (j / rows);
          d += seg(P(A[0], A[1], z), P(B[0], B[1], z));
        }
        line(g).setAttribute("d", d);
      };
      for (const side of [-1, 1]) {
        const a0 = side * 30;
        // Colonnade: a recessed glass wall behind a row of pillars.
        put(body(g), prism(block(a0, -3, 24, 7), null, 0, 11));
        grid(at(a0 - 12, 0.5), at(a0 + 12, 0.5), 0, 11, 8, 1);
        for (let k = -3; k <= 3; k++)
          put(
            body(g),
            prism(block(a0 + k * 4, 6.2, 1.1, 1.1, 0.3), null, 0, 11),
          );
        const slab = block(a0, 0, 28, 14);
        put(body(g), prism(slab, inset(slab, 0.8), 11, 30));
        // The projecting window box on the front face.
        put(body(g), prism(block(a0, 8.6, 24, 5, 0.5), null, 16, 27));
        grid(at(a0 - 12, 11.1), at(a0 + 12, 11.1), 16, 27, 7, 3);
        put(
          body(g),
          prism(block(a0 + side * 9, -2, 5, 5, 0.4), null, 30, 32.5),
        );
      }
      const core = block(0, -4, 26, 10);
      put(body(g), prism(core, inset(core, 0.8), 0, 23));
      grid(at(-13, 1), at(13, 1), 3, 21, 9, 4);
      const entry = block(0, 4, 14, 5, 0.4);
      put(body(g), prism(entry, inset(entry, 0.5), 0, 7));

      // Billboard: posts, a framed face, and the wordmark mapped onto it as a
      // currentColor rect masked by the logo art, so it inks like the strokes.
      const BW = 26;
      const BH = 10.5;
      const Z0 = 27;
      for (const a of [-BW / 2 + 1.4, BW / 2 - 1.4])
        put(body(g), prism(block(a, -4, 0.9, 0.9, 0.3), null, 23, Z0 + 0.5));
      put(body(g), prism(block(0, -4, BW, 1, 0.4), null, Z0, Z0 + BH));
      const mask = mk<SVGMaskElement>("mask", defs);
      const maskId = "dallas-ecsw-logo";
      mask.id = maskId;
      mask.setAttribute("maskUnits", "userSpaceOnUse");
      mask.setAttribute("x", "0");
      mask.setAttribute("y", "0");
      mask.setAttribute("width", "1");
      mask.setAttribute("height", "1");
      mask.style.maskType = "alpha";
      const img = mk<SVGImageElement>("image", mask);
      img.setAttribute("href", logoArt.src);
      img.setAttribute("width", "1");
      img.setAttribute("height", "1");
      img.setAttribute("preserveAspectRatio", "none");
      const lw = BW - 2.6;
      const lh = lw / (logoArt.width / logoArt.height);
      const zTop = Z0 + BH / 2 + lh / 2;
      const zBot = zTop - lh;
      const A = at(-lw / 2, -3.4);
      const B = at(lw / 2, -3.4);
      const o = P(A[0], A[1], zTop);
      const ex = P(B[0], B[1], zTop);
      const ey = P(A[0], A[1], zBot);
      const logo = mk<SVGRectElement>("rect", g);
      logo.setAttribute("width", "1");
      logo.setAttribute("height", "1");
      logo.setAttribute("mask", `url(#${maskId})`);
      logo.style.fill = "currentColor";
      logo.setAttribute(
        "transform",
        `matrix(${[ex[0] - o[0], ex[1] - o[1], ey[0] - o[0], ey[1] - o[1], o[0], o[1]].map(r2).join(" ")})`,
      );
    }

    // -- Reunion Tower: three shafts under a lit geodesic ball ----------------
    const [rx, ry] = W(1.2, 0.75);
    const REUNION_H = 74;
    const BALL_R = 9.5;
    const ballZ = REUNION_H + BALL_R - 1;
    for (const [du, dv] of [
      [-1.6, -1],
      [1.6, -1],
      [0, 1.8],
    ]) {
      const shaft = rrect(
        rx + du - 0.8,
        ry + dv - 0.8,
        rx + du + 0.8,
        ry + dv + 0.8,
        0.4,
      );
      put(body(far), prism(shaft, null, 0, REUNION_H));
    }
    const ballS = body(far);
    put(ballS, ball(rx, ry, ballZ, BALL_R));
    // Two meridians and a lower parallel read as the geodesic lattice.
    for (const [a, lat] of [
      [0.35, null],
      [-1.2, null],
      [0, -0.55],
    ] as [number, number | null][]) {
      const pts: Pt[] = [];
      if (lat === null) {
        for (let k = 0; k <= 24; k++) {
          const th = (k / 24) * Math.PI * 2;
          const q: Sample = {
            u: rx + BALL_R * Math.cos(th) * Math.cos(a),
            v: ry + BALL_R * Math.cos(th) * Math.sin(a),
            nu: Math.cos(th) * Math.cos(a),
            nv: Math.cos(th) * Math.sin(a),
          };
          const nz = Math.sin(th);
          if (front(q) || nz > 0.55)
            pts.push(P(q.u, q.v, ballZ + BALL_R * Math.sin(th)));
          else if (pts.length) break;
        }
      } else {
        const rr = BALL_R * Math.cos(lat);
        pts.push(
          ...ringAt(
            run(circ(rx, ry, rr, 24), front),
            ballZ + BALL_R * Math.sin(lat),
          ),
        );
      }
      line(far).setAttribute("d", open(pts));
    }
    const mast = rrect(rx - 0.5, ry - 0.5, rx + 0.5, ry + 0.5, 0.25);
    put(body(far), prism(mast, null, ballZ + BALL_R - 1, ballZ + BALL_R + 9));
    type Lamp = { el: SVGCircleElement; x: number; y: number; ph: number };
    const lamps: Lamp[] = [];
    for (let i = 0; i < 26; i++) {
      const lat = -0.9 + rnd() * 1.8;
      const lon = rnd() * Math.PI * 2;
      const q: Sample = {
        u: Math.cos(lat) * Math.cos(lon),
        v: Math.cos(lat) * Math.sin(lon),
        nu: Math.cos(lat) * Math.cos(lon),
        nv: Math.cos(lat) * Math.sin(lon),
      };
      if (!front(q) && Math.sin(lat) < 0.4) continue;
      const p = P(
        rx + q.u * BALL_R,
        ry + q.v * BALL_R,
        ballZ + Math.sin(lat) * BALL_R,
      );
      const el = dot(far, 0.7);
      el.setAttribute("cx", String(r2(p[0])));
      el.setAttribute("cy", String(r2(p[1])));
      lamps.push({ el, x: p[0], y: p[1], ph: rnd() * 6.28 });
    }

    // -- the Omni's LED facade ----------------------------------------------
    type Led = {
      el: SVGCircleElement;
      x: number;
      y: number;
      i: number;
      j: number;
    };
    const leds: Led[] = [];
    {
      const ring = rrect(
        omni.cx - omni.sx / 2,
        omni.cy - omni.sy / 2,
        omni.cx + omni.sx / 2,
        omni.cy + omni.sy / 2,
        omni.sy / 2,
        6,
      );
      const face = run(inset(ring, -0.3), front);
      const cols = 14;
      for (let i = 0; i < cols; i++) {
        const q = face[Math.floor(((i + 0.5) / cols) * face.length)];
        if (!q) continue;
        for (let j = 0; j < 5; j++) {
          const z = 5 + j * 6;
          const p = P(q.u, q.v, z);
          const el = dot(mid, 0.55);
          el.setAttribute("cx", String(r2(p[0])));
          el.setAttribute("cy", String(r2(p[1])));
          leds.push({ el, x: p[0], y: p[1], i, j });
        }
      }
    }

    // -- the Trinity: open water across the west end, with ripples ------------
    {
      const L: Pt[] = [];
      const R: Pt[] = [];
      for (let v = -3.2; v <= 4.6; v += 0.25) {
        const w = RIVER_HALF + 0.08 * Math.sin(v * 1.6);
        const [lx, ly] = W(RIVER_U(v) - w, v);
        const [qx, qy] = W(RIVER_U(v) + w + 0.06 * Math.cos(v * 1.1), v);
        L.push(P(lx, ly, 0));
        R.push(P(qx, qy, 0));
      }
      const water = mk<SVGPathElement>("path", ground);
      ink(water, "sil");
      water.setAttribute("d", poly(L.concat(R.reverse())));
      // Ripples: short strokes along the flow, scattered over the water.
      const ripples = line(ground);
      let d = "";
      for (let k = 0; k < 18; k++) {
        const v = -2.2 + rnd() * 5.8;
        const off = (rnd() - 0.5) * 1.8;
        const len = 0.18 + rnd() * 0.2;
        const [ax, ay] = W(RIVER_U(v) + off, v);
        const [bx, by] = W(RIVER_U(v + len) + off, v + len);
        d += seg(P(ax, ay, 0), P(bx, by, 0));
      }
      ripples.setAttribute("d", d);
    }

    // -- Margaret Hunt Hill bridge: slanted across the river to the west bank -
    {
      const A = W(-7.4, 3.0);
      const B = W(-0.6, -0.3);
      const ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
      const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
      const nx = -Math.sin(ang);
      const ny = Math.cos(ang);
      const at = (t: number, n = 0): Pt => [
        A[0] + (B[0] - A[0]) * t + nx * n,
        A[1] + (B[1] - A[1]) * t + ny * n,
      ];
      for (const t of [0.12, 0.5, 0.88]) {
        const [px, py] = at(t);
        put(
          body(far),
          prism(rrect(px - 1.3, py - 1.3, px + 1.3, py + 1.3, 0.5), null, 0, 7),
        );
      }
      const [dcx, dcy] = at(0.5);
      const deck = rotRect(dcx, dcy, len, 5, 1.2, ang);
      put(body(far), prism(deck, inset(deck, 0.9), 7, 9));
      for (const [t, dir] of [
        [0, -1],
        [1, 1],
      ] as const) {
        const [ex, ey] = at(t + dir * 0.07);
        put(
          body(far),
          prism(rotRect(ex, ey, len * 0.14, 4.4, 0.8, ang), null, 0, 7),
        );
      }
      const arch: Pt[] = [];
      const archIn: Pt[] = [];
      const ARCH = 44;
      for (let k = 0; k <= 28; k++) {
        const tt = k / 28;
        const [ax, ay] = at(tt, -2.2);
        const z = 9 + ARCH * Math.sin(Math.PI * tt);
        arch.push(P(ax, ay, z));
        archIn.push(P(ax, ay, z - 1.6));
      }
      const tube = mk<SVGPathElement>("path", far);
      ink(tube, "sil");
      tube.setAttribute("d", poly(arch.concat(archIn.slice().reverse())));
      const cables = line(far);
      let d = "";
      for (let k = 2; k <= 26; k += 2) {
        const tt = k / 28;
        const [ax, ay] = at(tt, -2.2);
        const top = P(ax, ay, 9 + ARCH * Math.sin(Math.PI * tt) - 1.6);
        const [bx, by] = at(0.5 + (tt - 0.5) * 0.55, -2.2);
        d += seg(top, P(bx, by, 9));
      }
      cables.setAttribute("d", d);
    }

    // -- DART: elevated line running diagonally through the city, two cars ---
    const uMax = N + 1.5;
    const T = (v: number, du = 0): Pt => W(DART_U(v) + du, v);
    const TANG = (() => {
      const a = T(DART_V0);
      const b = T(DART_V1);
      return Math.atan2(b[1] - a[1], b[0] - a[0]);
    })();
    // The bed is split by row so each stretch sits under its own row's blocks
    // and over the rows behind it.
    const bands: [number, number][] = [
      [DART_V0, -0.65],
      [-0.65, 0.65],
      [0.65, 2.05],
      [2.05, DART_V1],
    ];
    bands.forEach(([a, b], r) => {
      const pa = T(a);
      const pb = T(b);
      const bed = rotRect(
        (pa[0] + pb[0]) / 2,
        (pa[1] + pb[1]) / 2,
        Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) + 0.4,
        3.2,
        0.6,
        TANG,
      );
      const el = body(rowG[r]);
      put(el, prism(bed, inset(bed, 0.9), DART_Z, DART_Z + 1.2));
      rowG[r].insertBefore(el.g, rowG[r].firstChild);
    });
    const POLE_H = DART_Z + 1.2 + 7;
    const poleTops: Pt[] = [];
    for (let v = DART_V0 + 0.35; v < DART_V1; v += 0.7) {
      const g = rowG[rowOf(v)];
      const [cx, cy] = T(v);
      const pier = body(g);
      put(
        pier,
        prism(
          rrect(cx - 1.1, cy - 1.1, cx + 1.1, cy + 1.1, 0.3),
          null,
          0,
          DART_Z,
        ),
      );
      const [px, py] = T(v, 0.3);
      const pole = body(g);
      put(
        pole,
        prism(
          rrect(px - 0.4, py - 0.4, px + 0.4, py + 0.4, 0.2),
          null,
          DART_Z + 1.2,
          POLE_H,
        ),
      );
      const arm = line(g);
      arm.setAttribute("d", seg(P(px, py, POLE_H), P(cx, cy, POLE_H - 0.6)));
      g.insertBefore(arm, g.firstChild);
      g.insertBefore(pole.g, g.firstChild);
      g.insertBefore(pier.g, g.firstChild);
      poleTops.push(P(cx, cy, POLE_H - 0.6));
    }
    {
      const wire = line(ground);
      let d = "";
      for (let i = 1; i < poleTops.length; i++)
        d += cable(poleTops[i - 1], poleTops[i], 1.4);
      wire.setAttribute("d", d);
    }
    const cars = [body(near), body(near)];
    const carTops = [body(near), body(near)];
    const CAR_DV = 14.6 / CELL / Math.hypot(DART_SLOPE, 1);
    let trainU = 1.2;
    let trainDrawn = NaN;
    let trainRow = 3;
    const rate = spring(1, 60, 14);
    function drawTrain() {
      if (trainU === trainDrawn) return;
      trainDrawn = trainU;
      const row = rowOf(Math.min(Math.max(trainU, ROW_V[0]), ROW_V[3]));
      if (row !== trainRow) {
        trainRow = row;
        for (const s of [...cars, ...carTops]) rowG[row].appendChild(s.g);
      }
      cars.forEach((car, k) => {
        const [tx, ty] = T(trainU + (k - 0.5) * CAR_DV);
        const shell = rotRect(tx, ty, 14, 3.2, 1.3, TANG);
        put(car, prism(shell, inset(shell, 0.7), DART_Z + 1.2, DART_Z + 5.7));
        const roof = rotRect(tx, ty, 9, 1.8, 0.8, TANG);
        put(carTops[k], prism(roof, null, DART_Z + 5.7, DART_Z + 6.5));
      });
    }

    // -- rooftop billboards, turning toward the pointer -----------------------
    type Board = {
      cx: number;
      cy: number;
      z: number;
      w: number;
      sp: Spring;
      drawn: number;
      el: Solid;
      posts: Solid[];
    };
    const boards: Board[] = [];
    const boardRoofs = roofs
      .filter((r) => !r.t.landmark && r.z > 14 && r.z < 64)
      .sort((a, b) => a.cx - b.cx);
    const picked = new Set<Roof>();
    const boardCount = lite ? HERO_CITY.mobile.boards : 11;
    for (let i = 0; i < boardCount; i++) {
      const f = (i + 0.5) / boardCount;
      const r =
        boardRoofs[
          Math.min(boardRoofs.length - 1, Math.floor(boardRoofs.length * f))
        ];
      if (!r || picked.has(r)) continue;
      picked.add(r);
      const g = rowG[r.row];
      boards.push({
        cx: r.cx,
        cy: r.cy,
        z: r.z,
        w: 8 + rnd() * 5,
        sp: spring(UANG),
        drawn: NaN,
        el: body(g),
        posts: [body(g), body(g)],
      });
    }
    function drawBoard(b: Board) {
      const a = b.sp.x;
      if (a === b.drawn) return;
      b.drawn = a;
      const c = Math.cos(a);
      const s = Math.sin(a);
      for (const [k, d] of [-(b.w / 2 - 1.6), b.w / 2 - 1.6].entries()) {
        const px = b.cx + d * c;
        const py = b.cy + d * s;
        put(
          b.posts[k],
          prism(
            rrect(px - 0.5, py - 0.5, px + 0.5, py + 0.5, 0.25),
            null,
            b.z,
            b.z + 6,
          ),
        );
      }
      const face = rotRect(b.cx, b.cy, b.w, 1.2, 0.5, a);
      put(b.el, prism(face, null, b.z + 4, b.z + 4 + b.w * 0.62));
    }

    // -- tower cranes: jibs sweep left and right while the pointer is near ---
    type Crane = {
      roof: Roof;
      mast: Solid;
      cab: Solid;
      jib: Solid;
      counter: Solid;
      hook: Solid;
      hookLine: SVGPathElement;
      a: Spring;
      base: number;
      ph: number;
      drawn: number;
      H: number;
      J: number;
    };
    const cranes: Crane[] = [];
    const craneRoofs = roofs
      .filter((r) => !r.t.landmark && !picked.has(r) && r.z > 24 && r.z < 60)
      .sort((a, b) => a.cx - b.cx);
    const craneCount = lite ? HERO_CITY.mobile.cranes : 3;
    for (const f of [0.2, 0.5, 0.82].slice(0, craneCount)) {
      const roof =
        craneRoofs[
          Math.min(craneRoofs.length - 1, Math.floor(craneRoofs.length * f))
        ];
      if (!roof) continue;
      picked.add(roof);
      const g = rowG[roof.row];
      const H = 24 + rnd() * 10;
      const mastR = rrect(
        roof.cx - 1.3,
        roof.cy - 1.3,
        roof.cx + 1.3,
        roof.cy + 1.3,
        0.5,
      );
      const mast = body(g);
      put(mast, prism(mastR, null, roof.z, roof.z + H));
      cranes.push({
        roof,
        mast,
        cab: body(g),
        jib: body(g),
        counter: body(g),
        hook: body(g),
        hookLine: line(g),
        a: spring(UANG + 0.4 + rnd() * 0.6, 40, 11),
        base: UANG + 0.4 + rnd() * 0.6,
        ph: rnd() * 6.28,
        drawn: NaN,
        H,
        J: 22 + rnd() * 8,
      });
    }
    function drawCrane(cr: Crane) {
      const a = cr.a.x;
      if (a === cr.drawn) return;
      cr.drawn = a;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const { cx, cy } = cr.roof;
      const top = cr.roof.z + cr.H;
      const cabR = rrect(cx - 2.2, cy - 2.2, cx + 2.2, cy + 2.2, 0.8);
      put(cr.cab, prism(cabR, inset(cabR, 0.6), top, top + 2.8));
      const J = cr.J;
      put(
        cr.jib,
        prism(
          rotRect(cx + (J / 2 + 1) * c, cy + (J / 2 + 1) * s, J, 1.5, 0.6, a),
          null,
          top + 2.8,
          top + 4.2,
        ),
      );
      put(
        cr.counter,
        prism(
          rotRect(cx - 6 * c, cy - 6 * s, 10, 2, 0.6, a),
          null,
          top + 2.8,
          top + 4.2,
        ),
      );
      const tipX = cx + J * 0.85 * c;
      const tipY = cy + J * 0.85 * s;
      const drop = 10 + J * 0.3;
      cr.hookLine.setAttribute(
        "d",
        seg(P(tipX, tipY, top + 2.8), P(tipX, tipY, top - drop)),
      );
      put(
        cr.hook,
        prism(
          rrect(tipX - 1.3, tipY - 0.9, tipX + 1.3, tipY + 0.9, 0.4),
          null,
          top - drop - 2.2,
          top - drop,
        ),
      );
    }

    // -- wires between the tall roofs -----------------------------------------
    {
      const w = line(air);
      let d = "";
      const tip = (t: Tower, dz: number): Pt => P(t.cx, t.cy, t.h + dz);
      const neighbours = (t: Tower, n: number) =>
        roofs
          .filter(
            (r) =>
              r.t !== t && !r.t.landmark && Math.abs(r.cx - t.cx) < CELL * 7,
          )
          .sort((a, b) => Math.abs(a.cx - t.cx) - Math.abs(b.cx - t.cx))
          .slice(0, n);
      for (const r of neighbours(ren, 2))
        d += cable(tip(ren, 22), P(r.cx, r.cy, r.z + 2), 7);
      for (const r of neighbours(bofa, 1))
        d += cable(tip(bofa, 16), P(r.cx, r.cy, r.z + 2), 8);
      // Pole-to-pole runs along the far row's quieter roofs.
      const poles = roofs
        .filter(
          (r) => r.row === 1 && !r.t.landmark && !picked.has(r) && r.z > 12,
        )
        .sort((a, b) => a.cx - b.cx)
        .filter((_, i) => i % 2 === 0);
      for (const r of poles)
        put(
          body(rowG[r.row]),
          prism(
            rrect(r.cx - 0.5, r.cy - 0.5, r.cx + 0.5, r.cy + 0.5, 0.25),
            null,
            r.z,
            r.z + 7,
          ),
        );
      for (let i = 1; i < poles.length; i++) {
        const a = poles[i - 1];
        const b = poles[i];
        if (Math.abs(a.cx - b.cx) > CELL * 6) continue;
        const pa = P(a.cx, a.cy, a.z + 7);
        const pb = P(b.cx, b.cy, b.z + 7);
        const sag = 3 + Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * 0.06;
        d +=
          cable(pa, pb, sag) +
          cable(P(a.cx, a.cy, a.z + 5.6), P(b.cx, b.cy, b.z + 5.6), sag + 1);
      }
      w.setAttribute("d", d);
    }

    // -- the frame: the viewBox spans the city core at ground level and the
    //    SVG slices to the band width, so the blocks fill the viewport edge to
    //    edge; the bridge, the helicopter's loop and the tallest tops run past
    //    the box (overflow is visible) and bleed off the sides / rise above --
    const pts: Pt[] = [];
    for (const t of towers) {
      pts.push(
        P(t.cx - t.sx / 2, t.cy + t.sy / 2, 0),
        P(t.cx + t.sx / 2, t.cy - t.sy / 2, 0),
      );
      pts.push(
        P(
          t.cx,
          t.cy,
          t.h +
            RISE +
            (t.kind === "crown" ? 24 : t.kind === "chamfer" ? 18 : 10),
        ),
      );
    }
    pts.push(P(rx, ry, ballZ + BALL_R + 10));
    for (const cr of cranes)
      pts.push(P(cr.roof.cx, cr.roof.cy, cr.roof.z + cr.H + 6));
    const edge = (u: number) =>
      [ROW_V[0] - 0.6, ROW_V[3] + 0.7].map((v) => P(W(u, v)[0], W(u, v)[1], 0));
    const xs = [...edge(-11), ...edge(uMax - 3.2)].map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const gy0 = Math.min(...ys);
    const gy1 = Math.max(...ys) + 3;
    const SKY = 4;
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = gy0 - SKY;
    const y1 = gy1;
    svg.setAttribute(
      "viewBox",
      `${r2(x0)} ${r2(y0)} ${r2(x1 - x0)} ${r2(y1 - y0)}`,
    );
    const spanX = x1 - x0;

    // -- a helicopter on patrol over the city ---------------------------------
    const heli = {
      cabin: body(air),
      boom: body(air),
      fin: body(air),
      skids: line(air),
      mast: line(air),
      disc: line(air, "1.5 3"),
      blades: line(air),
      tail: line(air),
      wx: 0,
      wy: 0,
      ox: spring(0, 20, 8),
      oy: spring(0, 20, 8),
    };
    function drawHeli(t: number) {
      const { speed, radiusU, radiusV, z } = HERO_CITY.motion.heli;
      const th = 1.3 + t * speed;
      const u = N / 2 + Math.cos(th) * radiusU;
      const v = 0.6 + Math.sin(th) * radiusV;
      const [hx, hy] = W(u, v);
      heli.wx = hx;
      heli.wy = hy;
      const cx = hx + heli.ox.x;
      const cy = hy + heli.oy.x;
      // Heading follows the velocity around the ellipse.
      const du = -Math.sin(th) * radiusU;
      const dv = Math.cos(th) * radiusV;
      const ang = Math.atan2(du * UY + dv * UX, du * UX - dv * UY);
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const zz = z + 3 * Math.sin(t * 0.7);
      // Along-heading a, across n, up dz.
      const q = (a: number, n: number, dz: number) =>
        P(cx + a * c - n * s, cy + a * s + n * c, zz + dz);
      const cab = rotRect(cx + 1.6 * c, cy + 1.6 * s, 10, 5, 2.4, ang);
      put(heli.cabin, prism(cab, inset(cab, 1.2), zz, zz + 4.4));
      const boom = rotRect(cx - 9.5 * c, cy - 9.5 * s, 12.5, 1.4, 0.5, ang);
      put(heli.boom, prism(boom, null, zz + 2, zz + 3.3));
      const fin = rotRect(cx - 15.5 * c, cy - 15.5 * s, 2, 0.8, 0.3, ang);
      put(heli.fin, prism(fin, null, zz + 2, zz + 7));
      // Skids: two runners under the cabin on short struts.
      let d = "";
      for (const n of [-2.7, 2.7]) {
        d += seg(q(-3.6, n, -1.8), q(4.8, n, -1.8));
        for (const a of [-2, 3]) d += seg(q(a, n * 0.6, 0), q(a, n, -1.8));
      }
      heli.skids.setAttribute("d", d);
      heli.mast.setAttribute("d", seg(q(0, 0, 4.4), q(0, 0, 6.4)));
      const R = 10.5;
      heli.disc.setAttribute("d", poly(ringAt(circ(cx, cy, R, 20), zz + 6.4)));
      const rot = t * 16;
      let b = "";
      for (const a of [rot, rot + Math.PI / 2])
        b += seg(
          P(cx + Math.cos(a) * R, cy + Math.sin(a) * R, zz + 6.4),
          P(cx - Math.cos(a) * R, cy - Math.sin(a) * R, zz + 6.4),
        );
      heli.blades.setAttribute("d", b);
      const tr = Math.sin(t * 22) * 2;
      heli.tail.setAttribute(
        "d",
        seg(q(-15.8, 0, 5 + tr), q(-15.8, 0, 5 - tr)) +
          seg(q(-15.8, -0.8, 5), q(-15.8, 0.8, 5)),
      );
    }

    // -- scroll parallax: rows slide apart as the hero scrolls out ------------
    const ctx = gsap.context(() => {
      if (still || !section) return;
      const { parallax } = HERO_CITY;
      const scrub = isMobile ? MOBILE_SCRUB : HERO_SCENE_SCROLL.scrub;
      for (const [el, to] of [
        [back, parallax.back],
        [far, parallax.far],
        [mid, parallax.mid],
        [near, parallax.near],
      ] as const) {
        gsap.fromTo(
          el,
          { x: 0, y: 0 },
          {
            x: to.x,
            y: to.y,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: section,
              start: parallax.start,
              end: parallax.end,
              scrub,
            },
          },
        );
      }
    });

    // -- the loop --------------------------------------------------------------
    let over: Pt | null = null;
    let overS: Pt | null = null;
    let hot: Tower | null = null;
    let raf = 0;
    let last = 0;
    let visible = true;
    let clock = rnd() * 100;

    function setHot(t: Tower | null) {
      if (t === hot) return;
      hot?.parts.forEach((p) => ink(p.sil, "sil"));
      hot = t;
      hot?.parts.forEach((p) => ink(p.sil, "hi"));
    }

    function retarget() {
      let nearest: Tower | null = null;
      let best = Infinity;
      for (const t of towers) {
        if (!over) {
          t.sp.t = t.h;
          continue;
        }
        const d = Math.hypot(t.cx - over[0], t.cy - over[1]);
        t.sp.t = t.h + RISE * falloff(d / RADIUS);
        const inside =
          Math.abs(t.cx - over[0]) < t.sx / 2 + 3 &&
          Math.abs(t.cy - over[1]) < t.sy / 2 + 3;
        if (inside && d < best) {
          best = d;
          nearest = t;
        }
      }
      setHot(nearest);
      for (const b of boards)
        b.sp.t = over
          ? UANG +
            clamp(
              Math.atan2(over[1] - b.cy, over[0] - b.cx) + Math.PI / 2 - UANG,
              -0.7,
              0.7,
            )
          : UANG;
      if (!over) for (const cr of cranes) cr.a.t = cr.base;
      if (over) {
        const dx = heli.wx - over[0];
        const dy = heli.wy - over[1];
        const dist = Math.hypot(dx, dy);
        const push = clamp(1 - dist / (RADIUS * 2.2), 0, 1) * 22;
        heli.ox.t = dist < 1 ? push : (dx / dist) * push;
        heli.oy.t = dist < 1 ? 0 : (dy / dist) * push;
      } else {
        heli.ox.t = 0;
        heli.oy.t = 0;
      }
      if (over) {
        const [ou, ov] = Winv(over[0], over[1]);
        rate.t = Math.abs(ou - DART_U(ov)) * CELL < 14 ? 0.12 : 1;
      } else rate.t = 1;
      wake();
    }

    function tick(now: number) {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const snap = still;
      let moving = false;
      for (const t of towers) {
        if (stepS(t.sp, dt, snap)) moving = true;
        drawTower(t);
      }
      for (const b of boards) {
        if (stepS(b.sp, dt, snap)) moving = true;
        drawBoard(b);
      }
      for (const cr of cranes) {
        // A pointer parked near a crane sets its jib sweeping left and right.
        if (over && !snap) {
          const d = Math.hypot(over[0] - cr.roof.cx, over[1] - cr.roof.cy);
          if (d < CELL * 6) {
            const { amplitude, speed } = HERO_CITY.motion.craneSwing;
            cr.a.t = cr.base + Math.sin(clock * speed + cr.ph) * amplitude;
            moving = true;
          } else cr.a.t = cr.base;
        }
        if (stepS(cr.a, dt, snap)) moving = true;
        drawCrane(cr);
      }
      if (stepS(rate, dt, snap)) moving = true;
      if (!snap) {
        clock += dt;
        trainU +=
          (dt * rate.x * HERO_CITY.motion.train) / Math.hypot(DART_SLOPE, 1);
        if (trainU > DART_V1 + 0.6) trainU = DART_V0 - 0.6;
        moving = true;
      }
      drawTrain();
      if (stepS(heli.ox, dt, snap)) moving = true;
      if (stepS(heli.oy, dt, snap)) moving = true;
      drawHeli(snap ? 0 : clock);
      // Lights: Reunion's ball glitters, brighter toward the pointer; the Omni
      // plays a slow wave that ripples out from wherever the pointer rests.
      for (const l of lamps) {
        let a = 0.35 + 0.65 * Math.max(0, Math.sin(clock * 1.7 + l.ph));
        if (overS) {
          const d = Math.hypot(l.x - overS[0], l.y - overS[1]);
          a = Math.max(a, clamp(1 - d / (RADIUS * 1.6), 0, 1));
        }
        l.el.setAttribute("opacity", a.toFixed(2));
      }
      for (const l of leds) {
        let a =
          0.25 +
          0.75 * Math.max(0, Math.sin(clock * 2.2 - l.i * 0.55 + l.j * 0.35));
        if (overS) {
          const d = Math.hypot(l.x - overS[0], l.y - overS[1]);
          const ring = Math.abs(d - ((clock * 40) % 90));
          a = Math.max(
            a,
            clamp(1 - d / (RADIUS * 1.3), 0, 1) * clamp(1 - ring / 12, 0.2, 1),
          );
        }
        l.el.setAttribute("opacity", a.toFixed(2));
      }
      if (snap) {
        for (const l of lamps) l.el.setAttribute("opacity", "0.8");
        for (const l of leds) l.el.setAttribute("opacity", "0.6");
      }
      if (moving && visible && !document.hidden)
        raf = requestAnimationFrame(tick);
      else last = 0;
    }
    function wake() {
      if (!raf && visible && !document.hidden)
        raf = requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake();
    });
    io.observe(stage);
    const onVis = () => wake();
    document.addEventListener("visibilitychange", onVis);

    const toScene = (e: PointerEvent): Pt | null => {
      const m = svg.getScreenCTM();
      if (!m) return null;
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(
        m.inverse(),
      );
      return [pt.x, pt.y];
    };
    let leaveT = 0;
    const onMove = (e: PointerEvent) => {
      window.clearTimeout(leaveT);
      overS = toScene(e);
      over = overS ? unproj(overS[0], overS[1], 0) : null;
      retarget();
    };
    const onLeave = (e: PointerEvent) => {
      window.clearTimeout(leaveT);
      leaveT = window.setTimeout(
        () => {
          over = null;
          overS = null;
          retarget();
        },
        e.pointerType === "mouse" ? 0 : 1400,
      );
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointercancel", onLeave);

    // First paint.
    for (const t of towers) drawTower(t);
    for (const b of boards) drawBoard(b);
    for (const cr of cranes) drawCrane(cr);
    drawTrain();
    drawHeli(0);
    wake();

    return () => {
      window.clearTimeout(leaveT);
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ctx.revert();
      document.removeEventListener("visibilitychange", onVis);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointercancel", onLeave);
      root.remove();
    };
  }, [isMobile, prefersReducedMotion]);

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
      className="h-full w-full overflow-visible text-foreground"
    />
  );
}
