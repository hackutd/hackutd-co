# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HackUTD organization website — a single-page Next.js 16 App Router site for the largest 24-hour hackathon in Texas. The page is composed of sequential full-screen sections (Navbar, Hero, Mission, Teams, Projects, Timeline, Sponsors, Footer) assembled in `app/page.tsx`.

## Commands

- `npm run dev` — local dev server at localhost:3000
- `npm run build` — production build (run before PRs)
- `npm run lint` — ESLint with Next.js Core Web Vitals + TypeScript rules (run before PRs)

No test runner is configured.

## Verification

Do not run the dev server, start the site, curl pages, or otherwise test changes — the user runs and tests the site themselves. Make the code changes and hand them off. Only run `npm run build` / `npm run lint` when the user explicitly asks for it.

## Architecture

- **Stack**: Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, GSAP for animations
- **Font**: Satoshi (local woff2 in `app/fonts/`, loaded via `next/font/local`, exposed as `--font-satoshi`)
- **Design tokens**: brand palette and semantic colors defined as `@theme inline` in `app/globals.css` — not in a Tailwind config file
- **Import alias**: `@/*` maps to project root
- **Static data**: Content for sections lives in `app/data/` (teams, events, sponsors, projects, mission)
- **Shared hooks**: `app/hooks/useIsMobile.ts` and `app/hooks/usePrefersReducedMotion.ts`
- **Assets**: Images referenced from code live in `app/assets/<section>/` and are statically imported (`import art from "@/app/assets/hero/skyline.png"`), so `next/image` reads intrinsic dimensions from the file and a missing file fails the build. Never hand-write an image's width/height/aspect in code — derive it from the import (`art.width / art.height`); for CSS `url()` or SVG `<image href>` use `art.src`. `public/` is only for files that need a stable runtime URL: `models/*.glb` (Three.js loader), `Sponsorship-Packet.pdf` (shared link), and `officers/` headshots (referenced from `officer-teams.json`, which cannot import). Do not name asset files `icon.*`, `apple-icon.*`, `opengraph-image.*`, `twitter-image.*`, or `favicon.ico` inside `app/` — those are App Router metadata conventions.

## Key Patterns

- **GSAP + ScrollTrigger**: Animated sections (Hero, Mission) use scroll-driven GSAP tweens/timelines via `@gsap/react`'s `useGSAP` hook. Animation parameters are centralized in per-section `sceneConfig.ts` files. ScrollTrigger is registered once via `app/lib/scrollTrigger.ts` (`configureScrollTrigger()`). Components that use GSAP must be `"use client"`.
- **GSAP best practices**: Use top-level scrubbed tweens/timelines — never put ScrollTrigger on child tweens inside a timeline. Prefer `gsap.to()`/`gsap.fromTo()` with `scrollTrigger` config over manual `gsap.set()` inside `onUpdate` callbacks. Always pass `scope` or direct refs in `useGSAP`.
- **Navbar theme coordination**: Sections communicate navbar color theme via `dispatchNavbarThemeOverride()` custom events (in `app/components/navbar/navbarThemeOverride.ts`), triggered by ScrollTrigger callbacks (`onEnter`/`onLeave`/`onEnterBack`/`onLeaveBack`).
- **Reduced motion**: GSAP animations check `prefers-reduced-motion` and fall back to static states. The reduced-motion path renders plain HTML without any GSAP setup.
- **Seeded randomness**: Star positions use a deterministic PRNG (not `Math.random()`) so layout is consistent across renders.

## Conventions

- TypeScript strict mode, 2-space indent, semicolons, double quotes
- PascalCase component files, one component per file in `app/components/<section>/`
- Conventional Commits: `feat:`, `fix:`, `chore:`, etc.
- Utility-first Tailwind in JSX; custom CSS only for keyframes/animations in `globals.css`
