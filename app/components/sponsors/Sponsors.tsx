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
  const headerRef = useRef<HTMLDivElement>(null);
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

  // ── Cursor-tracked tilt on the sponsor tiles ──────────────
  // The CSS handles the lift, the shadow swap and the stacking order on its
  // own; this only feeds it where the cursor is, so the corner under the
  // pointer becomes the near corner and the specular wash follows it.
  useEffect(() => {
    const grid = logosRef.current;
    if (!grid || reducedMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const MAX_TILT = 9; // degrees at a tile's edge

    let active: HTMLElement | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;

    const clear = (tile: HTMLElement | null) => {
      if (!tile) return;
      for (const prop of ["--tilt-x", "--tilt-y", "--mx", "--my"]) {
        tile.style.removeProperty(prop);
      }
    };

    const paint = () => {
      frame = 0;
      if (!active) return;
      // Measured on the tile rather than the card: the tile never scales or
      // lifts, so the reading can't feed back into the transform it drives.
      // It does travel with the scrubbed rail, so it is re-read every frame.
      const box = active.getBoundingClientRect();
      const x = (pointerX - box.left) / box.width - 0.5;
      const y = (pointerY - box.top) / box.height - 0.5;
      // Positive rotateY pushes the right edge away and positive rotateX
      // brings the bottom edge forward, so the sign flip on x is what makes
      // the tile lean out toward the cursor instead of away from it.
      active.style.setProperty("--tilt-y", `${(-x * MAX_TILT * 2).toFixed(2)}deg`);
      active.style.setProperty("--tilt-x", `${(y * MAX_TILT * 2).toFixed(2)}deg`);
      active.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
      active.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    };

    const move = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const tile = target?.closest<HTMLElement>(".sponsor-tile") ?? null;
      if (tile !== active) {
        clear(active);
        active = tile;
      }
      if (!active) return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const leave = () => {
      clear(active);
      active = null;
    };

    grid.addEventListener("pointermove", move);
    grid.addEventListener("pointerleave", leave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      grid.removeEventListener("pointermove", move);
      grid.removeEventListener("pointerleave", leave);
      clear(active);
    };
  }, [reducedMotion]);

  // ── Keep the rail's travel measured against a settled grid ──
  // The rail is driven by `logosTrack.scrollHeight`, so anything that changes
  // that height after ScrollTrigger last measured leaves the rail scrubbing
  // over a stale distance — which reads as a rail that doesn't move at all.
  // The grid's `auto-rows-*` reserves every row up front so the first
  // measurement is already right; this catches whatever it can't (a font swap
  // reflowing the columns, a logo that resolves taller than its cap). Observed
  // rather than hung off image `load` events: it sees every cause, and the
  // border-box height it reports is not affected by the rail's own transform,
  // so a refresh can't feed back into another one.
  useEffect(() => {
    const track = logosTrackRef.current;
    if (!track || reducedMotion) return;

    let lastHeight = Math.round(track.getBoundingClientRect().height);
    let pending = 0;

    const observer = new ResizeObserver(() => {
      const height = Math.round(track.getBoundingClientRect().height);
      if (height === lastHeight) return;
      lastHeight = height;
      window.clearTimeout(pending);
      pending = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    });

    observer.observe(track);
    return () => {
      window.clearTimeout(pending);
      observer.disconnect();
    };
  }, [reducedMotion]);

  // ── GSAP: scroll entrance, shared logo/globe progress ─────
  const { contextSafe } = useGSAP(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const scene = sceneRef.current;
    const towerWrap = towerWrapRef.current;
    const logosTrack = logosTrackRef.current;
    const logos = logosRef.current;
    if (reducedMotion || !section || !scene || !towerWrap) return;

    // The wall's first frame is its heading, and it arrives while the timeline's
    // plume is still dissolving above it. Lifting it in over that same stretch
    // is what makes the handoff read as one movement instead of a panel of
    // white sliding up with text already printed on it.
    if (header) {
      gsap.fromTo(
        header,
        { y: 48, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 92%",
            end: "top 45%",
            scrub: 0.6,
          },
        },
      );
    }

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
          // Hand the transform back to CSS once the card has landed, so the
          // hover rules aren't outranked by GSAP's leftover inline style.
          clearProps: "transform",
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
              href="mailto:hackutdindustry@acmutd.co"
              className="group relative pb-1 text-sm text-muted transition-colors hover:text-foreground"
            >
              <span>hackutdindustry@acmutd.co</span>
              <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-linear-to-r from-purple to-pink transition-transform duration-300 group-hover:scale-x-100" />
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
    // Pulled 50vh up into the timeline's tail so the wall is already on screen
    // — heading and first logo rows and all — by the time the plume has finished
    // dissolving, instead of only starting to rise once the frame is white.
    // The overlap is what the transparent top of the wall below is for.
    <div className="relative -mt-[50vh]">
      <section
        ref={sectionRef}
        id="sponsors"
        className="relative z-20 px-8 pt-20 pb-32 text-surface-foreground"
        data-navbar-theme="light"
        data-sponsor-panel
        {...{ [SPONSORS_SECTION_DATA_ATTR]: "" }}
      >
        {/* The wall's own white, and the reason `bg-surface` is not on the
            section itself. The section now overlaps the timeline's last 50vh,
            and an opaque panel over that stretch is exactly the hard edge that
            cutting the plume produced before — so the overlapping part is left
            transparent and the solid panel starts where the section's top edge
            used to be. Nothing is lost by that: PAGE_BG has already carried the
            page to this same panel colour by then (SPONSORS_PANEL_PHASE), so
            the transparent band reads as the identical white, while the plume
            behind it is free to finish dissolving in full view underneath the
            heading and the logos rather than being clipped by them. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[50vh] bottom-0 -z-10 bg-surface"
        />

        {/* Header */}
        <div ref={headerRef} className="flex items-end justify-between">
          <h2 className="text-4xl font-bold md:text-5xl">Our Sponsors</h2>
          <a
            href="mailto:hackutdindustry@acmutd.co"
            className="group relative pb-1 text-sm text-muted transition-colors hover:text-foreground"
          >
            <span>hackutdindustry@acmutd.co</span>
            <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-linear-to-r from-purple to-pink transition-transform duration-300 group-hover:scale-x-100" />
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
              /* ── Sponsor tiles ──────────────────────────────────────
                 At rest a tile is debossed: two inset shadows press it
                 into the white panel. Hover has to reverse that reading
                 outright — the inset light drains away while a real drop
                 shadow grows underneath, the card rides forward through
                 its own perspective, tilts so the corner under the cursor
                 is the nearest one, lifts its logo clear of its face, and
                 jumps ahead of its neighbours while they fall back. */

              .sponsor-tile {
                --shift: 0px;
                --tilt-x: 0deg;
                --tilt-y: 0deg;
                --mx: 50%;
                --my: 50%;
                /* How long the box stays out after the cursor leaves. Declared
                   here so it inherits to the card, its ::before and its logo:
                   every part of the raised state has to hold for the same beat
                   or the box comes apart on the way down. */
                --hold: 2s;
                /* The tile itself never moves. All hover geometry lives on
                   the card inside it, so the hit area — and the box the
                   cursor maths measures against — stays put. */
                transform: translateX(var(--shift));
                perspective: 620px;
                z-index: 0;
                /* The stacking order has to outlast the box itself, or a held
                   card drops behind its neighbours while still standing out. */
                transition:
                  opacity 0.35s ease,
                  z-index 0.4s calc(var(--hold) + 0.4s);
              }

              @media (min-width: 640px) {
                .pancake-grid > :nth-child(6n+4),
                .pancake-grid > :nth-child(6n+5),
                .pancake-grid > :nth-child(6n+6) {
                  --shift: 40px;
                }
              }

              .sponsor-card {
                --lift: 0px;
                --depth: 0px;
                position: relative;
                background: var(--sponsor-panel);
                /* The debossed rest state puts its dark shading at the
                   top-left, which fixes the light source there for the whole
                   wall — everything below is derived from that one fact.

                   Six layers, and the same six in both states: a shadow list
                   can only interpolate when the layers line up, inset flags
                   included. The three that belong to the raised state sit at
                   zero alpha here, and each layer only ever crossfades within
                   its own colour, so nothing greys out mid-transition. */
                box-shadow:
                  /* pressed-in shading, lit from the top-left */
                  inset 2px 2px 5px rgba(0, 0, 0, 0.15),
                  inset -2px -2px 5px rgba(255, 255, 255, 0.7),
                  /* bulged-out shading — the mirror of the layer above */
                  inset -3px -3px 8px rgba(0, 0, 0, 0),
                  /* the box's two side faces and its contact with the wall,
                     all three parked flat */
                  0 0 0 rgba(26, 22, 46, 0),
                  0 0 0 rgba(26, 22, 46, 0),
                  0 0 0 -8px rgba(20, 12, 45, 0);
                /* Every transition declared on the resting rule is an exit —
                   it is what plays once :hover is lost — so the hold belongs
                   here and nowhere else. The hover rule below restates the
                   same properties without it, which is what keeps the box
                   coming out the instant the cursor arrives. */
                transition:
                  transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) var(--hold),
                  box-shadow 0.55s ease var(--hold),
                  border-color 0.35s ease var(--hold);
              }

              /* Specular wash following the cursor, so the raised face
                 reads as lit rather than merely moved. */
              .sponsor-card::before {
                content: "";
                position: absolute;
                inset: 0;
                border-radius: inherit;
                pointer-events: none;
                opacity: 0;
                background: radial-gradient(
                  150px circle at var(--mx) var(--my),
                  rgba(108, 23, 254, 0.18),
                  rgba(108, 23, 254, 0) 70%
                );
                transition: opacity 0.35s ease var(--hold);
              }

              @media (hover: hover) and (pointer: fine) {
                /* The 3D rest state is scoped to pointer devices: on a
                   touch screen it would only cost 40-odd composited layers
                   for a hover that can never fire. */
                .sponsor-card {
                  transform-style: preserve-3d;
                  transform:
                    translate3d(0, var(--lift), var(--depth))
                    rotateX(var(--tilt-x))
                    rotateY(var(--tilt-y));
                }

                .sponsor-card img {
                  transform: translateZ(0);
                  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) var(--hold);
                }

                .sponsor-tile:hover {
                  z-index: 30;
                  transition: opacity 0.35s ease, z-index 0s;
                }

                /* Hover is read off the tile, never the card: the card
                   slides out from under the cursor as it rises, which
                   would drop its own :hover and start a loop. */
                .sponsor-tile:hover .sponsor-card {
                  --lift: -2px;
                  --depth: 18px;
                  border-color: rgba(26, 26, 26, 0.22);
                  /* A solid extruded from the wall, not a card levitating
                     above it. Blur is what reads as distance, so the box's
                     own thickness is drawn with none at all: an offset shadow
                     at zero blur paints the whole card shape shifted down-right,
                     and the L-shaped band left uncovered *is* the side face.
                     Two of them — a darker one hugging the card for the crease
                     where it leaves the wall, a lighter one carrying the rest
                     of the face out to full depth.

                     Only the last layer is blurred, and it starts where the
                     side face ends: that one is the shadow the box casts, and
                     keeping it short is what stops the whole thing floating.
                     All of it falls down and to the right, under the same
                     top-left light as the inset. */
                  box-shadow:
                    inset 2px 2px 5px rgba(0, 0, 0, 0),
                    inset -2px -2px 5px rgba(255, 255, 255, 0),
                    inset -3px -3px 8px rgba(0, 0, 0, 0.07),
                    2px 2px 0 rgba(26, 22, 46, 0.12),
                    5px 5px 0 rgba(26, 22, 46, 0.08),
                    7px 8px 12px -5px rgba(20, 12, 45, 0.26);
                  transition:
                    transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2),
                    box-shadow 0.3s ease,
                    border-color 0.2s ease;
                }

                .sponsor-tile:hover .sponsor-card::before {
                  opacity: 1;
                  transition: opacity 0.35s ease;
                }

                /* The logo rides further forward than the face it sits on.
                   The parallax between the two is what sells the card as an
                   object with thickness rather than a scaled rectangle. */
                .sponsor-tile:hover .sponsor-card img {
                  transform: translateZ(16px);
                  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
                }

                /* Everything else recedes so the raised tile owns the wall. */
                .pancake-grid:has(> .sponsor-tile:hover) > .sponsor-tile:not(:hover) {
                  opacity: 0.72;
                }
              }
            `}} />

            <div ref={logosTrackRef}>
              <div
                ref={logosRef}
                className="pancake-grid grid auto-rows-[4.75rem] grid-cols-2 gap-x-8 gap-y-8 px-4 pt-8 pr-14 pb-32 sm:grid-cols-3 md:auto-rows-[5.25rem] lg:max-w-none lg:pt-8"
              >
                {SPONSORS.map((s) => (
                  <div key={s.name} className="sponsor-tile h-full flex-shrink-0">
                    <a
                      href={s.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sponsor-card flex h-full items-center justify-center rounded-xl border border-surface-foreground/10 p-4"
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
