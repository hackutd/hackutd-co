"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { missionContent } from "@/app/data/mission";
import TeamMemberCard from "@/app/components/ui/team-member-card";
import ScrollWordReveal from "@/components/ui/motion-scroll-word-reveal";
import { MISSION_STATEMENT_DATA_ATTR } from "../background/sceneConfig";
import {
  MISSION_KEY_WORD_CLASS,
  MISSION_KEY_WORD_DELIMITER,
  MISSION_STATEMENT_CURSOR,
  MISSION_WORD_REVEAL,
} from "./sceneConfig";

/**
 * The sticky stage gives the full statement one viewport to breathe while the
 * document scroll progressively restores each word to full ink. Marked key
 * words retain the existing sans-serif weight emphasis, and the whole heading
 * remains the hover target for the difference-blended cursor highlight.
 */
const MISSION_STATEMENT_CLASS_NAME =
  "relative w-full font-sans text-[1.75rem] font-normal leading-[1.18] sm:text-[2.25rem] md:text-[3rem] lg:text-[3.5rem]";

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
  const [firstDirector, secondDirector] = authors.split(" & ");
  const shortenedEyebrow = eyebrow.replace(/^HackUTD 2026 —\s*/, "");
  const roleWithoutTitle = role.replace(/^Co-Directors,\s*/, "");

  return (
    <TeamMemberCard
      position="left"
      jobPosition={`${shortenedEyebrow} · ${roleWithoutTitle}`}
      firstName={firstDirector}
      lastName={`& ${secondDirector}`}
      imageUrl={photo.src}
      imageAlt={photo.alt}
      description={quote}
    />
  );
}

type MissionProps = {
  afterStatement?: ReactNode;
};

export default function Mission({ afterStatement }: MissionProps) {
  const missionSectionRef = useRef<HTMLDivElement>(null);
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

  return (
    <div className="relative">
      {/* The page-level background owns this surface and its navbar palette. */}
      <div
        ref={missionSectionRef}
        data-section-gradient="mission"
        className={
          prefersReducedMotion
            ? "relative z-20 text-foreground"
            : "relative z-20 text-(--color-surface-foreground)"
        }
      >
        <ScrollWordReveal
          text={missionContent.statement}
          kicker={MISSION_WORD_REVEAL.kicker}
          className={MISSION_STATEMENT_CLASS_NAME}
          keyWordDelimiter={MISSION_KEY_WORD_DELIMITER}
          keyWordClassName={MISSION_KEY_WORD_CLASS}
          restOpacity={MISSION_WORD_REVEAL.restOpacity}
          revealSpan={MISSION_WORD_REVEAL.revealSpan}
          wordWindow={MISSION_WORD_REVEAL.wordWindow}
          scrollHeight={MISSION_WORD_REVEAL.scrollHeight}
          scrub={MISSION_WORD_REVEAL.scrub}
          cursorSize={MISSION_STATEMENT_CURSOR.size}
          invertedCursor
        >
          {MISSION_ANCHOR}
        </ScrollWordReveal>
      </div>

      {/* Empty paint-free runway: the statement leaves before PageBackground
          restores the base palette, and Stats arrives after the restore. */}
      {prefersReducedMotion ? null : (
        <div
          aria-hidden="true"
          {...{ [MISSION_STATEMENT_DATA_ATTR]: "" }}
          className={`relative z-20 ${MISSION_WORD_REVEAL.handoffHeight}`}
        />
      )}

      {afterStatement}

      {/* Directors message — enters editorially and remains in normal page flow. */}
      <section
        data-section-gradient="directors"
        className={
          prefersReducedMotion
            ? "relative z-20 bg-background px-8 py-24 md:px-12 md:py-32"
            : "relative z-20"
        }
      >
        <div
          className={
            prefersReducedMotion
              ? "flex w-full justify-center"
              : "flex h-screen items-center justify-center px-8 md:px-12"
          }
        >
          <div className="flex w-full justify-center">
            {renderDirectorsPanel()}
          </div>
        </div>
      </section>
    </div>
  );
}
