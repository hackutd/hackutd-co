// Regenerates the LOGO_DIMENSIONS block in app/data/sponsors.ts by reading the
// intrinsic size out of each logo file's own header. The sponsor grids render
// through next/image, which needs a real aspect ratio to avoid distorting the
// logo or pulling a 4K variant into a 48px-tall slot.
//
//   node scripts/sponsor-logo-dimensions.mjs           # print the block
//   node scripts/sponsor-logo-dimensions.mjs --write   # rewrite it in place
//
// Run from the repository root.

import fs from "node:fs";

const DATA = "app/data/sponsors.ts";
const source = fs.readFileSync(DATA, "utf8");

// Resolve the path constants exactly the way the module does.
const paths = new Map();
for (const m of source.matchAll(/^const\s+([A-Za-z_]\w*)\s*=\s*"(\/[^"]+)";/gm)) {
  paths.set(m[1], m[2]);
}
for (const m of source.matchAll(/^const\s+([A-Za-z_]\w*)\s*=\s*`\$\{SVG_LOC\}\/([^`]+)`;/gm)) {
  paths.set(m[1], `/sponsors/svg/${m[2]}`);
}

const referenced = new Set([...source.matchAll(/img:\s*([A-Za-z_]\w*)\s*,/g)].map((m) => m[1]));

function readDimensions(file) {
  const b = fs.readFileSync(file);
  const ext = file.split(".").pop().toLowerCase();

  if (ext === "png" && b[0] === 0x89) {
    return [b.readUInt32BE(16), b.readUInt32BE(20)];
  }

  if (ext === "webp" && b.slice(0, 4).toString() === "RIFF") {
    const fourcc = b.slice(12, 16).toString();
    if (fourcc === "VP8X") {
      return [(b.readUIntLE(24, 3) & 0xffffff) + 1, (b.readUIntLE(27, 3) & 0xffffff) + 1];
    }
    if (fourcc === "VP8L") {
      const bits = b.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
    if (fourcc === "VP8 ") {
      return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    }
  }

  if (ext === "jpg" || ext === "jpeg") {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = b[i + 1];
      const isSOF = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSOF) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }

  if (ext === "svg") {
    const text = b.toString("utf8").slice(0, 8000);
    const w = /\bwidth="([\d.]+)(?:px)?"/.exec(text);
    const h = /\bheight="([\d.]+)(?:px)?"/.exec(text);
    if (w && h) return [Math.round(+w[1]), Math.round(+h[1])];
    const vb = /viewBox="([-\d.\s,]+)"/.exec(text);
    if (vb) {
      const p = vb[1].trim().split(/[\s,]+/).map(Number);
      if (p.length === 4) return [Math.round(p[2]), Math.round(p[3])];
    }
  }

  return null;
}

const rows = [];
const problems = [];

for (const [name, urlPath] of paths) {
  if (!referenced.has(name)) continue;
  const file = `public${urlPath}`;
  if (!fs.existsSync(file)) {
    problems.push(`${urlPath} — file not found`);
    continue;
  }
  const dims = readDimensions(file);
  if (!dims) {
    problems.push(`${urlPath} — could not read dimensions`);
    continue;
  }
  rows.push([urlPath, dims[0], dims[1]]);
}

rows.sort((a, b) => a[0].localeCompare(b[0]));

const block = rows
  .map(([p, w, h]) => `  "${p}": { width: ${w}, height: ${h} },`)
  .join("\n");

for (const problem of problems) console.warn(`warning: ${problem}`);

if (!process.argv.includes("--write")) {
  console.log(block);
  console.log(`\n// ${rows.length} logos resolved, ${problems.length} problem(s)`);
  process.exit(problems.length ? 1 : 0);
}

const pattern = /(const LOGO_DIMENSIONS: Record<string, \{ width: number; height: number \}> = \{\n)[\s\S]*?(\n\};)/;
if (!pattern.test(source)) {
  console.error(`error: LOGO_DIMENSIONS block not found in ${DATA}`);
  process.exit(1);
}

fs.writeFileSync(DATA, source.replace(pattern, `$1${block}$2`));
console.log(`Wrote ${rows.length} logo dimensions to ${DATA}`);
process.exit(problems.length ? 1 : 0);
