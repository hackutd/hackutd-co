"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { SCROLL_ROOT_ATTR } from "@/app/lib/scrollAnchor";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  SECTION_GRADIENT_DATA_ATTR,
  SECTION_GRADIENT_END_ID,
  SECTION_GRADIENT_MOTION,
  SECTION_GRADIENT_SECTIONS,
} from "./sceneConfig";

gsap.registerPlugin(useGSAP);
configureScrollTrigger();

const LABEL_DATA_ATTR = "data-section-gradient-label";

export default function SectionGradient() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const artworkRef = useRef<HTMLDivElement>(null);
  const pullLayerRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      const artwork = artworkRef.current;
      const pullLayer = pullLayerRef.current;
      const labelLayer = labelLayerRef.current;
      const scrollRoot = document.querySelector<HTMLElement>(
        `[${SCROLL_ROOT_ATTR}]`,
      );

      if (!wrapper || !artwork || !pullLayer || !labelLayer || !scrollRoot) {
        return;
      }

      const entries = SECTION_GRADIENT_SECTIONS.map((entry) => ({
        ...entry,
        label: wrapper.querySelector<HTMLElement>(
          `[${LABEL_DATA_ATTR}="${entry.id}"]`,
        ),
        section: scrollRoot.querySelector<HTMLElement>(
          `[${SECTION_GRADIENT_DATA_ATTR}="${entry.id}"]`,
        ),
      })).filter(
        (
          entry,
        ): entry is (typeof entry & {
          label: HTMLElement;
          section: HTMLElement;
        }) => Boolean(entry.label && entry.section),
      );

      if (entries.length === 0) {
        return;
      }

      const endSection = scrollRoot.querySelector<HTMLElement>(
        `[${SECTION_GRADIENT_DATA_ATTR}="${SECTION_GRADIENT_END_ID}"]`,
      );

      const labels = entries.map(({ label }) => label);
      const visibleLayers = [artwork, labelLayer];
      gsap.set(labels, { autoAlpha: 0, yPercent: 0 });
      gsap.set(entries[0].label, { autoAlpha: 1 });
      gsap.set(visibleLayers, { autoAlpha: 0 });

      if (prefersReducedMotion) {
        const showLabel = (index: number) => {
          gsap.set(labels, { autoAlpha: 0, yPercent: 0 });
          gsap.set(entries[index].label, { autoAlpha: 1 });
        };

        entries.slice(1).forEach(({ section }, index) => {
          ScrollTrigger.create({
            trigger: section,
            start: "top 55%",
            onEnter: () => showLabel(index + 1),
            onLeaveBack: () => showLabel(index),
          });
        });

        const readingLine = window.innerHeight * 0.55;
        let activeIndex = 0;
        entries.forEach(({ section }, index) => {
          if (section.getBoundingClientRect().top <= readingLine) {
            activeIndex = index;
          }
        });
        showLabel(activeIndex);

        const missionSection = entries[0].section;
        const setArtworkVisibility = (visible: boolean) => {
          gsap.set(visibleLayers, { autoAlpha: visible ? 1 : 0 });
        };
        ScrollTrigger.create({
          trigger: missionSection,
          start: "top bottom",
          onEnter: () => setArtworkVisibility(true),
          onLeaveBack: () => setArtworkVisibility(false),
        });

        setArtworkVisibility(
          missionSection.getBoundingClientRect().top < window.innerHeight,
        );
        return;
      }

      const { labelTravelPercent } = SECTION_GRADIENT_MOTION;

      entries.slice(1).forEach(({ section, label }, index) => {
        const previousLabel = entries[index].label;

        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: SECTION_GRADIENT_MOTION.transitionStart,
              end: SECTION_GRADIENT_MOTION.transitionEnd,
              scrub: SECTION_GRADIENT_MOTION.transitionScrub,
            },
          })
          .fromTo(
            previousLabel,
            { autoAlpha: 1, yPercent: 0 },
            {
              autoAlpha: 0,
              yPercent: -labelTravelPercent,
              duration: 1,
              ease: "none",
              immediateRender: false,
            },
            0,
          )
          .fromTo(
            label,
            { autoAlpha: 0, yPercent: labelTravelPercent },
            {
              autoAlpha: 1,
              yPercent: 0,
              duration: 1,
              ease: "none",
              immediateRender: false,
            },
            0,
          );
      });

      gsap.fromTo(
        visibleLayers,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          ease: "none",
          scrollTrigger: {
            trigger: entries[0].section,
            start: SECTION_GRADIENT_MOTION.revealStart,
            end: SECTION_GRADIENT_MOTION.revealEnd,
            scrub: SECTION_GRADIENT_MOTION.revealScrub,
          },
        },
      );

      if (endSection) {
        // Keep the final Sponsors artwork intact. As the footer boundary rises
        // through the viewport, move this inner layer by the same distance;
        // the footer's opaque surface then cleanly covers everything beneath
        // its border instead of making the artwork dissolve in place.
        gsap.fromTo(
          [pullLayer, labelLayer],
          { y: 0 },
          {
            y: () => -window.innerHeight,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: endSection,
              start: SECTION_GRADIENT_MOTION.pullStart,
              end: SECTION_GRADIENT_MOTION.pullEnd,
              scrub: SECTION_GRADIENT_MOTION.pullScrub,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      gsap.fromTo(
        artwork,
        {
          xPercent: SECTION_GRADIENT_MOTION.parallax.fromXPercent,
          yPercent: SECTION_GRADIENT_MOTION.parallax.fromYPercent,
        },
        {
          xPercent: SECTION_GRADIENT_MOTION.parallax.toXPercent,
          yPercent: SECTION_GRADIENT_MOTION.parallax.toYPercent,
          ease: "none",
          scrollTrigger: {
            trigger: scrollRoot,
            start: "top top",
            endTrigger: endSection ?? scrollRoot,
            end: endSection
              ? SECTION_GRADIENT_MOTION.pullStart
              : "bottom bottom",
            scrub: SECTION_GRADIENT_MOTION.parallaxScrub,
          },
        },
      );
    },
    {
      dependencies: [prefersReducedMotion],
      scope: wrapperRef,
      revertOnUpdate: true,
    },
  );

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      <div
        ref={artworkRef}
        className="invisible fixed -left-16 h-[clamp(34rem,max(62vw,78svh),58rem)] w-[clamp(56rem,118vw,125rem)] opacity-0"
        style={{
          bottom: "clamp(-8rem, -15svh, -3rem)",
          willChange: prefersReducedMotion ? "auto" : "transform, opacity",
        }}
      >
        <div
          ref={pullLayerRef}
          className="absolute inset-0"
          style={{
            willChange: prefersReducedMotion ? "auto" : "transform",
          }}
        >
          <div
            className="absolute inset-0 scale-[1.04] blur-[clamp(20px,3vw,32px)]"
            style={{
              backgroundImage: [
                "radial-gradient(ellipse 42% 27% at 39% 98%, rgba(255, 216, 48, 1) 0%, rgba(255, 176, 29, 0.82) 49%, transparent 95%)",
                "radial-gradient(ellipse 43% 35% at 17% 88%, rgba(62, 111, 255, 0.84) 0%, rgba(108, 23, 254, 0.56) 48%, transparent 95%)",
                "radial-gradient(ellipse 40% 36% at 14% 87%, rgba(255, 211, 47, 0.98) 0%, rgba(255, 154, 25, 0.82) 48%, transparent 94%)",
                "radial-gradient(ellipse 44% 35% at 42% 97%, rgba(255, 119, 23, 0.96) 0%, rgba(255, 76, 31, 0.68) 52%, transparent 94%)",
                "radial-gradient(ellipse 42% 45% at 30% 61%, rgba(255, 0, 78, 0.95) 0%, rgba(243, 22, 103, 0.7) 50%, transparent 95%)",
                "radial-gradient(ellipse 40% 36% at 54% 73%, rgba(190, 0, 91, 0.9) 0%, rgba(243, 22, 103, 0.58) 52%, transparent 94%)",
                "radial-gradient(ellipse 38% 33% at 73% 89%, rgba(243, 22, 103, 0.88) 0%, rgba(255, 63, 113, 0.5) 50%, transparent 94%)",
                "radial-gradient(ellipse 47% 34% at 70% 62%, rgba(108, 23, 254, 0.82) 0%, rgba(74, 84, 255, 0.52) 53%, transparent 95%)",
                "radial-gradient(ellipse 40% 31% at 87% 80%, rgba(67, 112, 255, 0.74) 0%, rgba(108, 23, 254, 0.32) 52%, transparent 94%)",
                "radial-gradient(ellipse 34% 25% at 55% 57%, rgba(244, 244, 255, 0.54) 0%, rgba(150, 181, 255, 0.24) 50%, transparent 92%)",
                "radial-gradient(ellipse 145% 50% at 34% 110%, rgba(255, 194, 35, 0.95) 0%, rgba(255, 119, 25, 0.82) 34%, rgba(243, 22, 103, 0.6) 59%, rgba(108, 23, 254, 0.22) 78%, transparent 96%)",
                "radial-gradient(ellipse 106% 91% at 3% 108%, rgba(255, 122, 27, 0.9) 0%, rgba(243, 22, 103, 0.7) 40%, rgba(108, 23, 254, 0.4) 63%, transparent 86%)",
              ].join(", "),
              maskImage:
                "radial-gradient(ellipse 88% 92% at 0% 100%, #000 0%, rgba(0, 0, 0, 0.96) 42%, rgba(0, 0, 0, 0.68) 62%, rgba(0, 0, 0, 0.18) 78%, transparent 92%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 88% 92% at 0% 100%, #000 0%, rgba(0, 0, 0, 0.96) 42%, rgba(0, 0, 0, 0.68) 62%, rgba(0, 0, 0, 0.18) 78%, transparent 92%)",
            }}
          />
        </div>
      </div>

      {/* Keep the active label inside the viewport independently of the much
          larger gradient canvas. It still joins the same footer-pull tween, so
          the artwork and word leave as one piece at the final separator. */}
      <div
        ref={labelLayerRef}
        className="invisible fixed bottom-[clamp(1rem,4svh,3rem)] left-[clamp(1rem,4vw,4rem)] h-0 w-0 opacity-0"
        style={{
          willChange: prefersReducedMotion ? "auto" : "transform, opacity",
        }}
      >
        {SECTION_GRADIENT_SECTIONS.map(({ id, label }, index) => (
          <span
            key={id}
            {...{ [LABEL_DATA_ATTR]: id }}
            className={`absolute bottom-0 left-0 whitespace-nowrap select-none text-[clamp(3rem,10vw,12rem)] font-black leading-none tracking-[-0.08em] text-white/35 blur-[clamp(2px,0.35vw,5px)] ${index === 0 ? "visible opacity-100" : "invisible opacity-0"}`}
            style={{
              willChange: prefersReducedMotion
                ? "auto"
                : "transform, opacity",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
