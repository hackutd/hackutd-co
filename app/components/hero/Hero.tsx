"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { HERO_SCENE_DATA_ATTR } from "../background/sceneConfig";
import CometAnimation from "./CometAnimation";
import SkyElements from "./SkyElements";
import {
  HERO_COPY,
  HERO_COMET_SHADER,
  HERO_LAYOUT,
  HERO_SCENE_SCROLL,
  HERO_SKYLINE,
  HERO_SKYLINE_MASK,
  HERO_STARS,
  HERO_WHITEOUT,
} from "./sceneConfig";
import dynamic from "next/dynamic";

const CometTrailBackground = dynamic(
  () => import("./CometTrailBackground"),
  { ssr: false },
);

configureScrollTrigger();

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const starsLayerRef = useRef<HTMLDivElement>(null);
  const cometBackgroundLayerRef = useRef<HTMLDivElement>(null);
  const skyLayerRef = useRef<HTMLDivElement>(null);
  const skylineLayerRef = useRef<HTMLDivElement>(null);
  const cometLayerRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const starsLayer = starsLayerRef.current;
      const cometBackgroundLayer = cometBackgroundLayerRef.current;
      const skyLayer = skyLayerRef.current;
      const skylineLayer = skylineLayerRef.current;
      const cometLayer = cometLayerRef.current;
      const heroText = heroTextRef.current;

      if (!section) {
        return;
      }

      if (prefersReducedMotion) {
        if (cometBackgroundLayer) {
          if (isMobile) {
            gsap.set(cometBackgroundLayer, {
              background:
                "linear-gradient(150deg, #4a0eff 0%, #6C17FE 20%, #9B30FF 40%, #F31667 65%, #ff6b4a 85%, #FFA21F 100%)",
            });
          }
          gsap.set(cometBackgroundLayer, { autoAlpha: 1 });
        }
        if (heroText) {
          gsap.set(heroText, { opacity: 1 });
        }
        return;
      }

      // On real phones, momentum scrolling traverses the full hero in under a
      // second. A numeric scrub adds lag, and because the reveal and whiteout
      // are separate tweens their catch-up windows don't overlap — creating a
      // visible gradient flash. `true` = zero lag, exact scroll tracking.
      const scrub = isMobile ? true : HERO_SCENE_SCROLL.scrub;

      if (heroText) {
        gsap.set(heroText, { autoAlpha: 1 });
      }

      if (cometBackgroundLayer) {
        // On mobile, use a CSS gradient instead of the WebGL canvas. Mobile
        // GPUs promote WebGL canvases inside SVG foreignObject to independent
        // compositing layers that ignore parent opacity/visibility, causing
        // the gradient to paint through even when autoAlpha is 0. Setting
        // the background here (not in JSX) guarantees it appears atomically
        // with autoAlpha: 0 — the gradient is never in the DOM before GSAP
        // hides it.
        if (isMobile) {
          gsap.set(cometBackgroundLayer, {
            background:
              "linear-gradient(150deg, #4a0eff 0%, #6C17FE 20%, #9B30FF 40%, #F31667 65%, #ff6b4a 85%, #FFA21F 100%)",
          });
        }
        gsap.set(cometBackgroundLayer, { autoAlpha: 0 });
        gsap.to(cometBackgroundLayer, {
          autoAlpha: 1,
          ease: HERO_COMET_SHADER.reveal.ease,
          scrollTrigger: {
            trigger: section,
            start: HERO_COMET_SHADER.reveal.start,
            end: HERO_COMET_SHADER.reveal.end,
            scrub,
          },
        });
      }

      const sceneFadeTargets = [
        skyLayer,
        skylineLayer,
        starsLayer,
        cometBackgroundLayer,
        cometLayer,
      ].filter((el): el is HTMLDivElement => el !== null);

      if (sceneFadeTargets.length > 0) {
        gsap.to(sceneFadeTargets, {
          autoAlpha: 0,
          ease: HERO_WHITEOUT.scene.ease,
          scrollTrigger: {
            trigger: section,
            start: HERO_WHITEOUT.scene.start,
            end: HERO_WHITEOUT.scene.end,
            scrub,
          },
        });
      }

      if (heroText) {
        gsap.to(heroText, {
          autoAlpha: 0,
          ease: HERO_WHITEOUT.text.ease,
          scrollTrigger: {
            trigger: section,
            start: HERO_WHITEOUT.text.start,
            end: HERO_WHITEOUT.text.end,
            scrub,
          },
        });
      }
    },
    { scope: sectionRef, dependencies: [isMobile, prefersReducedMotion] },
  );

  return (
    <section
      ref={sectionRef}
      {...{ [HERO_SCENE_DATA_ATTR]: "" }}
      className={`relative ${HERO_LAYOUT.minHeight}`}
    >
      <div
        style={
          { [HERO_SKYLINE.heightVar]: HERO_SKYLINE.height } as CSSProperties
        }
        className={`sticky top-0 overflow-hidden isolate ${HERO_LAYOUT.stickyViewportHeight}`}
      >
        <div
          ref={starsLayerRef}
          aria-hidden="true"
          className="absolute inset-0 z-1"
        >
          {HERO_STARS.map((star) => {
            const style = {
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            } satisfies CSSProperties;

            return (
              <span
                key={star.id}
                className="hero-star absolute bg-(--color-amber)"
                style={style}
              />
            );
          })}
        </div>

        <div
          ref={cometBackgroundLayerRef}
          aria-hidden="true"
          className="absolute inset-0 z-2"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          {!isMobile && <CometTrailBackground />}
        </div>

        {/* Sky before buildings: same z, so DOM order alone puts the flock
            behind the skyline. */}
        <SkyElements ref={skyLayerRef} />

        {/* Pinned to the foot of the sticky viewport at every size: the layer is
            as tall as the art needs to span the full width, floored so it stays
            substantial on phones and capped so it can't swallow short landscape
            viewports. The centered `contain` mask keeps the full skyline visible
            and allows breathing room at either side.

            `bg-foreground` is the ink; the artwork is only the stencil (see
            HERO_SKYLINE_MASK), so the skyline follows the site theme by way of
            the same token as body text — no per-theme asset, no swap. */}
        <div
          ref={skylineLayerRef}
          aria-hidden="true"
          style={HERO_SKYLINE_MASK}
          className={`pointer-events-none absolute inset-x-0 z-0 bg-foreground ${HERO_SKYLINE.layerBox}`}
        />

        {/* Comet SVG layer */}
        <div ref={cometLayerRef} className="absolute inset-0 z-10">
          <CometAnimation />
        </div>

        <div
          ref={heroTextRef}
          className={`relative z-20 flex h-full flex-col items-center justify-center px-5 text-center md:px-8 ${HERO_LAYOUT.textLift}`}
        >
          <p className="mb-2 font-serif text-base font-normal italic sm:text-lg md:mb-3 md:text-xl">
            {HERO_COPY.eyebrow}
          </p>
          <h1 className="w-full min-w-0 max-w-[20ch] font-sans text-[2rem] font-bold leading-[1.1] sm:max-w-[26ch] sm:text-[2.5rem] md:max-w-[40ch] md:text-5xl lg:text-[3.5rem]">
            {HERO_COPY.headline}
          </h1>
        </div>
      </div>
    </section>
  );
}
