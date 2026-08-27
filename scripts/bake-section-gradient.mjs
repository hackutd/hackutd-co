// Bakes the section-gradient artwork to a static image.
//
// The artwork is a stack of 13 radial gradients under a 30–44px Gaussian blur
// and a radial mask, on an element up to 1784x928 CSS px that stays mounted for
// the whole page. Live, that is several compositor surfaces of ~26MB each at
// DPR 2. Nothing in it animates — the parent moves, the artwork itself is a
// constant image — so it is baked here once instead.
//
// Because the source is heavily blurred it carries no detail finer than the
// blur radius, which is why a 640px-wide bake upscales to full size with no
// visible loss.
//
//   node scripts/bake-section-gradient.mjs
//
// Writes public/background/section-gradient.png (+ .webp when cwebp exists)
// and a side-by-side comparison at the path printed on exit.

import fs from "node:fs";
import zlib from "node:zlib";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const OUT_W = 640;
const OUT_H = 328;

// Blur radius as a fraction of element width: the live value is
// blur-[clamp(30px,3.75vw,44px)], which on desktop sits at the 44px cap
// against an element ~1784px wide.
const BLUR_FRACTION = 44 / 1784;

// Source of truth for the artwork, lifted verbatim from SectionGradient.tsx.
const LAYERS = [
  "radial-gradient(ellipse 32% 23% at 56% 35%, rgba(184, 211, 255, 0.76) 0%, rgba(113, 157, 255, 0.38) 50%, transparent 91%)",
  "radial-gradient(ellipse 36% 28% at 61% 48%, rgba(65, 120, 255, 1) 0%, rgba(75, 78, 255, 0.82) 52%, transparent 93%)",
  "radial-gradient(ellipse 43% 35% at 66% 63%, rgba(75, 75, 255, 0.86) 0%, rgba(113, 50, 246, 0.58) 53%, transparent 94%)",
  "radial-gradient(ellipse 38% 33% at 72% 80%, rgba(124, 34, 233, 0.68) 0%, rgba(195, 14, 188, 0.46) 52%, transparent 93%)",
  "radial-gradient(ellipse 40% 27% at 8% 100%, rgba(255, 198, 35, 1) 0%, rgba(255, 157, 24, 0.88) 50%, transparent 94%)",
  "radial-gradient(ellipse 48% 31% at 48% 103%, rgba(255, 145, 22, 0.82) 0%, rgba(255, 91, 25, 0.62) 54%, transparent 94%)",
  "radial-gradient(ellipse 43% 36% at 23% 79%, rgba(255, 38, 56, 0.92) 0%, rgba(255, 0, 72, 0.78) 52%, transparent 94%)",
  "radial-gradient(ellipse 46% 40% at 28% 57%, rgba(255, 0, 70, 0.98) 0%, rgba(249, 20, 99, 0.74) 53%, transparent 95%)",
  "radial-gradient(ellipse 43% 39% at 55% 65%, rgba(255, 0, 104, 0.96) 0%, rgba(226, 0, 126, 0.64) 54%, transparent 95%)",
  "radial-gradient(ellipse 38% 35% at 79% 77%, rgba(255, 0, 116, 0.92) 0%, rgba(235, 21, 145, 0.58) 52%, transparent 94%)",
  "radial-gradient(ellipse 34% 24% at 52% 31%, rgba(246, 239, 255, 0.42) 0%, rgba(202, 182, 255, 0.2) 50%, transparent 92%)",
  "radial-gradient(ellipse 145% 52% at 32% 111%, rgba(255, 194, 35, 0.94) 0%, rgba(255, 113, 24, 0.74) 33%, rgba(255, 0, 91, 0.7) 58%, rgba(93, 72, 250, 0.34) 79%, transparent 96%)",
  "radial-gradient(ellipse 108% 92% at 2% 109%, rgba(255, 153, 24, 0.78) 0%, rgba(255, 0, 77, 0.82) 39%, rgba(93, 72, 250, 0.48) 64%, transparent 87%)",
];

const MASK =
  "radial-gradient(ellipse 88% 92% at 0% 100%, #000 0%, rgba(0, 0, 0, 0.96) 42%, rgba(0, 0, 0, 0.68) 62%, rgba(0, 0, 0, 0.18) 78%, transparent 92%)";

// ── Parsing ─────────────────────────────────────────────────
function parseColor(text) {
  const s = text.trim();
  if (s === "transparent") return [0, 0, 0, 0];
  if (s.startsWith("#")) {
    const h = s.slice(1);
    const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
      1,
    ];
  }
  const m = /rgba?\(([^)]+)\)/.exec(s);
  if (!m) throw new Error(`unparsed color: ${s}`);
  const p = m[1].split(",").map((v) => parseFloat(v));
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
}

function parseGradient(text) {
  const inner = /radial-gradient\(([\s\S]*)\)$/.exec(text.trim())[1];
  const head = /^ellipse\s+([\d.]+)%\s+([\d.]+)%\s+at\s+([\d.]+)%\s+([\d.]+)%\s*,/.exec(inner);
  if (!head) throw new Error(`unparsed gradient head: ${inner.slice(0, 60)}`);

  // Split the stop list on commas that are not inside rgba(...)
  const rest = inner.slice(head[0].length);
  const parts = [];
  let depth = 0;
  let buf = "";
  for (const ch of rest) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else buf += ch;
  }
  parts.push(buf);

  const stops = parts.map((p) => {
    const t = p.trim();
    const at = /\s([\d.]+)%$/.exec(t);
    if (!at) throw new Error(`stop without position: ${t}`);
    return { color: parseColor(t.slice(0, at.index)), pos: parseFloat(at[1]) / 100 };
  });

  return {
    rx: parseFloat(head[1]) / 100,
    ry: parseFloat(head[2]) / 100,
    cx: parseFloat(head[3]) / 100,
    cy: parseFloat(head[4]) / 100,
    stops,
  };
}

// ── Evaluation ──────────────────────────────────────────────
// Interpolation runs in premultiplied alpha, the way browsers do it — this is
// what stops a stop fading to `transparent` (which is rgba(0,0,0,0)) from
// dragging a grey fringe through the ramp.
function sampleStops(stops, d) {
  if (d <= stops[0].pos) return stops[0].color;
  const last = stops[stops.length - 1];
  if (d >= last.pos) return last.color;

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (d >= a.pos && d <= b.pos) {
      const t = b.pos === a.pos ? 0 : (d - a.pos) / (b.pos - a.pos);
      const aa = a.color[3];
      const ba = b.color[3];
      const alpha = aa + (ba - aa) * t;
      // premultiply, mix, un-premultiply
      const mix = (i2) => {
        const pa = a.color[i2] * aa;
        const pb = b.color[i2] * ba;
        const pm = pa + (pb - pa) * t;
        return alpha === 0 ? 0 : pm / alpha;
      };
      return [mix(0), mix(1), mix(2), alpha];
    }
  }
  return last.color;
}

function renderGradient(g, w, h) {
  // Premultiplied RGBA float buffer.
  const out = new Float32Array(w * h * 4);
  const cx = g.cx * w;
  const cy = g.cy * h;
  const rx = g.rx * w;
  const ry = g.ry * h;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      const d = Math.sqrt(dx * dx + dy * dy);
      const [r, gg, b, a] = sampleStops(g.stops, d);
      const i = (y * w + x) * 4;
      out[i] = (r / 255) * a;
      out[i + 1] = (gg / 255) * a;
      out[i + 2] = (b / 255) * a;
      out[i + 3] = a;
    }
  }
  return out;
}

/** source-over, both operands premultiplied. */
function over(src, dst, n) {
  for (let i = 0; i < n; i += 4) {
    const ia = 1 - src[i + 3];
    dst[i] = src[i] + dst[i] * ia;
    dst[i + 1] = src[i + 1] + dst[i + 1] * ia;
    dst[i + 2] = src[i + 2] + dst[i + 2] * ia;
    dst[i + 3] = src[i + 3] + dst[i + 3] * ia;
  }
}

// ── Separable Gaussian, on premultiplied data ───────────────
function gaussianKernel(sigma) {
  const radius = Math.max(1, Math.ceil(sigma * 3));
  const k = new Float64Array(radius * 2 + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k[i + radius] = v;
    sum += v;
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  return { k, radius };
}

function blur(buf, w, h, sigma) {
  const { k, radius } = gaussianKernel(sigma);
  const tmp = new Float32Array(buf.length);
  const out = new Float32Array(buf.length);

  // Outside the element is transparent, so out-of-bounds samples contribute
  // nothing — the same edge falloff a real CSS blur produces.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let t = -radius; t <= radius; t++) {
        const sx = x + t;
        if (sx < 0 || sx >= w) continue;
        const wgt = k[t + radius];
        const i = (y * w + sx) * 4;
        r += buf[i] * wgt; g += buf[i + 1] * wgt; b += buf[i + 2] * wgt; a += buf[i + 3] * wgt;
      }
      const o = (y * w + x) * 4;
      tmp[o] = r; tmp[o + 1] = g; tmp[o + 2] = b; tmp[o + 3] = a;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let t = -radius; t <= radius; t++) {
        const sy = y + t;
        if (sy < 0 || sy >= h) continue;
        const wgt = k[t + radius];
        const i = (sy * w + x) * 4;
        r += tmp[i] * wgt; g += tmp[i + 1] * wgt; b += tmp[i + 2] * wgt; a += tmp[i + 3] * wgt;
      }
      const o = (y * w + x) * 4;
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
    }
  }
  return out;
}

// ── PNG encoding ────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(rgba, w, h) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Bake ────────────────────────────────────────────────────
const n = OUT_W * OUT_H * 4;
const composite = new Float32Array(n);

// Later entries sit underneath, so composite bottom-up and let the first
// listed gradient land on top — the same order CSS stacks background layers in.
for (let i = LAYERS.length - 1; i >= 0; i--) {
  over(renderGradient(parseGradient(LAYERS[i]), OUT_W, OUT_H), composite, n);
}

const sigma = BLUR_FRACTION * OUT_W;
const blurred = blur(composite, OUT_W, OUT_H, sigma);

// The mask is applied after the filter, and multiplies alpha only.
const maskGradient = parseGradient(MASK);
const maskBuf = renderGradient(maskGradient, OUT_W, OUT_H);

const rgba = Buffer.alloc(n);
for (let i = 0; i < n; i += 4) {
  const a = blurred[i + 3] * maskBuf[i + 3];
  const unmul = (v) => (blurred[i + 3] === 0 ? 0 : Math.round(Math.min(255, Math.max(0, (v / blurred[i + 3]) * 255))));
  rgba[i] = unmul(blurred[i]);
  rgba[i + 1] = unmul(blurred[i + 1]);
  rgba[i + 2] = unmul(blurred[i + 2]);
  rgba[i + 3] = Math.round(Math.min(255, Math.max(0, a * 255)));
}

fs.mkdirSync("public/background", { recursive: true });

// Only the WebP ships. Everything under public/ is copied into the deploy, so
// the PNG stays in a temp dir as an intermediate for cwebp (and a handy
// full-quality reference when tuning the artwork).
const pngPath = path.join(os.tmpdir(), "section-gradient.png");
fs.writeFileSync(pngPath, encodePng(rgba, OUT_W, OUT_H));
console.log(`intermediate  ${pngPath}  ${OUT_W}x${OUT_H}  ${(fs.statSync(pngPath).size / 1024).toFixed(0)} KB  (sigma ${sigma.toFixed(1)}px)`);

const webpPath = "public/background/section-gradient.webp";
try {
  execFileSync("cwebp", ["-q", "90", "-alpha_q", "100", pngPath, "-o", webpPath], { stdio: "pipe" });
  console.log(`shipped       ${webpPath}  ${(fs.statSync(webpPath).size / 1024).toFixed(0)} KB`);
} catch {
  fs.copyFileSync(pngPath, "public/background/section-gradient.png");
  console.error("cwebp not found — wrote a PNG instead; point the component at it or install cwebp");
  process.exit(1);
}
