"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getImageProps, type StaticImageData } from "next/image";
import { useNearViewport } from "@/app/hooks/useNearViewport";
import { useIsMobile } from "@/app/hooks/useIsMobile";

const AUTO_ROTATION_SPEED = 0.3;
const MAX_FRAME_DELTA = 1 / 30;
const ROTATION_SMOOTHING = 0.08;

// Logos ride just outside the glass band (radius 43, y 130–170 below).
const LOGO_RADIUS = 45.0;
const LOGO_OFFSET = 0.0; // Tiny offset to prevent z-fighting

const MIN_LOGO_DISPLAY_HEIGHT = 12.0; // "Wayy bigger" height
const MAX_LOGO_DISPLAY_WIDTH = 32.0;  // "Wayy bigger" width
const SLOT_COUNT = 10;    // Number of active logos on the tower at once

// ── Tower geometry ──────────────────────────────────────────
// Built from primitives rather than a GLB: nothing to download or traverse,
// and every color is a constant here. World units: 420 tall, base at y=-210,
// matching the camera rig below. Flat toon fills + inverted-hull ink outlines.
const COLORS = {
  concrete: "#e4ded2",
  steel: "#959ca4",
  glass: "#134e5e",
  globe: "#c4c9cf",
  ink: "#111111",
};
const INK = 0.9; // Outline thickness (world units)
const SEGMENTS = 40;
const TOWER_BASE_Y = -210;

// [bottom radius, top radius, bottom y, top y, color]
type Part = [number, number, number, number, string];

const CORE: Part = [15, 15, TOWER_BASE_Y, 120, COLORS.concrete];
const SHAFT: Part = [10, 10, TOWER_BASE_Y, 112, COLORS.concrete];
const SHAFT_DISTANCE = 28;
const SHAFT_ANGLES = [60, 180, 300].map(THREE.MathUtils.degToRad);

const DRUM: Part[] = [
  [34, 45, 100, 115, COLORS.concrete], // Underside collar where the shafts meet
  [45, 45, 115, 130, COLORS.steel],    // Lower ring
  [43, 43, 130, 170, COLORS.glass],    // Rotating window band — logos ride here
  [47, 47, 170, 178, COLORS.steel],    // Observation deck ledge
  [40, 40, 178, 190, COLORS.concrete],
  [40, 18, 190, 198, COLORS.concrete], // Roof
];

const GLOBE_Y = 133;
const GLOBE_RADIUS = 77;
const GLOBE_CUT = -40; // Globe is open below this local y, where the shafts enter
const GLOBE_DETAIL = 3; // Geodesic subdivision: higher = denser struts
const STRUT_OPACITY = 0.6;

// Three-band cel ramp for MeshToonMaterial
const TOON_RAMP = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
TOON_RAMP.minFilter = THREE.NearestFilter;
TOON_RAMP.magFilter = THREE.NearestFilter;
TOON_RAMP.needsUpdate = true;

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
  logo?: StaticImageData;
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
      const y = r === 0 ? 142 : 160; // Fixed heights in the blue band
      
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

// ── SVG dimension fix ───────────────────────────────────────
// Three.js TextureLoader rasterizes SVGs via <img>. If the SVG has no explicit
// width/height attributes (only viewBox), the browser produces a 0×0 bitmap,
// causing "texSubImage2D: bad image data" / "Texture is immutable" WebGL errors.
// This hook fetches the raw SVG text, injects concrete pixel dimensions derived
// from the viewBox, and returns stable object-URLs safe to pass to TextureLoader.
const SVG_RASTER_SIZE = 512; // px — enough for crisp logos on the tower

// 1x1 transparent PNG. Substituted for any logo URL that fails to load so a
// single broken asset can't take the whole batch down with it (the alphaTest
// in the logo material makes it render as invisible).
const PLACEHOLDER_TEXTURE_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function patchSvgUrl(url: string): Promise<string> {
  if (!url.toLowerCase().endsWith(".svg")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
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

// Resolves to the original URL if the browser can load it as an image,
// otherwise to a transparent placeholder (e.g. 404s on case-sensitive hosts).
function loadableOrPlaceholder(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => {
      console.warn("[sponsor logo] Failed to load, hiding logo:", url);
      resolve(PLACEHOLDER_TEXTURE_URL);
    };
    img.src = url;
  });
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

    Promise.all(
      urls.map((u) => patchSvgUrl(u).then(loadableOrPlaceholder)),
    ).then((results) => {
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

// ── Capped logo textures ────────────────────────────────────
// Sponsor logos ship at their source resolution — up to 2000px on the long
// edge — but on the tower each is drawn on an arc roughly 200px wide. Handed
// to the GPU untouched, three.js rounds them up to the next power of two for
// mipmapping, so a 1029x1200 PNG becomes a 2048x2048 texture: ~22MB for a logo
// the size of a postage stamp. Drawing each through a canvas first and capping
// the long edge takes the whole set from ~151MB to ~14MB, with no visible
// difference at the size they are actually rendered.
const MAX_LOGO_TEX = 256;

// Fetch each raster logo through the image optimizer at the capped width
// rather than downloading the full-size source only to shrink it. The src
// getImageProps returns is its 2x candidate, hence half the width. SVGs come
// back untouched (the optimizer skips them), so the SVG patching still applies.
const logoTextureUrl = (logo: StaticImageData) =>
  getImageProps({ src: logo, alt: "", width: MAX_LOGO_TEX / 2 }).props.src;

// Keyed by source URL and never evicted, standing in for the global cache
// useLoader used to provide: the canvas unmounts and remounts every time the
// tower leaves and re-enters its viewport margin, and re-decoding every logo
// on each pass would cost more than holding the textures does.
const cappedTextureCache = new Map<string, Promise<THREE.Texture>>();

/** A 1x1 transparent texture — alphaTest in the logo material hides it. */
function blankTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return new THREE.CanvasTexture(canvas);
}

function loadCappedTexture(url: string): Promise<THREE.Texture> {
  const cached = cappedTextureCache.get(url);
  if (cached) {
    return cached;
  }

  const pending = new Promise<THREE.Texture>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const longEdge = Math.max(img.width, img.height);
      if (!longEdge) {
        resolve(blankTexture());
        return;
      }

      const scale = Math.min(1, MAX_LOGO_TEX / longEdge);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(blankTexture());
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace; // Logos render in their true brand colors
      texture.anisotropy = 4;
      resolve(texture);
    };

    img.onerror = () => {
      console.warn("[sponsor logo] Failed to decode, hiding logo:", url);
      resolve(blankTexture());
    };

    img.src = url;
  });

  cappedTextureCache.set(url, pending);
  return pending;
}

/**
 * Loads every logo through loadCappedTexture, preserving URL order so slot
 * indices still line up with the sponsor list. Null until the set is complete.
 */
function useCappedTextures(urls: string[] | null): THREE.Texture[] | null {
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);
  const urlKey = urls?.join("|") ?? "";

  useEffect(() => {
    if (!urls) {
      setTextures(null);
      return;
    }

    let cancelled = false;
    Promise.all(urls.map(loadCappedTexture)).then((loaded) => {
      if (!cancelled) {
        setTextures(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlKey]);

  return textures;
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
  // The slot index is driven by revolution count, which can briefly outrun a
  // shrinking sponsor list; fall back rather than indexing off the end.
  const texture = textures[sponsorIdx] ?? textures[0];

  const arcGeo = useMemo(() => {
    // Canvas-backed now rather than an <img>, so read the size structurally —
    // HTMLCanvasElement carries width/height just as HTMLImageElement does.
    const img = texture.image as { width: number; height: number } | undefined;
    const aspect = img && img.height ? img.width / img.height : 1;

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
      <mesh geometry={arcGeo} renderOrder={2}>
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── Toon solid with ink outline ─────────────────────────────
function Solid({ part: [rBottom, rTop, y0, y1, color], x = 0, z = 0 }: { part: Part; x?: number; z?: number }) {
  const h = y1 - y0;
  return (
    <group position={[x, (y0 + y1) / 2, z]}>
      <mesh>
        <cylinderGeometry args={[rTop, rBottom, h, SEGMENTS]} />
        <meshToonMaterial color={color} gradientMap={TOON_RAMP} />
      </mesh>
      {/* Inverted hull: a slightly larger back-face shell drawn in ink shows only at the silhouette */}
      <mesh>
        <cylinderGeometry args={[rTop + INK, rBottom + INK, h + INK * 2, SEGMENTS]} />
        <meshBasicMaterial color={COLORS.ink} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// Every triangle edge of a subdivided icosahedron, minus the open bottom: the geodesic struts.
function buildGlobeStruts(): THREE.BufferGeometry {
  const edges = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(GLOBE_RADIUS, GLOBE_DETAIL), 1);
  const p = edges.attributes.position.array;
  const kept: number[] = [];
  for (let i = 0; i < p.length; i += 6) {
    if (p[i + 1] > GLOBE_CUT && p[i + 4] > GLOBE_CUT) kept.push(...p.slice(i, i + 6));
  }
  edges.dispose();
  return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(kept, 3));
}

// ── Tower model ─────────────────────────────────────────────
function TowerModel({ scrollProgressRef, dragOffsetRef, sponsors }: TowerSceneProps) {
  const globeRef = useRef<THREE.Group>(null);
  const globeFillRef = useRef<THREE.MeshBasicMaterial>(null);
  const sponsorGroupRef = useRef<THREE.Group>(null);
  const smoothRotation = useRef(0);
  const autoAngle = useRef(0);

  const struts = useMemo(buildGlobeStruts, []);
  useEffect(() => () => struts.dispose(), [struts]);

  const validSponsors = useMemo(() => sponsors.filter((s) => s.logo), [sponsors]);
  const logoUrls = useMemo(() => validSponsors.map((s) => logoTextureUrl(s.logo!)), [validSponsors]);

  // Patch any SVGs missing explicit width/height before handing URLs to TextureLoader.
  // Without this, viewBox-only SVGs rasterize to a 0x0 bitmap -> WebGL errors.
  const safeLogoUrls = usePatchedSvgUrls(logoUrls);

  // Batch-load all textures to get real aspect ratios BEFORE placement.
  // While patching/validation is in progress, load placeholders instead of the
  // raw URLs — an unvalidated URL that 404s would reject the whole batch and
  // take down the page.
  const textures = useCappedTextures(safeLogoUrls);

  // Static layout of slots
  const placements = useMemo(() => generateSlots(), []);

  useFrame((_, delta) => {
    const scroll = scrollProgressRef.current ?? 0;

    // Parabolic fading: ~0.2 near the start of the scroll, opaque by the end
    const minOpacity = 0.2;
    if (globeFillRef.current) {
      globeFillRef.current.opacity = Math.min(1, 4 * (1 - minOpacity) * Math.pow(scroll - 0.1, 2) + minOpacity);
    }

    if (!globeRef.current) return;

    // The canvas stops rendering while off-screen. Clamp the first frame after
    // it resumes so elapsed off-screen time cannot become a rotation burst.
    autoAngle.current += Math.min(delta, MAX_FRAME_DELTA) * AUTO_ROTATION_SPEED;
    const scrollAngle = scroll * Math.PI * 2;
    const dragAngle = (dragOffsetRef.current ?? 0) * 0.01;
    const target = autoAngle.current + scrollAngle + dragAngle;

    // ScrollTrigger can update while the canvas is paused. On re-entry, follow
    // the equivalent nearest angle instead of chasing a full stale revolution.
    const shortestRotationDelta = Math.atan2(
      Math.sin(target - smoothRotation.current),
      Math.cos(target - smoothRotation.current),
    );
    smoothRotation.current += shortestRotationDelta * ROTATION_SMOOTHING;

    if (sponsorGroupRef.current) {
      sponsorGroupRef.current.rotation.y = smoothRotation.current;
    }
    globeRef.current.rotation.y = -smoothRotation.current * 0.5;
  });

  return (
    <group>
      <Solid part={CORE} />
      {SHAFT_ANGLES.map((a) => (
        <Solid key={a} part={SHAFT} x={Math.sin(a) * SHAFT_DISTANCE} z={Math.cos(a) * SHAFT_DISTANCE} />
      ))}
      {DRUM.map((part, i) => (
        <Solid key={i} part={part} />
      ))}

      <group ref={globeRef} position={[0, GLOBE_Y, 0]}>
        {/* Drawn after the logos (renderOrder 2) so the globe sits in front of them */}
        <mesh renderOrder={3}>
          <sphereGeometry args={[GLOBE_RADIUS, 48, 24, 0, Math.PI * 2, 0, Math.acos(GLOBE_CUT / GLOBE_RADIUS)]} />
          <meshBasicMaterial ref={globeFillRef} color={COLORS.globe} transparent depthWrite={false} />
        </mesh>
        <lineSegments geometry={struts} renderOrder={4}>
          <lineBasicMaterial color={COLORS.ink} transparent opacity={STRUT_OPACITY} depthWrite={false} />
        </lineSegments>
      </group>

      <group ref={sponsorGroupRef}>
        {textures &&
          placements.map((placement, i) => (
            <SponsorLogo
              key={`slot-${i}`}
              placement={placement}
              textures={textures}
              groupRotationRef={smoothRotation}
              totalSponsors={validSponsors.length}
            />
          ))}
      </group>
    </group>
  );
}

// ── Globe bounding sphere for camera fit (world-space) ──
const GLOBE_CENTER_Y = 125;
const GLOBE_BOUNDING_R = 38;
const CAMERA_FIT_OFFSET = 1.6;
const CAMERA_VERTICAL_OFFSET = 6;

// ── Camera rig ──────────────────────────────────────────────
function CameraRig({ scrollProgressRef }: { scrollProgressRef: React.RefObject<number> }) {
  const { camera, size } = useThree();
  const smoothZ = useRef(0);
  const smoothY = useRef(0);
  const smoothLookY = useRef(0);
  const initialized = useRef(false);

  // The fit distance and clip planes depend only on the viewport aspect, so
  // the projection matrix is rebuilt on resize rather than every frame.
  const baseZ = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const effectiveFov = Math.min(vFov, hFov);
    return (GLOBE_BOUNDING_R / Math.sin(effectiveFov / 2)) * CAMERA_FIT_OFFSET;
  }, [camera, size.width, size.height]);

  const appliedBaseZ = useRef<number | null>(null);

  useFrame(() => {
    const p = scrollProgressRef.current ?? 0;
    if (appliedBaseZ.current !== baseZ) {
      const cam = camera as THREE.PerspectiveCamera;
      cam.near = baseZ / 100;
      cam.far = (baseZ + 240) * 3;
      cam.updateProjectionMatrix();
      appliedBaseZ.current = baseZ;
    }
    const targetZ = baseZ + p * 240;
    const targetY = GLOBE_CENTER_Y + CAMERA_VERTICAL_OFFSET;
    const targetLookY = GLOBE_CENTER_Y + CAMERA_VERTICAL_OFFSET;

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
  const isMobile = useIsMobile();

  // Defer creating the GPU context until the canvas is within half a viewport.
  const shouldMountCanvas = useNearViewport(wrapperRef, "50%");

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
      {shouldMountCanvas && (
        <Canvas
          // Phones get no MSAA and 1x pixels; desktop gets a little extra
          // resolution so the ink outlines stay crisp.
          dpr={isMobile ? 1 : [1, 1.5]}
          // No tone mapping, so COLORS render as the exact hex values
          flat
          gl={{
            antialias: !isMobile,
            alpha: true,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
          }}
          camera={{ position: [0, 125, 175], fov: 55, near: 0.1, far: 2000 }}
          style={{
            touchAction: "pan-y",
            maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 90%, transparent 100%)",
          }}
          frameloop={inView ? "always" : "never"}
        >
          {/* Toon materials step this into the three cel bands of TOON_RAMP */}
          <ambientLight intensity={1.8} />
          <directionalLight position={[-120, 200, 160]} intensity={1.6} />

          <TowerModel
            scrollProgressRef={scrollProgressRef}
            dragOffsetRef={dragOffsetRef}
            sponsors={sponsors}
          />

          <CameraRig scrollProgressRef={scrollProgressRef} />
        </Canvas>
      )}
    </div>
  );
}
