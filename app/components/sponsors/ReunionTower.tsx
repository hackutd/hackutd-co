"use client";

import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/models/reunion_tower_center.glb";

// Cylinder radius: MainRoom is ~37.7 after normalization. Place logos just outside.
const LOGO_RADIUS = 37.2;
const LOGO_OFFSET = 0.0; // Tiny offset to prevent z-fighting

const MIN_LOGO_DISPLAY_HEIGHT = 12.0; // "Wayy bigger" height
const MAX_LOGO_DISPLAY_WIDTH = 32.0;  // "Wayy bigger" width
const LOGO_PADDING = 2.2; // Minimum gap between any two logo edges (world units)
const SLOT_COUNT = 10;    // Number of active logos on the tower at once

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
  displayWidth: number; // Actual width of the logo in world units
  displayHeight: number; // Actual height of the logo in world units
  initialSponsorIndex: number;
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

function generateSlots(): SponsorPlacement[] {
  const slots: SponsorPlacement[] = [];
  const rows = 2;
  const cols = SLOT_COUNT / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const initialSponsorIndex = r * cols + c;
      const theta = (c * (Math.PI * 2)) / cols + (r * Math.PI) / cols; // Staggered rows
      const y = r === 0 ? 112 : 130; // Fixed heights in the blue band
      
      slots.push({
        theta: theta % (Math.PI * 2),
        y,
        sponsorIndex: initialSponsorIndex,
        initialSponsorIndex,
        displayWidth: MAX_LOGO_DISPLAY_WIDTH, // Default, will be adjusted per sponsor
        displayHeight: MIN_LOGO_DISPLAY_HEIGHT,
      });
    }
  }
  return slots;
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
// from the viewBox, and returns stable object-URLs safe to pass to TextureLoader.
const SVG_RASTER_SIZE = 512; // px — enough for crisp logos on the tower

async function patchSvgUrl(url: string): Promise<string> {
  if (!url.toLowerCase().endsWith(".svg")) return url;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return url;

    const hasW = svg.hasAttribute("width");
    const hasH = svg.hasAttribute("height");
    if (hasW && hasH) return url; // already fine — keep original URL

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
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn("[SVG patch] Failed for", url, e);
    return url;
  }
}

// Patches all SVG URLs in a list before they reach TextureLoader.
// Returns null while async patching is in progress so the caller can wait.
function usePatchedSvgUrls(urls: string[]): string[] | null {
  const [patchedUrls, setPatchedUrls] = useState<string[] | null>(null);
  const urlKey = urls.join("|");

  useEffect(() => {
    setPatchedUrls(null);
    let cancelled = false;
    const createdObjectUrls: string[] = [];

    Promise.all(urls.map((u) => patchSvgUrl(u))).then((results) => {
      if (cancelled) {
        results.forEach((r) => { if (r.startsWith("blob:")) URL.revokeObjectURL(r); });
        return;
      }
      results.forEach((r) => { if (r.startsWith("blob:")) createdObjectUrls.push(r); });
      setPatchedUrls(results);
    });

    return () => {
      cancelled = true;
      createdObjectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  return patchedUrls;
}

// ── Single sponsor logo ─────────────────────────────────────
function SponsorLogo({
  placement,
  textures,
  groupRotationRef,
  totalSponsors,
}: {
  placement: SponsorPlacement;
  textures: THREE.Texture[];
  groupRotationRef: React.MutableRefObject<number>;
  totalSponsors: number;
}) {
  const [sponsorIdx, setSponsorIdx] = useState(placement.initialSponsorIndex);
  const texture = textures[sponsorIdx];

  const arcGeo = useMemo(() => {
    const img = texture.image as HTMLImageElement | undefined;
    const aspect = img ? img.width / img.height : 1;

    let h = MIN_LOGO_DISPLAY_HEIGHT;
    let w = h * aspect;
    if (w > MAX_LOGO_DISPLAY_WIDTH) {
      w = MAX_LOGO_DISPLAY_WIDTH;
      h = w / aspect;
    }

    const r = LOGO_RADIUS + LOGO_OFFSET;
    const thetaLen = w / r;
    const thetaStart = -thetaLen / 2;
    const geo = new THREE.CylinderGeometry(r, r, h, 12, 1, true, thetaStart, thetaLen);
    const normals = geo.attributes.normal;
    for (let i = 0; i < normals.count; i++) {
      normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
    }
    return geo;
  }, [texture]);

  // Shared material for this slot
  const material = useWhiteDiscardMaterial(texture);

  useFrame(() => {
    const worldTheta = placement.theta + groupRotationRef.current;
    // Shift trigger phase to 1.4*PI (from 1.0*PI) to swap the logo earlier.
    // This ensures the transition happens shortly after the logo enters the hidden zone.
    const revolution = Math.floor((worldTheta + Math.PI * 1.4) / (Math.PI * 2));
    let nextIdx = (placement.initialSponsorIndex + revolution * SLOT_COUNT) % totalSponsors;
    if (nextIdx < 0) nextIdx = (nextIdx + totalSponsors) % totalSponsors;
    if (nextIdx !== sponsorIdx) setSponsorIdx(nextIdx);
  });

  // Local rotation to face outward
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
            node.material.opacity = 0.6;
            node.material.depthWrite = false;
            node.renderOrder = 3; // Render AFTER logos (renderOrder=2) so sphere appears in front
            mats.push(node.material as THREE.Material);
          }
        });
      }
    });
    globeMaterialsRef.current = mats;
  }, [clonedScene]);

  const validSponsors = useMemo(() => sponsors.filter((s) => s.logo), [sponsors]);
  const logoUrls = useMemo(() => validSponsors.map((s) => s.logo!), [validSponsors]);

  // Patch any SVGs missing explicit width/height before handing URLs to TextureLoader.
  // Without this, viewBox-only SVGs rasterize to a 0x0 bitmap -> WebGL errors.
  const safeLogoUrls = usePatchedSvgUrls(logoUrls);

  // Batch-load all textures to get real aspect ratios BEFORE placement.
  // Falls back to original URLs while SVG patching is still in progress.
  const textures = useLoader(THREE.TextureLoader, safeLogoUrls ?? logoUrls);

  // Static layout of slots
  const placements = useMemo(() => generateSlots(), []);

  useFrame((_, delta) => {
    const scroll = scrollProgressRef.current ?? 0;

    // Parabolic fading: Starts at 1.0, reaches 0.2 at scroll=0.5, ends at 1.0
    const minOpacity = 0.2;
    const targetOpacity = 4 * (1 - minOpacity) * Math.pow(scroll - 0.1, 2) + minOpacity;
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
    <group dispose={null}>
      <primitive
        object={clonedScene}
        scale={[normScale, normScale, normScale]}
        position={[0, -centerY, 0]}
      />
      <group ref={sponsorGroupRef} position={[-1.7, 0, 0]}>
        {placements.map((placement, i) => {
          return (
            <Suspense key={`slot-${i}`} fallback={null}>
              <SponsorLogo 
                placement={placement} 
                textures={Array.isArray(textures) ? textures : [textures]} 
                groupRotationRef={smoothRotation}
                totalSponsors={validSponsors.length}
              />
            </Suspense>
          );
        })}
      </group>
    </group>
  );
}

// ── Globe bounding sphere for camera fit (world-space) ──
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

    const fitOffset = 1.3;
    const baseZ = (GLOBE_BOUNDING_R / Math.sin(effectiveFov / 2)) * fitOffset;

    cam.near = baseZ / 100;
    cam.far = (baseZ + 240) * 3;
    cam.updateProjectionMatrix();

    const targetZ = baseZ + p * 240;
    const targetY = GLOBE_CENTER_Y - p * 92;
    const targetLookY = GLOBE_CENTER_Y - 3 - p * 106;

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Render frames only while the tower is on screen
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "25%" },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 125, 175], fov: 55, near: 0.1, far: 2000 }}
        style={{ touchAction: "pan-y" }}
        frameloop={inView ? "always" : "never"}
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
    </div>
  );
}
