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
const MAX_LOGO_DISPLAY_WIDTH = 32.0; // "Wayy bigger" width
const SLOT_COUNT = 10; // Number of active logos on the tower at once

// ── Tower geometry ──────────────────────────────────────────
// Built from primitives rather than a GLB: nothing to download or traverse,
// and every color is a constant here. World units: 420 tall, base at y=-210,
// matching the camera rig below. The silhouette follows the old GLB model —
// an open geodesic lattice ball wrapped around the drum, on fluted columns —
// with real materials and lit nodes instead of flat gray fills.
const COLORS = {
  concrete: "#e2dabd", // Warm ivory columns
  concreteShade: "#b3a888", // Collar underside
  steel: "#5a6470", // Dark ring bands
  steelLight: "#aab3bd", // Secondary rings + mullions
  glass: "#0e4a5e", // Window band — dark so white plaques read on it
  strut: "#d8d4c8", // Warm aluminum lattice
  node: "#ffc15e", // Lit dome nodes — amber like the real tower
  nodeAlt: "#ef8fc8", // Occasional brand pink
  plinth: "#948d7c", // Ground plinth
  shell: "#dceeff", // Faint glass shell inside the lattice
};
const SEGMENTS = 48;
const TOWER_BASE_Y = -210;

// [bottom radius, top radius, bottom y, top y, color]
type Part = [number, number, number, number, string];

// Tapered fluted columns — one core + three shafts converging into the collar.
const CORE: Part = [16, 12, TOWER_BASE_Y, 118, COLORS.concrete];
const SHAFT: Part = [11, 9, TOWER_BASE_Y, 104, COLORS.concrete];
const SHAFT_DISTANCE = 30;
const SHAFT_ANGLES = [60, 180, 300].map(THREE.MathUtils.degToRad);
const SHAFT_TILT = THREE.MathUtils.degToRad(3.2); // Slight inward lean
const FLUTE_RIBS = 16; // Horizontal ribs per column, like the GLB's segments

const DRUM: Part[] = [
  [30, 44, 100, 116, COLORS.concreteShade], // Underside collar where shafts meet
  [45, 45, 116, 124, COLORS.steel], // Lower dark ring
  [44, 43.5, 124, 130, COLORS.steelLight], // Secondary ring
  [43, 43, 130, 170, COLORS.glass], // Window band — logos ride here
  [47, 47, 170, 178, COLORS.steel], // Observation deck ledge
  [40, 40, 178, 190, COLORS.concrete],
  [40, 16, 190, 200, COLORS.concrete], // Roof taper
];
const MULLION_COUNT = 32; // Vertical window ribs on the glass band
const MULLION_RADIUS = 43.6; // Inside LOGO_RADIUS (45) with clearance

const GLOBE_Y = 133;
const GLOBE_RADIUS = 77;
const GLOBE_CUT = -50; // Globe opens just under the collar, where the shafts enter
const GLOBE_DETAIL = 2; // Geodesic subdivision: 2 ≈ 270 struts, chunky like the GLB
const STRUT_RADIUS = 1.2;
const NODE_RADIUS = 2.4;
const NODE_ALT_EVERY = 9; // Every 9th node is pink instead of amber
const SHELL_OPACITY = 0.07;

// Ground plinth: two stacked disks at the tower's foot.
const PLINTH: Part[] = [
  [96, 88, TOWER_BASE_Y, TOWER_BASE_Y + 8, COLORS.plinth],
  [82, 76, TOWER_BASE_Y + 8, TOWER_BASE_Y + 14, COLORS.concreteShade],
];

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
      const parts = vb
        .trim()
        .split(/[\s,]+/)
        .map(Number);
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
        results.forEach((r) => {
          if (r.startsWith("blob:")) URL.revokeObjectURL(r);
        });
        return;
      }
      results.forEach((r) => {
        if (r.startsWith("blob:")) createdObjectUrls.push(r);
      });
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

  const { arcGeo, cardGeo } = useMemo(() => {
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
    const arcGeo = new THREE.CylinderGeometry(
      r,
      r,
      h,
      12,
      1,
      true,
      thetaStart,
      thetaLen,
    );
    const normals = arcGeo.attributes.normal;
    for (let i = 0; i < normals.count; i++) {
      normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
    }

    // White plaque behind each logo, mirroring the sponsor wall's cards —
    // keeps dark wordmarks legible on the dark glass band.
    const cardR = LOGO_RADIUS - 0.6;
    const cardLen = (w * 1.3) / cardR;
    const cardGeo = new THREE.CylinderGeometry(
      cardR,
      cardR,
      h * 1.45,
      12,
      1,
      true,
      -cardLen / 2,
      cardLen,
    );

    return { arcGeo, cardGeo };
  }, [texture]);

  useEffect(
    () => () => {
      arcGeo.dispose();
      cardGeo.dispose();
    },
    [arcGeo, cardGeo],
  );

  useFrame(() => {
    const worldTheta = placement.theta + groupRotationRef.current;
    // Shift trigger phase to 1.4*PI (from 1.0*PI) to swap the logo earlier.
    // This ensures the transition happens shortly after the logo enters the hidden zone.
    const revolution = Math.floor((worldTheta + Math.PI * 1.4) / (Math.PI * 2));
    let nextIdx =
      (placement.initialSponsorIndex + revolution * SLOT_COUNT) % totalSponsors;
    if (nextIdx < 0) nextIdx = (nextIdx + totalSponsors) % totalSponsors;
    if (nextIdx !== sponsorIdx) setSponsorIdx(nextIdx);
  });

  // Local rotation to face outward
  const rotY = placement.theta + Math.PI / 2;

  return (
    <group position={[0, placement.y, 0]} rotation={[0, rotY, 0]}>
      <mesh geometry={cardGeo} renderOrder={1}>
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
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

// ── Tower parts ─────────────────────────────────────────────
// LatheGeometry needs lathe-space points (x = radius, y = height), so each
// part's [rBottom, rTop, y0, y1] is remapped around its own center.
function partGeometry(
  [rBottom, rTop, y0, y1]: Part,
  ribs = 0,
): THREE.LatheGeometry {
  const h = y1 - y0;
  const mid = (y0 + y1) / 2;
  const steps = ribs > 0 ? ribs * 3 : 2;
  // Closed profile: bottom cap in, side up, top cap in — lathe leaves ends open otherwise.
  const pts: THREE.Vector2[] = [new THREE.Vector2(0.01, y0 - mid)];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let r = rBottom + (rTop - rBottom) * t;
    if (ribs > 0) {
      // Triangular rib wave: small periodic bulge, like the GLB's segments
      const phase = (t * ribs) % 1;
      r *= 1 + 0.07 * Math.max(0, 1 - Math.abs(phase * 2 - 1) * 3);
    }
    pts.push(new THREE.Vector2(Math.max(r, 0.01), y0 + h * t - mid));
  }
  pts.push(new THREE.Vector2(0.01, y1 - mid));
  return new THREE.LatheGeometry(pts, SEGMENTS);
}

type Finish = "stone" | "steel" | "glass";

// Phong for anything meant to gleam: metallic finishes need an env map under
// MeshStandardMaterial, and this scene ships none — specular fakes it cheaply.
function Solid({
  part,
  x = 0,
  z = 0,
  tilt = 0,
  ribs = 0,
  finish = "stone",
}: {
  part: Part;
  x?: number;
  z?: number;
  tilt?: number;
  ribs?: number;
  finish?: Finish;
}) {
  const geo = useMemo(() => partGeometry(part, ribs), [part, ribs]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group
      position={[x, (part[2] + part[3]) / 2, z]}
      rotation={[
        tilt === 0 ? 0 : -Math.cos(Math.atan2(x, z)) * tilt,
        0,
        tilt === 0 ? 0 : Math.sin(Math.atan2(x, z)) * tilt,
      ]}
    >
      <mesh geometry={geo}>
        {finish === "stone" && (
          <meshStandardMaterial
            color={part[4]}
            roughness={0.85}
            metalness={0}
          />
        )}
        {finish === "steel" && (
          <meshPhongMaterial
            color={part[4]}
            shininess={70}
            specular="#77808c"
          />
        )}
        {finish === "glass" && (
          <meshPhongMaterial
            color={part[4]}
            shininess={120}
            specular="#8fc4d6"
            emissive="#07272f"
          />
        )}
      </mesh>
    </group>
  );
}

// Vertical window ribs around the glass band, between it and the logo ring.
function Mullions() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, mat } = useMemo(
    () => ({
      geo: new THREE.BoxGeometry(0.9, 38, 0.7),
      mat: new THREE.MeshPhongMaterial({
        color: COLORS.steelLight,
        shininess: 60,
        specular: "#8a94a0",
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  useEffect(() => {
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < MULLION_COUNT; i++) {
      const a = (i / MULLION_COUNT) * Math.PI * 2;
      p.set(Math.sin(a) * MULLION_RADIUS, 150, Math.cos(a) * MULLION_RADIUS);
      q.setFromEuler(new THREE.Euler(0, a, 0));
      m.compose(p, q, s);
      ref.current?.setMatrixAt(i, m);
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [geo, mat]);
  return <instancedMesh ref={ref} args={[geo, mat, MULLION_COUNT]} />;
}

// Unique vertices + edges of a subdivided icosahedron, minus the open bottom.
// The GLB ball is a lattice of chunky struts — the drum and logos show through.
function buildGeodesic(): {
  verts: THREE.Vector3[];
  edges: [number, number][];
} {
  const geo = new THREE.IcosahedronGeometry(GLOBE_RADIUS, GLOBE_DETAIL);
  const pos = geo.attributes.position.array;
  const vertIndex = new Map<string, number>();
  const verts: THREE.Vector3[] = [];
  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];

  const indexOf = (i: number) => {
    const v = new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    let idx = vertIndex.get(key);
    if (idx === undefined) {
      idx = verts.length;
      vertIndex.set(key, idx);
      verts.push(v);
    }
    return idx;
  };
  const addEdge = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push([a, b]);
    }
  };

  for (let i = 0; i < pos.length / 9; i++) {
    const a = indexOf(i * 3);
    const b = indexOf(i * 3 + 1);
    const c = indexOf(i * 3 + 2);
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }
  geo.dispose();

  // Drop everything at or below the open bottom so columns enter cleanly.
  const keepVert = verts.map((v) => v.y > GLOBE_CUT);
  const keptEdges = edges.filter(([a, b]) => keepVert[a] && keepVert[b]);
  const remap = new Map<number, number>();
  const keptVerts: THREE.Vector3[] = [];
  verts.forEach((v, i) => {
    if (keepVert[i]) {
      remap.set(i, keptVerts.length);
      keptVerts.push(v);
    }
  });
  return {
    verts: keptVerts,
    edges: keptEdges.map(([a, b]) => [remap.get(a)!, remap.get(b)!]),
  };
}

// The dome: instanced strut cylinders + glowing node spheres + a faint inner
// shell for depth. Everything rides globeRef so it counter-rotates slowly.
function GeodesicBall({
  materialsRef,
}: {
  materialsRef: React.MutableRefObject<THREE.Material[]>;
}) {
  const strutsRef = useRef<THREE.InstancedMesh>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const altNodesRef = useRef<THREE.InstancedMesh>(null);

  const { verts, edges } = useMemo(() => buildGeodesic(), []);
  const altCount = useMemo(
    () => Math.ceil(verts.length / NODE_ALT_EVERY),
    [verts],
  );

  const geoms = useMemo(
    () => ({
      strut: new THREE.CylinderGeometry(STRUT_RADIUS, STRUT_RADIUS, 1, 7),
      node: new THREE.SphereGeometry(NODE_RADIUS, 12, 10),
      shell: new THREE.SphereGeometry(
        GLOBE_RADIUS - 1,
        48,
        24,
        0,
        Math.PI * 2,
        0,
        Math.acos(GLOBE_CUT / GLOBE_RADIUS),
      ),
    }),
    [],
  );
  useEffect(
    () => () => Object.values(geoms).forEach((g) => g.dispose()),
    [geoms],
  );

  const mats = useMemo(
    () => ({
      strut: new THREE.MeshPhongMaterial({
        color: COLORS.strut,
        shininess: 90,
        specular: "#9aa4b0",
        transparent: true,
      }),
      node: new THREE.MeshBasicMaterial({
        color: COLORS.node,
        transparent: true,
      }),
      nodeAlt: new THREE.MeshBasicMaterial({
        color: COLORS.nodeAlt,
        transparent: true,
      }),
      shell: new THREE.MeshBasicMaterial({
        color: COLORS.shell,
        transparent: true,
        opacity: SHELL_OPACITY,
        depthWrite: false,
      }),
    }),
    [],
  );
  useEffect(() => {
    materialsRef.current = [mats.strut, mats.node, mats.nodeAlt, mats.shell];
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [mats, materialsRef]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const mid = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();

    if (strutsRef.current) {
      edges.forEach(([a, b], i) => {
        const va = verts[a];
        const vb = verts[b];
        mid.addVectors(va, vb).multiplyScalar(0.5);
        dir.subVectors(vb, va);
        const len = dir.length();
        q.setFromUnitVectors(up, dir.normalize());
        s.set(1, len, 1);
        m.compose(mid, q, s);
        strutsRef.current!.setMatrixAt(i, m);
      });
      strutsRef.current.instanceMatrix.needsUpdate = true;
    }
    let amber = 0;
    let pink = 0;
    verts.forEach((v, i) => {
      m.compose(v, q.identity(), s.set(1, 1, 1));
      if (i % NODE_ALT_EVERY === 0) {
        altNodesRef.current?.setMatrixAt(pink++, m);
      } else {
        nodesRef.current?.setMatrixAt(amber++, m);
      }
    });
    if (nodesRef.current) nodesRef.current.instanceMatrix.needsUpdate = true;
    if (altNodesRef.current)
      altNodesRef.current.instanceMatrix.needsUpdate = true;
  }, [verts, edges]);

  return (
    <>
      <instancedMesh
        ref={strutsRef}
        args={[geoms.strut, mats.strut, edges.length]}
        renderOrder={4}
      />
      <instancedMesh
        ref={nodesRef}
        args={[geoms.node, mats.node, verts.length - altCount]}
        renderOrder={4}
      />
      <instancedMesh
        ref={altNodesRef}
        args={[geoms.node, mats.nodeAlt, altCount]}
        renderOrder={4}
      />
      {/* Faint shell gives the ball a glassy body without hiding the drum */}
      <mesh geometry={geoms.shell} material={mats.shell} renderOrder={3} />
    </>
  );
}

// ── Tower model ─────────────────────────────────────────────
function TowerModel({
  scrollProgressRef,
  dragOffsetRef,
  sponsors,
}: TowerSceneProps) {
  const globeRef = useRef<THREE.Group>(null);
  const globeMaterialsRef = useRef<THREE.Material[]>([]);
  const sponsorGroupRef = useRef<THREE.Group>(null);
  const smoothRotation = useRef(0);
  const autoAngle = useRef(0);

  const validSponsors = useMemo(
    () => sponsors.filter((s) => s.logo),
    [sponsors],
  );
  const logoUrls = useMemo(
    () => validSponsors.map((s) => logoTextureUrl(s.logo!)),
    [validSponsors],
  );

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

    // Parabolic fading: ~0.2 near the start of the scroll, opaque by the end.
    // Fades the whole lattice (struts, nodes, shell, belt) as one material set.
    const minOpacity = 0.2;
    const targetOpacity = Math.min(
      1,
      4 * (1 - minOpacity) * Math.pow(scroll - 0.1, 2) + minOpacity,
    );
    globeMaterialsRef.current.forEach((mat) => {
      mat.opacity =
        mat === globeMaterialsRef.current[3]
          ? targetOpacity * SHELL_OPACITY // Shell stays faint at full scroll
          : targetOpacity;
    });

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
      {PLINTH.map((part, i) => (
        <Solid key={`plinth-${i}`} part={part} />
      ))}
      <Solid part={CORE} ribs={FLUTE_RIBS} />
      {SHAFT_ANGLES.map((a) => (
        <Solid
          key={a}
          part={SHAFT}
          x={Math.sin(a) * SHAFT_DISTANCE}
          z={Math.cos(a) * SHAFT_DISTANCE}
          tilt={SHAFT_TILT}
          ribs={FLUTE_RIBS}
        />
      ))}
      {DRUM.map((part, i) => (
        <Solid
          key={i}
          part={part}
          finish={
            part[4] === COLORS.glass
              ? "glass"
              : part[4] === COLORS.steel || part[4] === COLORS.steelLight
                ? "steel"
                : "stone"
          }
        />
      ))}
      <Mullions />

      <group ref={globeRef} position={[0, GLOBE_Y, 0]}>
        {/* Drawn after the logos (renderOrder 2) so the lattice sits in front of them */}
        <GeodesicBall materialsRef={globeMaterialsRef} />
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
function CameraRig({
  scrollProgressRef,
}: {
  scrollProgressRef: React.RefObject<number>;
}) {
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
            maskImage:
              "linear-gradient(to bottom, black 90%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 90%, transparent 100%)",
          }}
          frameloop={inView ? "always" : "never"}
        >
          {/* Hemisphere wash + warm key: stone stays soft, phong picks up the sun */}
          <hemisphereLight args={["#ffffff", "#8f8672", 0.9]} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[-120, 200, 160]} intensity={1.5} />
          <directionalLight
            position={[140, 40, -100]}
            intensity={0.4}
            color="#bfd4e0"
          />

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
