"use client";

import { useRef, useEffect, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SPONSORS } from "../../data/sponsors";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { dispatchNavbarThemeOverride } from "../navbar/navbarThemeOverride";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";

configureScrollTrigger();

// ── Types ───────────────────────────────────────────────────
interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ── Constants ───────────────────────────────────────────────
const AUTO_SPEED = 0.18;
const DRAG_SENSITIVITY = 0.35;
const RETURN_RATE = 0.025;
const TILT = -10;
const EDGE_WIDTH = 3;
const OUTLINE_WIDTH = 6;

// ── Geodesic sphere (subdivided icosahedron) ────────────────
function createGeodesicSphere(subdivisions = 1) {
  const t = (1 + Math.sqrt(5)) / 2;

  const raw: [number, number, number][] = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ];

  const vertices: Vec3[] = raw.map(([x, y, z]) => {
    const len = Math.sqrt(x * x + y * y + z * z);
    return { x: x / len, y: y / len, z: z / len };
  });

  let faces: [number, number, number][] = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];

  for (let s = 0; s < subdivisions; s++) {
    const cache: Record<string, number> = {};
    const next: [number, number, number][] = [];

    const mid = (a: number, b: number): number => {
      const key = Math.min(a, b) + "_" + Math.max(a, b);
      if (cache[key] !== undefined) return cache[key];
      const va = vertices[a],
        vb = vertices[b];
      const mx = (va.x + vb.x) / 2;
      const my = (va.y + vb.y) / 2;
      const mz = (va.z + vb.z) / 2;
      const len = Math.sqrt(mx * mx + my * my + mz * mz);
      vertices.push({ x: mx / len, y: my / len, z: mz / len });
      cache[key] = vertices.length - 1;
      return vertices.length - 1;
    };

    for (const [a, b, c] of faces) {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }

  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];
  for (const [a, b, c] of faces) {
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ] as [number, number][]) {
      const key = Math.min(p, q) + "_" + Math.max(p, q);
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([p, q]);
      }
    }
  }

  return { vertices, edges };
}

// ── 3D projection (rotateY then rotateX) ────────────────────
function project(v: Vec3, yDeg: number, xDeg: number): Vec3 {
  const yr = (yDeg * Math.PI) / 180;
  const xr = (xDeg * Math.PI) / 180;
  const cosY = Math.cos(yr),
    sinY = Math.sin(yr);
  const cosX = Math.cos(xr),
    sinX = Math.sin(xr);

  const x1 = v.x * cosY + v.z * sinY;
  const z1 = -v.x * sinY + v.z * cosY;
  const y1 = v.y;

  return {
    x: x1,
    y: y1 * cosX - z1 * sinX,
    z: y1 * sinX + z1 * cosX,
  };
}

// ── Canvas wireframe renderer ───────────────────────────────
function drawWireframe(
  canvas: HTMLCanvasElement,
  vertices: Vec3[],
  edges: [number, number][],
  angle: number,
  radius: number,
  dpr: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const size = canvas.width / dpr;
  const center = size / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  // Project all unit-sphere vertices, scaled by radius
  const proj = vertices.map((v) => {
    const p = project(v, angle, TILT);
    return { x: p.x * radius, y: p.y * radius, z: p.z * radius };
  });

  // Sort edges back-to-front for proper layering
  const sorted = [...edges]
    .map((e) => ({ e, z: (proj[e[0]].z + proj[e[1]].z) / 2 }))
    .sort((a, b) => a.z - b.z);

  // Draw geodesic edges with depth-based opacity
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = EDGE_WIDTH;

  for (const { e } of sorted) {
    const a = proj[e[0]];
    const b = proj[e[1]];
    const midZ = (a.z + b.z) / 2;
    const depth = (midZ / radius + 1) / 2; // 0 = back, 1 = front
    const alpha = 0.06 + depth * 0.84;

    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(center + a.x, center - a.y);
    ctx.lineTo(center + b.x, center - b.y);
    ctx.stroke();
  }

  // Thick outer circle
  ctx.strokeStyle = "rgba(0,0,0,0.92)";
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// ── Logo distribution (Fibonacci spiral) ────────────────────
function distributeOnSphere(
  count: number
): { lat: number; lon: number }[] {
  const golden = 137.508;
  return Array.from({ length: count }, (_, i) => ({
    lat: -35 + (i / (count - 1)) * 70,
    lon: (i * golden) % 360,
  }));
}

// ── Tower SVG (Reunion Tower base — starts below globe) ─────
function TowerSVG({ canvasSize, radius }: { canvasSize: number; radius: number }) {
  const towerWidth = radius * 0.6;
  const towerHeight = radius * 1.6;
  const lineW = OUTLINE_WIDTH * 4;
  const innerGap = towerWidth * 0.15;

  const outerExtend = towerHeight * 0.02;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={towerWidth}
      height={towerHeight}
      style={{
        position: "absolute",
        top: canvasSize / 2 + radius * 1.01,
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "visible",
      }}
    >
      {/* Outer columns — extend up to meet globe */}
      <line x1={0} y1={-outerExtend - towerHeight * 0.01} x2={0} y2={towerHeight} stroke="currentColor" strokeWidth={lineW * 0.6} strokeLinecap="round" />
      <line x1={towerWidth} y1={-outerExtend - towerHeight * 0.01} x2={towerWidth} y2={towerHeight} stroke="currentColor" strokeWidth={lineW * 0.6} strokeLinecap="round" />
      {/* Inner columns — 1% lower */}
      <line x1={towerWidth / 2 - innerGap} y1={towerHeight * 0.01} x2={towerWidth / 2 - innerGap} y2={towerHeight} stroke="currentColor" strokeWidth={lineW} strokeLinecap="round" />
      <line x1={towerWidth / 2 + innerGap} y1={towerHeight * 0.01} x2={towerWidth / 2 + innerGap} y2={towerHeight} stroke="currentColor" strokeWidth={lineW} strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────
export default function Sponsors() {
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);

  const angleRef = useRef(0);
  const velocityRef = useRef(AUTO_SPEED);
  const isDragging = useRef(false);
  const lastXRef = useRef(0);

  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();

  const radius = isMobile ? 216 : 378;
  const cardW = isMobile ? 56 : 80;
  const cardH = isMobile ? 36 : 52;
  const canvasSize = radius * 2 + 24;

  const positions = useMemo(() => distributeOnSphere(SPONSORS.length), []);
  const { vertices, edges } = useMemo(() => createGeodesicSphere(1), []);

  // ── Canvas resolution setup ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;
  }, [canvasSize]);

  // ── Animation loop — always spinning ────────────────────
  useEffect(() => {
    if (reducedMotion) return;
    const dpr = window.devicePixelRatio || 1;
    let id: number;

    const tick = () => {
      if (!isDragging.current) {
        velocityRef.current +=
          (AUTO_SPEED - velocityRef.current) * RETURN_RATE;
      }
      angleRef.current += velocityRef.current;

      // Canvas wireframe
      if (canvasRef.current) {
        drawWireframe(
          canvasRef.current,
          vertices,
          edges,
          angleRef.current,
          radius,
          dpr
        );
      }

      // CSS 3D logos
      if (globeRef.current) {
        globeRef.current.style.transform = `rotateX(${TILT}deg) rotateY(${angleRef.current}deg)`;
      }

      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [reducedMotion, vertices, edges, radius]);

  // ── Drag-to-rotate with momentum ───────────────────────
  useEffect(() => {
    const viewport = sceneRef.current;
    if (!viewport || reducedMotion) return;

    const down = (e: PointerEvent) => {
      isDragging.current = true;
      lastXRef.current = e.clientX;
      viewport.setPointerCapture(e.pointerId);
      viewport.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!isDragging.current) return;
      velocityRef.current =
        (e.clientX - lastXRef.current) * DRAG_SENSITIVITY;
      lastXRef.current = e.clientX;
    };
    const up = () => {
      isDragging.current = false;
      viewport.style.cursor = "grab";
    };

    viewport.addEventListener("pointerdown", down);
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", up);
    viewport.addEventListener("pointercancel", up);
    return () => {
      viewport.removeEventListener("pointerdown", down);
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", up);
      viewport.removeEventListener("pointercancel", up);
    };
  }, [reducedMotion]);

  // ── GSAP: scroll entrance, overlay fade, navbar ─────────
  useGSAP(() => {
    const section = sectionRef.current;
    const overlay = overlayRef.current;
    const scene = sceneRef.current;
    if (!section || !overlay || !scene) return;

    gsap.set(overlay, { autoAlpha: 0 });
    gsap.to(overlay, {
      autoAlpha: 1,
      ease: "power1.in",
      scrollTrigger: {
        trigger: section,
        start: "center top",
        end: "bottom top",
        scrub: 1,
      },
    });

    // Globe rises from below as section enters viewport
    gsap.fromTo(
      scene,
      { y: 500 },
      {
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "top 20%",
          scrub: 1.5,
        },
      }
    );

    const nav = ScrollTrigger.create({
      trigger: section,
      start: "top 10%",
      end: "bottom 10%",
      onEnter: () => dispatchNavbarThemeOverride("light"),
      onEnterBack: () => dispatchNavbarThemeOverride("light"),
      onLeave: () => dispatchNavbarThemeOverride(null),
      onLeaveBack: () => dispatchNavbarThemeOverride(null),
    });
    return () => nav.kill();
  });

  // ── Reduced-motion fallback: flat grid ──────────────────
  if (reducedMotion) {
    return (
      <div className="relative bg-surface">
        <section
          ref={sectionRef}
          id="sponsors"
          className="relative px-8 py-32 text-surface-foreground"
        >
          <div className="flex items-end justify-between">
            <h2 className="text-4xl font-bold md:text-5xl">Our Sponsors</h2>
            <a
              href="mailto:sponsors@hackutd.co"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              sponsors@hackutd.co
            </a>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 md:grid-cols-5 lg:grid-cols-6">
            {SPONSORS.map((s) => (
              <a
                key={s.name}
                href={s.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-lg p-4 transition-colors hover:bg-muted/10"
              >
                <img
                  src={s.logo || ""}
                  alt={s.name}
                  className="max-h-12 max-w-full object-contain"
                />
              </a>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ── Full geodesic globe ─────────────────────────────────
  return (
    <div className="relative bg-surface">
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-10 bg-background"
      />
      <section
        ref={sectionRef}
        id="sponsors"
        className="relative z-20 px-8 py-32 text-surface-foreground"
        data-navbar-theme="light"
      >
        <div className="flex items-end justify-between">
          <h2 className="text-4xl font-bold md:text-5xl">Our Sponsors</h2>
          <a
            href="mailto:sponsors@hackutd.co"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            sponsors@hackutd.co
          </a>
        </div>

        <div className="mt-16 flex justify-center overflow-visible">
          {/* Viewport — drag target + GSAP scroll entrance */}
          <div
            ref={sceneRef}
            style={{
              position: "relative",
              width: canvasSize,
              height: canvasSize + radius * 1.2,
              cursor: "grab",
              userSelect: "none",
              overflow: "visible",
            }}
          >
            <TowerSVG canvasSize={canvasSize} radius={radius} />

            {/* Canvas: geodesic wireframe (behind logos) */}
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 1,
                pointerEvents: "none",
              }}
            />

            {/* CSS 3D layer: sponsor logos (above wireframe) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: canvasSize,
                height: canvasSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: 1200,
                zIndex: 2,
              }}
            >
              <div
                ref={globeRef}
                style={{
                  width: radius * 2,
                  height: radius * 2,
                  position: "relative",
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${TILT}deg) rotateY(0deg)`,
                }}
              >
                {SPONSORS.map((sponsor, i) => {
                  const { lat, lon } = positions[i];
                  const needsBg = (
                    sponsor as Record<string, unknown>
                  ).needs_white_bg;
                  return (
                    <div
                      key={sponsor.name}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transformStyle: "preserve-3d",
                        transform: `rotateY(${lon}deg) rotateX(${-lat}deg) translateZ(${radius}px)`,
                        backfaceVisibility: "hidden",
                      }}
                    >
                      <a
                        href={sponsor.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sponsor-logo-card"
                        style={{
                          width: cardW,
                          height: cardH,
                          marginLeft: -cardW / 2,
                          marginTop: -cardH / 2,
                          backgroundColor: needsBg
                            ? "#ffffff"
                            : "rgba(255,255,255,0.88)",
                        }}
                      >
                        <img
                          src={sponsor.logo || ""}
                          alt={sponsor.name}
                          draggable={false}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            pointerEvents: "none",
                          }}
                          loading="lazy"
                        />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
