"use client";

import { useRef, useEffect, lazy, Suspense, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SPONSORS } from "../../data/sponsors";
import { SPONSORS_SECTION_DATA_ATTR } from "../background/sceneConfig";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";

const ReunionTower = lazy(() => import("./ReunionTower"));

configureScrollTrigger();

// ── Main component ──────────────────────────────────────────
export default function Sponsors() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const towerWrapRef = useRef<HTMLDivElement>(null);
  const logosTrackRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);

  // Shared refs for R3F scene
  const scrollProgressRef = useRef(0);
  const dragOffsetRef = useRef(0);

  // Drag state
  const isDragging = useRef(false);
  const lastXRef = useRef(0);
  const dragVelocity = useRef(0);

  const reducedMotion = usePrefersReducedMotion();

  const [hasNudged, setHasNudged] = useState(false);

  // ── Drag-to-rotate on tower container ─────────────────────
  useEffect(() => {
    const el = towerWrapRef.current;
    if (!el || reducedMotion) return;

    let rafId: number;

    // Momentum decay loop
    const decayLoop = () => {
      if (!isDragging.current) {
        dragVelocity.current *= 0.95;
        dragOffsetRef.current += dragVelocity.current;
        if (Math.abs(dragVelocity.current) < 0.01) {
          dragVelocity.current = 0;
          return;
        }
      }
      rafId = requestAnimationFrame(decayLoop);
    };

    const down = (e: PointerEvent) => {
      isDragging.current = true;
      lastXRef.current = e.clientX;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };

    const move = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastXRef.current;
      dragVelocity.current = dx * 0.5;
      dragOffsetRef.current += dx * 0.5;
      lastXRef.current = e.clientX;
    };

    const up = () => {
      isDragging.current = false;
      el.style.cursor = "grab";
      rafId = requestAnimationFrame(decayLoop);
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [reducedMotion]);

  // ── GSAP: scroll entrance, shared logo/globe progress ─────
  const { contextSafe } = useGSAP(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    const towerWrap = towerWrapRef.current;
    const logosTrack = logosTrackRef.current;
    const logos = logosRef.current;
    if (reducedMotion || !section || !scene || !towerWrap) return;

    // Tower rises from below
    gsap.fromTo(
      towerWrap,
      { y: 300, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "top 20%",
          scrub: 1.5,
        },
      },
    );

    // On desktop, one document-scroll range advances both the logo rail and
    // the R3F globe. The logo column is clipped rather than independently
    // scrollable, so wheel/touch input can never get trapped in the rail.
    const media = gsap.matchMedia();
    media.add("(min-width: 1024px)", () => {
      if (!logosTrack) return;

      const syncGlobeProgress = (self: ScrollTrigger) => {
        scrollProgressRef.current = self.progress;
      };

      gsap.fromTo(
        logosTrack,
        { y: 0 },
        {
          y: () =>
            -Math.max(
              0,
              logosTrack.scrollHeight - (logosTrack.parentElement?.clientHeight ?? 0),
            ),
          ease: "none",
          scrollTrigger: {
            trigger: scene,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: syncGlobeProgress,
            onRefresh: syncGlobeProgress,
          },
        },
      );
    });
    media.add("(max-width: 1023px)", () => {
      ScrollTrigger.create({
        trigger: scene,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
        },
        onRefresh: (self) => {
          scrollProgressRef.current = self.progress;
        },
      });
    });

    // Sponsor logos stagger in
    if (logos) {
      const cards = logos.querySelectorAll(".sponsor-card");
      gsap.fromTo(
        cards,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          scrollTrigger: {
            trigger: logos,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        },
      );
    }

    return () => media.revert();
  }, {
    scope: sectionRef,
    dependencies: [reducedMotion],
    revertOnUpdate: true,
  });

  // ── Nudge animation on hover ──────────────────────────────
  const handleMouseEnter = () => {
    contextSafe(() => {
      if (
        reducedMotion ||
        !logosRef.current ||
        hasNudged ||
        // Only trigger nudge if the device has a cursor (hover support)
        !window.matchMedia("(hover: hover)").matches
      )
        return;

      setHasNudged(true);
      gsap.to(logosRef.current, {
        y: -15,
        duration: 0.5,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      });
    })();
  };

  const towerH = "max(100vh, 1000px)";

  // ── Reduced-motion fallback ────────────────────────────────
  if (reducedMotion) {
    return (
      <div className="relative">
        <section
          ref={sectionRef}
          id="sponsors"
          className="relative bg-surface px-8 text-surface-foreground"
          data-navbar-theme="light"
          data-sponsor-panel
        >
          <div className="flex items-end justify-between">
            <h2 className="text-4xl font-bold md:text-5xl">Our Sponsors</h2>
            <a
              href="mailto:sponsors@hackutd.co"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              sponsors@hackutd.co
            </a>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 md:grid-cols-5 lg:grid-cols-6">
            {SPONSORS.map((s) => (
              <a
                key={s.name}
                href={s.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-lg p-4 transition-opacity hover:opacity-75"
              >
                <img
                  src={s.logo || ""}
                  alt={s.name}
                  className="max-h-12 max-w-full object-contain"
                />
              </a>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ── Full 3D section ────────────────────────────────────────
  return (
    <div className="relative">
      <section
        ref={sectionRef}
        id="sponsors"
        className="relative z-20 bg-surface px-8 py-32 text-surface-foreground"
        data-navbar-theme="light"
        data-sponsor-panel
        {...{ [SPONSORS_SECTION_DATA_ATTR]: "" }}
      >
        {/* Header */}
        <div className="flex items-end justify-between">
          <h2 className="text-4xl font-bold md:text-5xl">Our Sponsors</h2>
          <a
            href="mailto:sponsors@hackutd.co"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            sponsors@hackutd.co
          </a>
        </div>

        <div
          ref={sceneRef}
          className="flex flex-col gap-8 lg:flex-row lg:gap-20"
        >
          {/* Sponsor logos grid - Left side */}
          <div
            className="relative z-10 order-2 w-full lg:sticky lg:top-0 lg:order-1 lg:h-screen lg:w-[48%] lg:overflow-hidden"
            onMouseEnter={handleMouseEnter}
          >
            <style dangerouslySetInnerHTML={{ __html: `
              .sponsor-card {
                box-shadow: inset 2px 2px 5px rgba(0,0,0,0.15), inset -2px -2px 5px rgba(255,255,255,0.7);
                /* Transition specific properties to avoid conflicts and lag */
                transition-property: box-shadow, border-color;
                transition-duration: 0.6s, 0.3s;
                transition-timing-function: ease;
                /* Only the box-shadow persists for 2s after mouse exit */
                transition-delay: 2s, 0s;
                will-change: box-shadow;
              }
              @media (hover: hover) {
                .sponsor-card:hover {
                  box-shadow: inset 6px 6px 12px rgba(255,255,255,0.8), inset -6px -6px 12px rgba(0,0,0,0.2);
                  /* Instant entry ensures the effect reaches 100% completion before exit can interrupt it */
                  transition-duration: 0s, 0.1s;
                  transition-delay: 0s, 0s;
                }
              }
              @media (min-width: 640px) {
                .pancake-grid > :nth-child(6n+4),
                .pancake-grid > :nth-child(6n+5),
                .pancake-grid > :nth-child(6n+6) {
                  transform: translateX(40px);
                }
              }
            `}} />

            <div ref={logosTrackRef}>
              <div
                ref={logosRef}
                className="pancake-grid grid grid-cols-2 gap-x-8 gap-y-8 px-4 pt-12 pr-10 pb-32 sm:grid-cols-3 lg:max-w-none lg:pt-12"
              >
                {SPONSORS.map((s) => (
                  <div key={s.name} className="h-full flex-shrink-0">
                    <a
                      href={s.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sponsor-card flex h-full items-center justify-center rounded-xl border border-surface-foreground/10 p-4 backdrop-blur-sm hover:border-surface-foreground/25"
                    >
                      <img
                        src={s.logo || ""}
                        alt={s.name}
                        className="max-h-10 max-w-full object-contain md:max-h-12"
                        loading="lazy"
                        draggable={false}
                      />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3D Reunion Tower — Right side */}
          <div className="relative order-1 h-[400vh] w-full lg:order-2 lg:w-[45%]">
            <div
              ref={towerWrapRef}
              className="sticky top-0"
              style={{
                width: "100%",
                height: "max(100vh, 1000px)",
                cursor: "grab",
                userSelect: "none",
              }}
            >
              <Suspense
                fallback={
                  <div
                    className="flex items-center justify-center"
                    style={{ height: towerH }}
                  >
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-foreground/20 border-t-surface-foreground" />
                  </div>
                }
              >
                <ReunionTower
                  scrollProgressRef={scrollProgressRef}
                  dragOffsetRef={dragOffsetRef}
                  sponsors={SPONSORS}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
