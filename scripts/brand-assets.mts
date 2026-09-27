/**
 * Builds the brand deliverables in brand/ from the preloader's path data so
 * the web preloader, the Lottie file and the video outros share one animation:
 *
 *   brand/hackutd-logo-draw.json             Lottie (trim paths + fades), white glyphs
 *   brand/hackutd-logo-draw-white.webm       VP9 with alpha, white glyphs, 1080x1920 @ 30
 *   brand/hackutd-logo-draw-white-4444.mov   ProRes 4444 with alpha, white glyphs
 *   brand/hackutd-logo-draw-black.webm       same, black glyphs (for light footage)
 *   brand/hackutd-logo-draw-black-4444.mov
 *   brand/hackutd-logo-draw.mp4              H.264, white glyphs on the site dark (Reels)
 *
 * Usage:  node scripts/brand-assets.mts [--lottie] [--video]   (default: both)
 *
 * Video frames are rendered by headless Chrome over CDP (Node's built-in
 * WebSocket, no npm deps) from a throwaway HTML page that reuses the exact
 * keyframes from app/globals.css, scrubbed with the Web Animations API. Needs
 * `google-chrome` and `ffmpeg` on PATH.
 */
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LOGO_ACCENT,
  LOGO_PATHS,
  LOGO_VIEWBOX,
} from "../app/components/preloader/logoPaths.ts";
import {
  LOGO_DRAW,
  OUTRO_HOLD_SECONDS,
} from "../app/components/preloader/sceneConfig.ts";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const OUT = join(ROOT, "brand");
const BASENAME = "hackutd-logo-draw";

/* Site palette — `--theme-background` / `--theme-foreground` in globals.css. */
const INKS = { white: "#ffffff", black: "#1a1a1a" } as const;
type Ink = keyof typeof INKS;
const BACKGROUND = "#1a1a1a";

const STROKE_S = LOGO_DRAW.strokeSeconds;
const STAGGER_S = LOGO_DRAW.staggerSeconds;
const DRAW_TOTAL_S = LOGO_DRAW.drawTotalSeconds;
const FILL_START_S = DRAW_TOTAL_S - LOGO_DRAW.fillLeadSeconds;
const FILL_S = LOGO_DRAW.fillSeconds;
const UNSTROKE_S = LOGO_DRAW.unstrokeSeconds;
const SETTLE_S = LOGO_DRAW.settleSeconds;
const CLIP_S = SETTLE_S + OUTRO_HOLD_SECONDS;

const [, , vbW, vbH] = LOGO_VIEWBOX.split(" ").map(Number);

/* ------------------------------------------------------------------ Lottie */

type Pt = [number, number];

/** Expands the (m/h/v/l/z-only) path data into closed polygons. */
function polygons(d: string): Pt[][] {
  const tokens = d.match(/[a-z]|-?\d*\.?\d+/gi) ?? [];
  const polys: Pt[][] = [];
  let cur: Pt[] = [];
  let x = 0;
  let y = 0;
  let cmd = "";
  let i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-z]/i.test(t)) {
      cmd = t;
      i++;
      if (cmd === "z") {
        if (cur.length) polys.push(cur);
        [x, y] = cur[0] ?? [x, y];
        cur = [];
      }
      continue;
    }
    switch (cmd) {
      case "m":
        if (cur.length) polys.push(cur);
        cur = [];
        x += num();
        y += num();
        cmd = "l";
        break;
      case "l":
        x += num();
        y += num();
        break;
      case "h":
        x += num();
        break;
      case "v":
        y += num();
        break;
      default:
        throw new Error(`unsupported path command ${cmd}`);
    }
    cur.push([x, y]);
  }
  if (cur.length) polys.push(cur);
  return polys;
}

function hexToLottie(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function buildLottie() {
  const fps = 60;
  const f = (s: number) => Math.round(s * fps);
  const pad = 100;
  const ease = { i: { x: [0.35], y: [1] }, o: { x: [0.65], y: [0] } };
  const tween = (t0: number, t1: number, a: number, b: number) => ({
    a: 1,
    k: [
      { t: f(t0), s: [a], ...ease },
      { t: f(t1), s: [b] },
    ],
  });
  const last = LOGO_PATHS.length - 1;

  const groups = LOGO_PATHS.map((p, idx) => {
    const color = hexToLottie(p.accent ? LOGO_ACCENT : INKS.white);
    const delay = (STAGGER_S * idx) / last;
    return {
      ty: "gr",
      nm: `glyph-${idx}`,
      it: [
        ...polygons(p.d).map((poly) => ({
          ty: "sh",
          ks: {
            a: 0,
            k: {
              c: true,
              v: poly,
              i: poly.map(() => [0, 0]),
              o: poly.map(() => [0, 0]),
            },
          },
        })),
        {
          ty: "tm",
          nm: "draw",
          s: { a: 0, k: 0 },
          e: tween(delay, delay + STROKE_S, 0, 100),
          o: { a: 0, k: 0 },
          m: 1,
        },
        {
          ty: "fl",
          nm: "fill",
          c: { a: 0, k: [...color, 1] },
          o: tween(FILL_START_S, FILL_START_S + FILL_S, 0, 100),
          r: 1,
        },
        {
          ty: "st",
          nm: "stroke",
          c: { a: 0, k: [...color, 1] },
          o: tween(FILL_START_S, FILL_START_S + UNSTROKE_S, 100, 0),
          w: { a: 0, k: 10 },
          lc: 2,
          lj: 2,
        },
        {
          ty: "tr",
          p: { a: 0, k: [p.x + pad, p.y + pad] },
          a: { a: 0, k: [0, 0] },
          s: { a: 0, k: [100, 100] },
          r: { a: 0, k: 0 },
          o: { a: 0, k: 100 },
        },
      ],
    };
  });

  const w = vbW + pad * 2;
  const h = vbH + pad * 2;
  const lottie = {
    v: "5.12.1",
    nm: "HackUTD logo draw",
    fr: fps,
    ip: 0,
    op: f(SETTLE_S),
    w,
    h,
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ty: 4,
        nm: "logo",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [0, 0, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: groups,
        ip: 0,
        op: f(SETTLE_S),
        st: 0,
        bm: 0,
      },
    ],
    markers: [],
  };
  writeFileSync(join(OUT, `${BASENAME}.json`), JSON.stringify(lottie));
  console.log(`wrote brand/${BASENAME}.json (${w}x${h}, ${f(SETTLE_S)}f)`);
}

/* ------------------------------------------------------------------- Video */

const W = 1080;
const H = 1920;
const FPS = 30;

function frameHtml(ink: string): string {
  const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
  // Everything from the logo section banner onward is plain CSS; the Tailwind
  // import and theme blocks above it are not needed here.
  const logoCss = css.slice(css.indexOf("/* ── Logo draw-on"));
  const last = LOGO_PATHS.length - 1;
  const paths = LOGO_PATHS.map(
    (p, i) =>
      `<path d="${p.d}" transform="translate(${p.x} ${p.y})" pathLength="1" class="logo-draw-path" style="--logo-i:${i / last};${p.accent ? `color:${LOGO_ACCENT}` : ""}"/>`,
  ).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:${W}px;height:${H}px;background:transparent;overflow:hidden}
body{display:grid;place-items:center;color:${ink}}
body.bg{background:${BACKGROUND}}
svg{width:${Math.round(W * 0.8)}px}
${logoCss}
</style></head><body>
<svg viewBox="${LOGO_VIEWBOX}" fill="none" stroke-linejoin="round" stroke-linecap="round">${paths}</svg>
<script>
window.seek = (ms) => {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
};
</script></body></html>`;
}

type CdpResult = Record<string, string>;
type CdpMessage = {
  id?: number;
  result?: CdpResult;
  error?: { message: string };
};
type Cdp = {
  send: (
    method: string,
    params?: object,
    sessionId?: string,
  ) => Promise<CdpResult>;
  close: () => void;
};

async function connectCdp(port: number): Promise<Cdp> {
  let version: { webSocketDebuggerUrl: string } | undefined;
  for (let i = 0; i < 50 && !version; i++) {
    try {
      version = await (
        await fetch(`http://127.0.0.1:${port}/json/version`)
      ).json();
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  if (!version) throw new Error("chrome did not expose a debugging port");
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise<void>((ok, err) => {
    ws.onopen = () => ok();
    ws.onerror = () => err(new Error("cdp websocket failed"));
  });
  const pending = new Map<
    number,
    [(v: CdpResult) => void, (e: Error) => void]
  >();
  let id = 0;
  ws.onmessage = (ev) => {
    const msg: CdpMessage = JSON.parse(String(ev.data));
    const p = msg.id === undefined ? undefined : pending.get(msg.id);
    if (!p || msg.id === undefined) return;
    pending.delete(msg.id);
    if (msg.error) p[1](new Error(msg.error.message));
    else p[0](msg.result ?? {});
  };
  return {
    send: (method, params = {}, sessionId) =>
      new Promise((ok, err) => {
        const msgId = ++id;
        pending.set(msgId, [ok, err]);
        ws.send(JSON.stringify({ id: msgId, method, params, sessionId }));
      }),
    close: () => ws.close(),
  };
}

async function renderFrames(dir: string, ink: Ink, transparent: boolean) {
  const html = join(dir, "frame.html");
  writeFileSync(html, frameHtml(INKS[ink]));
  const port = 9333;
  const profile = join(dir, "chrome-profile");
  const chrome = spawn(
    "google-chrome",
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--hide-scrollbars",
      `--window-size=${W},${H}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  try {
    const cdp = await connectCdp(port);
    const { targetId } = await cdp.send("Target.createTarget", {
      url: "about:blank",
    });
    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    const s = (m: string, p?: object) => cdp.send(m, p, sessionId);
    await s("Page.enable");
    await s("Runtime.enable");
    await s("Emulation.setDeviceMetricsOverride", {
      width: W,
      height: H,
      deviceScaleFactor: 1,
      mobile: false,
    });
    if (transparent) {
      await s("Emulation.setDefaultBackgroundColorOverride", {
        color: { r: 0, g: 0, b: 0, a: 0 },
      });
    }
    await s("Page.navigate", { url: `file://${html}` });
    await s("Runtime.evaluate", {
      expression: `new Promise(r => document.readyState === 'complete' ? r() : addEventListener('load', r))`,
      awaitPromise: true,
    });
    if (!transparent) {
      await s("Runtime.evaluate", {
        expression: "document.body.classList.add('bg')",
      });
    }
    const total = Math.round(CLIP_S * FPS);
    for (let i = 0; i < total; i++) {
      const ms = Math.min((i / FPS) * 1000, SETTLE_S * 1000);
      await s("Runtime.evaluate", { expression: `seek(${ms})` });
      const { data } = await s("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      writeFileSync(
        join(dir, `f${String(i).padStart(4, "0")}.png`),
        Buffer.from(data, "base64"),
      );
    }
    cdp.close();
    return total;
  } finally {
    chrome.kill();
  }
}

function ffmpeg(args: string[]) {
  execFileSync(
    "ffmpeg",
    ["-y", "-hide_banner", "-loglevel", "error", ...args],
    {
      stdio: "inherit",
    },
  );
}

async function buildVideo() {
  const dir = join(tmpdir(), `${BASENAME}-frames`);
  const fresh = () => {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  };
  const input = ["-framerate", String(FPS), "-i", join(dir, "f%04d.png")];

  for (const ink of Object.keys(INKS) as Ink[]) {
    fresh();
    const frames = await renderFrames(dir, ink, true);
    console.log(`rendered ${frames} transparent ${ink} frames`);
    ffmpeg([
      ...input,
      "-c:v",
      "libvpx-vp9",
      "-pix_fmt",
      "yuva420p",
      "-b:v",
      "0",
      "-crf",
      "24",
      "-auto-alt-ref",
      "0",
      "-metadata:s:v:0",
      "alpha_mode=1",
      join(OUT, `${BASENAME}-${ink}.webm`),
    ]);
    ffmpeg([
      ...input,
      "-c:v",
      "prores_ks",
      "-profile:v",
      "4444",
      "-pix_fmt",
      "yuva444p10le",
      "-vendor",
      "apl0",
      join(OUT, `${BASENAME}-${ink}-4444.mov`),
    ]);
  }

  fresh();
  await renderFrames(dir, "white", false);
  ffmpeg([
    ...input,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "18",
    "-preset",
    "slow",
    "-movflags",
    "+faststart",
    join(OUT, `${BASENAME}.mp4`),
  ]);
  rmSync(dir, { recursive: true, force: true });
  console.log(
    `wrote brand/${BASENAME}-{white,black}.{webm,-4444.mov} + ${BASENAME}.mp4 (${W}x${H} @ ${FPS}fps, ${CLIP_S}s)`,
  );
}

const args = new Set(process.argv.slice(2));
const all = !args.has("--lottie") && !args.has("--video");
mkdirSync(OUT, { recursive: true });
if (all || args.has("--lottie")) buildLottie();
if (all || args.has("--video")) await buildVideo();
