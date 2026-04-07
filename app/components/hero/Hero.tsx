"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import AccentButton from "../ui/AccentButton";
import { dispatchNavbarThemeOverride } from "../navbar/navbarThemeOverride";
import CometAnimation from "./CometAnimation";
import {
  HERO_COPY,
  HERO_LAYOUT,
  HERO_NAVBAR_THEME_TRIGGER,
  HERO_SCENE_SCROLL,
  HERO_SKYLINE_PARALLAX,
  HERO_STARS,
  HERO_WHITEOUT,
  MOBILE_SCRUB,
} from "./sceneConfig";

configureScrollTrigger();

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const skylineBackRef = useRef<HTMLImageElement>(null);
  const skylineFrontRef = useRef<HTMLImageElement>(null);
  const whiteOverlayRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const skylineBack = skylineBackRef.current;
      const skylineFront = skylineFrontRef.current;
      const whiteOverlay = whiteOverlayRef.current;
      const heroText = heroTextRef.current;

      if (!section || !skylineBack || !skylineFront) {
        return;
      }

      if (prefersReducedMotion) {
        gsap.set([skylineBack, skylineFront], { yPercent: 0 });
        if (whiteOverlay) {
          gsap.set(whiteOverlay, { opacity: 0 });
        }
        if (heroText) {
          gsap.set(heroText, { opacity: 1 });
        }
        return;
      }

      const scrub = isMobile ? MOBILE_SCRUB : HERO_SCENE_SCROLL.scrub;

      if (whiteOverlay) {
        gsap.set(whiteOverlay, { autoAlpha: 0 });
      }
      if (heroText) {
        gsap.set(heroText, { autoAlpha: 1 });
      }

      const sceneTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: HERO_SCENE_SCROLL.start,
          end: HERO_SCENE_SCROLL.end,
          scrub,
        },
      });

      sceneTimeline.to(
        skylineBack,
        {
          yPercent: HERO_SKYLINE_PARALLAX.backYPercent,
          ease: "none",
        },
        0,
      );

      sceneTimeline.to(
        skylineFront,
        {
          yPercent: HERO_SKYLINE_PARALLAX.frontYPercent,
          ease: "none",
        },
        0,
      );

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

      if (whiteOverlay) {
        gsap.to(whiteOverlay, {
          autoAlpha: 1,
          ease: HERO_WHITEOUT.overlay.ease,
          scrollTrigger: {
            trigger: section,
            start: HERO_WHITEOUT.overlay.start,
            end: HERO_WHITEOUT.overlay.end,
            scrub,
          },
        });
      }

      let navbarThemeOverride: "light" | "dark" | null = null;
      const setNavbarThemeOverride = (theme: "light" | "dark" | null) => {
        if (navbarThemeOverride === theme) {
          return;
        }

        navbarThemeOverride = theme;
        dispatchNavbarThemeOverride(theme);
      };

      const navbarThemeTrigger = ScrollTrigger.create({
        trigger: section,
        start: HERO_NAVBAR_THEME_TRIGGER.start,
        end: HERO_NAVBAR_THEME_TRIGGER.end,
        onEnter: () => setNavbarThemeOverride(HERO_NAVBAR_THEME_TRIGGER.theme),
        onEnterBack: () =>
          setNavbarThemeOverride(HERO_NAVBAR_THEME_TRIGGER.theme),
        onLeave: () => setNavbarThemeOverride(null),
        onLeaveBack: () => setNavbarThemeOverride(null),
      });

      return () => {
        navbarThemeTrigger.kill();
        setNavbarThemeOverride(null);
      };
    },
    { scope: sectionRef, dependencies: [isMobile, prefersReducedMotion] },
  );

  return (
    <section ref={sectionRef} className={`relative bg-[var(--color-surface)] ${HERO_LAYOUT.minHeight}`}>
      <div
        className={`sticky top-0 overflow-hidden isolate bg-background ${HERO_LAYOUT.stickyViewportHeight}`}
      >
        <div aria-hidden="true" className="absolute inset-0 z-[1]">
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
                className="hero-star absolute bg-[var(--color-amber)]"
                style={style}
              />
            );
          })}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[clamp(360px,48vh,580px)] overflow-hidden"
        >
          <Image
            ref={skylineBackRef}
            src="/skyline1.png"
            alt=""
            width={2431}
            height={954}
            priority
            className={`absolute bottom-0 left-1/2 h-[88%] w-auto max-w-none ${HERO_LAYOUT.skylineBackTranslateX} opacity-45`}
            sizes="100vw"
          />
          <Image
            ref={skylineFrontRef}
            src="/skyline2.png"
            alt=""
            width={1867}
            height={830}
            priority
            className="absolute bottom-0 left-1/2 h-[84%] w-auto max-w-none -translate-x-1/2 opacity-95"
            sizes="100vw"
          />
        </div>

        {/* Comet SVG layer */}
        <div className="absolute inset-0 z-10">
          <CometAnimation />
        </div>

        <div
          ref={whiteOverlayRef}
          className="pointer-events-none absolute inset-0 z-30 bg-[var(--color-surface)] opacity-0"
        />

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
