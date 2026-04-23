"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { missionContent } from "@/app/data/mission";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { dispatchNavbarThemeOverride } from "../navbar/navbarThemeOverride";
import {
  DIRECTORS_CARD,
  DIRECTORS_NAVBAR_THEME_TRIGGER,
  MISSION_LAYOUT,
} from "./sceneConfig";

configureScrollTrigger();

function renderMissionStatement() {
  return (
    <>
      {missionContent.statement.prefix}{" "}
      <span className="font-semibold">{missionContent.statement.emphasis}</span>{" "}
      students to{" "}
      <span className="italic text-pink">
        {missionContent.statement.highlight}{" "}
      </span>
      {missionContent.statement.suffix}
    </>
  );
}

function renderDirectorsPanel() {
  return (
    <div className="flex w-full max-w-[620px] flex-col items-center rounded-2xl bg-[#FAFAFA] px-8 py-10 shadow-[0_2px_24px_rgba(0,0,0,0.06)] md:px-12 md:py-14">
      {/* Photo placeholder */}
      <div className="h-44 w-full max-w-[460px] rounded-xl bg-[#E0E0E0] sm:h-52 md:h-56" />

      {/* Label */}
      <p className="mt-8 text-xs tracking-[0.15em] text-[#999]">
        {missionContent.directorsMessage.label}
      </p>

      {/* Quote — Satoshi Italic 400 */}
      <blockquote className="mt-5 max-w-md text-center font-[family-name:var(--font-satoshi)] text-base font-normal italic leading-relaxed text-[#333] md:text-lg">
        {missionContent.directorsMessage.quote}
      </blockquote>

      {/* Divider */}
      <div className="mt-8 h-px w-full max-w-[460px] bg-[#E5E5E5]" />

      {/* Directors names — Inter Regular 400 */}
      <p className="mt-6 font-[family-name:var(--font-inter)] text-sm font-normal tracking-wide text-[#222]">
        {missionContent.directorsMessage.authors}
      </p>
      <p className="mt-1 font-[family-name:var(--font-inter)] text-[10px] tracking-[0.18em] text-[#999]">
        {missionContent.directorsMessage.subtitle}
      </p>
    </div>
  );
}

export default function Mission() {
  const missionSectionRef = useRef<HTMLElement>(null);
  const directorsSectionRef = useRef<HTMLElement>(null);
  const directorsCardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const directorsSection = directorsSectionRef.current;
      const directorsCard = directorsCardRef.current;

      if (!directorsSection || !directorsCard) {
        return;
      }

      if (prefersReducedMotion) {
        return;
      }

      // Card scale-up on scroll entry
      gsap.fromTo(
        directorsCard,
        {
          scale: DIRECTORS_CARD.initialScale,
          autoAlpha: DIRECTORS_CARD.initialOpacity,
        },
        {
          scale: 1,
          autoAlpha: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: directorsCard,
            start: DIRECTORS_CARD.start,
            end: DIRECTORS_CARD.end,
            scrub: DIRECTORS_CARD.scrub,
          },
        },
      );

      // Navbar theme — light since directors section is now light bg
      let navbarThemeOverride: "light" | "dark" | null = null;
      const setNavbarThemeOverride = (theme: "light" | "dark" | null) => {
        if (navbarThemeOverride === theme) {
          return;
        }
        navbarThemeOverride = theme;
        dispatchNavbarThemeOverride(theme);
      };

      const navbarThemeTrigger = ScrollTrigger.create({
        trigger: directorsSection,
        start: DIRECTORS_NAVBAR_THEME_TRIGGER.start,
        end: DIRECTORS_NAVBAR_THEME_TRIGGER.end,
        onEnter: () =>
          setNavbarThemeOverride(
            DIRECTORS_NAVBAR_THEME_TRIGGER.theme as "light",
          ),
        onEnterBack: () =>
          setNavbarThemeOverride(
            DIRECTORS_NAVBAR_THEME_TRIGGER.theme as "light",
          ),
        onLeave: () => setNavbarThemeOverride(null),
        onLeaveBack: () => setNavbarThemeOverride(null),
      });

      return () => {
        navbarThemeTrigger.kill();
        setNavbarThemeOverride(null);
      };
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
          className={`bg-[var(--color-surface)] ${MISSION_LAYOUT.sectionPadding}`}
        >
          <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center">
            <p className="max-w-6xl text-center text-4xl font-normal leading-[1.2] text-[var(--color-surface-foreground)] sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-7xl">
              {renderMissionStatement()}
            </p>
          </div>
        </section>

        <section
          ref={directorsSectionRef}
          className="bg-[#F2F2F2] px-8 py-24 md:px-12 md:py-32"
        >
          <div className="flex flex-col items-center">
            {renderDirectorsPanel()}
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="relative bg-[var(--color-surface)]">
      {/* Mission statement — naturally scrolling, no pin */}
      <section
        ref={missionSectionRef}
        data-navbar-theme="light"
        className={`relative ${MISSION_LAYOUT.sectionPadding} ${MISSION_LAYOUT.sectionMinHeight}`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-start justify-center ${MISSION_LAYOUT.statementWrapMinHeight} ${MISSION_LAYOUT.statementOffset}`}
        >
          <p className="max-w-6xl text-center text-4xl font-normal leading-[1.2] text-[var(--color-surface-foreground)] sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-7xl">
            {renderMissionStatement()}
          </p>
        </div>
      </section>

      {/* Directors message — light bg, card scales up on scroll */}
      <section
        ref={directorsSectionRef}
        data-navbar-theme="light"
        className="bg-[#F2F2F2] px-8 py-24 md:px-12 md:py-32"
      >
        <div className="flex flex-col items-center">
          <div ref={directorsCardRef}>
            {renderDirectorsPanel()}
          </div>
        </div>
      </section>
    </div>
  );
}
