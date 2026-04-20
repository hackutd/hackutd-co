"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SPONSORS } from "../../data/sponsors";

// ── Fibonacci sphere distribution ────────────────────────────
function fibonacciPoint(i: number, total: number, radius: number) {
  // Limit the Y-axis range to a "belt" around the equator. 
  // This keeps logos from landing near the poles where perspective distortion makes them hard to read.
  const verticalLimit = 0.2; 
  const h = verticalLimit - (i + 0.5) * (2 * verticalLimit) / total;
  const phi = Math.acos(h);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Quaternion that rotates +Z to point outward from sphere center ──
function outwardQuaternion(position: THREE.Vector3): THREE.Quaternion {
  const quaternion = new THREE.Quaternion();
  // The plane's default normal is +Z. We want it to point away from origin.
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    position.clone().normalize()
  );
  return quaternion;
}

// ── Single sponsor plane ──────────────────────────────────────
function SponsorLogo({
  url,
  position,
  href,
}: {
  url: string;
  position: THREE.Vector3;
  href: string;
}) {
  const texture = useTexture(url);
  const quaternion = useMemo(() => outwardQuaternion(position), [position]);

  // Get aspect ratio (texture.image can be HTMLImageElement, HTMLCanvasElement, etc.)
  const aspect = (texture.image as HTMLImageElement)?.width
    ? (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height
    : 1;

  const height = 0.22;
  const width = height * aspect;

  return (
    <mesh
      position={position}
      quaternion={quaternion}
      onClick={() => window.open(href, "_blank")}
      onPointerEnter={() => { document.body.style.cursor = "pointer"; }}
      onPointerLeave={() => { document.body.style.cursor = "auto"; }}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.9}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── The geodesic sphere shell ─────────────────────────────────
function GeodesicSphere({ radius }: { radius: number }) {
  return (
    <mesh>
      <icosahedronGeometry args={[radius, 4]} />

      {/* Invisible solid sphere (handles occlusion) */}
      <mesh>
        <sphereGeometry args={[radius-0.05, 32, 32]} />
        <meshBasicMaterial
          color= "#1a1a1a" // doesn't matter much
          toneMapped={false}
          opacity={0}     // invisible
          depthWrite={true}
        />
      </mesh>

      <meshBasicMaterial
        color="#ffffff"
        wireframe
        transparent
        opacity={0.07}
      />
    </mesh>
  );
}

// ── 2D Reunion Tower SVG overlay (rendered behind the canvas) ──
function TowerSVG() {
  return (
    <svg
      viewBox="0 0 200 300"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        bottom: "-200px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "38%",
        height: "65%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Outer left line */}
      <line x1="10" y1="0" x2="10" y2="300" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      {/* Outer right line */}
      <line x1="190" y1="0" x2="190" y2="300" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />

      {/* Inner left skinny rectangle */}
      <rect x="68" y="0" width="16" height="180" rx="6" ry="6" fill="none" stroke="currentColor" strokeWidth="6" />
      {/* Inner right skinny rectangle */}
      <rect x="116" y="0" width="16" height="180" rx="6" ry="6" fill="none" stroke="currentColor" strokeWidth="6" />
    </svg>
  );
}

// ── Rotating group (sphere + logos) ──────────────────────────
const SPHERE_RADIUS = 1.8;

function RotatingGlobe() {
  const groupRef = useRef<THREE.Group>(null!);

  const positions = useMemo(
    () => SPONSORS.map((_, i) => fibonacciPoint(i, SPONSORS.length, SPHERE_RADIUS)),
    []
  );

  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.25;
  });

  return (
    <group ref={groupRef}>
      <GeodesicSphere radius={SPHERE_RADIUS} />
      {SPONSORS.map((s, i) => (
        <SponsorLogo
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
  return (
    <section id="sponsors" className="px-8 py-32">
      <div className="flex items-end justify-between">
        <h2 className="text-4xl font-bold md:text-5xl">Our Sponsors</h2>
        <a
          href="mailto:sponsors@hackutd.co"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          sponsors@hackutd.co
        </a>
      </div>

      <div className="mt-16 h-[600px] w-full relative">
        <TowerSVG />
        <Canvas style={{ position: "relative", zIndex: 1 }} camera={{ position: [0, 1, 6], fov: 45 }}>
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
  );
}