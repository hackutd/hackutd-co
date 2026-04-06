"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { missionContent } from "@/app/data/mission";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { dispatchNavbarThemeOverride } from "../navbar/navbarThemeOverride";
import {
  MISSION_DECORATION_COUNT,
  MISSION_LAYOUT,
  MISSION_NAVBAR_THEME_TRIGGER,
  MISSION_SCENE_SCROLL,
  MISSION_TIMELINE,
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

      let navbarThemeOverride: "light" | "dark" | null = null;
      const setNavbarThemeOverride = (theme: "light" | "dark" | null) => {
        if (navbarThemeOverride === theme) {
          return;
        }

        navbarThemeOverride = theme;
        dispatchNavbarThemeOverride(theme);
      };

      gsap.set(missionContent, {
        yPercent: MISSION_TIMELINE.intro.initialYPercent,
        autoAlpha: MISSION_TIMELINE.intro.initialOpacity,
      });
      gsap.set(directorsContent, {
        autoAlpha: 0,
        yPercent: MISSION_TIMELINE.directors.initialYPercent,
      });
      gsap.set(darkOverlay, { opacity: 0 });
      const clamp01 = gsap.utils.clamp(0, 1);
      const interpolate = gsap.utils.interpolate;
      const progressForSegment = (
        progress: number,
        start: number,
        duration: number,
      ) => {
        if (duration <= 0) {
          return progress >= start ? 1 : 0;
        }

        return clamp01((progress - start) / duration);
      };

      const updateScene = (progress: number) => {
        const settleProgress = progressForSegment(
          progress,
          MISSION_TIMELINE.intro.settleAt,
          MISSION_TIMELINE.intro.settleDuration,
        );
        const exitProgress = progressForSegment(
          progress,
          MISSION_TIMELINE.intro.exitAt,
          MISSION_TIMELINE.intro.exitDuration,
        );
        const fadeOutProgress = progressForSegment(
          progress,
          MISSION_TIMELINE.intro.fadeOutAt,
          MISSION_TIMELINE.intro.fadeOutDuration,
        );
        const overlayProgress = progressForSegment(
          progress,
          MISSION_TIMELINE.overlay.fadeInAt,
          MISSION_TIMELINE.overlay.fadeInDuration,
        );
        const directorsProgress = progressForSegment(
          progress,
          MISSION_TIMELINE.directors.fadeInAt,
          MISSION_TIMELINE.directors.fadeInDuration,
        );
        const directorsYPercent = interpolate(
          MISSION_TIMELINE.directors.initialYPercent,
          0,
          directorsProgress,
        );

        const missionOpacity =
          interpolate(
            MISSION_TIMELINE.intro.initialOpacity,
            1,
            settleProgress,
          ) *
          (1 - fadeOutProgress);
        const missionYPercent =
          exitProgress > 0
            ? interpolate(0, MISSION_TIMELINE.intro.exitYPercent, exitProgress)
            : interpolate(
                MISSION_TIMELINE.intro.initialYPercent,
                0,
                settleProgress,
              );

        gsap.set(missionContent, {
          yPercent: missionYPercent,
          autoAlpha: missionOpacity,
        });
        gsap.set(darkOverlay, { opacity: overlayProgress });
        gsap.set(directorsContent, {
          autoAlpha: directorsProgress,
          yPercent: directorsYPercent,
        });
        setNavbarThemeOverride(
          progress >= MISSION_NAVBAR_THEME_TRIGGER.darkAtProgress
            ? MISSION_NAVBAR_THEME_TRIGGER.theme
            : null,
        );
      };

      const sceneTrigger = ScrollTrigger.create({
        trigger: section,
        start: MISSION_SCENE_SCROLL.start,
        end: MISSION_SCENE_SCROLL.end,
        scrub: isMobile
          ? MISSION_SCENE_SCROLL.scrub * MISSION_SCENE_SCROLL.mobileScrubMultiplier
          : MISSION_SCENE_SCROLL.scrub,
        onUpdate: (self) => {
          updateScene(self.progress);
        },
        onRefresh: (self) => {
          updateScene(self.progress);
        },
        onLeave: () => setNavbarThemeOverride(null),
        onLeaveBack: () => setNavbarThemeOverride(null),
      });

      updateScene(sceneTrigger.progress);

      return () => {
        sceneTrigger.kill();
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
          className={`bg-[var(--color-surface)] ${MISSION_LAYOUT.staticIntroPadding}`}
        >
          <div className="mx-auto flex min-h-[80vh] max-w-7xl items-center justify-center">
            <p className="max-w-6xl text-center text-4xl font-normal leading-[1.2] text-[var(--color-surface-foreground)] sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-7xl">
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
      className={`relative bg-[var(--color-surface)] ${MISSION_LAYOUT.animatedSectionMinHeight}`}
    >
      <div
        className={`sticky top-0 overflow-hidden isolate ${MISSION_LAYOUT.stickyViewportHeight}`}
      >
        <div className="absolute inset-0 bg-[var(--color-surface)]" />
        <div
          ref={darkOverlayRef}
          className="pointer-events-none absolute inset-0 z-10 bg-background opacity-0"
        />
        <div
          ref={missionContentRef}
          className={`absolute inset-0 z-20 flex items-center justify-center ${MISSION_LAYOUT.animatedIntroPadding}`}
        >
          <p className="max-w-6xl text-center text-4xl font-normal leading-[1.2] text-[var(--color-surface-foreground)] sm:text-5xl md:text-6xl lg:text-7xl xl:max-w-7xl">
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
