"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import AccentButton from "../ui/AccentButton";
import { HERO_SCENE_DATA_ATTR } from "../background/sceneConfig";
import CometAnimation from "./CometAnimation";
import {
  HERO_COPY,
  HERO_COMET_SHADER,
  HERO_LAYOUT,
  HERO_SCENE_SCROLL,
  HERO_SKYLINE_PARALLAX,
  HERO_STARS,
  HERO_WHITEOUT,
  MOBILE_SCRUB,
} from "./sceneConfig";
import CometTrailBackground from "./CometTrailBackground";

configureScrollTrigger();

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const starsLayerRef = useRef<HTMLDivElement>(null);
  const cometBackgroundLayerRef = useRef<HTMLDivElement>(null);
  const skylineLayerRef = useRef<HTMLDivElement>(null);
  const skylineBackRef = useRef<HTMLDivElement>(null);
  const cometLayerRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const starsLayer = starsLayerRef.current;
      const cometBackgroundLayer = cometBackgroundLayerRef.current;
      const skylineLayer = skylineLayerRef.current;
      const skylineBack = skylineBackRef.current;
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

      if (skylineBack) {
        gsap.to(skylineBack, {
          y: HERO_SKYLINE_PARALLAX.backY,
          ease: HERO_SKYLINE_PARALLAX.ease,
          scrollTrigger: {
            trigger: section,
            start: HERO_SKYLINE_PARALLAX.start,
            end: HERO_SKYLINE_PARALLAX.end,
            scrub,
          },
        });
      }

      if (heroText) {
        gsap.set(heroText, { autoAlpha: 1 });
      }

      if (cometBackgroundLayer) {
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
        backdropRef.current,
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
      className={`theme-scope-dark relative text-foreground ${HERO_LAYOUT.minHeight}`}
    >
      <div
        className={`sticky top-0 overflow-hidden isolate ${HERO_LAYOUT.stickyViewportHeight}`}
      >
        {/* Opaque dark backdrop so the hero art direction stays dark in the
            light site theme; it fades out with the rest of the scene. */}
        <div
          ref={backdropRef}
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-black"
        />
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

        <div
          ref={skylineLayerRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[clamp(200px,36vh,420px)] sm:h-[clamp(280px,42vh,500px)] md:h-[clamp(360px,48vh,580px)] overflow-hidden"
        >
          <div ref={skylineBackRef} className="absolute inset-0">
            <Image
              src="/skyline-back.png"
              alt=""
              width={2048}
              height={768}
              priority
              className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2"
              sizes="100vw"
            />
          </div>
          <Image
            src="/skyline-front.png"
            alt=""
            width={2048}
            height={768}
            priority
            className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2"
            sizes="100vw"
          />
        </div>

        {/* Comet SVG layer */}
        <div ref={cometLayerRef} className="absolute inset-0 z-10">
          <CometAnimation />
        </div>

        <div
          ref={heroTextRef}
          className="relative z-20 flex h-full flex-col items-center justify-center px-5 text-center md:px-8"
        >
          <h1 className="max-w-[16ch] text-3xl font-semibold leading-[1.1] sm:max-w-[20ch] sm:text-4xl md:max-w-4xl md:text-5xl lg:text-6xl">
            {HERO_COPY.heading}
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted sm:max-w-lg sm:text-base md:max-w-2xl md:text-lg">
            {HERO_COPY.body}
          </p>
          <AccentButton
            variant="panel"
            size="sm"
            className="mt-6 min-w-36 p-4 md:mt-8 md:min-w-44"
          >
            {HERO_COPY.ctaLabel}
          </AccentButton>
        </div>
      </div>
    </section>
  );
}
