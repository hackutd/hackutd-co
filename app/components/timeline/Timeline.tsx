"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";

configureScrollTrigger();

export default function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(() => {
    if (prefersReducedMotion || !rocketRef.current || !trailRef.current || !sectionRef.current) return;

    const rocket = rocketRef.current;
    const trail = trailRef.current;
    const section = sectionRef.current;
    const sectionWidth = section.offsetWidth;
    const rocketWidth = rocket.offsetWidth;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 40%",
        end: "center center",
        scrub: true,
        invalidateOnRefresh: true,
        markers: true,
      },
    });

    // Rocket moves from right edge to left edge
    tl.fromTo(rocket,
      { x: 0 },
      { x: -(sectionWidth - rocketWidth), ease: "power2.out" },
      0
    );

    // Offset by rocket body width (~82% of bounding box), not the full SVG which includes fin tips
    const rocketBodyWidth = rocketWidth * 0.82;

    // Trail sits just behind the rocket body, moves the same distance as the rocket
    tl.fromTo(trail,
      { x: sectionWidth - rocketWidth + rocketBodyWidth },
      { x: rocketBodyWidth, ease: "power2.out" },
      0
    );
  }, { scope: sectionRef });

  return (
    <section
      id="hackathons"
      ref={sectionRef}
      className="relative w-full min-h-screen overflow-hidden"
    >
      {/* Trail — stretches from right edge, growing behind the rocket */}
      <div
        ref={trailRef}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-full"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Trail.svg"
          alt=""
          className="h-[150px] sm:h-[200px] md:h-[300px] w-full object-fill"
        />
      </div>

      {/* Rocket — moves from right to left */}
      <div
        ref={rocketRef}
        className="absolute right-0 top-1/2 -translate-y-1/2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Rocket.svg"
          alt="Rocket"
          className="h-auto w-[25vw] sm:w-[20vw] md:w-[15vw]"
        />
      </div>
    </section>
  );
}
