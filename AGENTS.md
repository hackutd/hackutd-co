# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

## Project Overview

HackUTD organization website — a single-page Next.js 16 App Router site for the largest 24-hour hackathon in Texas. The page is composed of sequential full-screen sections (Navbar, Hero, Mission, DirectorsMessage, Constellation, Projects, Timeline, Sponsors, Footer) assembled in `app/page.tsx`.

## Commands

- `npm run dev` — local dev server at localhost:3000
- `npm run build` — production build (run before PRs)
- `npm run lint` — ESLint with Next.js Core Web Vitals + TypeScript rules (run before PRs)

No test runner is configured.

## Architecture

- **Stack**: Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, GSAP for animations
- **Font**: Satoshi (local woff2 in `app/fonts/`, loaded via `next/font/local`, exposed as `--font-satoshi`)
- **Design tokens**: brand palette and semantic colors defined as `@theme inline` in `app/globals.css` — not in a Tailwind config file
- **Import alias**: `@/*` maps to project root

## Key Patterns

- **GSAP + ScrollTrigger**: Hero section uses scroll-driven GSAP timelines for parallax skylines and a comet reveal animation. Animation parameters are centralized in `app/components/hero/sceneConfig.ts`. Components that use GSAP must be `"use client"` and call `gsap.registerPlugin(ScrollTrigger)`.
- **Reduced motion**: GSAP animations check `prefers-reduced-motion` and fall back to static states.
- **Animated section structure**: For animation-heavy sections such as Hero and Mission, keep the folder organized around a main `Section.tsx` plus a colocated `sceneConfig.ts`. Put scroll ranges, timing values, copy, layout constants, and other tunables in `sceneConfig.ts`; keep the TSX focused on refs, rendering, and timeline wiring.
- **Motion hooks**: Prefer shared client hooks such as `useIsMobile` and `usePrefersReducedMotion` for responsive animation branching instead of repeating inline media query listeners inside section components.
- **Seeded randomness**: Star positions use a deterministic PRNG (not `Math.random()`) so layout is consistent across renders.

## Conventions

- TypeScript strict mode, 2-space indent, semicolons, double quotes
- PascalCase component files, one component per file in `app/components/`
- Conventional Commits: `feat:`, `fix:`, `chore:`, etc.
- Utility-first Tailwind in JSX; custom CSS only for keyframes/animations in `globals.css`
