"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { missionContent } from "@/app/data/mission";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { MISSION_STATEMENT_DATA_ATTR } from "../background/sceneConfig";
import BlurStatement from "./BlurStatement";
import { DIRECTORS_CARD, DIRECTORS_PIN, MISSION_LAYOUT } from "./sceneConfig";

configureScrollTrigger();

/**
 * The statement is painted in flat surface ink — the per-word blur reveal in
 * <BlurStatement /> now supplies the softening the old static bottom-fade
 * gradient used to, and a `background-clip: text` fill can't survive the
 * per-word filters that reveal drives.
 */
const MISSION_STATEMENT_CLASS_NAME =
  "relative w-full text-center font-serif text-[2rem] font-normal leading-[1.2] text-(--color-surface-foreground) sm:text-[2.5rem] md:text-[3.25rem] lg:text-[4rem]";

const MISSION_ANCHOR = (
  <span
    id="about"
    aria-hidden="true"
    className="pointer-events-none absolute left-1/2 top-1/2 h-px w-px scroll-mt-[50svh] md:scroll-mt-[50vh]"
  />
);

function renderDirectorsPanel() {
  const { eyebrow, quote, authors, role, photo } =
    missionContent.directorsMessage;

  return (
    <div className={`flex flex-col items-center ${DIRECTORS_CARD.width}`}>
      {/* Directors photo — sits above the card and overhangs its top edge */}
      <div
        className={`relative z-10 overflow-hidden border border-foreground/10 bg-foreground/5 ${DIRECTORS_CARD.photo}`}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={DIRECTORS_CARD.photoSizes}
          className="object-cover object-center"
        />
      </div>

      <div
        className={`relative w-full rounded-3xl border border-foreground/10 bg-(--color-card) text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] ${DIRECTORS_CARD.overlap} ${DIRECTORS_CARD.padding}`}
      >
        <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted">
          {eyebrow}
        </p>

        <blockquote className="mx-auto mt-6 max-w-[42ch] text-lg italic leading-[1.5] md:mt-8 md:text-xl">
          <p>{quote}</p>
        </blockquote>

        <div className="mx-auto mt-10 h-px w-[73%] bg-foreground/10" />

        <p className="mt-6 font-medium">{authors}</p>
        <p className="mt-2 text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          {role}
        </p>
      </div>
    </div>
  );
}

export default function Mission() {
  const missionSectionRef = useRef<HTMLElement>(null);
  const directorsSectionRef = useRef<HTMLElement>(null);
  const directorsContentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const missionSection = missionSectionRef.current;

    if (!missionSection) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.documentElement.toggleAttribute(
          "data-mission-scrollbar",
          entry.isIntersecting,
        );
      },
      { threshold: 0.05 },
    );

    observer.observe(missionSection);

    return () => {
      observer.disconnect();
      document.documentElement.removeAttribute("data-mission-scrollbar");
    };
  }, []);

  useGSAP(
    () => {
      const missionSection = missionSectionRef.current;
      const directorsSection = directorsSectionRef.current;
      const directorsContent = directorsContentRef.current;

      if (!missionSection || !directorsSection || !directorsContent) {
        return;
      }

      if (prefersReducedMotion) {
        return;
      }

      // Directors section — pin at viewport top, fade content in, then unpin
      //    Animate children of the pinned element, not the pinned element itself.
      gsap.set(directorsContent, {
        autoAlpha: 0,
        yPercent: DIRECTORS_PIN.initialYPercent,
      });

      gsap.to(directorsContent, {
        autoAlpha: 1,
        yPercent: 0,
        ease: "power1.out",
        scrollTrigger: {
          trigger: directorsSection,
          start: DIRECTORS_PIN.start,
          end: DIRECTORS_PIN.end,
          pin: true,
          scrub: DIRECTORS_PIN.scrub,
        },
      });
    },
    {
      dependencies: [prefersReducedMotion],
    },
  );

  if (prefersReducedMotion) {
    return (
      <>
        <section
          ref={missionSectionRef}
          data-navbar-theme="light"
          className={`bg-(--color-surface) ${MISSION_LAYOUT.sectionPadding}`}
        >
          <div className="flex min-h-[80vh] w-full items-center justify-center">
            <BlurStatement
              text={missionContent.statement}
              className={MISSION_STATEMENT_CLASS_NAME}
            >
              {MISSION_ANCHOR}
            </BlurStatement>
          </div>
        </section>

        <section
          ref={directorsSectionRef}
          className="bg-background px-8 py-24 md:px-12 md:py-32"
        >
          <div ref={directorsContentRef} className="flex w-full justify-center">
            {renderDirectorsPanel()}
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="relative">
      {/* Mission statement — naturally scrolling, no pin. Background is painted
          by the page-level <PageBackground /> layer to avoid seams between
          sections. */}
      <section
        ref={missionSectionRef}
        {...{ [MISSION_STATEMENT_DATA_ATTR]: "" }}
        className={`relative z-20 ${MISSION_LAYOUT.sectionPadding} ${MISSION_LAYOUT.sectionMinHeight}`}
      >
        <div
          className={`flex w-full items-start justify-center ${MISSION_LAYOUT.statementWrapMinHeight} ${MISSION_LAYOUT.statementOffset}`}
        >
          <BlurStatement
            text={missionContent.statement}
            className={MISSION_STATEMENT_CLASS_NAME}
          >
            {MISSION_ANCHOR}
          </BlurStatement>
        </div>
      </section>

      {/* Directors message — pins at viewport top, content fades in centered, then unpins */}
      <section
        ref={directorsSectionRef}
        className="relative z-20"
      >
        <div className="flex h-screen items-center justify-center px-8 md:px-12">
          <div ref={directorsContentRef} className="flex w-full justify-center">
            {renderDirectorsPanel()}
          </div>
        </div>
      </section>
    </div>
  );
}
