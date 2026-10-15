"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getImageProps, type StaticImageData } from "next/image";
import { useNearViewport } from "@/app/hooks/useNearViewport";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import {
  TOWER_BOUNDS,
  TOWER_DATA,
  LATTICE_NODES,
  TOWER_PARTS,
} from "./towerGeometry";

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
// The real GLB meshes live in ./towerGeometry (generated, quantized): the same
// beveled lattice bars, connectors, drum panels and columns as the old model —
// no .glb download and no loader. The scene is normalized to 420 world units
// tall and centered at y=0, exactly like the old useGLTF pipeline.

const MODEL_HEIGHT = 420;
const NORM_SCALE =
  MODEL_HEIGHT / (TOWER_BOUNDS.max[1] - TOWER_BOUNDS.min[1]);
const CENTER_Y =
  ((TOWER_BOUNDS.min[1] + TOWER_BOUNDS.max[1]) / 2) * NORM_SCALE;

const COLORS = {
  lattice: "#e9e7e2", // Silver-grey ball bars
  latticeEdge: "#3a3f45", // Outlines on the ball
  column: "#cbb189", // Concrete tan shafts
  columnBrace: "#b39d77", // Cross-braces between the columns
  drumLight: "#39434d", // Dark glass panels above/below the window band
  drumBand: "#202a33", // Darker window band the logos ride on
  base: "#a3967f",
  ink: "#1f2226", // Outlines on the body
};
// Junction dots: warm gold-white like the real tower's LEDs, slight variance.
const NODE_COLORS = ["#fff3d4", "#ffe9ae", "#ffd98a"];
const NODE_COLOR_WEIGHTS = [0.55, 0.3, 0.15];
// Window band extent in normalized world y — the drum spans ~115–193, and the
// logo rows (142/160) sit inside the dark band.
const BAND_Y: [number, number] = [118, 168];
const SPHERE_OPACITY = 0.9;
const NODE_RADIUS = 0.3; // Raw model units — small white dots at bar junctions

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
      // colorSpace is deliberately left at the Texture default (NoColorSpace) —
      // the brightness/saturation constants in useWhiteDiscardMaterial are
      // tuned against it.
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

// ── Near-white discard material ─────────────────────────────
// Discards near-white pixels so logos with white backgrounds render
// transparent — the logo floats on the glass band instead of boxing.
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

        // Darken and saturate colored logos so they read on the band
        diffuseColor.rgb *= 0.55;
        float luma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        diffuseColor.rgb = mix(vec3(luma), diffuseColor.rgb, 1.5);
        `,
      );
    };

    return mat;
  }, [texture]);
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
    const geo = new THREE.CylinderGeometry(
      r,
      r,
      h,
      12,
      1,
      true,
      thetaStart,
      thetaLen,
    );
    const normals = geo.attributes.normal;
    for (let i = 0; i < normals.count; i++) {
      normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
    }
    return geo;
  }, [texture]);

  useEffect(() => () => arcGeo.dispose(), [arcGeo]);

  // Shared material for this slot
  const material = useWhiteDiscardMaterial(texture);

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
      <mesh geometry={arcGeo} material={material} renderOrder={2} />
    </group>
  );
}

// ── Decoded GLB parts ───────────────────────────────────────
// towerGeometry.ts packs every mesh as quantized Int16 positions, Int8
// normals and Uint16 indices behind one base64 blob; decode once into real
// BufferGeometry. World-space coords, pre-normalization (see NORM_SCALE).
function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

const QUANT_MAX = 65535;

function decodePositions(
  src: ArrayBuffer,
  byteOffset: number,
  count: number,
): Float32Array {
  const q = new Int16Array(src, byteOffset, count * 3);
  const out = new Float32Array(count * 3);
  const { min, scale } = TOWER_BOUNDS;
  for (let i = 0; i < out.length; i++) {
    out[i] = ((q[i] + 32768) / QUANT_MAX) * scale + min[i % 3];
  }
  return out;
}

interface TowerPart {
  name: string;
  inSphere: boolean;
  geo: THREE.BufferGeometry;
  edges: THREE.EdgesGeometry;
}

// Axis-aligned footprint of a column shaft — used to thread cross-braces
// between the three supports like the real tower's connecting struts.
interface SupportInfo {
  cx: number;
  cz: number;
  yMin: number;
  yMax: number;
  radius: number;
}

// All meshes, decoded + split into lattice (PlatonicSphere) vs body. The drum
// gets its dark window band baked as vertex colors — a MeshToonMaterial with
// vertexColors then shades the panels like the illustration. The sphere is
// recentred on the Y axis so globeRef spins it instead of orbiting it.
function useTowerParts(): {
  body: TowerPart[];
  sphere: TowerPart[];
  supports: SupportInfo[];
  sphereCenter: [number, number];
} {
  return useMemo(() => {
    const buf = b64ToArrayBuffer(TOWER_DATA);
    const light = new THREE.Color(COLORS.drumLight);
    const dark = new THREE.Color(COLORS.drumBand);
    const body: TowerPart[] = [];
    const sphere: TowerPart[] = [];
    const supports: SupportInfo[] = [];
    const sphereCenter: [number, number] = [0, 0];

    for (const part of TOWER_PARTS) {
      const geo = new THREE.BufferGeometry();
      const positions = decodePositions(buf, part.posOff, part.vCount);
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      if (part.normOff >= 0) {
        const q = new Int8Array(buf, part.normOff, part.vCount * 3);
        const nor = new Float32Array(part.vCount * 3);
        for (let i = 0; i < nor.length; i++) nor[i] = q[i] / 127;
        geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      } else {
        geo.computeVertexNormals();
      }
      geo.setIndex(
        new THREE.BufferAttribute(
          new Uint16Array(buf, part.idxOff, part.iCount),
          1,
        ),
      );

      if (part.inSphere) {
        geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        sphereCenter[0] = (bb.min.x + bb.max.x) / 2;
        sphereCenter[1] = (bb.min.z + bb.max.z) / 2;
        geo.translate(-sphereCenter[0], 0, -sphereCenter[1]);
      }

      if (/mainroom/i.test(part.name)) {
        const pos = geo.attributes.position;
        const colors = new Float32Array(part.vCount * 3);
        for (let i = 0; i < part.vCount; i++) {
          const ny = pos.getY(i) * NORM_SCALE - CENTER_Y;
          const c = ny > BAND_Y[0] && ny < BAND_Y[1] ? dark : light;
          colors[i * 3] = c.r;
          colors[i * 3 + 1] = c.g;
          colors[i * 3 + 2] = c.b;
        }
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      }

      if (/^support/i.test(part.name)) {
        geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        supports.push({
          cx: (bb.min.x + bb.max.x) / 2,
          cz: (bb.min.z + bb.max.z) / 2,
          yMin: bb.min.y,
          yMax: bb.max.y,
          radius: Math.min(
            (bb.max.x - bb.min.x) / 2,
            (bb.max.z - bb.min.z) / 2,
          ),
        });
      }

      const edges = new THREE.EdgesGeometry(geo, part.inSphere ? 55 : 25);
      const entry = { name: part.name, inSphere: part.inSphere, geo, edges };
      (part.inSphere ? sphere : body).push(entry);
    }
    return { body, sphere, supports, sphereCenter };
  }, []);
}

// Junction points between lattice bars — extracted at generation time by
// clustering the sphere's vertices, so a white dot lands at every connector.
// Takes the sphere's recentre offset so the dots ride the spinning lattice.
function decodeLatticeNodes(center: [number, number]): Float32Array {
  const buf = b64ToArrayBuffer(LATTICE_NODES);
  const q = new Int16Array(buf);
  const out = new Float32Array(q.length);
  const { min, scale } = TOWER_BOUNDS;
  for (let i = 0; i < q.length; i++) {
    const axis = i % 3;
    const off = axis === 0 ? center[0] : axis === 2 ? center[1] : 0;
    out[i] = ((q[i] + 32768) / QUANT_MAX) * scale + min[axis] - off;
  }
  return out;
}

// Shared toon ramp — three hard steps keeps the flat illustration shading.
function useToonRamp() {
  return useMemo(() => {
    const ramp = new THREE.DataTexture(
      new Uint8Array([80, 170, 255]),
      3,
      1,
      THREE.RedFormat,
    );
    ramp.minFilter = THREE.NearestFilter;
    ramp.magFilter = THREE.NearestFilter;
    ramp.needsUpdate = true;
    return ramp;
  }, []);
}

// The lattice ball: the GLB's PlatonicSphere mesh with slightly transparent
// toon bars plus white dots on every junction. Rides globeRef so it can
// counter-rotate against the sponsor ring.
function LatticeBall({
  sphere,
  nodes,
  ramp,
  materialsRef,
}: {
  sphere: TowerPart[];
  nodes: Float32Array;
  ramp: THREE.DataTexture;
  materialsRef: React.MutableRefObject<THREE.Material[]>;
}) {
  const nodesRef = useRef<THREE.InstancedMesh>(null);

  const mats = useMemo(
    () => ({
      lattice: new THREE.MeshToonMaterial({
        color: COLORS.lattice,
        gradientMap: ramp,
        transparent: true,
        opacity: SPHERE_OPACITY,
      }),
      edge: new THREE.LineBasicMaterial({
        color: COLORS.latticeEdge,
        transparent: true,
      }),
      node: new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
      }),
    }),
    [ramp],
  );

  const nodeGeo = useMemo(
    () => new THREE.SphereGeometry(NODE_RADIUS, 8, 6),
    [],
  );

  useEffect(() => {
    materialsRef.current = [mats.lattice, mats.edge, mats.node];
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
      nodeGeo.dispose();
    };
  }, [mats, nodeGeo, materialsRef]);

  useEffect(() => {
    const m = new THREE.Matrix4();
    const color = new THREE.Color();
    const rand = seededRandom(2026);
    const pick = () => {
      const r = rand();
      let acc = 0;
      for (let i = 0; i < NODE_COLOR_WEIGHTS.length; i++) {
        acc += NODE_COLOR_WEIGHTS[i];
        if (r <= acc) return NODE_COLORS[i];
      }
      return NODE_COLORS[0];
    };
    for (let i = 0; i < nodes.length / 3; i++) {
      m.makeTranslation(nodes[i * 3], nodes[i * 3 + 1], nodes[i * 3 + 2]);
      nodesRef.current?.setMatrixAt(i, m);
      nodesRef.current?.setColorAt(i, color.set(pick()));
    }
    if (nodesRef.current) {
      nodesRef.current.instanceMatrix.needsUpdate = true;
      if (nodesRef.current.instanceColor) {
        nodesRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [nodes]);

  return (
    <>
      {sphere.map((p) => (
        <mesh
          key={p.name}
          geometry={p.geo}
          material={mats.lattice}
          renderOrder={3}
        >
          <lineSegments
            geometry={p.edges}
            material={mats.edge}
            renderOrder={3}
          />
        </mesh>
      ))}
      <instancedMesh
        ref={nodesRef}
        args={[nodeGeo, mats.node, nodes.length / 3]}
        renderOrder={3}
      />
    </>
  );
}

// Body meshes — columns, drum, base. Toon shaded, ink outlines.
function TowerBody({
  body,
  ramp,
}: {
  body: TowerPart[];
  ramp: THREE.DataTexture;
}) {
  const mats = useMemo(
    () => ({
      column: new THREE.MeshToonMaterial({
        color: COLORS.column,
        gradientMap: ramp,
      }),
      drum: new THREE.MeshToonMaterial({
        color: "#ffffff",
        vertexColors: true,
        gradientMap: ramp,
      }),
      base: new THREE.MeshToonMaterial({
        color: COLORS.base,
        gradientMap: ramp,
      }),
      edge: new THREE.LineBasicMaterial({ color: COLORS.ink }),
    }),
    [ramp],
  );
  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats],
  );

  const matFor = (name: string) =>
    /support/i.test(name)
      ? mats.column
      : /mainroom/i.test(name)
        ? mats.drum
        : mats.base;

  return (
    <>
      {body.map((p) => (
        <mesh key={p.name} geometry={p.geo} material={matFor(p.name)}>
          <lineSegments geometry={p.edges} material={mats.edge} />
        </mesh>
      ))}
    </>
  );
}

// Horizontal struts tying the three column shafts together — the real
// tower's legs are braced this way. Cylinders span each pair of supports,
// end points pulled 3/4 of the way into each column surface.
function ConnectorBars({
  supports,
  ramp,
}: {
  supports: SupportInfo[];
  ramp: THREE.DataTexture;
}) {
  const mats = useMemo(
    () => ({
      brace: new THREE.MeshToonMaterial({
        color: COLORS.columnBrace,
        gradientMap: ramp,
      }),
      edge: new THREE.LineBasicMaterial({ color: COLORS.ink }),
    }),
    [ramp],
  );
  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
    },
    [mats],
  );

  const bars = useMemo(() => {
    const list: { geo: THREE.CylinderGeometry; edges: THREE.EdgesGeometry }[] =
      [];
    if (supports.length < 2) return list;
    const pairs: [number, number][] = [
      [0, 1],
      [1, 2 % supports.length],
      [0, 2 % supports.length],
    ];
    for (const [ia, ib] of pairs) {
      const A = supports[ia];
      const B = supports[ib];
      const y0 = Math.max(A.yMin, B.yMin) + 5;
      const y1 = Math.min(A.yMax, B.yMax) - 5;
      if (y1 - y0 < 8) continue;
      const dx = B.cx - A.cx;
      const dz = B.cz - A.cz;
      const dist = Math.hypot(dx, dz);
      const dirX = dx / dist;
      const dirZ = dz / dist;
      const count = Math.max(3, Math.round((y1 - y0) / 8));
      for (let k = 0; k < count; k++) {
        const y = y0 + ((y1 - y0) * (k + 0.5)) / count;
        const ax = A.cx + dirX * A.radius * 0.75;
        const az = A.cz + dirZ * A.radius * 0.75;
        const bx = B.cx - dirX * B.radius * 0.75;
        const bz = B.cz - dirZ * B.radius * 0.75;
        const len = Math.hypot(bx - ax, bz - az);
        const geo = new THREE.CylinderGeometry(0.55, 0.55, len, 8);
        geo.rotateZ(Math.PI / 2); // lie along +X
        geo.rotateY(-Math.atan2(bz - az, bx - ax));
        geo.translate((ax + bx) / 2, y, (az + bz) / 2);
        list.push({ geo, edges: new THREE.EdgesGeometry(geo, 25) });
      }
    }
    return list;
  }, [supports]);

  useEffect(
    () => () => {
      bars.forEach((b) => {
        b.geo.dispose();
        b.edges.dispose();
      });
    },
    [bars],
  );

  return (
    <>
      {bars.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={mats.brace}>
          <lineSegments geometry={b.edges} material={mats.edge} />
        </mesh>
      ))}
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

  const { body, sphere, supports, sphereCenter } = useTowerParts();
  const ramp = useToonRamp();
  const latticeNodes = useMemo(
    () => decodeLatticeNodes(sphereCenter),
    [sphereCenter],
  );

  useEffect(
    () => () => {
      [...body, ...sphere].forEach((p) => {
        p.geo.dispose();
        p.edges.dispose();
      });
    },
    [body, sphere],
  );

  useFrame((_, delta) => {
    const scroll = scrollProgressRef.current ?? 0;

    // Globe materials stay at full opacity the whole scroll — no fade-in.
    globeMaterialsRef.current.forEach((mat) => {
      mat.opacity = SPHERE_OPACITY;
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
      {/* Model normalized like the old GLB pipeline: 420 tall, centered, rotated */}
      <group
        scale={[NORM_SCALE, NORM_SCALE, NORM_SCALE]}
        position={[0, -CENTER_Y, 0]}
        rotation={[0, Math.PI + THREE.MathUtils.degToRad(10), 0]}
      >
        <TowerBody body={body} ramp={ramp} />
        <ConnectorBars supports={supports} ramp={ramp} />
        <group ref={globeRef}>
          {/* renderOrder 3 puts the lattice in front of the logos (order 2) */}
          <LatticeBall
            sphere={sphere}
            nodes={latticeNodes}
            ramp={ramp}
            materialsRef={globeMaterialsRef}
          />
        </group>
      </group>

      {/* The drum is ~2 units off-axis in the model; shift the logo ring over */}
      <group ref={sponsorGroupRef} position={[2.3, 0, 0]}>
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
          {/* Hemisphere wash + warm key light for the toon shading */}
          <hemisphereLight args={["#ffffff", "#776f60", 1.1]} />
          <directionalLight position={[-120, 200, 160]} intensity={1.6} />
          <directionalLight
            position={[140, 40, -100]}
            intensity={0.5}
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
