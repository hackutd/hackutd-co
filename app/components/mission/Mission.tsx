"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { missionContent } from "@/app/data/mission";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { MISSION_STATEMENT_DATA_ATTR } from "../background/sceneConfig";
import { dispatchNavbarThemeOverride } from "../navbar/navbarThemeOverride";
import {
  DIRECTORS_NAVBAR_THEME_TRIGGER,
  DIRECTORS_PIN,
  MISSION_DECORATION_COUNT,
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
    <div className="flex flex-col items-center">
      <div className="h-64 w-full max-w-lg rounded-lg bg-white/5" />
      <blockquote className="mt-8 max-w-lg text-center text-muted">
        <p>{missionContent.directorsMessage.quote}</p>
        <footer className="mt-4 font-medium text-foreground">
          — {missionContent.directorsMessage.authors}
        </footer>
      </blockquote>
      <div className="mt-8 flex gap-2">
        {Array.from({ length: MISSION_DECORATION_COUNT }).map((_, i) => (
          <div key={i} className="h-10 w-10 rounded-full bg-white/10" />
        ))}
      </div>
    </div>
  );
}

export default function Mission() {
  const missionSectionRef = useRef<HTMLElement>(null);
  const directorsSectionRef = useRef<HTMLElement>(null);
  const directorsContentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

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

      // Navbar theme — switch to dark when directors section enters
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
            DIRECTORS_NAVBAR_THEME_TRIGGER.theme as "dark",
          ),
        onEnterBack: () =>
          setNavbarThemeOverride(
            DIRECTORS_NAVBAR_THEME_TRIGGER.theme as "dark",
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
          className={`bg-(--color-surface) ${MISSION_LAYOUT.sectionPadding}`}
        >
          <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center">
            <p className="max-w-6xl text-center text-4xl font-normal leading-[1.2] text-(--color-surface-foreground) sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-7xl">
              {renderMissionStatement()}
            </p>
          </div>
        </section>

        <section
          ref={directorsSectionRef}
          className="bg-background px-8 py-24 md:px-12 md:py-32"
        >
          <div
            ref={directorsContentRef}
            className="flex flex-col items-center"
          >
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
        data-navbar-theme="light"
        {...{ [MISSION_STATEMENT_DATA_ATTR]: "" }}
        className={`relative z-20 ${MISSION_LAYOUT.sectionPadding} ${MISSION_LAYOUT.sectionMinHeight}`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-start justify-center ${MISSION_LAYOUT.statementWrapMinHeight} ${MISSION_LAYOUT.statementOffset}`}
        >
          <p className="max-w-6xl text-center text-4xl font-normal leading-[1.2] text-(--color-surface-foreground) sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-7xl">
            {renderMissionStatement()}
          </p>
        </div>
      </section>

      {/* Directors message — pins at viewport top, content fades in centered, then unpins */}
      <section
        ref={directorsSectionRef}
        className="relative z-20"
      >
        <div className="flex h-screen items-center justify-center px-8 md:px-12">
          <div
            ref={directorsContentRef}
            className="flex flex-col items-center"
          >
            {renderDirectorsPanel()}
          </div>
        </div>
      </section>
    </div>
  );
}
