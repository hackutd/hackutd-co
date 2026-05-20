"use client";

import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/reunion-tower-simple.glb";

// ── Scene scale — applied to root group; camera constants must match ──
const SCENE_SCALE = 1.6;

// Cylinder radius: MainRoom is ~37.7 after normalization. Place logos just outside.
const LOGO_RADIUS = 38.0;
const LOGO_OFFSET = 0.03; // Tiny offset to prevent z-fighting

// ── Blue glass band vertical constraints ───────────────────
// MainRoom cylinder normalized: y=[89.57, 154.80], height=65.23
const CYLINDER_MIN_Y = 89.57;
const CYLINDER_MAX_Y = 154.80;
const CYLINDER_HEIGHT = CYLINDER_MAX_Y - CYLINDER_MIN_Y; // ~65.23
// Blue band is the middle portion — gray structural rings at top/bottom
const BAND_TOP_MARGIN = CYLINDER_HEIGHT * 0.22;   // Top 15% is gray ledge
const BAND_BOTTOM_MARGIN = CYLINDER_HEIGHT * 0.18; // Bottom 10% is gray ring
const BAND_MIN_Y = CYLINDER_MIN_Y + BAND_BOTTOM_MARGIN;  // ~99.4
const BAND_MAX_Y = CYLINDER_MAX_Y - BAND_TOP_MARGIN;     // ~141.8

// ── Types ───────────────────────────────────────────────────
interface SponsorPlacement {
  theta: number;
  y: number;
  sponsorIndex: number;
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

// ── Hybrid stratified-grid + AABB placement ────────────────
// Step 1: Divide cylinder band into a grid for even spatial coverage
// Step 2: Assign logos to shuffled cells (largest first get priority)
// Step 3: Jitter within cell, AABB-check against all placed logos
// Result: even distribution + zero overlaps + natural randomness
const LOGO_HEIGHT = 3.8;
const LOGO_PADDING = 2.2; // Minimum gap between any two logo edges (world units)

interface LogoFootprint {
  sponsorIndex: number;
  halfWidth: number;
  halfHeight: number;
  angularHalfWidth: number;
  area: number;
}

interface PlacedLogo extends LogoFootprint {
  theta: number;
  y: number;
}

function generatePlacements(aspects: number[]): SponsorPlacement[] {
  const N = aspects.length;
  if (N === 0) return [];

  const rand = seededRandom(54321);
  const bandHeight = BAND_MAX_Y - BAND_MIN_Y;

  if (bandHeight <= LOGO_HEIGHT) {
    console.warn("[Sponsors] Band too small for logos");
    return [];
  }

  const circumference = 2 * Math.PI * LOGO_RADIUS;

  // Build footprints with real aspect ratios + padding
  const footprints: LogoFootprint[] = aspects.map((aspect, i) => {
    const w = LOGO_HEIGHT * aspect;
    const halfW = w / 2 + LOGO_PADDING / 2;
    const halfH = LOGO_HEIGHT / 2 + LOGO_PADDING / 2;
    return {
      sponsorIndex: i,
      halfWidth: halfW,
      halfHeight: halfH,
      angularHalfWidth: halfW / LOGO_RADIUS,
      area: halfW * halfH,
    };
  });

  // Grid dimensions — roughly square cells in cylinder-surface space
  const surfaceAspect = circumference / bandHeight;
  const rows = Math.max(2, Math.round(Math.sqrt(N / surfaceAspect)));
  const cols = Math.ceil(N / rows);
  const cellTheta = (Math.PI * 2) / cols;
  const cellH = bandHeight / rows;

  // Build & shuffle cells
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c });
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  // Sort footprints largest-first so wide logos get first pick of cells
  const sorted = [...footprints].sort((a, b) => b.area - a.area);

  // Assign cells: largest logos first, shuffled cells
  const assignments: { fp: LogoFootprint; cell: { row: number; col: number } }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    assignments.push({ fp: sorted[i], cell: cells[i % cells.length] });
  }

  // AABB overlap check (theta wraps)
  function overlaps(a: PlacedLogo, b: PlacedLogo): boolean {
    let dTheta = Math.abs(a.theta - b.theta);
    if (dTheta > Math.PI) dTheta = 2 * Math.PI - dTheta;
    return (
      dTheta < a.angularHalfWidth + b.angularHalfWidth &&
      Math.abs(a.y - b.y) < a.halfHeight + b.halfHeight
    );
  }

  const placed: PlacedLogo[] = [];
  const dropped: number[] = [];

  for (const { fp, cell } of assignments) {
    const cellCenterTheta = cell.col * cellTheta + cellTheta / 2;
    const cellCenterY = BAND_MIN_Y + cell.row * cellH + cellH / 2;

    // Try jittered positions within cell, AABB-checked
    let success = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      // Moderate jitter for even look; shrink on retries for guaranteed fit
      const jitterScale = attempt < 30 ? 0.35 : attempt < 50 ? 0.2 : 0.05;
      const theta = cellCenterTheta + (rand() - 0.5) * cellTheta * jitterScale;
      let y = cellCenterY + (rand() - 0.5) * cellH * jitterScale;

      // Clamp Y so logo edges stay in band
      y = Math.max(BAND_MIN_Y + fp.halfHeight, Math.min(BAND_MAX_Y - fp.halfHeight, y));

      const candidate: PlacedLogo = { ...fp, theta: ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), y };

      if (!placed.some((p) => overlaps(candidate, p))) {
        placed.push(candidate);
        success = true;
        break;
      }
    }

    // Fallback: try anywhere on cylinder (pure rejection)
    if (!success) {
      for (let attempt = 0; attempt < 200; attempt++) {
        const theta = rand() * Math.PI * 2;
        const y = BAND_MIN_Y + fp.halfHeight + rand() * (bandHeight - 2 * fp.halfHeight);
        const candidate: PlacedLogo = { ...fp, theta, y };
        if (!placed.some((p) => overlaps(candidate, p))) {
          placed.push(candidate);
          success = true;
          break;
        }
      }
    }

    if (!success) dropped.push(fp.sponsorIndex);
  }

  // Verification
  if (typeof window !== "undefined") {
    let overlapCount = 0;
    let bandViolations = 0;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        if (overlaps(placed[i], placed[j])) overlapCount++;
      }
      if (placed[i].y - placed[i].halfHeight < BAND_MIN_Y ||
          placed[i].y + placed[i].halfHeight > BAND_MAX_Y) {
        bandViolations++;
      }
    }
    console.log(
      `[Sponsors] Hybrid grid+AABB: ${rows}×${cols} grid | ` +
      `${placed.length}/${N} placed | Dropped: ${dropped.length} | ` +
      `Overlaps: ${overlapCount} | Band violations: ${bandViolations}`
    );
    if (dropped.length > 0) {
      console.warn("[Sponsors] Dropped indices:", dropped);
    }
  }

  return placed.map((p) => ({
    theta: p.theta,
    y: p.y,
    sponsorIndex: p.sponsorIndex,
  }));
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
    

        // Apply brightness reduction and saturation boost to colored logos
        diffuseColor.rgb *= 0.55; // TUNE THIS PLS!!!!
        float luma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        diffuseColor.rgb = mix(vec3(luma), diffuseColor.rgb, 1.5);
        `
      );
    };

    return mat;
  }, [texture]);
}

// ── SVG dimension fix ───────────────────────────────────────
// Three.js TextureLoader rasterizes SVGs via <img>. If the SVG has no explicit
// width/height attributes (only viewBox), the browser produces a 0×0 bitmap,
// causing "texSubImage2D: bad image data" / "Texture is immutable" WebGL errors.
// This hook fetches the raw SVG text, injects concrete pixel dimensions derived
// from the viewBox, and returns a stable object-URL safe to pass to TextureLoader.
const SVG_RASTER_SIZE = 512; // px — enough for crisp logos on the tower

function usePatchedSvgUrl(url: string): string {
  const [patchedUrl, setPatchedUrl] = useState(url);

  useEffect(() => {
    if (!url.toLowerCase().endsWith(".svg")) return;

    let objectUrl: string | null = null;

    (async () => {
      try {
        const res = await fetch(url);
        const text = await res.text();

        // Parse the SVG to check/inject width + height
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "image/svg+xml");
        const svg = doc.querySelector("svg");
        if (!svg) return;

        const hasW = svg.hasAttribute("width");
        const hasH = svg.hasAttribute("height");
        if (hasW && hasH) return; // already fine — keep original URL

        // Derive pixel size from viewBox
        const vb = svg.getAttribute("viewBox");
        if (vb) {
          const parts = vb.trim().split(/[\s,]+/).map(Number);
          if (parts.length === 4) {
            const [, , vbW, vbH] = parts;
            const aspect = vbW / vbH;
            const [pw, ph] =
              aspect >= 1
                ? [SVG_RASTER_SIZE, Math.round(SVG_RASTER_SIZE / aspect)]
                : [Math.round(SVG_RASTER_SIZE * aspect), SVG_RASTER_SIZE];
            if (!hasW) svg.setAttribute("width", String(pw));
            if (!hasH) svg.setAttribute("height", String(ph));
          }
        } else {
          // No viewBox either — last resort fallback
          if (!hasW) svg.setAttribute("width", String(SVG_RASTER_SIZE));
          if (!hasH) svg.setAttribute("height", String(SVG_RASTER_SIZE));
        }

        const serialized = new XMLSerializer().serializeToString(doc);
        const blob = new Blob([serialized], { type: "image/svg+xml" });
        objectUrl = URL.createObjectURL(blob);
        setPatchedUrl(objectUrl);
      } catch (e) {
        console.warn("[SVG patch] Failed for", url, e);
      }
    })();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return patchedUrl;
}

// ── Single sponsor logo ─────────────────────────────────────
function SponsorLogo({
  placement,
  logoUrl,
}: {
  placement: SponsorPlacement;
  logoUrl: string;
}) {
  const safeUrl = usePatchedSvgUrl(logoUrl);
  const texture = useLoader(THREE.TextureLoader, safeUrl);
  const material = useWhiteDiscardMaterial(texture);

  const aspect = texture.image ? texture.image.width / texture.image.height : 1;
  const logoHeight = LOGO_HEIGHT;
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
  const globeMaterialsRef = useRef<THREE.Material[]>([]);
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

  // Find PlatonicSphere and apply transparency to the whole structure
  useEffect(() => {
    const mats: THREE.Material[] = [];
    clonedScene.traverse((child) => {
      if (child.name === "PlatonicSphere") {
        globeRef.current = child;

        // Apply transparency to the sphere and all its sub-meshes (bars, connectors, etc.)
        child.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.material = node.material.clone();
            node.material.transparent = true;
            node.material.opacity = 0.2; // Adjust this for overall transparency (0.0 to 1.0)
            node.material.depthWrite = false; // Prevents the sphere from blocking the logos inside
            mats.push(node.material as THREE.Material);
          }
        });
      }
    });
    globeMaterialsRef.current = mats;
  }, [clonedScene]);

  const validSponsors = useMemo(() => sponsors.filter((s) => s.logo), [sponsors]);
  const logoUrls = useMemo(() => validSponsors.map((s) => s.logo!), [validSponsors]);

  // Batch-load all textures to get real aspect ratios BEFORE placement
  const textures = useLoader(THREE.TextureLoader, logoUrls);

  // AABB collision placement using real per-logo aspect ratios
  const placements = useMemo(() => {
    const texArr = Array.isArray(textures) ? textures : [textures];
    const aspects = texArr.map((t: THREE.Texture) => {
      const img = t.image as HTMLImageElement | undefined;
      return img ? img.width / img.height : 1;
    });
    return generatePlacements(aspects);
  }, [textures]);

  useFrame((_, delta) => {
    const scroll = scrollProgressRef.current ?? 0;

    // Dynamically update globe opacity based on scroll progress (0.2 -> 1.0)
    const targetOpacity = THREE.MathUtils.lerp(0.2, 1.0, scroll);
    globeMaterialsRef.current.forEach((mat) => {
      mat.opacity = targetOpacity;
    });

    if (!globeRef.current) return;

    autoAngle.current += delta * 0.3;
    const scrollAngle = scroll * Math.PI * 2;
    const dragAngle = (dragOffsetRef.current ?? 0) * 0.01;
    const target = autoAngle.current + scrollAngle + dragAngle;

    smoothRotation.current += (target - smoothRotation.current) * 0.08;

    if (sponsorGroupRef.current) {
      sponsorGroupRef.current.rotation.y = smoothRotation.current;
    }
    globeRef.current.rotation.y = -smoothRotation.current * 0.5;
  });

  return (
    <group dispose={null} scale={SCENE_SCALE}>
      <primitive
        object={clonedScene}
        scale={[normScale, normScale, normScale]}
        position={[0, -centerY, 0]}
      />
      <group ref={sponsorGroupRef}>
        {placements.map((placement, i) => {
          const sponsor = validSponsors[placement.sponsorIndex];
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

// ── Globe bounding sphere for camera fit (world-space, includes SCENE_SCALE) ──
const GLOBE_CENTER_Y = 125 * SCENE_SCALE;   // 200
const GLOBE_BOUNDING_R = 38 * SCENE_SCALE;  // 60.8

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

    const fitOffset = 0.85;
    const baseZ = (GLOBE_BOUNDING_R / Math.sin(effectiveFov / 2)) * fitOffset;

    cam.near = baseZ / 100;
    cam.far = (baseZ + 384) * 3;   // 240 * 1.6 = 384
    cam.updateProjectionMatrix();

    const targetZ = baseZ + p * 240;                         // Reduced zoom-out travel
    const targetY = GLOBE_CENTER_Y + 24 - p * 147.2;       // Starts lower (15*1.6), ends same (-77*1.6)
    const targetLookY = GLOBE_CENTER_Y - 4.8 - p * 169.6;  // Starts at logo center (-3*1.6), ends same (-109*1.6)

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
      camera={{ position: [0, 224, 192], fov: 55, near: 0.1, far: 3200 }}
      style={{ background: "transparent", touchAction: "pan-y" }}
      frameloop="always"
    >
      <ambientLight intensity={0.8} />
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