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
  HERO_SKYLINE_STROKE_FILTER,
  HERO_STARS,
  HERO_WHITEOUT,
  MOBILE_SCRUB,
} from "./sceneConfig";
import CometTrailBackground from "./CometTrailBackground";

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
          gsap.set(cometBackgroundLayer, { autoAlpha: 1 });
        }
        if (heroText) {
          gsap.set(heroText, { opacity: 1 });
        }
        return;
      }

      const scrub = isMobile ? MOBILE_SCRUB : HERO_SCENE_SCROLL.scrub;

      // Layers that are simply on screen from the top of the page. The shader
      // gradient is deliberately not among them: it starts hidden and reveals on
      // its own range below, then leaves with everything else in the whiteout.
      const restingLayers = [
        skyLayer,
        skylineLayer,
        starsLayer,
        cometLayer,
      ].filter((el): el is HTMLDivElement => el !== null);

      // Every state below is declared rather than inferred.
      //
      // A plain `gsap.to()` reads its start value off the live element the first
      // time it renders. This scene is rebuilt whenever `isMobile` flips, and a
      // rebuild that lands while the whiteout is part-way through would have a
      // `to()` record "hidden" as these layers' resting state — after which they
      // animate hidden to hidden and never come back. The gradient used to be the
      // only layer that recovered, purely because it alone had a `set()` baseline
      // ahead of its tween. So: state the baseline up front, and give every tween
      // a literal `from`.
      //
      // `immediateRender: false` keeps those literal starts from being written at
      // build time, where the whiteout's `autoAlpha: 1` would otherwise overwrite
      // the gradient's hidden baseline before its reveal ever ran.
      gsap.set(restingLayers, { autoAlpha: 1 });

      if (heroText) {
        gsap.set(heroText, { autoAlpha: 1 });
      }

      if (cometBackgroundLayer) {
        gsap.set(cometBackgroundLayer, { autoAlpha: 0 });
        gsap.fromTo(
          cometBackgroundLayer,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            ease: HERO_COMET_SHADER.reveal.ease,
            immediateRender: false,
            scrollTrigger: {
              trigger: section,
              start: HERO_COMET_SHADER.reveal.start,
              end: HERO_COMET_SHADER.reveal.end,
              scrub,
            },
          },
        );
      }

      const sceneFadeTargets = cometBackgroundLayer
        ? [...restingLayers, cometBackgroundLayer]
        : restingLayers;

      if (sceneFadeTargets.length > 0) {
        gsap.fromTo(
          sceneFadeTargets,
          { autoAlpha: 1 },
          {
            autoAlpha: 0,
            ease: HERO_WHITEOUT.scene.ease,
            immediateRender: false,
            scrollTrigger: {
              trigger: section,
              start: HERO_WHITEOUT.scene.start,
              end: HERO_WHITEOUT.scene.end,
              scrub,
            },
          },
        );
      }

      if (heroText) {
        gsap.fromTo(
          heroText,
          { autoAlpha: 1 },
          {
            autoAlpha: 0,
            ease: HERO_WHITEOUT.text.ease,
            immediateRender: false,
            scrollTrigger: {
              trigger: section,
              start: HERO_WHITEOUT.text.start,
              end: HERO_WHITEOUT.text.end,
              scrub,
            },
          },
        );
      }
    },
    {
      scope: sectionRef,
      dependencies: [isMobile, prefersReducedMotion],
      // A resize that flips `isMobile` has to replace this scene, not stack a
      // second generation of scrubbed tweens on top of the first. Both would go
      // on writing `autoAlpha` to the same layers, and the newer one records its
      // start values from whatever the older one happened to be showing — so a
      // flip caught mid-fade leaves the sky, skyline and comet animating from
      // hidden to hidden, and they never come back.
      revertOnUpdate: true,
    },
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
        <svg aria-hidden="true" className="absolute h-0 w-0">
          <defs>
            <filter
              id={HERO_SKYLINE_STROKE_FILTER.id}
              x="-5%"
              y="-5%"
              width="110%"
              height="110%"
              colorInterpolationFilters="sRGB"
            >
              <feMorphology
                in="SourceGraphic"
                operator="erode"
                radius={HERO_SKYLINE_STROKE_FILTER.radius}
              />
            </filter>
          </defs>
        </svg>

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
        >
          <CometTrailBackground />
        </div>

        {/* Sky before buildings: same z, so DOM order alone puts the flock
            behind the skyline. */}
        <SkyElements ref={skyLayerRef} />

        {/* Pinned to the foot of the sticky viewport at every size: the layer is
            as tall as the art needs to span the full width, floored so it stays
            substantial on phones and capped so it can't swallow short landscape
            viewports. The mask fills the band so the skyline reaches both edges.

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
