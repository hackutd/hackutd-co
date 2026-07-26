"use client";

import type { RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import {
  HERO_SKYLINE,
  HERO_SKY_ELEMENTS,
  HERO_SKY_MOTION,
  heroSkyElementStyle,
} from "./sceneConfig";

type SkyElementsProps = {
  /** Owned by Hero so the layer can join the whiteout fade. */
  ref: RefObject<HTMLDivElement | null>;
};

/**
 * Clouds, plane and balloon over the Dallas skyline, laid out from the
 * reference plate and animated in place. Each one is a `bg-foreground`
 * rectangle masked by its artwork (see `heroSkyElementStyle`), so the flock
 * inherits the site theme exactly the way the buildings do.
 *
 * The layer is registered against the skyline band rather than the viewport,
 * which is what keeps the sky sitting on the rooflines instead of sliding
 * around as the window changes shape.
 */
export default function SkyElements({ ref }: SkyElementsProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const layer = ref.current;

      // Reduced motion keeps the arrangement and drops every tween — the
      // elements simply hold their reference positions.
      if (!layer || prefersReducedMotion) {
        return;
      }

      let context: gsap.Context | null = null;

      const build = () => {
        context?.revert();
        context = gsap.context(() => {
          const band = layer.offsetHeight;

          layer
            .querySelectorAll<HTMLElement>("[data-sky^='drift-']")
            .forEach((cloud) => {
              const direction = cloud.dataset.sky === "drift-right" ? 1 : -1;

              gsap.to(cloud, {
                xPercent: direction * HERO_SKY_MOTION.cloud.xPercent,
                duration: Number(cloud.dataset.skyDuration),
                ease: HERO_SKY_MOTION.cloud.ease,
                repeat: -1,
                yoyo: true,
              });
            });

          const plane = layer.querySelector<HTMLElement>("[data-sky='cross']");
          if (plane) {
            const planeRect = plane.getBoundingClientRect();
            const fromX = -planeRect.right;
            const toX = window.innerWidth - planeRect.left;
            const initialProgress = -fromX / (toX - fromX);

            gsap
              .fromTo(
                plane,
                { x: fromX },
                {
                  x: toX,
                  repeat: -1,
                  ...HERO_SKY_MOTION.plane,
                },
              )
              .progress(initialProgress);
          }

          const balloon = layer.querySelector<HTMLElement>("[data-sky='rise']");
          if (balloon) {
            const { from, to, duration, swayPercent, swayDuration } =
              HERO_SKY_MOTION.balloon;

            gsap.fromTo(
              balloon,
              { y: band * from, autoAlpha: 1 },
              {
                y: band * to,
                autoAlpha: 1,
                duration,
                ease: "none",
                repeat: -1,
                yoyo: true,
              },
            );

            // Separate tween so the sway keeps its own slow rhythm instead of
            // being tied to the length of the climb.
            gsap.to(balloon, {
              xPercent: swayPercent,
              duration: swayDuration,
              ease: "none",
              repeat: -1,
              yoyo: true,
            });
          }
        }, layer);
      };

      build();

      // The balloon's travel is measured in pixels off the band height, so a
      // resize has to rebuild it. Width is the trigger rather than any resize:
      // mobile browsers fire height changes constantly as the URL bar
      // collapses, and restarting the plane's crossing on every scroll would
      // be plain to see.
      let lastWidth = window.innerWidth;
      let rebuildTimer = 0;

      const onResize = () => {
        if (window.innerWidth === lastWidth) {
          return;
        }
        lastWidth = window.innerWidth;
        window.clearTimeout(rebuildTimer);
        rebuildTimer = window.setTimeout(build, 200);
      };

      window.addEventListener("resize", onResize);

      return () => {
        window.clearTimeout(rebuildTimer);
        window.removeEventListener("resize", onResize);
        context?.revert();
      };
    },
    { dependencies: [prefersReducedMotion] },
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 z-0 ${HERO_SKYLINE.layerBox}`}
    >
      {HERO_SKY_ELEMENTS.map((element) => (
        <span
          key={element.id}
          data-sky={element.motion}
          data-sky-duration={element.duration}
          style={heroSkyElementStyle(element)}
          className={`absolute bg-foreground ${element.className ?? ""}`}
        />
      ))}
    </div>
  );
}
