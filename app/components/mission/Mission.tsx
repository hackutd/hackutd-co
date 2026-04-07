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
  DIRECTORS_NAVBAR_THEME_TRIGGER,
  DIRECTORS_PIN,
  MISSION_DECORATION_COUNT,
  MISSION_LAYOUT,
  MISSION_OVERLAY,
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
  const darkOverlayRef = useRef<HTMLDivElement>(null);
  const directorsSectionRef = useRef<HTMLElement>(null);
  const directorsContentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const missionSection = missionSectionRef.current;
      const darkOverlay = darkOverlayRef.current;
      const directorsSection = directorsSectionRef.current;
      const directorsContent = directorsContentRef.current;

      if (
        !missionSection ||
        !darkOverlay ||
        !directorsSection ||
        !directorsContent
      ) {
        return;
      }

      if (prefersReducedMotion) {
        return;
      }

      // Dark overlay crossfade — begins when mission is half-scrolled out
      gsap.set(darkOverlay, { autoAlpha: 0 });
      gsap.to(darkOverlay, {
        autoAlpha: 1,
        ease: "power1.in",
        scrollTrigger: {
          trigger: missionSection,
          start: MISSION_OVERLAY.start,
          end: MISSION_OVERLAY.end,
          scrub: MISSION_OVERLAY.scrub,
        },
      });

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
    <div className="relative bg-[var(--color-surface)]">
      {/* Shared dark overlay — covers both sections for seamless transition */}
      <div
        ref={darkOverlayRef}
        className="pointer-events-none absolute inset-0 z-10 bg-background"
      />

      {/* Mission statement — naturally scrolling, no pin */}
      <section
        ref={missionSectionRef}
        data-navbar-theme="light"
        className={`relative z-20 ${MISSION_LAYOUT.sectionPadding} ${MISSION_LAYOUT.sectionMinHeight}`}
      >
        <div
          className={`mx-auto flex max-w-7xl items-start justify-center ${MISSION_LAYOUT.statementWrapMinHeight} ${MISSION_LAYOUT.statementOffset}`}
        >
          <p className="max-w-6xl text-center text-4xl font-normal leading-[1.2] text-[var(--color-surface-foreground)] sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-7xl">
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
