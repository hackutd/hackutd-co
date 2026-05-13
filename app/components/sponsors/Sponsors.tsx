"use client";

import { useRef, useEffect, lazy, Suspense } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SPONSORS } from "../../data/sponsors";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { dispatchNavbarThemeOverride } from "../navbar/navbarThemeOverride";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";

const ReunionTower = lazy(() => import("./ReunionTower"));

configureScrollTrigger();

// ── Main component ──────────────────────────────────────────
export default function Sponsors() {
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const towerWrapRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);

  // Shared refs for R3F scene
  const scrollProgressRef = useRef(0);
  const dragOffsetRef = useRef(0);

  // Drag state
  const isDragging = useRef(false);
  const lastXRef = useRef(0);
  const dragVelocity = useRef(0);

  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();

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

  // ── GSAP: scroll entrance, scroll progress, overlay, navbar
  useGSAP(() => {
    const section = sectionRef.current;
    const overlay = overlayRef.current;
    const towerWrap = towerWrapRef.current;
    const logos = logosRef.current;
    if (!section || !overlay || !towerWrap) return;

    // Overlay fade for section exit
    gsap.set(overlay, { autoAlpha: 0 });
    gsap.to(overlay, {
      autoAlpha: 1,
      ease: "power1.in",
      scrollTrigger: {
        trigger: section,
        start: "center top",
        end: "bottom top",
        scrub: 1,
      },
    });

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
      }
    );

    // Scroll progress → drives tower rotation in R3F
    ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        scrollProgressRef.current = self.progress;
      },
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
        }
      );
    }

    // Navbar theme
    const nav = ScrollTrigger.create({
      trigger: section,
      start: "top 10%",
      end: "bottom 10%",
      onEnter: () => dispatchNavbarThemeOverride("light"),
      onEnterBack: () => dispatchNavbarThemeOverride("light"),
      onLeave: () => dispatchNavbarThemeOverride(null),
      onLeaveBack: () => dispatchNavbarThemeOverride(null),
    });
    return () => nav.kill();
  });

  const towerH = "100vh";

  // ── Reduced-motion fallback ────────────────────────────────
  if (reducedMotion) {
    return (
      <div className="relative bg-surface">
        <section
          ref={sectionRef}
          id="sponsors"
          className="relative px-8 py-32 text-surface-foreground"
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
                className="flex items-center justify-center rounded-lg p-4 transition-colors hover:bg-muted/10"
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
    <div className="relative bg-surface">
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-10 bg-background"
      />
      <section
        ref={sectionRef}
        id="sponsors"
        className="relative z-20 px-8 py-32 text-surface-foreground"
        data-navbar-theme="light"
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

        {/* 3D Reunion Tower — spans multiple pages, sticky canvas */}
        <div
          className="relative mt-12"
          style={{ height: "250vh" }}
        >
          <div
            ref={towerWrapRef}
            className="sticky top-0"
            style={{
              width: "100%",
              height: "100vh",
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

        {/* Sponsor logos grid */}
        <div
          ref={logosRef}
          className="mx-auto mt-16 grid max-w-6xl grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
        >
          {SPONSORS.map((s) => (
            <a
              key={s.name}
              href={s.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-card flex items-center justify-center rounded-xl bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white hover:shadow-lg"
            >
              <img
                src={s.logo || ""}
                alt={s.name}
                className="max-h-10 max-w-full object-contain md:max-h-12"
                loading="lazy"
                draggable={false}
              />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
