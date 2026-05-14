"use client";

import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/reunion-tower.glb";

// ── Types ───────────────────────────────────────────────────
interface TriFace {
  center: THREE.Vector3;
  normal: THREE.Vector3;
  size: number;
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

// ── Procedurally generate band positions around the globe ──
function generateBandPositions(sponsorsCount: number): TriFace[] {
  const bands = 4;
  const globeCenterY = 125; // Centered near the top of the 350-unit tall model
  const radius = 42; // Constant radius for cylindrical layout
  const faces: TriFace[] = [];
  
  const sponsorsPerBand = Math.ceil(sponsorsCount / bands);
  const yOffsets = [-12, -4, 4, 12]; // Vertical distribution

  for (let b = 0; b < bands; b++) {
    const y = globeCenterY + yOffsets[b];
    const r = radius;
    
    for (let i = 0; i < sponsorsPerBand; i++) {
      if (faces.length >= sponsorsCount) break;
      
      const angle = (i / sponsorsPerBand) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      const center = new THREE.Vector3(x, y, z);
      const normal = new THREE.Vector3(x, 0, z).normalize();
      
      // Use a consistent size for all procedural "faces"
      faces.push({ center, normal, size: 22 });
    }
  }
  return faces;
}

// ── Single sponsor logo plane ───────────────────────────────
function SponsorPlane({
  face,
  logoUrl,
}: {
  face: TriFace;
  logoUrl: string;
}) {
  const texture = useLoader(THREE.TextureLoader, logoUrl);
  const groupRef = useRef<THREE.Group>(null);

  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    // Orient plane to face outward along the triangle normal
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
    return q;
  }, [face.normal]);

  const aspect = texture.image ? texture.image.width / texture.image.height : 1;
  const logoWidth = face.size * 0.15 * aspect;
  const logoHeight = face.size * 0.15;

  const bgWidth = face.size * 0.18 * aspect;
  const bgHeight = face.size * 0.18;

  return (
    <group
      ref={groupRef}
      position={[face.center.x, face.center.y, face.center.z]}
      quaternion={quaternion}
    >
      {/* White background rectangle */}
      <mesh position={[0, 0, 0.05]} renderOrder={1}>
        <planeGeometry args={[bgWidth, bgHeight]} />
        <meshBasicMaterial color="white" transparent opacity={0.9} />
      </mesh>
      {/* Logo plane */}
      <mesh position={[0, 0, 0.11]} renderOrder={2}>
        <planeGeometry args={[logoWidth, logoHeight]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        opacity={0.92}
      />
      </mesh>
    </group>
  );
}

// ── Tower model with sponsor logos in globe triangles ────────
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

  // Find the PlatonicSphere node (the actual globe ball) to rotate independently
  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child.name === "PlatonicSphere") {
        globeRef.current = child;
      }
    });
  }, [clonedScene]);

  // Extract globe triangle faces for sponsor placement
  const sponsorFaces = useMemo(() => {
    return generateBandPositions(sponsors.length);
  }, [sponsors.length]);

  // Filter sponsors to ones with valid logos
  const validSponsors = useMemo(
    () => sponsors.filter((s) => s.logo),
    [sponsors]
  );

  useFrame((_, delta) => {
    if (!globeRef.current) return;

    autoAngle.current += delta * 0.3;
    const scrollAngle = (scrollProgressRef.current ?? 0) * Math.PI * 2;
    const dragAngle = (dragOffsetRef.current ?? 0) * 0.01;
    const target = autoAngle.current + scrollAngle + dragAngle;

    smoothRotation.current += (target - smoothRotation.current) * 0.08;

    // 1. Inside part (sponsors) rotates in the original direction
    if (sponsorGroupRef.current) {
      sponsorGroupRef.current.rotation.y = smoothRotation.current;
    }
    // 2. Globe rotates in the opposite direction at half speed
    globeRef.current.rotation.y = -smoothRotation.current * 0.5;
  });

  return (
    <group dispose={null}>
      <primitive
        object={clonedScene}
        scale={[normScale, normScale, normScale]}
        position={[0, -centerY, 0]}
      />
      {/* Sponsor group handles the primary rotation */}
      <group ref={sponsorGroupRef} position={[0, 0, 0]}>
        {sponsorFaces.map((face, i) => {
          const sponsor = validSponsors[i % validSponsors.length];
          if (!sponsor?.logo) return null;
          return (
            <Suspense key={`sponsor-${i}`} fallback={null}>
              <SponsorPlane face={face} logoUrl={sponsor.logo} />
            </Suspense>
          );
        })}
      </group>
    </group>
  );
}

// ── Camera rig ──────────────────────────────────────────────
// p=0 → tight on globe (fills viewport, no top clipping)
// p=1 → pulled back to see full tower
function CameraRig({ scrollProgressRef }: { scrollProgressRef: React.RefObject<number> }) {
  const { camera } = useThree();
  const smoothZ = useRef(20);
  const smoothY = useRef(155);
  const smoothLookY = useRef(150);

  useFrame(() => {
    const p = scrollProgressRef.current ?? 0;

    // Values recalculated for a base scale of 320 (1.6x the original 200)
    // targetZ at p=1 moves from 190 to 304 to maintain vertical framing while increasing width
    const targetZ = 20 + p * 284;
    const targetY = 155 - p * 107;
    const targetLookY = 150 - p * 134;

    smoothZ.current += (targetZ - smoothZ.current) * 0.06;
    smoothY.current += (targetY - smoothY.current) * 0.06;
    smoothLookY.current += (targetLookY - smoothLookY.current) * 0.06;

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
      camera={{ position: [0, 155, 20], fov: 55, near: 0.1, far: 2000 }}
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