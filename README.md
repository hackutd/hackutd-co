# hackutd.co

Marketing site for [HackUTD](https://hackutd.co), the University of Texas at Dallas hackathon. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and GSAP, deployed on Vercel.

## Getting started

Requires Node 20+.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # eslint
```

## Project layout

```
app/
  layout.tsx            root layout: theme, <Preloader />, page, <SiteCursor />
  page.tsx              single-page site, one section per component
  globals.css           Tailwind theme tokens + keyframe animations
  (legal)/              /privacy and /terms
  assets/               brand SVGs, hero artwork, baked backgrounds
  components/
    preloader/          logo + skyline draw-on overlay shown on first load
    hero/               sticky hero with Dallas skyline, sky elements, comet
    navbar/, footer/    site chrome (mobile menu is a blurred overlay)
    mission/, timeline/, projects/, sponsors/, teams/   page sections
    background/         SectionGradient (baked artwork) and scene config
    cursor/, theme/     custom cursor, dark/light theme
    ui/                 shared buttons and cards
  data/                 events, projects, sponsors, officer teams (edit here)
  hooks/                usePrefersReducedMotion, useIsMobile, useNearViewport, ...
brand/                  generated logo animation deliverables (Lottie, WebM, MOV, MP4)
scripts/                asset generators (see below)
```

Animation-heavy components keep their numbers in a colocated `sceneConfig.ts`. The hero and preloader share `app/components/hero/sceneConfig.ts` so the skyline the preloader draws lands exactly on the one the hero renders.

## Content updates

Most copy and lists live in `app/data/`:

- `events.ts` — timeline
- `projects.ts` — featured projects
- `sponsors.ts` — sponsor tiers and logos (assets in `app/assets/`)
- `officer-teams.json` — team members

## Preloader

`app/components/preloader/Preloader.tsx` is a fixed overlay that strokes the HackUTD wordmark and the hero's Dallas skyline on with pure SVG + CSS (no Lottie runtime), cross-fades the skyline into the hero's real artwork, then fades out and unmounts after `LOGO_DRAW.settleSeconds`. It respects `prefers-reduced-motion` (static logo, short hold) and must stay before `{children}` in `app/layout.tsx`. Timing lives in `app/components/preloader/sceneConfig.ts` and is mirrored by the brand asset generator.

## Scripts

| Command                                 | Purpose                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `node scripts/brand-assets.mts`         | Regenerates everything in `brand/` (Lottie JSON, alpha WebM, ProRes 4444 MOV, Reels MP4) from `logoPaths.ts`. Needs `google-chrome` and `ffmpeg`. |
| `python3 scripts/trace-skyline.py`      | Re-traces `app/assets/hero/skyline.png` into `app/components/preloader/skylinePaths.ts`. Needs Pillow + potracer. |
| `node scripts/bake-section-gradient.mjs` | Bakes the section gradient to `app/assets/background/section-gradient.webp`.                                     |

See [`brand/README.md`](brand/README.md) for the deliverable list and animation timing.

## Conventions

- TypeScript, two-space indent, semicolons, double quotes; PascalCase component files.
- Honor reduced motion for every animation.
- Run `npm run lint` and `npm run build` before opening a PR. No test runner is configured.
- `SiteCursor` must remain the last child of `<body>`.
