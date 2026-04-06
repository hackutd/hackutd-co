"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import AccentButton from "../ui/AccentButton";
import CometAnimation from "./CometAnimation";
import { HERO_SCENE_SCROLL, MOBILE_SCRUB } from "./sceneConfig";

gsap.registerPlugin(ScrollTrigger);

type HeroStar = {
  id: number;
  size: number;
  top: number;
  left: number;
  opacity: number;
  duration: number;
  delay: number;
};

function createHeroStars(count: number): HeroStar[] {
  let seed = 27;

  const next = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  return Array.from({ length: count }, (_, index) => ({
    id: index,
    size: 4 + next() * 4.2,
    top: 8 + next() * 56,
    left: 4 + next() * 92,
    opacity: 0.35 + next() * 0.5,
    duration: 2.6 + next() * 3.8,
    delay: next() * 4,
  }));
}

const HERO_STARS = createHeroStars(28);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const skylineBackRef = useRef<HTMLImageElement>(null);
  const skylineFrontRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const skylineBack = skylineBackRef.current;
      const skylineFront = skylineFrontRef.current;

      if (!section || !skylineBack || !skylineFront) {
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([skylineBack, skylineFront], { yPercent: 0 });
        return;
      }

      const mobile =
        window.innerWidth < 768 ||
        window.matchMedia("(pointer: coarse)").matches;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: HERO_SCENE_SCROLL.start,
          end: HERO_SCENE_SCROLL.end,
          scrub: mobile ? MOBILE_SCRUB : HERO_SCENE_SCROLL.scrub,
        },
      });

      tl.to(
        skylineBack,
        {
          yPercent: -6,
          ease: "none",
        },
        0,
      );

      tl.to(
        skylineFront,
        {
          yPercent: -12,
          ease: "none",
        },
        0,
      );
    },
    { scope: sectionRef, dependencies: [] },
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[160vh] md:min-h-[260vh]"
    >
      {/* Comet sticks in viewport, text overlays it */}
      <div className="sticky top-0 h-screen overflow-hidden isolate">
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
            className="absolute bottom-0 left-1/2 h-[88%] w-auto max-w-none -translate-x-[47%] opacity-45"
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

        {/* Text content on top */}
        <div className="relative z-20 flex h-full flex-col items-center justify-center px-5 text-center md:px-8">
          <h1 className="max-w-[16ch] text-3xl font-semibold leading-[1.1] sm:max-w-[20ch] sm:text-4xl md:max-w-4xl md:text-5xl lg:text-6xl">
            The Largest 24-Hour Hackathon in Texas.
          </h1>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted sm:max-w-lg sm:text-base md:max-w-2xl md:text-lg">
            Join hundreds of hackers, creators, and innovators for a weekend of
            coding, collaboration, and chaos where ideas become reality.
          </p>
          <AccentButton
            variant="panel"
            size="sm"
            className="mt-6 min-w-36 p-4 md:mt-8 md:min-w-44"
          >
            Coming Soon
          </AccentButton>
        </div>
      </div>
    </section>
  );
}
