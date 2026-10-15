// Parse a GLB: extract every mesh's baked world-space geometry, quantized,
// plus lattice junction points (for node lights), emitted as a TS module.
// Usage: node parse-glb.mjs <file.glb> <out.ts>
import { readFileSync, writeFileSync } from "fs";

const file = process.argv[2];
const outFile = process.argv[3] || "/tmp/towerGeometry.ts";

const buf = readFileSync(file);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("not a glb");
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
const bin = buf.subarray(20 + jsonLen + 8);

const COMP = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function readAccessor(idx) {
  const acc = json.accessors[idx];
  const bv = json.bufferViews[acc.bufferView];
  const T = COMP[acc.componentType];
  const n = NCOMP[acc.type];
  const stride = bv.byteStride || n * T.BYTES_PER_ELEMENT;
  const base = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const out = new T(acc.count * n);
  if (stride === n * T.BYTES_PER_ELEMENT) {
    out.set(new T(bin.buffer, bin.byteOffset + base, acc.count * n));
  } else {
    for (let i = 0; i < acc.count; i++) {
      const o = base + i * stride;
      for (let c = 0; c < n; c++) out[i * n + c] = new T(bin.buffer, bin.byteOffset + o + c * T.BYTES_PER_ELEMENT, 1)[0];
    }
  }
  return out;
}

function mat4FromNode(node) {
  if (node.matrix) return node.matrix;
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  const [qx, qy, qz, qw] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const x2 = qx + qx, y2 = qy + qy, z2 = qz + qz;
  const xx = qx * x2, xy = qx * y2, xz = qx * z2;
  const yy = qy * y2, yz = qy * z2, zz = qz * z2;
  const wx = qw * x2, wy = qw * y2, wz = qw * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}
function mulMat(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
    for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
const xform = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];

const sphereNodeIndices = new Set();
function findSphere(idx, inside) {
  const node = json.nodes[idx];
  const inSphere = inside || /platonic/i.test(node.name || "");
  if (inSphere) sphereNodeIndices.add(idx);
  (node.children || []).forEach((c) => findSphere(c, inSphere));
}
(json.scenes[json.scene || 0].nodes || []).forEach((n) => findSphere(n, false));

const meshes = [];
function walk(idx, parentM, inSphere) {
  const node = json.nodes[idx];
  const m = mulMat(parentM, mat4FromNode(node));
  const hereInSphere = inSphere || sphereNodeIndices.has(idx);
  if (node.mesh !== undefined) {
    const mesh = json.meshes[node.mesh];
    for (const prim of mesh.primitives || []) {
      if (prim.mode !== undefined && prim.mode !== 4) continue;
      const pos = readAccessor(prim.attributes.POSITION);
      const nor = prim.attributes.NORMAL !== undefined ? readAccessor(prim.attributes.NORMAL) : null;
      const idxArr = prim.indices !== undefined ? readAccessor(prim.indices) : null;
      const count = pos.length / 3;
      const baked = new Float32Array(pos.length);
      const bakedN = nor ? new Float32Array(nor.length) : null;
      for (let i = 0; i < count; i++) {
        const [x, y, z] = xform(m, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
        baked[i * 3] = x; baked[i * 3 + 1] = y; baked[i * 3 + 2] = z;
        if (bakedN) {
          // Normal matrix = upper 3x3 (uniform-ish scale in this model)
          const [nx, ny, nz] = xform(m, nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]);
          const [ox, oy, oz] = xform(m, 0, 0, 0);
          let vx = nx - ox, vy = ny - oy, vz = nz - oz;
          const l = Math.hypot(vx, vy, vz) || 1;
          bakedN[i * 3] = vx / l; bakedN[i * 3 + 1] = vy / l; bakedN[i * 3 + 2] = vz / l;
        }
      }
      let indices;
      if (idxArr) { indices = new Uint32Array(idxArr.length); indices.set(idxArr); }
      else { indices = new Uint32Array(count); for (let i = 0; i < count; i++) indices[i] = i; }
      meshes.push({ name: node.name || mesh.name || `mesh${node.mesh}`, inSphere: hereInSphere, positions: baked, normals: bakedN, indices });
    }
  }
  (node.children || []).forEach((c) => walk(c, m, hereInSphere));
}
const I = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
(json.scenes[json.scene || 0].nodes || []).forEach((n) => walk(n, I, false));

// Global bbox for quantization
let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
for (const m of meshes) for (let i = 0; i < m.positions.length; i += 3)
  for (let a = 0; a < 3; a++) {
    mn[a] = Math.min(mn[a], m.positions[i + a]);
    mx[a] = Math.max(mx[a], m.positions[i + a]);
  }
const scale = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);

// Lattice junction points: cluster sphere verts into ~0.9-unit cells, centroid each
const CELL = 0.9;
const cells = new Map();
for (const m of meshes.filter((x) => x.inSphere)) {
  for (let i = 0; i < m.positions.length; i += 3) {
    const key = `${Math.round(m.positions[i] / CELL)},${Math.round(m.positions[i + 1] / CELL)},${Math.round(m.positions[i + 2] / CELL)}`;
    let c = cells.get(key);
    if (!c) { c = [0, 0, 0, 0]; cells.set(key, c); }
    c[0] += m.positions[i]; c[1] += m.positions[i + 1]; c[2] += m.positions[i + 2]; c[3]++;
  }
}
const nodes = [];
for (const c of cells.values()) nodes.push([c[0] / c[3], c[1] / c[3], c[2] / c[3]]);
console.log(`junction clusters: ${nodes.length}`);

// Pack quantized buffers
const chunks = [];
let offset = 0;
const pad = () => { const p = (4 - (offset % 4)) % 4; if (p) { chunks.push(Buffer.alloc(p)); offset += p; } };
const manifest = [];
for (const m of meshes) {
  const qp = new Int16Array(m.positions.length);
  for (let i = 0; i < m.positions.length; i++) {
    const a = i % 3;
    qp[i] = Math.round(((m.positions[i] - mn[a]) / scale) * 65535 - 32768);
  }
  const qn = m.normals ? new Int8Array(m.normals.length) : null;
  if (qn) for (let i = 0; i < m.normals.length; i++) qn[i] = Math.round(m.normals[i] * 127);
  const qi = new Uint16Array(m.indices.length);
  for (let i = 0; i < m.indices.length; i++) qi[i] = m.indices[i];
  const pB = Buffer.from(qp.buffer), nB = qn ? Buffer.from(qn.buffer) : null, iB = Buffer.from(qi.buffer);
  pad();
  const posOff = offset; chunks.push(pB); offset += pB.length;
  let normOff = -1;
  if (nB) { normOff = offset; chunks.push(nB); offset += nB.length; }
  pad();
  const idxOff = offset; chunks.push(iB); offset += iB.length;
  manifest.push({ name: m.name, inSphere: m.inSphere, vCount: m.positions.length / 3, iCount: m.indices.length, posOff, normOff, idxOff });
}
const dataB64 = Buffer.concat(chunks).toString("base64");

const qn2 = new Int16Array(nodes.length * 3);
nodes.forEach((n, i) => {
  for (let a = 0; a < 3; a++) qn2[i * 3 + a] = Math.round(((n[a] - mn[a]) / scale) * 65535 - 32768);
});
const nodesB64 = Buffer.from(qn2.buffer).toString("base64");

const ts = `// Generated from public/models/sponsor-globe-flat-4.glb (main branch) —
// the GLB was dropped to avoid the download + loader; this is the same baked
// world-space geometry, quantized. Regenerate with scripts/extract-tower.mjs.
/* eslint-disable */
export const TOWER_BOUNDS = { min: [${mn.join(",")}], max: [${mx.join(",")}], scale: ${scale} };
export const TOWER_PARTS: { name: string; inSphere: boolean; vCount: number; iCount: number; posOff: number; normOff: number; idxOff: number }[] = ${JSON.stringify(manifest)};
export const TOWER_DATA = "${dataB64}";
export const LATTICE_NODES = "${nodesB64}";
`;
writeFileSync(outFile, ts);
console.log(`wrote ${outFile}: ${(ts.length / 1024).toFixed(0)}KB, ${meshes.length} parts, ${nodes.length} nodes`);
