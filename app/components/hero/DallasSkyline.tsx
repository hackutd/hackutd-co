"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
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
 * manner of Lucas Marques' hairline figures. Reunion Tower, Bank of America
 * Plaza, Renaissance Tower, Comerica, Energy Plaza, Fountain Place, Chase
 * Tower, Trammell Crow Center, the Omni and the Margaret Hunt Hill bridge
 * stand among filler blocks, with a DART train running the front, tower
 * cranes, rooftop and wall billboards, strung wires, clouds, airliners and a
 * hot-air balloon overhead.
 *
 * Everything is one stroke colour (`currentColor`) with the page background
 * as fill, so the figure follows the site theme like the body text does.
 *
 * The pointer is the weather: towers rise under it and settle behind it, the
 * nearest one lights up, cranes and billboards turn toward it, clouds, planes
 * and the balloon give it room, the Omni's facade ripples from it, Reunion's
 * ball lights in its direction, and holding it near the track slows the
 * train. Scroll parallaxes the rows. The loop sleeps when the hero is off
 * screen, the tab is hidden, or the reader asked for reduced motion.
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
const TRACK_V = 1.75;
const N = 34;

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
    const sky = mk<SVGGElement>("g", root);
    const far = mk<SVGGElement>("g", root);
    const mid = mk<SVGGElement>("g", root);
    const near = mk<SVGGElement>("g", root);
    const air = mk<SVGGElement>("g", root);

    // -- towers: the landmarks first, then filler blocks in the free cells --
    const towers: Tower[] = [];
    const roofs: Roof[] = [];
    const taken = new Set<string>();
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
      const row = v < 0.5 ? 0 : 1;
      const g = row === 0 ? far : mid;
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
      const span = Math.ceil(sx / 2 / CELL);
      for (let k = -span; k <= span; k++)
        taken.add(`${row}:${Math.round(u) + k}`);
      return t;
    }

    // West to east, the way the plate reads.
    tower(3.6, 0.1, 30, 15, 30, "tiered", { landmark: true }); // Hyatt Regency
    const bofa = tower(8.2, 0.05, 17, 17, 128, "chamfer", { landmark: true });
    const ren = tower(11.4, 1.05, 14, 14, 108, "crown", { landmark: true });
    tower(14.6, 0, 16, 15, 96, "barrel", { landmark: true }); // Comerica
    tower(16.9, 1.1, 11, 11, 80, "tri", { landmark: true, rot: 0.3 }); // Energy Plaza
    tower(19.6, 0.05, 15, 15, 106, "prismatic", { landmark: true }); // Fountain Place
    tower(22.6, 1.05, 20, 9, 98, "stadium", { landmark: true }); // Chase Tower
    tower(25.6, 0.05, 15, 15, 92, "pyramid", { landmark: true }); // Trammell Crow
    tower(28.2, 1.1, 14, 12, 72, "box", { landmark: true }); // Thanksgiving Tower
    const omni = tower(31.6, 1.0, 30, 9, 36, "stadium", { landmark: true }); // Omni

    for (const row of [
      { v: 0, min: 26, max: 70, fp: [11, 17] as const, gap: 0.1 },
      { v: 1.05, min: 12, max: 40, fp: [8, 13] as const, gap: 0.18 },
    ]) {
      const r = row.v < 0.5 ? 0 : 1;
      for (let i = 1; i < N; i++) {
        if (taken.has(`${r}:${i}`)) continue;
        if (rnd() < row.gap) continue;
        const sx = row.fp[0] + rnd() * (row.fp[1] - row.fp[0]);
        const sy = sx * (0.75 + rnd() * 0.5);
        const env = row.min + (row.max - row.min) * Math.sin((i / N) * Math.PI);
        const h = env * (0.65 + rnd() * 0.6);
        const kind: Kind = r === 0 && rnd() < 0.3 ? "tiered" : "box";
        const wall: 0 | 1 | 2 =
          (lite ? HERO_CITY.mobile.wallBoards : true) && rnd() < 0.4
            ? rnd() < 0.5
              ? 1
              : 2
            : 0;
        tower(i + (r ? 0.5 : 0), row.v, sx, sy, h, kind, { wall });
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

    // -- Margaret Hunt Hill bridge, west of town ------------------------------
    {
      const BV = 0.9;
      const u0 = -7.2;
      const u1 = -1.4;
      const [dcx, dcy] = W((u0 + u1) / 2, BV);
      const deckLen = (u1 - u0) * CELL;
      for (const u of [u0 + 1.2, (u0 + u1) / 2, u1 - 1.2]) {
        const [px, py] = W(u, BV);
        put(
          body(far),
          prism(rrect(px - 1.3, py - 1.3, px + 1.3, py + 1.3, 0.5), null, 0, 7),
        );
      }
      const deck = rotRect(dcx, dcy, deckLen, 5, 1.2, UANG);
      put(body(far), prism(deck, inset(deck, 0.9), 7, 9));
      const arch: Pt[] = [];
      const archIn: Pt[] = [];
      const ARCH = 44;
      for (let k = 0; k <= 28; k++) {
        const tt = k / 28;
        const [ax, ay] = W(u0 + tt * (u1 - u0), BV - 0.12);
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
        const [ax, ay] = W(u0 + tt * (u1 - u0), BV - 0.12);
        const top = P(ax, ay, 9 + ARCH * Math.sin(Math.PI * tt) - 1.6);
        const [bx, by] = W(u0 + 0.5 + (tt - 0.5) * (u1 - u0) * 0.55, BV - 0.12);
        d += seg(top, P(bx, by, 9));
      }
      cables.setAttribute("d", d);
    }

    // -- DART along the front: track, catenary poles and wire, two cars -----
    const uMin = -2.5;
    const uMax = N + 1.5;
    {
      const [tcx, tcy] = W((uMin + uMax) / 2, TRACK_V);
      const bed = rotRect(tcx, tcy, (uMax - uMin) * CELL, 3.2, 0.6, UANG);
      put(body(near), prism(bed, inset(bed, 0.9), 0, 0.9));
    }
    const POLE_H = 9;
    const poleTops: Pt[] = [];
    for (let u = uMin + 1; u < uMax; u += 3.2) {
      const [px, py] = W(u, TRACK_V + 0.32);
      put(
        body(near),
        prism(
          rrect(px - 0.45, py - 0.45, px + 0.45, py + 0.45, 0.2),
          null,
          0,
          POLE_H,
        ),
      );
      const arm = P(px, py, POLE_H);
      const [wx, wy] = W(u, TRACK_V);
      line(near).setAttribute("d", seg(arm, P(wx, wy, POLE_H - 0.6)));
      poleTops.push(P(wx, wy, POLE_H - 0.6));
    }
    {
      const wire = line(near);
      let d = "";
      for (let i = 1; i < poleTops.length; i++)
        d += cable(poleTops[i - 1], poleTops[i], 1.4);
      wire.setAttribute("d", d);
    }
    const cars = [body(near), body(near)];
    const carTops = [body(near), body(near)];
    let trainU = 6;
    let trainDrawn = NaN;
    const rate = spring(1, 60, 14);
    function drawTrain() {
      if (trainU === trainDrawn) return;
      trainDrawn = trainU;
      cars.forEach((car, k) => {
        const [tx, ty] = W(trainU + ((k - 0.5) * 14.6) / CELL, TRACK_V);
        const shell = rotRect(tx, ty, 14, 3.2, 1.3, UANG);
        put(car, prism(shell, inset(shell, 0.7), 0.9, 5.4));
        const roof = rotRect(tx, ty, 9, 1.8, 0.8, UANG);
        put(carTops[k], prism(roof, null, 5.4, 6.2));
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
      .filter((r) => !r.t.landmark && r.z > 18 && r.z < 64)
      .sort((a, b) => a.cx - b.cx);
    const picked = new Set<Roof>();
    for (const f of [0.06, 0.22, 0.4, 0.58, 0.76, 0.93]) {
      const r =
        boardRoofs[
          Math.min(boardRoofs.length - 1, Math.floor(boardRoofs.length * f))
        ];
      if (!r || picked.has(r)) continue;
      picked.add(r);
      const g = r.row ? mid : far;
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

    // -- tower cranes, jibs swinging toward the pointer -----------------------
    type Crane = {
      roof: Roof;
      mast: Solid;
      cab: Solid;
      jib: Solid;
      counter: Solid;
      hook: Solid;
      hookLine: SVGPathElement;
      a: Spring;
      drawn: number;
      H: number;
      J: number;
    };
    const cranes: Crane[] = [];
    const craneRoofs = roofs
      .filter((r) => !r.t.landmark && !picked.has(r) && r.z > 24 && r.z < 60)
      .sort((a, b) => a.cx - b.cx);
    const craneCount = lite ? HERO_CITY.mobile.cranes : 2;
    for (const f of [0.33, 0.7].slice(0, craneCount)) {
      const roof =
        craneRoofs[
          Math.min(craneRoofs.length - 1, Math.floor(craneRoofs.length * f))
        ];
      if (!roof) continue;
      picked.add(roof);
      const g = roof.row ? mid : far;
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
        a: spring(UANG + 0.4 + rnd() * 0.6, 60, 14),
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
        .filter((r) => r.row === 0 && !r.t.landmark && !picked.has(r))
        .sort((a, b) => a.cx - b.cx)
        .filter((_, i) => i % 2 === 0);
      for (const r of poles)
        put(
          body(far),
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

    // -- the frame: fit the rest pose plus headroom, then leave sky above ----
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
    pts.push(P(W(-7.6, 0.9)[0], W(-7.6, 0.9)[1], 0));
    pts.push(P(W(uMin, TRACK_V + 0.6)[0], W(uMin, TRACK_V + 0.6)[1], 0));
    pts.push(P(W(uMax, TRACK_V + 0.6)[0], W(uMax, TRACK_V + 0.6)[1], 0));
    for (const cr of cranes)
      pts.push(P(cr.roof.cx, cr.roof.cy, cr.roof.z + cr.H + 6));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const gx0 = Math.min(...xs) - 6;
    const gx1 = Math.max(...xs) + 6;
    const gy0 = Math.min(...ys);
    const gy1 = Math.max(...ys) + 3;
    const SKY = 54;
    const x0 = gx0;
    const x1 = gx1;
    const y0 = gy0 - SKY;
    const y1 = gy1;
    svg.setAttribute(
      "viewBox",
      `${r2(x0)} ${r2(y0)} ${r2(x1 - x0)} ${r2(y1 - y0)}`,
    );
    const spanX = x1 - x0;

    // -- clouds: flat-bottomed puffs drifting across the sky ------------------
    type Cloud = {
      x: number;
      y: number;
      w: number;
      v: number;
      el: SVGPathElement;
      oy: Spring;
      d: string;
    };
    const clouds: Cloud[] = [];
    const cloudCount = lite ? HERO_CITY.mobile.clouds : 6;
    for (let i = 0; i < cloudCount; i++) {
      const w = 44 + rnd() * 52;
      const h = w * (0.22 + rnd() * 0.1);
      // Sample the upper outline of a few overlapping discs.
      const discs: [number, number, number][] = [];
      const n = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) {
        const cx = -w / 2 + ((k + 0.5) / n) * w;
        const rr =
          h * (0.55 + rnd() * 0.55) * (k === 0 || k === n - 1 ? 0.7 : 1);
        discs.push([cx, -rr * 0.15, rr]);
      }
      const outline: Pt[] = [];
      const steps = 36;
      for (let s = 0; s <= steps; s++) {
        const x = -w / 2 + (s / steps) * w;
        let top = 0;
        for (const [cx, cy, rr] of discs) {
          const dx = x - cx;
          if (Math.abs(dx) < rr)
            top = Math.min(top, cy - Math.sqrt(rr * rr - dx * dx));
        }
        outline.push([x, top]);
      }
      const d = poly([[-w / 2 - 2, 0], ...outline, [w / 2 + 2, 0]]);
      const el = mk<SVGPathElement>("path", sky);
      ink(el, "sil");
      el.setAttribute("d", d);
      clouds.push({
        x: x0 + rnd() * spanX,
        y: y0 + 14 + rnd() * (SKY + 30),
        w,
        v: HERO_CITY.motion.cloud * (0.5 + rnd()) * (i % 2 ? 1 : -1),
        el,
        oy: spring(0, 30, 10),
        d,
      });
    }
    function drawCloud(c: Cloud) {
      c.el.setAttribute(
        "transform",
        `translate(${r2(c.x)} ${r2(c.y + c.oy.x)})`,
      );
    }

    // -- airliners, crossing on long contrails --------------------------------
    type Plane = {
      g: SVGGElement;
      trail: SVGPathElement;
      x: number;
      y: number;
      dir: 1 | -1;
      v: number;
      s: number;
      oy: Spring;
      bank: number;
    };
    const planes: Plane[] = [];
    const planeGlyph = (() => {
      // Unit glyph, nose at +x: fuselage, swept wing, tail fin, one engine.
      const fus = poly([
        [-10, -1.2],
        [7, -1.2],
        [10, 0],
        [7, 1.2],
        [-10, 1.2],
        [-11, 0.4],
        [-11, -0.4],
      ]);
      const fin = poly([
        [-10.5, -1.2],
        [-7.5, -5.2],
        [-5.5, -5.2],
        [-7, -1.2],
      ]);
      const wing = poly([
        [1.5, 0.4],
        [-1.5, 3.6],
        [-4.5, 3.6],
        [-2.5, 0.4],
      ]);
      const eng = poly([
        [-1, 2.2],
        [1.6, 2.2],
        [1.6, 3.4],
        [-1, 3.4],
      ]);
      return { fus, fin, wing, eng };
    })();
    const planeCount = lite ? HERO_CITY.mobile.planes : 2;
    for (let i = 0; i < planeCount; i++) {
      const trail = line(sky, "3 5");
      const g = mk<SVGGElement>("g", sky);
      for (const d of [
        planeGlyph.fin,
        planeGlyph.fus,
        planeGlyph.wing,
        planeGlyph.eng,
      ]) {
        const p = mk<SVGPathElement>("path", g);
        ink(p, "cr");
        p.style.fill = "var(--color-background)";
        p.setAttribute("d", d);
      }
      const dir: 1 | -1 = i % 2 ? -1 : 1;
      planes.push({
        g,
        trail,
        x: x0 + rnd() * spanX,
        y: y0 + 12 + i * 24 + rnd() * 6,
        dir,
        v: HERO_CITY.motion.plane * (i ? 0.72 : 1),
        s: i ? 1.5 : 2.1,
        oy: spring(0, 24, 9),
        bank: 0,
      });
    }
    function drawPlane(p: Plane) {
      const y = p.y + p.oy.x;
      p.g.setAttribute(
        "transform",
        `translate(${r2(p.x)} ${r2(y)}) rotate(${r2(p.bank)}) scale(${r2(p.dir * p.s)} ${r2(p.s)})`,
      );
      const len = 60 * p.s;
      p.trail.setAttribute(
        "d",
        seg([p.x - p.dir * 12 * p.s, y + 0.2], [p.x - p.dir * len, y + 0.2]),
      );
    }

    // -- a hot-air balloon, climbing and swaying ------------------------------
    const balloonG = mk<SVGGElement>("g", sky);
    {
      const env = mk<SVGPathElement>("path", balloonG);
      ink(env, "sil");
      const pts: Pt[] = [];
      for (let k = 0; k <= 28; k++) {
        const a = (k / 28) * Math.PI * 2;
        const rr = 7 * (1 - 0.18 * Math.max(0, Math.sin(a)) ** 3);
        pts.push([Math.cos(a) * rr * 0.92, Math.sin(a) * rr - 2]);
      }
      env.setAttribute("d", poly(pts));
      const gores = line(balloonG);
      gores.setAttribute(
        "d",
        `M-2.6 -8.6Q-3.4 -2 -1.6 4.4M2.6 -8.6Q3.4 -2 1.6 4.4M0 -9Q0 -2 0 4.6`,
      );
      const ropes = line(balloonG);
      ropes.setAttribute("d", `M-2.2 4.4L-1.3 8.6M2.2 4.4L1.3 8.6`);
      const basket = mk<SVGPathElement>("path", balloonG);
      ink(basket, "cr");
      basket.style.fill = "var(--color-background)";
      basket.setAttribute(
        "d",
        poly([
          [-1.7, 8.6],
          [1.7, 8.6],
          [1.4, 11],
          [-1.4, 11],
        ]),
      );
    }
    const balloon = {
      x: x0 + spanX * 0.8,
      y: y0 + SKY + 10,
      ox: spring(0, 24, 9),
      oy: spring(0, 24, 9),
    };
    function drawBalloon(t: number) {
      const { rise, sway, period } = HERO_CITY.motion.balloon;
      const y = balloon.y - rise * (0.5 + 0.5 * Math.sin(t / 7)) + balloon.oy.x;
      const x =
        balloon.x + sway * Math.sin((t / period) * Math.PI * 2) + balloon.ox.x;
      balloonG.setAttribute("transform", `translate(${r2(x)} ${r2(y)})`);
    }

    // -- scroll parallax: rows slide apart as the hero scrolls out ------------
    const ctx = gsap.context(() => {
      if (still || !section) return;
      const { parallax } = HERO_CITY;
      const scrub = isMobile ? MOBILE_SCRUB : HERO_SCENE_SCROLL.scrub;
      for (const [el, to] of [
        [sky, parallax.sky],
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
      for (const cr of cranes) {
        cr.a.t = over
          ? UANG +
            0.5 +
            clamp(
              Math.atan2(over[1] - cr.roof.cy, over[0] - cr.roof.cx) -
                UANG -
                0.5,
              -1.2,
              1.2,
            )
          : UANG + 0.5;
      }
      for (const c of clouds) {
        if (!overS) {
          c.oy.t = 0;
          continue;
        }
        const dx = c.x - overS[0];
        const dy = c.y - overS[1];
        const reach = c.w * 0.9;
        const near = clamp(1 - Math.hypot(dx, dy) / reach, 0, 1);
        c.oy.t = near * (dy < 0 ? -1 : 1) * 10;
      }
      for (const p of planes) {
        if (!overS) {
          p.oy.t = 0;
          continue;
        }
        const dy = p.y - overS[1];
        const dx = p.x - overS[0];
        const near = clamp(1 - Math.hypot(dx, dy) / (RADIUS * 2.2), 0, 1);
        p.oy.t = near * (dy < 0 ? -1 : 1) * 14;
      }
      if (overS) {
        const dx = balloon.x - overS[0];
        const dy = balloon.y - 15 - overS[1];
        const dist = Math.hypot(dx, dy);
        const push = clamp(1 - dist / (RADIUS * 2), 0, 1) * 16;
        balloon.ox.t = dist < 1 ? push : (dx / dist) * push;
        balloon.oy.t = dist < 1 ? 0 : (dy / dist) * push;
      } else {
        balloon.ox.t = 0;
        balloon.oy.t = 0;
      }
      if (over) {
        const [, ov] = Winv(over[0], over[1]);
        rate.t = Math.abs(ov - TRACK_V) * CELL < 12 ? 0.12 : 1;
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
        if (stepS(cr.a, dt, snap)) moving = true;
        drawCrane(cr);
      }
      if (stepS(rate, dt, snap)) moving = true;
      if (!snap) {
        clock += dt;
        trainU += dt * rate.x * HERO_CITY.motion.train;
        if (trainU > uMax + 1.5) trainU = uMin - 1.5;
        moving = true;
      }
      drawTrain();
      for (const c of clouds) {
        if (!snap) {
          c.x += c.v * dt;
          if (c.x > x1 + c.w) c.x = x0 - c.w;
          if (c.x < x0 - c.w) c.x = x1 + c.w;
        }
        if (stepS(c.oy, dt, snap)) moving = true;
        drawCloud(c);
      }
      for (const p of planes) {
        if (!snap) {
          p.x += p.dir * p.v * dt;
          const margin = 80 * p.s;
          if (p.dir > 0 && p.x > x1 + margin) p.x = x0 - margin;
          if (p.dir < 0 && p.x < x0 - margin) p.x = x1 + margin;
        }
        if (stepS(p.oy, dt, snap)) moving = true;
        p.bank = clamp(-p.oy.v * 0.25 * p.dir, -9, 9);
        drawPlane(p);
      }
      if (stepS(balloon.ox, dt, snap)) moving = true;
      if (stepS(balloon.oy, dt, snap)) moving = true;
      drawBalloon(snap ? 0 : clock);
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
      preserveAspectRatio="xMidYMax meet"
      className="h-full w-full overflow-visible text-foreground"
    />
  );
}
