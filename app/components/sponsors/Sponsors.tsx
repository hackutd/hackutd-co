"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP as useGsapReact } from "@gsap/react";
import { SPONSORS } from "../../data/sponsors";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { dispatchNavbarThemeOverride } from "../navbar/navbarThemeOverride";

configureScrollTrigger();

const SPHERE_RADIUS = 3.8;

// ── Structured grid distribution ─────────────────────────────
function gridPoints(total: number, radius: number): THREE.Vector3[] {
  const numRows: number = 3;
  const latMin = -Math.PI * 0.18;
  const latMax = Math.PI * 0.18;

  const lats: number[] = [];
  for (let r = 0; r < numRows; r++) {
    const t = numRows === 1 ? 0.5 : r / (numRows - 1);
    lats.push(latMin + t * (latMax - latMin));
  }

  const weights = lats.map((lat) => Math.cos(lat));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const itemsPerRow = weights.map((w) => Math.max(1, Math.round((w / weightSum) * total)));

  let assigned = itemsPerRow.reduce((a, b) => a + b, 0);
  let ri = Math.floor(numRows / 2);
  while (assigned !== total) {
    const delta = assigned < total ? 1 : -1;
    itemsPerRow[ri] = Math.max(1, itemsPerRow[ri] + delta);
    assigned += delta;
    ri = (ri + 1) % numRows;
  }

  const points: THREE.Vector3[] = [];
  for (let r = 0; r < numRows; r++) {
    const lat = lats[r];
    const count = itemsPerRow[r];
    const offset = r % 2 === 0 ? 0 : Math.PI / count;
    for (let c = 0; c < count; c++) {
      const lon = offset + (c / count) * Math.PI * 2;
      const x = radius * Math.cos(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(lon);
      points.push(new THREE.Vector3(x, y, z));
    }
  }
  return points;
}

// ── Build a curved spherical-cap patch geometry ───────────────
// Creates a small curved patch of sphere surface at a given lat/lon,
// spanning angularW radians in longitude and angularH in latitude.
// The mesh curves in BOTH axes to conform to the globe surface.
function makeSphericalPatch(
  centerLat: number,
  centerLon: number,
  angularW: number,
  angularH: number,
  radius: number,
  segments = 16
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Logos on the back hemisphere (cos(lon) < 0) get mirror-flipped by the
  // spherical winding. Detect that and flip U to compensate.
  const isBackFacing = Math.cos(centerLon) < 0;

  for (let row = 0; row <= segments; row++) {
    const v = row / segments;
    const lat = (centerLat - angularH) + v * angularH * 2;
    for (let col = 0; col <= segments; col++) {
      const u = col / segments;
      const lon = (centerLon - angularW) + u * angularW * 2;
      const x = radius * Math.cos(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(lon);
      positions.push(x, y, z);
      // Flip V for right-side-up; flip U on back hemisphere to un-mirror
      const finalU = isBackFacing ? 1-u : 1-u;
      uvs.push(finalU, v);
    }
  }

  for (let row = 0; row < segments; row++) {
    for (let col = 0; col < segments; col++) {
      const stride = segments + 1;
      const a = row * stride + col;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ── Single curved sponsor patch ───────────────────────────────
// Normalized: every logo gets the same angular height on the sphere.
// Width is scaled by aspect ratio so images are never squished.
function SponsorPatch({
  url,
  position,
  href,
}: {
  url: string;
  position: THREE.Vector3;
  href: string;
}) {
  const texture = useTexture(url);

  // Max angular size in each axis — logo hits whichever limit comes first
  const maxAngularH = 0.05; // radians (~2.9°)
  const maxAngularW = 0.20; // radians (~6.9°) — caps wide logos

  const aspect = useMemo(() => {
    const img = texture.image as HTMLImageElement | undefined;
    return img?.width && img?.height ? img.width / img.height : 1;
  }, [texture]);

  // Scale from height, then clamp width; if width hits its cap, scale height back down
  const { angularH, angularW } = useMemo(() => {
    let h = maxAngularH;
    let w = h * aspect;
    if (w > maxAngularW) {
      w = maxAngularW;
      h = w / aspect;
    }
    return { angularH: h, angularW: w };
  }, [aspect]);

  const { lat, lon } = useMemo(() => {
    const r = position.length();
    const lat = Math.asin(THREE.MathUtils.clamp(position.y / r, -1, 1));
    const lon = Math.atan2(position.z, position.x);
    return { lat, lon };
  }, [position]);

  // Offset radius slightly beyond sphere to avoid z-fighting with occluder
  const patchRadius = SPHERE_RADIUS + 0.012;

  const patchGeo = useMemo(
    () => makeSphericalPatch(lat, lon, angularW, angularH, patchRadius, 16),
    [lat, lon, angularW, angularH, patchRadius]
  );

  return (
    <mesh
      geometry={patchGeo}
      onClick={() => window.open(href, "_blank")}
      onPointerEnter={() => { document.body.style.cursor = "pointer"; }}
      onPointerLeave={() => { document.body.style.cursor = "auto"; }}
    >
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.95}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// ── Thick wireframe sphere ────────────────────────────────────
function ThickWireframeSphere({ radius }: { radius: number }) {
  const edgePoints = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(radius, 4);
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const pos = edgeGeo.attributes.position;
    const segments: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < pos.count; i += 2) {
      segments.push([
        new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)),
        new THREE.Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)),
      ]);
    }
    return segments;
  }, [radius]);

  return (
    <>
      {/* Solid occluder — hides back-facing logos cleanly */}
      <mesh>
        <sphereGeometry args={[radius - 0.04, 32, 32]} />
        <meshBasicMaterial color="#f2f2f2" toneMapped={false} depthWrite={true} />
      </mesh>
      {edgePoints.map((pts, i) => (
        <Line key={i} points={pts} color="#000000" lineWidth={5} />
      ))}
    </>
  );
}

// ── Tower SVG overlay ─────────────────────────────────────────
function TowerSVG() {
  return (
    <svg
      viewBox="0 0 200 300"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        bottom: "-300px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "38%",
        height: "65%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <line x1="10" y1="0" x2="10" y2="300" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="10" y1="0" x2="10" y2="300" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <line x1="190" y1="0" x2="190" y2="300" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="190" y1="0" x2="190" y2="300" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <rect x="68" y="0" width="16" height="180" rx="6" ry="6" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="68" y="0" width="16" height="180" rx="6" ry="6" fill="none" stroke="currentColor" strokeWidth="8" />
      <rect x="116" y="0" width="16" height="180" rx="6" ry="6" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="116" y="0" width="16" height="180" rx="6" ry="6" fill="none" stroke="currentColor" strokeWidth="8" />
    </svg>
  );
}

// ── Rotating globe ────────────────────────────────────────────
function RotatingGlobe() {
  const groupRef = useRef<THREE.Group>(null!);

  const positions = useMemo(
    () => gridPoints(SPONSORS.length, SPHERE_RADIUS),
    []
  );

  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={groupRef}>
      <ThickWireframeSphere radius={SPHERE_RADIUS} />
      {SPONSORS.map((s, i) => (
        <SponsorPatch
          key={s.name}
          url={s.logo || ""}
          href={s.url || "#"}
          position={positions[i]}
        />
      ))}
    </group>
  );
}

// ── Section export ────────────────────────────────────────────
export default function Sponsors() {
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useGsapReact(() => {
    const section = sectionRef.current;
    const overlay = overlayRef.current;
    if (!section || !overlay) return;

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

    const navbarTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top 10%",
      end: "bottom 10%",
      onEnter: () => dispatchNavbarThemeOverride("light"),
      onEnterBack: () => dispatchNavbarThemeOverride("light"),
      onLeave: () => dispatchNavbarThemeOverride(null),
      onLeaveBack: () => dispatchNavbarThemeOverride(null),
    });

    return () => navbarTrigger.kill();
  });

  return (
    <div className="relative bg-surface">
      <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-10 bg-background" />
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
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            sponsors@hackutd.co
          </a>
        </div>

        <div className="mt-16 h-[900px] w-full relative">
          <TowerSVG />
          <Canvas
            style={{ position: "relative", zIndex: 1 }}
            camera={{ position: [0, 1, 12], fov: 42 }}
          >
            <ambientLight intensity={0.6} />
            <RotatingGlobe />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.8}
              autoRotate={false}
            />
          </Canvas>
        </div>
      </section>
    </div>
  );
}