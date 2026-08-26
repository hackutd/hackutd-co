"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  ABOUT_ENTER_REVEAL,
  ABOUT_EXIT_DATA_ATTR,
  ABOUT_EXIT_FADE,
} from "@/app/components/background/sceneConfig";

gsap.registerPlugin(useGSAP);
configureScrollTrigger();

const SUPPORTING_STATS = [
  {
    value: "3500+",
    title: "Applicants",
    description: "Students applied to HackUTD",
    accent: "text-orange",
  },
  {
    value: "350+",
    title: "Project Submissions",
    description: "Submitted at HackUTD",
    accent: "text-pink",
  },
  {
    value: "53",
    title: "Schools",
    description: "Besides UTD represented",
    accent: "text-purple",
  },
] as const;

/**
 * About rides the same lit surface the mission statement is set on — the hero
 * whites the page out once and it stays that way through both sections, so
 * there is no palette step between them.
 *
 * `data-surface-ink` is what pays for that: it points the theme's ink tokens at
 * their surface counterparts for this subtree, so every `text-foreground`,
 * `text-muted` and `border-foreground/*` below reads against the lit page
 * instead of the base one — the same swap the sponsor wall makes, and only in
 * the animated path, since the reduced-motion page never leaves the base
 * palette to begin with.
 *
 * The page returns to that base palette on the way out of this section, which
 * the block itself has to make room for: see ABOUT_EXIT_FADE.
 */
export const BoldStats = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const content = contentRef.current;

      if (!section || !content || prefersReducedMotion) {
        return;
      }

      const revealItems = gsap.utils.toArray<HTMLElement>(
        "[data-about-reveal]",
      );

      revealItems.forEach((item) => {
        const fromRight = item.dataset.aboutReveal === "from-right";

        gsap.fromTo(
          item,
          {
            autoAlpha: 0,
            x: fromRight
              ? ABOUT_ENTER_REVEAL.distance
              : -ABOUT_ENTER_REVEAL.distance,
          },
          {
            autoAlpha: 1,
            x: 0,
            duration: ABOUT_ENTER_REVEAL.duration,
            ease: ABOUT_ENTER_REVEAL.ease,
            scrollTrigger: {
              trigger: item,
              start: ABOUT_ENTER_REVEAL.start,
              toggleActions: ABOUT_ENTER_REVEAL.toggleActions,
            },
          },
        );
      });

      // Literal `from` and `to` states rather than a plain `to()`: a rebuild
      // that lands mid-range would otherwise record "already dissolved" as
      // this block's resting state and it would never come back.
      gsap.fromTo(
        content,
        { autoAlpha: 1 },
        {
          autoAlpha: 0,
          ease: ABOUT_EXIT_FADE.ease,
          immediateRender: false,
          scrollTrigger: {
            trigger: section,
            start: ABOUT_EXIT_FADE.start,
            end: ABOUT_EXIT_FADE.end,
            scrub: ABOUT_EXIT_FADE.scrub,
          },
        },
      );
    },
    {
      scope: sectionRef,
      dependencies: [prefersReducedMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-labelledby="about-heading"
      data-section-gradient="about"
      {...{ [ABOUT_EXIT_DATA_ATTR]: "" }}
      {...(prefersReducedMotion ? {} : { "data-surface-ink": "" })}
      className="relative isolate flex min-h-screen flex-col justify-center px-8 py-24 sm:px-10 md:py-32 lg:px-12"
    >
      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex w-full max-w-7xl -translate-y-8 flex-col gap-10 sm:-translate-y-10 md:-translate-y-16 md:gap-16"
      >
        <h2
          id="about-heading"
          data-about-reveal="from-left"
          className="mb-3 flex flex-col gap-2 font-sans text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[0.9] tracking-[-0.045em] sm:gap-3 md:mb-4"
        >
          <span className="block text-foreground">About</span>
          <span className="block text-pink">HackUTD</span>
        </h2>

        <div className="grid items-stretch gap-8 border-b border-foreground/30 pb-10 md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] md:gap-12 md:pb-14">
          <div
            data-about-reveal="from-left"
            className="flex flex-col justify-center gap-4 lg:flex-row lg:items-baseline lg:justify-start lg:gap-8"
          >
            <span className="shrink-0 text-[clamp(4rem,8vw,6.5rem)] font-medium leading-[0.85] tracking-[-0.065em] text-foreground">
              1200+
            </span>

            <div className="max-w-sm">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                Participants
              </h3>
              <p className="mt-2 text-base text-muted md:text-lg">
                At Fall 2025 HackUTD
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            data-about-reveal="from-right"
            className="relative min-h-52 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,var(--color-amber)_0%,var(--color-orange)_28%,var(--color-pink)_62%,var(--color-purple)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          >
            <div className="absolute -left-[12%] -top-[55%] h-[130%] w-[75%] rounded-full bg-white/55 blur-3xl" />
            <div className="absolute -bottom-[65%] right-[2%] h-[125%] w-[70%] rounded-full bg-purple/60 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(255,255,255,0.4),transparent_22%)]" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3">
          {SUPPORTING_STATS.map((stat, index) => (
            <article
              key={stat.value}
              data-about-reveal={
                index === 0 ? "from-left" : "from-right"
              }
              className="border-b border-foreground/20 py-8 first:pt-0 last:border-b-0 sm:border-b-0 sm:border-r sm:px-8 sm:py-1 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
            >
              <p
                className={`mb-3 text-5xl font-medium tracking-[-0.055em] md:text-6xl ${stat.accent}`}
              >
                {stat.value}
              </p>
              <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                {stat.title}
              </h3>
              <p className="mt-2 max-w-[24ch] text-sm leading-relaxed text-muted md:text-base">
                {stat.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BoldStats;
