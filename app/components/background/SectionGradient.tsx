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
  SECTION_GRADIENT_LABEL_DATA_ATTR,
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
    (_context, contextSafe) => {
      const wrapper = wrapperRef.current;
      const artwork = artworkRef.current;
      const pullLayer = pullLayerRef.current;
      const labelLayer = labelLayerRef.current;
      const scrollRoot = document.querySelector<HTMLElement>(
        `[${SCROLL_ROOT_ATTR}]`,
      );

      if (
        !wrapper ||
        !artwork ||
        !pullLayer ||
        !labelLayer ||
        !scrollRoot ||
        !contextSafe
      ) {
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
      const dynamicTransitions = new Map<
        HTMLElement,
        { incomingLabel: HTMLElement; timeline: gsap.core.Timeline }
      >();
      const finishDynamicTransition = (label: HTMLElement) => {
        const transition = dynamicTransitions.get(label);

        if (!transition) {
          return;
        }

        transition.timeline.progress(1).kill();
        transition.incomingLabel.remove();
        dynamicTransitions.delete(label);
      };
      const syncDynamicLabel = contextSafe(
        (entry: (typeof entries)[number], animate: boolean) => {
          const dynamicLabel = entry.section.getAttribute(
            SECTION_GRADIENT_LABEL_DATA_ATTR,
          );

          if (!dynamicLabel || dynamicLabel === entry.label.textContent) {
            return;
          }

          finishDynamicTransition(entry.label);

          if (!animate) {
            entry.label.textContent = dynamicLabel;
            return;
          }

          const incomingLabel = entry.label.cloneNode(true) as HTMLElement;
          incomingLabel.removeAttribute(LABEL_DATA_ATTR);
          incomingLabel.setAttribute("aria-hidden", "true");
          incomingLabel.textContent = dynamicLabel;
          labelLayer.appendChild(incomingLabel);

          const { dynamicLabelDuration, labelTravelPercent } =
            SECTION_GRADIENT_MOTION;
          gsap.set(incomingLabel, {
            autoAlpha: 0,
            yPercent: labelTravelPercent,
          });

          const timeline = gsap
            .timeline({
              defaults: {
                duration: dynamicLabelDuration,
                ease: "none",
              },
            })
            .to(
              entry.label,
              { autoAlpha: 0, yPercent: -labelTravelPercent },
              0,
            )
            .to(incomingLabel, { autoAlpha: 1, yPercent: 0 }, 0)
            .add(() => {
              entry.label.textContent = dynamicLabel;
            })
            .set(entry.label, { autoAlpha: 1, yPercent: 0 })
            .add(() => {
              incomingLabel.remove();
              dynamicTransitions.delete(entry.label);
              // The .set above forced this label visible so the swap could
              // finish on screen. Whether it *should* be visible is the
              // resolver's call — a section can change its label while it is
              // nowhere near the reading line.
              updateLabels();
            });

          dynamicTransitions.set(entry.label, { incomingLabel, timeline });
        },
      );
      const labelObserver = new MutationObserver((mutations) => {
        mutations.forEach(({ target }) => {
          const entry = entries.find(({ section }) => section === target);

          if (entry) {
            syncDynamicLabel(entry, !prefersReducedMotion);
          }
        });
      });

      entries.forEach((entry) => {
        syncDynamicLabel(entry, false);
        labelObserver.observe(entry.section, {
          attributes: true,
          attributeFilter: [SECTION_GRADIENT_LABEL_DATA_ATTR],
        });
      });

      const cleanUpDynamicLabels = () => {
        labelObserver.disconnect();
        dynamicTransitions.forEach(({ incomingLabel, timeline }) => {
          timeline.kill();
          incomingLabel.remove();
        });
        dynamicTransitions.clear();
      };

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
        return cleanUpDynamicLabels;
      }

      const { labelTravelPercent, labelSnapDelta } = SECTION_GRADIENT_MOTION;

      /**
       * Labels are resolved from scroll position, not chained together.
       *
       * Each label used to be written by two independent scrubbed timelines —
       * one fading it in as the incoming word, one fading it out as the
       * outgoing one. That holds while scrolling, because the ranges are
       * crossed one at a time and in page order. It breaks on a jump: a navbar
       * anchor is an instant scroll, so it crosses every transition range in a
       * single frame, all six timelines then ease toward their new progress at
       * once (transitionScrub), and for that moment every word on the list is
       * part-way through a crossfade and on screen together. Worse, once they
       * settled the value of a shared label depended on which of its two
       * timelines rendered last — and update order is not guaranteed to be the
       * page order the chain assumed — so a word could stay lit on top of its
       * successor until that boundary was scrolled through again.
       *
       * So the triggers no longer animate anything. Each reports progress, and
       * one resolver derives every label's state from all of them together, the
       * way PageBackground already resolves its layers. At most two labels can
       * be non-zero because the resolver only ever assigns two, and a jump
       * lands on the right answer directly instead of easing through six wrong
       * ones on the way.
       */
      type LabelTransition = {
        from: number;
        to: number;
        trigger: ScrollTrigger;
      };

      /**
       * Declared up front and filled in place: ScrollTrigger.create() refreshes
       * synchronously, so the first trigger built calls updateLabels() before
       * the last one exists. Reading a half-built list is fine — a transition
       * yet to be created reports progress 0, which the resolver already
       * handles — and the explicit call after the loop settles the real answer.
       */
      const transitions: LabelTransition[] = [];

      const labelWriters = labels.map((label) => {
        const easeOpacity = gsap.quickTo(label, "opacity", {
          duration: SECTION_GRADIENT_MOTION.transitionScrub,
          ease: "none",
          onComplete: () => {
            // Drop the layer once the word has actually finished leaving.
            if (Number(gsap.getProperty(label, "opacity")) < 0.001) {
              gsap.set(label, { visibility: "hidden" });
            }
          },
        });
        const easeTravel = gsap.quickTo(label, "yPercent", {
          duration: SECTION_GRADIENT_MOTION.transitionScrub,
          ease: "none",
        });

        return (alpha: number, travel: number) => {
          if (alpha > 0) {
            gsap.set(label, { visibility: "visible" });
          }

          const current = Number(gsap.getProperty(label, "opacity"));
          if (Math.abs(alpha - current) >= labelSnapDelta) {
            // One update moved this label across most of its range, so the
            // scroll jumped rather than scrolled. Easing from here is exactly
            // what puts several words on screen at once — land on the value.
            gsap.set(label, {
              opacity: alpha,
              yPercent: travel,
              visibility: alpha > 0 ? "visible" : "hidden",
            });
          }

          easeOpacity(alpha);
          easeTravel(travel);
        };
      });

      function updateLabels() {
        // Walk in page order: the last transition that has begun owns the
        // state. Everything before it has finished and everything after has not
        // started, so only that one can be part-way through.
        let activeIndex = 0;
        let blendFrom = -1;
        let blendProgress = 1;

        for (const { from, to, trigger } of transitions) {
          const { progress } = trigger;
          if (progress > 0) {
            activeIndex = to;
            blendFrom = progress < 1 ? from : -1;
            blendProgress = progress;
          }
        }

        labels.forEach((label, index) => {
          // A label mid text-swap drives itself for those few frames; that
          // transition's tail calls back here once it lands.
          if (dynamicTransitions.has(label)) {
            return;
          }

          if (index === blendFrom) {
            labelWriters[index](
              1 - blendProgress,
              -labelTravelPercent * blendProgress,
            );
          } else if (index === activeIndex) {
            labelWriters[index](
              blendFrom === -1 ? 1 : blendProgress,
              blendFrom === -1 ? 0 : labelTravelPercent * (1 - blendProgress),
            );
          } else {
            labelWriters[index](0, 0);
          }
        });
      }

      entries.slice(1).forEach(({ section }, index) => {
        transitions.push({
          from: index,
          to: index + 1,
          trigger: ScrollTrigger.create({
            trigger: section,
            start: SECTION_GRADIENT_MOTION.transitionStart,
            end: SECTION_GRADIENT_MOTION.transitionEnd,
            onUpdate: () => updateLabels(),
            onRefresh: () => updateLabels(),
          }),
        });
      });

      updateLabels();

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

      return cleanUpDynamicLabels;
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
          {/* The artwork was 13 stacked radial gradients under a 30–44px blur
              and a radial mask. Live, that is several compositor surfaces of
              ~26MB each at DPR 2, held for the whole page — and none of it
              animates, so it is baked to a static image instead (regenerate
              with `node scripts/bake-section-gradient.mjs`). Heavily blurred
              source carries no detail finer than the blur radius, so the 640px
              bake stretches to full size with nothing visible lost. */}
          <div
            className="absolute inset-0 scale-[1.04] opacity-80"
            style={{
              backgroundImage: "url(/background/section-gradient.webp)",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
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
