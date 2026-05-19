"use client";

import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/reunion-tower-simple.glb";

// Cylinder radius: MainRoom is ~37.7 after normalization. Place logos just outside.
const LOGO_RADIUS = 38.0;
const LOGO_OFFSET = 0.03; // Tiny offset to prevent z-fighting

// ── Blue glass band vertical constraints ───────────────────
// MainRoom cylinder normalized: y=[89.57, 154.80], height=65.23
const CYLINDER_MIN_Y = 89.57;
const CYLINDER_MAX_Y = 154.80;
const CYLINDER_HEIGHT = CYLINDER_MAX_Y - CYLINDER_MIN_Y; // ~65.23
// Blue band is the middle portion — gray structural rings at top/bottom
const BAND_TOP_MARGIN = CYLINDER_HEIGHT * 0.20;   // Top 20% is gray ledge
const BAND_BOTTOM_MARGIN = CYLINDER_HEIGHT * 0.15; // Bottom 15% is gray ring
const BAND_MIN_Y = CYLINDER_MIN_Y + BAND_BOTTOM_MARGIN;  // ~99.4
const BAND_MAX_Y = CYLINDER_MAX_Y - BAND_TOP_MARGIN;     // ~141.8

// ── Types ───────────────────────────────────────────────────
interface SponsorPlacement {
  theta: number;
  y: number;
}

interface SponsorData {
  name: string;
  logo?: string;
}

interface TowerSceneProps {
  scrollProgressRef: React.RefObject<number>;
  dragOffsetRef: React.RefObject<number>;
  sponsors: SponsorData[];
}

// ── Seeded PRNG for reproducible layout ─────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ── Poisson-disk placement on cylinder surface ──────────────
// logoH passed in so we can constrain logo EDGES (not just centers) within band
function generatePlacements(count: number, logoH: number): SponsorPlacement[] {
  const rand = seededRandom(12345);
  // Logo edges must stay inside band — shrink valid center range by half logo height
  const yMin = BAND_MIN_Y + logoH / 2;
  const yMax = BAND_MAX_Y - logoH / 2;

  if (yMax <= yMin) {
    console.warn("[Sponsors] Band too small for logos of height " + logoH);
    return [];
  }

  let minArcSpacing = 14;
  let minYSpacing = 5;
  const placements: SponsorPlacement[] = [];

  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      const theta = rand() * Math.PI * 2;
      const y = yMin + rand() * (yMax - yMin);

      const tooClose = placements.some((p) => {
        let dTheta = Math.abs(p.theta - theta);
        if (dTheta > Math.PI) dTheta = Math.PI * 2 - dTheta;
        const arcDist = dTheta * LOGO_RADIUS;
        const dY = Math.abs(p.y - y);
        return arcDist < minArcSpacing && dY < minYSpacing;
      });

      if (!tooClose) {
        placements.push({ theta, y });
        placed = true;
        break;
      }
    }

    if (!placed) {
      minArcSpacing *= 0.9;
      minYSpacing *= 0.9;
      i--;
      if (minArcSpacing < 2) {
        console.warn(`[Sponsors] Could not place all sponsors. Placed ${placements.length}/${count}`);
        break;
      }
    }
  }
  return placements;
}

// ── Near-white discard material ─────────────────────────────
// Discards near-white pixels so logos with white backgrounds render transparent.
function useWhiteDiscardMaterial(texture: THREE.Texture) {
  return useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
      opacity: 1,
    });

    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
        #include <map_fragment>
        {
          float brightness = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
          if (brightness > 0.95 && diffuseColor.a > 0.5) {
            discard;
          }
        }
        `
      );
    };

    return mat;
  }, [texture]);
}

// ── Single sponsor logo ─────────────────────────────────────
function SponsorLogo({
  placement,
  logoUrl,
}: {
  placement: SponsorPlacement;
  logoUrl: string;
}) {
  const texture = useLoader(THREE.TextureLoader, logoUrl);
  const material = useWhiteDiscardMaterial(texture);

  const aspect = texture.image ? texture.image.width / texture.image.height : 1;
  // 20% size increase: 3.96 * 1.2 = 4.752
  const logoHeight = 4.752;
  const logoWidth = logoHeight * aspect;

  // Build curved arc at exact cylinder radius + tiny offset
  const arcGeo = useMemo(() => {
    const r = LOGO_RADIUS + LOGO_OFFSET;
    const thetaLen = logoWidth / r;
    const thetaStart = -thetaLen / 2;

    const geo = new THREE.CylinderGeometry(
      r, r, logoHeight, 12, 1, true, thetaStart, thetaLen
    );

    // Flip normals outward
    const normals = geo.attributes.normal;
    for (let i = 0; i < normals.count; i++) {
      normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
    }
    normals.needsUpdate = true;
    return geo;
  }, [logoWidth, logoHeight]);

  // CylinderGeometry arc at thetaStart=0 faces +X direction in Three.js.
  // Rotate around Y to place at the correct theta.
  const rotY = placement.theta + Math.PI / 2;

  return (
    <group position={[0, placement.y, 0]} rotation={[0, rotY, 0]}>
      <mesh geometry={arcGeo} material={material} renderOrder={2} />
    </group>
  );
}

// ── Tower model ─────────────────────────────────────────────
function TowerModel({ scrollProgressRef, dragOffsetRef, sponsors }: TowerSceneProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const globeRef = useRef<THREE.Object3D | null>(null);
  const sponsorGroupRef = useRef<THREE.Group>(null);
  const smoothRotation = useRef(0);
  const autoAngle = useRef(0);

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // Normalize model
  const { normScale, centerY } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = 350 / size.y;
    return { normScale: s, centerY: center.y * s };
  }, [clonedScene]);

  // Find PlatonicSphere
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.name === "PlatonicSphere") {
        globeRef.current = child;
      }
    });
  }, [clonedScene]);

  const validSponsors = useMemo(() => sponsors.filter((s) => s.logo), [sponsors]);

  // Random placement with fixed seed, constrained to blue glass band
  const logoHeight = 4.752;
  const placements = useMemo(() => {
    return generatePlacements(validSponsors.length, logoHeight);
  }, [validSponsors.length]);

  useFrame((_, delta) => {
    if (!globeRef.current) return;

    autoAngle.current += delta * 0.3;
    const scrollAngle = (scrollProgressRef.current ?? 0) * Math.PI * 2;
    const dragAngle = (dragOffsetRef.current ?? 0) * 0.01;
    const target = autoAngle.current + scrollAngle + dragAngle;

    smoothRotation.current += (target - smoothRotation.current) * 0.08;

    if (sponsorGroupRef.current) {
      sponsorGroupRef.current.rotation.y = smoothRotation.current;
    }
    globeRef.current.rotation.y = -smoothRotation.current * 0.5;
  });

  return (
    <group dispose={null}>
      <primitive
        object={clonedScene}
        scale={[normScale, normScale, normScale]}
        position={[0, -centerY, 0]}
      />
      {/* Issue 1 fix: no X offset — logos centered on cylinder axis */}
      <group ref={sponsorGroupRef}>
        {placements.map((placement, i) => {
          const sponsor = validSponsors[i % validSponsors.length];
          if (!sponsor?.logo) return null;
          return (
            <Suspense key={`sponsor-${i}`} fallback={null}>
              <SponsorLogo placement={placement} logoUrl={sponsor.logo} />
            </Suspense>
          );
        })}
      </group>
    </group>
  );
}

// ── Globe bounding sphere for camera fit ────────────────────
const GLOBE_CENTER_Y = 125;
const GLOBE_BOUNDING_R = 38;

// ── Camera rig ──────────────────────────────────────────────
function CameraRig({ scrollProgressRef }: { scrollProgressRef: React.RefObject<number> }) {
  const { camera, size } = useThree();
  const smoothZ = useRef(0);
  const smoothY = useRef(0);
  const smoothLookY = useRef(0);
  const initialized = useRef(false);

  useFrame(() => {
    const p = scrollProgressRef.current ?? 0;
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const vFov = THREE.MathUtils.degToRad(cam.fov);

    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const effectiveFov = Math.min(vFov, hFov);

    const fitOffset = 1.15;
    const baseZ = (GLOBE_BOUNDING_R / Math.sin(effectiveFov / 2)) * fitOffset;

    cam.near = baseZ / 100;
    cam.far = (baseZ + 240) * 3;
    cam.updateProjectionMatrix();

    const targetZ = baseZ + p * 240;
    const targetY = GLOBE_CENTER_Y + 47 - p * 124;
    const targetLookY = GLOBE_CENTER_Y + 5 - p * 114;

    if (!initialized.current) {
      smoothZ.current = targetZ;
      smoothY.current = targetY;
      smoothLookY.current = targetLookY;
      initialized.current = true;
    } else {
      smoothZ.current += (targetZ - smoothZ.current) * 0.06;
      smoothY.current += (targetY - smoothY.current) * 0.06;
      smoothLookY.current += (targetLookY - smoothLookY.current) * 0.06;
    }

    camera.position.set(0, smoothY.current, smoothZ.current);
    camera.lookAt(0, smoothLookY.current, 0);
  });

  return null;
}

useGLTF.preload(MODEL_PATH);

// ── Exported component ──────────────────────────────────────
interface ReunionTowerProps {
  scrollProgressRef: React.RefObject<number>;
  dragOffsetRef: React.RefObject<number>;
  sponsors: SponsorData[];
}

export default function ReunionTower({
  scrollProgressRef,
  dragOffsetRef,
  sponsors,
}: ReunionTowerProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 172, 120], fov: 55, near: 0.1, far: 2000 }}
      style={{ background: "transparent", touchAction: "pan-y" }}
      frameloop="always"
    >
      <ambientLight intensity={1.4} />
      <directionalLight position={[10, 20, 10]} intensity={2.5} />
      <directionalLight position={[-6, 12, -8]} intensity={0.6} />
      <hemisphereLight color="#f2f2f2" groundColor="#a3a3a3" intensity={0.8} />

      <Suspense fallback={null}>
        <TowerModel
          scrollProgressRef={scrollProgressRef}
          dragOffsetRef={dragOffsetRef}
          sponsors={sponsors}
        />
        <Environment preset="city" />
      </Suspense>

      <CameraRig scrollProgressRef={scrollProgressRef} />
    </Canvas>
  );
}
