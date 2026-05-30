"use client";

import { useRef, useEffect, lazy, Suspense, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SPONSORS } from "../../data/sponsors";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { dispatchNavbarThemeOverride } from "../navbar/navbarThemeOverride";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { SPONSORS_SECTION_DATA_ATTR } from "@/app/components/background/sceneConfig";

const ReunionTower = lazy(() => import("./ReunionTower"));

configureScrollTrigger();

// ── Main component ──────────────────────────────────────────
export default function Sponsors() {
  const sectionRef = useRef<HTMLElement>(null);
  const towerWrapRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);

  // Shared refs for R3F scene
  const scrollProgressRef = useRef(0);
  const dragOffsetRef = useRef(0);

  // Drag state
  const isDragging = useRef(false);
  const lastXRef = useRef(0);
  const dragVelocity = useRef(0);

  const reducedMotion = usePrefersReducedMotion();

  // ── First-hover indicator state ───────────────────────────
  const [hasHovered, setHasHovered] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  const handleMouseEnter = () => {
    if (!hasHovered && !reducedMotion) {
      setHasHovered(true);
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 2000);
    }
  };

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

  // ── GSAP: scroll entrance, scroll progress, navbar
  useGSAP(() => {
    const section = sectionRef.current;
    const towerWrap = towerWrapRef.current;
    const logos = logosRef.current;
    if (!section || !towerWrap) return;

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
        },
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

  const towerH = "max(100vh, 1000px)";

  // ── Reduced-motion fallback ────────────────────────────────
  if (reducedMotion) {
    return (
      <div className="relative">
        <section
          ref={sectionRef}
          id="sponsors"
          className="relative bg-surface px-8 py-32 text-surface-foreground"
          {...{ [SPONSORS_SECTION_DATA_ATTR]: "" }}
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

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          {/* Sponsor logos grid - Left side */}
          <div 
            className="w-full lg:w-2/5 order-2 lg:order-1 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:overscroll-contain scrollbar-hide relative"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onMouseEnter={handleMouseEnter}
          >
            <style dangerouslySetInnerHTML={{ __html: `
              .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}} />

            {/* Scroll Indicator Overlay */}
            {showIndicator && (
              <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
                <div className="bg-surface/80 border border-surface-foreground/10 px-8 py-6 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                  <div className="w-10 h-16 rounded-full border-2 border-surface-foreground/30 flex justify-center p-2">
                    <div className="w-1 h-3 bg-surface-foreground rounded-full animate-bounce" />
                  </div>
                  <span className="text-lg font-bold tracking-[0.2em] text-surface-foreground uppercase">
                    Scrollable
                  </span>
                </div>
              </div>
            )}

            <div
              ref={logosRef}
              className={`grid grid-cols-2 sm:grid-cols-3 gap-4 lg:max-w-none pt-12 lg:pt-12 pb-32 transition-all duration-700 ${
                showIndicator ? "blur-xl scale-95 opacity-40" : "blur-0 scale-100 opacity-100"
              }`}
            >
              {SPONSORS.map((s) => (
                <a
                  key={s.name}
                  href={s.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sponsor-card flex items-center justify-center rounded-xl border border-surface-foreground/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-surface-foreground/25 hover:shadow-lg"
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
          </div>

          {/* 3D Reunion Tower — Right side */}
          <div className="w-full lg:w-3/5 order-1 lg:order-2 relative" style={{ height: "400vh" }}>
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