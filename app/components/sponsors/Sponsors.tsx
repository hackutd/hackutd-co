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

// ── Fibonacci sphere distribution ────────────────────────────
function fibonacciPoint(i: number, total: number, radius: number) {
  // Wider vertical belt so logos spread across more of the sphere
  const verticalLimit = 0.55;
  const h = verticalLimit - (i + 0.5) * (2 * verticalLimit) / total;
  const phi = Math.acos(h);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Quaternion: logo lies FLAT tangent to the sphere surface ─
// A THREE.PlaneGeometry lives in the XY plane with its normal along +Z.
// We want the plane to be tangent to the sphere, meaning its normal should
// point RADIALLY outward. So we simply rotate +Z → outward normal.
// To keep logos upright, we compute a stable "up" from world-up projected
// onto the tangent plane, then build the full basis.
function tangentQuaternion(position: THREE.Vector3): THREE.Quaternion {
  const normal = position.clone().normalize(); // radially outward = desired plane normal
  const worldUp = new THREE.Vector3(0, 1, 0);

  // Project worldUp onto the tangent plane (remove component along normal)
  const up = worldUp.clone().sub(normal.clone().multiplyScalar(worldUp.dot(normal))).normalize();

  // Fallback if near pole (worldUp ≈ normal)
  if (up.lengthSq() < 0.001) {
    up.set(1, 0, 0).sub(normal.clone().multiplyScalar(normal.x)).normalize();
  }

  const right = new THREE.Vector3().crossVectors(up, normal).normalize(); // complete the basis

  // Columns: right=X, up=Y, normal=Z  → plane's +Z now points radially outward
  const m = new THREE.Matrix4().makeBasis(right, up, normal);
  return new THREE.Quaternion().setFromRotationMatrix(m);
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
  const quaternion = useMemo(() => tangentQuaternion(position), [position]);

  const aspect = (texture.image as HTMLImageElement)?.width
    ? (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height
    : 1;

  // Slightly larger logos to be more readable
  const height = 0.28;
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
        opacity={0.95}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Thick wireframe sphere using EdgesGeometry + Line ─────────
// drei's <Line> component uses three/addons LineSegments2 which supports lineWidth > 1
function ThickWireframeSphere({ radius }: { radius: number }) {
  const edgePoints = useMemo(() => {
    // Build icosahedron edges explicitly so we can pass them to <Line>
    const geo = new THREE.IcosahedronGeometry(radius, 4);
    const edgeGeo = new THREE.EdgesGeometry(geo);
    const pos = edgeGeo.attributes.position;

    // EdgesGeometry stores pairs of vertices (each edge = 2 consecutive vertices)
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
      {/* Invisible solid sphere — occludes logos on the back */}
      <mesh>
        <sphereGeometry args={[radius - 0.04, 32, 32]} />
        <meshBasicMaterial
          color="#f2f2f2"
          toneMapped={false}
          opacity={1}
          depthWrite={true}
        />
      </mesh>

      {/* Thick wireframe edges */}
      {edgePoints.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#000000"
          lineWidth={5}
        />
      ))}
    </>
  );
}

// ── 2D Reunion Tower SVG overlay ──────────────────────────────
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

// ── Rotating group (sphere + logos) ──────────────────────────
const SPHERE_RADIUS = 2.4; // Bigger globe

function RotatingGlobe() {
  const groupRef = useRef<THREE.Group>(null!);

  const positions = useMemo(
    () => SPONSORS.map((_, i) => fibonacciPoint(i, SPONSORS.length, SPHERE_RADIUS)),
    []
  );

  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.1;
  });

  return (
    <group ref={groupRef}>
      <ThickWireframeSphere radius={SPHERE_RADIUS} />
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

      <section ref={sectionRef} id="sponsors" className="relative z-20 px-8 py-32 text-surface-foreground" data-navbar-theme="light">
        <div className="flex items-end justify-between">
          <h2 className="text-4xl font-bold md:text-5xl">Our Sponsors</h2>
          <a
            href="mailto:sponsors@hackutd.co"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            sponsors@hackutd.co
          </a>
        </div>

        <div className="mt-16 h-[700px] w-full relative">
          <TowerSVG />
          <Canvas
            style={{ position: "relative", zIndex: 1 }}
            camera={{ position: [0, 1, 8], fov: 42 }}
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