"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { missionContent } from "@/app/data/mission";
import { dispatchNavbarThemeOverride } from "../navbar/navbarThemeOverride";
import { MOBILE_SCRUB } from "../hero/sceneConfig";
import {
  MISSION_DECORATION_COUNT,
  MISSION_LAYOUT,
  MISSION_NAVBAR_THEME_TRIGGER,
  MISSION_SCENE_SCROLL,
  MISSION_TIMELINE,
} from "./sceneConfig";

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef = useRef<HTMLElement>(null);
  const missionContentRef = useRef<HTMLDivElement>(null);
  const directorsContentRef = useRef<HTMLDivElement>(null);
  const darkOverlayRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const missionContent = missionContentRef.current;
      const directorsContent = directorsContentRef.current;
      const darkOverlay = darkOverlayRef.current;
      if (!section || !missionContent || !directorsContent || !darkOverlay) {
        return;
      }

      if (prefersReducedMotion) {
        dispatchNavbarThemeOverride(null);
        return;
      }

      const scrub = isMobile
        ? MOBILE_SCRUB * MISSION_SCENE_SCROLL.mobileScrubMultiplier
        : MISSION_SCENE_SCROLL.scrub;

      gsap.set(missionContent, {
        yPercent: MISSION_TIMELINE.intro.initialYPercent,
        opacity: MISSION_TIMELINE.intro.initialOpacity,
      });
      gsap.set(directorsContent, { opacity: 0 });
      gsap.set(darkOverlay, { opacity: 0 });

      const transitionTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: MISSION_SCENE_SCROLL.start,
          end: MISSION_SCENE_SCROLL.end,
          scrub,
        },
      });

      transitionTimeline.to(
        missionContent,
        {
          yPercent: 0,
          opacity: 1,
          ease: "power2.out",
        },
        MISSION_TIMELINE.intro.settleAt,
      );

      transitionTimeline.to(
        missionContent,
        {
          yPercent: MISSION_TIMELINE.intro.exitYPercent,
          ease: "power2.inOut",
        },
        MISSION_TIMELINE.intro.exitAt,
      );

      transitionTimeline.to(
        missionContent,
        {
          opacity: 0,
          ease: "power2.out",
        },
        MISSION_TIMELINE.intro.fadeOutAt,
      );

      transitionTimeline.to(
        darkOverlay,
        {
          opacity: 1,
          ease: "power2.inOut",
        },
        MISSION_TIMELINE.overlay.fadeInAt,
      );

      transitionTimeline.to(
        directorsContent,
        {
          opacity: 1,
          ease: "power2.out",
        },
        MISSION_TIMELINE.directors.fadeInAt,
      );

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
        start: MISSION_NAVBAR_THEME_TRIGGER.start,
        end: MISSION_NAVBAR_THEME_TRIGGER.end,
        onEnter: () =>
          setNavbarThemeOverride(MISSION_NAVBAR_THEME_TRIGGER.theme),
        onEnterBack: () =>
          setNavbarThemeOverride(MISSION_NAVBAR_THEME_TRIGGER.theme),
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

  if (prefersReducedMotion) {
    return (
      <>
        <section
          ref={sectionRef}
          data-navbar-theme="light"
          className={`bg-(--color-surface) ${MISSION_LAYOUT.staticIntroPadding}`}
        >
          <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center">
            <p className="max-w-6xl text-center text-4xl font-normal leading-[1.2] text-(--color-surface-foreground) sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-7xl">
              {renderMissionStatement()}
            </p>
          </div>
        </section>

        <section className="flex flex-col items-center bg-background px-8 py-32">
          {renderDirectorsPanel()}
        </section>
      </>
    );
  }

  return (
    <section
      ref={sectionRef}
      data-navbar-theme="light"
      className={`relative bg-(--color-surface) ${MISSION_LAYOUT.animatedSectionMinHeight}`}
    >
      <div className="sticky top-0 h-screen overflow-hidden isolate">
        <div className="absolute inset-0 bg-(--color-surface)" />
        <div
          ref={darkOverlayRef}
          className="pointer-events-none absolute inset-0 z-10 bg-background opacity-0"
        />
        <div
          ref={missionContentRef}
          className={`absolute inset-0 z-20 flex items-center justify-center ${MISSION_LAYOUT.animatedIntroPadding}`}
        >
          <p className="max-w-6xl text-center text-4xl font-normal leading-[1.2] text-(--color-surface-foreground) sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-7xl">
            {renderMissionStatement()}
          </p>
        </div>
        <div
          ref={directorsContentRef}
          className={`absolute inset-0 z-20 flex items-center justify-center ${MISSION_LAYOUT.directorsPadding}`}
        >
          {renderDirectorsPanel()}
        </div>
      </div>
    </section>
  );
}
