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

// ── Extract triangle faces from globe region of model ───────
function extractGlobeTriangles(
  scene: THREE.Object3D,
  scale: number,
  centerY: number
): TriFace[] {
  const faces: TriFace[] = [];
  const box = new THREE.Box3().setFromObject(scene);
  const modelHeight = (box.max.y - box.min.y) * scale;
  // Globe is top ~30% of the tower
  const globeThresholdY = (box.min.y + (box.max.y - box.min.y) * 0.65) * scale - centerY;

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const geo = child.geometry;
    if (!geo || !geo.attributes.position) return;

    const pos = geo.attributes.position;
    const index = geo.index;
    const worldMatrix = child.matrixWorld.clone();

    const triCount = index ? index.count / 3 : pos.count / 3;
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();

    for (let i = 0; i < triCount; i++) {
      if (index) {
        vA.fromBufferAttribute(pos, index.getX(i * 3));
        vB.fromBufferAttribute(pos, index.getX(i * 3 + 1));
        vC.fromBufferAttribute(pos, index.getX(i * 3 + 2));
      } else {
        vA.fromBufferAttribute(pos, i * 3);
        vB.fromBufferAttribute(pos, i * 3 + 1);
        vC.fromBufferAttribute(pos, i * 3 + 2);
      }

      // Transform to world space then scale
      vA.applyMatrix4(worldMatrix).multiplyScalar(scale);
      vB.applyMatrix4(worldMatrix).multiplyScalar(scale);
      vC.applyMatrix4(worldMatrix).multiplyScalar(scale);

      // Offset Y to match model positioning
      vA.y -= centerY;
      vB.y -= centerY;
      vC.y -= centerY;

      const center = new THREE.Vector3()
        .addVectors(vA, vB)
        .add(vC)
        .divideScalar(3);

      // Only faces in globe region
      if (center.y < globeThresholdY) continue;

      // Compute face normal
      const edge1 = new THREE.Vector3().subVectors(vB, vA);
      const edge2 = new THREE.Vector3().subVectors(vC, vA);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      // Face size (area)
      const area = new THREE.Vector3().crossVectors(edge1, edge2).length() * 0.5;

      // Skip tiny degenerate triangles
      if (area < 0.01) continue;

      faces.push({ center, normal, size: Math.sqrt(area) * 0.6 });
    }
  });

  return faces;
}

// ── Select well-spaced triangles for sponsor placement ──────
function selectSponsorFaces(faces: TriFace[], count: number): TriFace[] {
  if (faces.length === 0) return [];

  // Sort by size descending — prefer larger triangles
  const sorted = [...faces].sort((a, b) => b.size - a.size);

  const selected: TriFace[] = [];
  const minDist = 1.2; // minimum distance between selected faces

  for (const face of sorted) {
    if (selected.length >= count) break;

    // Check distance to already selected faces
    const tooClose = selected.some(
      (s) => s.center.distanceTo(face.center) < minDist
    );
    if (tooClose) continue;

    selected.push(face);
  }

  return selected;
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
  const meshRef = useRef<THREE.Mesh>(null);

  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    // Orient plane to face outward along the triangle normal
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
    return q;
  }, [face.normal]);

  return (
    <mesh
      ref={meshRef}
      position={[face.center.x, face.center.y, face.center.z]}
      quaternion={quaternion}
    >
      <planeGeometry args={[face.size * 1.4, face.size * 1.4]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        opacity={0.92}
      />
    </mesh>
  );
}

// ── Tower model with sponsor logos in globe triangles ────────
function TowerModel({ scrollProgressRef, dragOffsetRef, sponsors }: TowerSceneProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const groupRef = useRef<THREE.Group>(null);
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
    const s = 200 / size.y;
    return { normScale: s, centerY: center.y * s };
  }, [clonedScene]);

  // Extract globe triangle faces for sponsor placement
  const sponsorFaces = useMemo(() => {
    // Update world matrices before scanning
    clonedScene.updateMatrixWorld(true);
    const allFaces = extractGlobeTriangles(clonedScene, normScale, centerY);
    return selectSponsorFaces(allFaces, sponsors.length);
  }, [clonedScene, normScale, centerY, sponsors.length]);

  // Filter sponsors to ones with valid logos
  const validSponsors = useMemo(
    () => sponsors.filter((s) => s.logo),
    [sponsors]
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    autoAngle.current += delta * 0.3;
    const scrollAngle = (scrollProgressRef.current ?? 0) * Math.PI * 2;
    const dragAngle = (dragOffsetRef.current ?? 0) * 0.01;
    const target = autoAngle.current + scrollAngle + dragAngle;

    smoothRotation.current += (target - smoothRotation.current) * 0.08;
    groupRef.current.rotation.y = smoothRotation.current;
  });

  return (
    <group ref={groupRef} dispose={null}>
      <primitive
        object={clonedScene}
        scale={[normScale, normScale, normScale]}
        position={[0, -centerY, 0]}
      />
      {/* Sponsor logos placed in globe triangle gaps */}
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
  );
}

// ── Camera rig ──────────────────────────────────────────────
// p=0 → tight on globe (fills viewport, no top clipping)
// p=1 → pulled back to see full tower
function CameraRig({ scrollProgressRef }: { scrollProgressRef: React.RefObject<number> }) {
  const { camera } = useThree();
  const smoothZ = useRef(20);
  const smoothY = useRef(97);
  const smoothLookY = useRef(94);

  useFrame(() => {
    const p = scrollProgressRef.current ?? 0;

    // p=0: lookAt Y=94, visible top = 94+10.4 = 104.4, globe top Y=100 → 4.4 units headroom
    // p=1: pulled back to see full tower
    const targetZ = 20 + p * 170;
    const targetY = 97 - p * 67;
    const targetLookY = 94 - p * 84;

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
      camera={{ position: [0, 97, 20], fov: 55, near: 0.1, far: 1000 }}
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
