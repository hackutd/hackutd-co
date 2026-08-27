"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { missionContent } from "@/app/data/mission";
import TeamMemberCard from "@/app/components/ui/team-member-card";
import ScrollWordReveal from "@/components/ui/motion-scroll-word-reveal";
import {
  MISSION_KEY_WORD_CLASS,
  MISSION_KEY_WORD_DELIMITER,
  MISSION_STATEMENT_CURSOR,
  MISSION_WORD_REVEAL,
} from "./sceneConfig";

/**
 * The sticky stage gives the full statement one viewport to breathe while the
 * document scroll progressively restores each word to full ink — and it is
 * pulled up so that viewport pins the instant the hero's does, so the statement
 * is already centred when the reader meets it. Marked key words retain the
 * existing sans-serif weight emphasis, and the whole heading remains the hover
 * target for the difference-blended cursor highlight.
 */
const MISSION_STATEMENT_CLASS_NAME =
  "relative w-full font-sans text-[1.75rem] font-normal leading-[1.18] sm:text-[2.25rem] md:text-[3rem] lg:text-[3.5rem]";

const MISSION_ANCHOR = (
  <span
    id="mission"
    aria-hidden="true"
    className="pointer-events-none absolute left-1/2 top-1/2 h-px w-px scroll-mt-[50svh] md:scroll-mt-[50vh]"
  />
);

function renderDirectorsPanel() {
  const { eyebrow, quote, authors, photo } = missionContent.directorsMessage;
  const [firstDirector, secondDirector] = authors.split(" & ");

  return (
    <TeamMemberCard
      position="left"
      jobPosition={eyebrow}
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

    // The section is pulled up over the hero's last screen, so plain
    // intersection would widen the scrollbar — and reflow the page — while the
    // hero is still on it. Watching only the top band of the viewport holds the
    // switch until the statement is actually the thing being read.
    const observer = new IntersectionObserver(
      ([entry]) => {
        document.documentElement.toggleAttribute(
          "data-mission-scrollbar",
          entry.isIntersecting,
        );
      },
      { rootMargin: "0px 0px -85% 0px" },
    );

    observer.observe(missionSection);

    return () => {
      observer.disconnect();
      document.documentElement.removeAttribute("data-mission-scrollbar");
    };
  }, []);

  return (
    // The pull is what removes the viewport of blank scrolling between the hero
    // letting go and the statement pinning; see MISSION_WORD_REVEAL.pullUp. It
    // only applies where there is a whiteout to arrive out of — the
    // reduced-motion hero keeps its scene, so the statement stays below it.
    <div
      className={
        prefersReducedMotion
          ? "relative"
          : `relative ${MISSION_WORD_REVEAL.pullUp}`
      }
    >
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
          arrivalStart={
            prefersReducedMotion ? undefined : MISSION_WORD_REVEAL.arrivalStart
          }
          arrivalEnd={
            prefersReducedMotion ? undefined : MISSION_WORD_REVEAL.arrivalEnd
          }
          cursorSize={MISSION_STATEMENT_CURSOR.size}
          invertedCursor
        >
          {MISSION_ANCHOR}
        </ScrollWordReveal>
      </div>

      {/* About follows immediately, on the same lit surface: the palette only
          returns to base on the way out of About (see ABOUT_EXIT_DATA_ATTR), so
          there is no colour step between the statement and it, and no runway to
          scroll through to get from one to the other. */}
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
