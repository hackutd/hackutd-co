"use client";

import { useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { SHOOTING_STAR_ROUTES, STAR_FIELD_STARS } from "./sceneConfig";
import { STAR_CLIP_PATH } from "./starGeometry";

type AmbientStarStyle = CSSProperties & {
  "--star-opacity": number;
  "--star-dim-opacity": number;
};

export default function StarField() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const shootingStarRef = useRef<HTMLDivElement>(null);
  const shootingStarVisualRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const shootingStar = shootingStarRef.current;
      const shootingStarVisual = shootingStarVisualRef.current;
      if (!shootingStar || !shootingStarVisual) {
        return;
      }

      gsap.set(shootingStar, { autoAlpha: 0, x: 0, y: 0 });

      if (prefersReducedMotion) {
        return;
      }

      const timeline = gsap.timeline({
        repeat: -1,
        repeatRefresh: true,
      });

      SHOOTING_STAR_ROUTES.forEach((route, index) => {
        const label = `shoot-${index}`;
        const fadeInDuration = route.duration * 0.16;
        const fadeOutDuration = route.duration * 0.3;

        timeline
          .addLabel(label, `+=${route.wait}`)
          .set(
            shootingStar,
            {
              autoAlpha: 0,
              left: `${route.startLeft}%`,
              top: `${route.startTop}%`,
              x: 0,
              y: 0,
            },
            label,
          )
          .set(
            shootingStarVisual,
            {
              rotation: () =>
                (Math.atan2(
                  (window.innerHeight * route.travelY) / 100,
                  (window.innerWidth * route.travelX) / 100,
                ) *
                  180) /
                Math.PI,
            },
            label,
          )
          .to(
            shootingStar,
            {
              x: () => (window.innerWidth * route.travelX) / 100,
              y: () => (window.innerHeight * route.travelY) / 100,
              duration: route.duration,
              ease: "power1.in",
            },
            label,
          )
          .fromTo(
            shootingStar,
            { autoAlpha: 0 },
            {
              autoAlpha: 1,
              duration: fadeInDuration,
              ease: "power1.out",
              immediateRender: false,
            },
            label,
          )
          .to(
            shootingStar,
            {
              autoAlpha: 0,
              duration: fadeOutDuration,
              ease: "power1.in",
            },
            `${label}+=${route.duration - fadeOutDuration}`,
          );
      });

      const syncVisibility = () => {
        if (document.hidden) {
          timeline.pause();
        } else {
          timeline.resume();
        }
      };

      document.addEventListener("visibilitychange", syncVisibility);
      syncVisibility();

      return () => {
        document.removeEventListener("visibilitychange", syncVisibility);
        timeline.kill();
      };
    },
    {
      scope: fieldRef,
      dependencies: [prefersReducedMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={fieldRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0">
        {STAR_FIELD_STARS.map((star) => {
          const style = {
            "--star-opacity": star.opacity,
            "--star-dim-opacity": star.dimOpacity,
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            clipPath: STAR_CLIP_PATH,
          } satisfies AmbientStarStyle;

          return (
            <span
              key={star.id}
              data-hide-star-on-mobile={star.hideOnMobile ? "" : undefined}
              className="site-star absolute bg-(--color-amber)"
              style={style}
            />
          );
        })}
      </div>

      <div
        ref={shootingStarRef}
        className="invisible absolute left-0 top-0 h-0 w-0 will-change-[transform,opacity]"
      >
        <div
          ref={shootingStarVisualRef}
          className="absolute left-0 top-0 origin-left"
        >
          <span className="absolute right-0 top-1/2 h-px w-16 -translate-y-1/2 bg-linear-to-r from-transparent to-amber/75 md:h-0.5 md:w-24" />
          <span
            className="absolute left-0 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 bg-(--color-amber) md:h-[11px] md:w-[11px]"
            style={{ clipPath: STAR_CLIP_PATH }}
          />
        </div>
      </div>
    </div>
  );
}
