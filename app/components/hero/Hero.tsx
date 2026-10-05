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
import DallasSkyline from "./DallasSkyline";
import {
  HERO_CITY_STAGE_DATA_ATTR,
  HERO_COPY,
  HERO_COMET_SHADER,
  HERO_LAYOUT,
  HERO_SCENE_SCROLL,
  HERO_SKYLINE,
  HERO_TEXT_EFFECT,
  HERO_WHITEOUT,
  MOBILE_SCRUB,
} from "./sceneConfig";
import CometTrailBackground from "./CometTrailBackground";

configureScrollTrigger();

const HERO_TEXT_CHARACTER_DATA_ATTR = "data-hero-text-character";
const HERO_TEXT_WORD_DATA_ATTR = "data-hero-text-word";

/** Keeps natural word wrapping while exposing each glyph as a GSAP target. */
function renderHeroText(text: string) {
  return text.split(/(\s+)/).map((segment, segmentIndex) => {
    if (/^\s+$/.test(segment)) {
      return (
        <span
          key={`space-${segmentIndex}`}
          aria-hidden="true"
          className="whitespace-pre-wrap"
        >
          {segment}
        </span>
      );
    }

    return (
      <span
        key={`word-${segmentIndex}`}
        {...{ [HERO_TEXT_WORD_DATA_ATTR]: "" }}
        aria-hidden="true"
        className="inline-block whitespace-nowrap"
      >
        {Array.from(segment).map((character, characterIndex) => (
          <span
            key={`${segmentIndex}-${characterIndex}`}
            {...{ [HERO_TEXT_CHARACTER_DATA_ATTR]: "" }}
            className="inline-block"
          >
            {character}
          </span>
        ))}
      </span>
    );
  });
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const cometBackgroundLayerRef = useRef<HTMLDivElement>(null);
  const skylineLayerRef = useRef<HTMLDivElement>(null);
  const cometLayerRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const cometBackgroundLayer = cometBackgroundLayerRef.current;
      const skylineLayer = skylineLayerRef.current;
      const cometLayer = cometLayerRef.current;
      const heroText = heroTextRef.current;
      const heroTextCharacters = heroText
        ? Array.from(
            heroText.querySelectorAll<HTMLElement>(
              `[${HERO_TEXT_CHARACTER_DATA_ATTR}]`,
            ),
          )
        : [];

      if (!section) {
        return;
      }

      if (prefersReducedMotion) {
        if (cometBackgroundLayer) {
          gsap.set(cometBackgroundLayer, { autoAlpha: 1 });
        }
        if (heroText) {
          gsap.set(heroText, { autoAlpha: 1 });
        }
        if (heroTextCharacters.length > 0) {
          gsap.set(heroTextCharacters, {
            autoAlpha: 1,
            filter: "blur(0px) brightness(100%)",
            y: 0,
          });
        }
        return;
      }

      const scrub = isMobile ? MOBILE_SCRUB : HERO_SCENE_SCROLL.scrub;

      // Layers that are simply on screen from the top of the page. The shader
      // gradient is deliberately not among them: it starts hidden and reveals on
      // its own range below, then leaves with everything else in the whiteout.
      const restingLayers = [skylineLayer, cometLayer].filter(
        (el): el is HTMLDivElement => el !== null,
      );

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

      // The copy is present from the first paint — no entrance. Its only
      // animation is the scroll-driven exit below.
      const exitScrollTrigger = {
        trigger: section,
        start: HERO_TEXT_EFFECT.exit.start,
        end: HERO_TEXT_EFFECT.exit.end,
        scrub,
      };

      if (isMobile && heroText) {
        // Phones leave by word, on opacity and transform alone. A per-glyph
        // blur gives every character its own filter surface, re-rasterised on
        // every scroll tick — around ninety of them at once mid-exit. The
        // stagger's total spread is kept, so the words still leave across the
        // same stretch of scroll the glyphs do on desktop.
        const heroTextWords = Array.from(
          heroText.querySelectorAll<HTMLElement>(`[${HERO_TEXT_WORD_DATA_ATTR}]`),
        );

        if (heroTextWords.length > 0) {
          gsap.fromTo(
            heroTextWords,
            { autoAlpha: 1, y: 0 },
            {
              autoAlpha: 0,
              y: HERO_TEXT_EFFECT.exit.y,
              duration: HERO_TEXT_EFFECT.exit.duration,
              stagger: {
                amount:
                  HERO_TEXT_EFFECT.exit.stagger *
                  Math.max(heroTextCharacters.length - 1, 0),
              },
              ease: HERO_TEXT_EFFECT.exit.ease,
              immediateRender: false,
              overwrite: "auto",
              scrollTrigger: exitScrollTrigger,
            },
          );
        }
      } else if (heroTextCharacters.length > 0) {
        gsap.fromTo(
          heroTextCharacters,
          {
            autoAlpha: 1,
            filter: "blur(0px) brightness(100%)",
            y: 0,
          },
          {
            autoAlpha: 0,
            filter: `blur(${HERO_TEXT_EFFECT.exit.blur}px) brightness(0%)`,
            y: HERO_TEXT_EFFECT.exit.y,
            duration: HERO_TEXT_EFFECT.exit.duration,
            stagger: HERO_TEXT_EFFECT.exit.stagger,
            ease: HERO_TEXT_EFFECT.exit.ease,
            immediateRender: false,
            overwrite: "auto",
            scrollTrigger: exitScrollTrigger,
          },
        );
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
        {...{ [HERO_CITY_STAGE_DATA_ATTR]: "" }}
        className={`sticky top-0 overflow-hidden isolate ${HERO_LAYOUT.stickyViewportHeight} ${HERO_SKYLINE.widthClass}`}
      >
        <div
          ref={cometBackgroundLayerRef}
          aria-hidden="true"
          className="absolute inset-0 z-2"
        >
          <CometTrailBackground />
        </div>

        {/* Pinned to the foot of the sticky viewport at every size: the band is
            as tall as the art needs to span the full width, floored so it stays
            substantial on phones and capped so it can't swallow short landscape
            viewports. The city is drawn live in `currentColor`, so it follows
            the site theme by way of the same token as body text. */}
        <div
          ref={skylineLayerRef}
          aria-hidden="true"
          className={`pointer-events-none absolute z-0 ${HERO_SKYLINE.layerBox}`}
        >
          <DallasSkyline />
        </div>

        {/* Comet SVG layer */}
        <div ref={cometLayerRef} className="absolute inset-0 z-10">
          <CometAnimation />
        </div>

        <div
          ref={heroTextRef}
          className={`relative z-20 flex h-full flex-col items-center justify-center px-5 text-center md:px-8 ${HERO_LAYOUT.textLift}`}
        >
          <p
            aria-label={HERO_COPY.eyebrow}
            className="mb-2 font-sans text-base font-normal italic sm:text-lg md:mb-3 md:text-xl"
          >
            {renderHeroText(HERO_COPY.eyebrow)}
          </p>
          <h1
            aria-label={HERO_COPY.headline}
            className="w-full min-w-0 max-w-[20ch] font-sans text-[2rem] font-medium leading-[1.1] sm:max-w-[26ch] sm:text-[2.5rem] md:max-w-[40ch] md:text-5xl lg:text-[3.5rem]"
          >
            {renderHeroText(HERO_COPY.headline)}
          </h1>
        </div>
      </div>
    </section>
  );
}
