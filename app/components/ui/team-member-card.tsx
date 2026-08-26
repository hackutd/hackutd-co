"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { DIRECTORS_ENTER_REVEAL } from "@/app/components/mission/sceneConfig";

gsap.registerPlugin(useGSAP);
configureScrollTrigger();

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface TeamMemberCardProps {
  position?: "left" | "right";
  jobPosition?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  imageAlt?: string;
  description?: string;
  className?: string;
}

/**
 * Editorial team card with an overlapping portrait, display typography, and
 * an inward directional entrance. The layout becomes a full-width landscape
 * card on small screens so group photos and long bios remain readable.
 */
export default function TeamMemberCard({
  position = "left",
  jobPosition = "Backend Engineer",
  firstName = "Jennie",
  lastName = "Garcia",
  imageUrl = "/mission/directors.JPG",
  imageAlt,
  description =
    "Jennie is a skilled developer with expertise in modern web technologies and a passion for creating seamless user experiences.",
  className,
}: TeamMemberCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const fullName = `${firstName} ${lastName}`.trim();
  const isPositionRight = position === "right";

  useGSAP(
    () => {
      const root = rootRef.current;
      const label = labelRef.current;
      const image = imageRef.current;
      const info = infoRef.current;

      if (!root || !label || !image || !info || prefersReducedMotion) {
        return;
      }

      const revealItems = [
        { target: label, fromRight: isPositionRight },
        { target: image, fromRight: isPositionRight },
        { target: info, fromRight: !isPositionRight },
      ];

      revealItems.forEach(({ target, fromRight }) => {
        gsap.fromTo(
          target,
          {
            autoAlpha: 0,
            x: fromRight
              ? DIRECTORS_ENTER_REVEAL.distance
              : -DIRECTORS_ENTER_REVEAL.distance,
          },
          {
            autoAlpha: 1,
            x: 0,
            duration: DIRECTORS_ENTER_REVEAL.duration,
            ease: DIRECTORS_ENTER_REVEAL.ease,
            scrollTrigger: {
              trigger: target,
              start: DIRECTORS_ENTER_REVEAL.start,
              toggleActions: DIRECTORS_ENTER_REVEAL.toggleActions,
            },
          },
        );
      });
    },
    {
      dependencies: [isPositionRight, prefersReducedMotion],
      revertOnUpdate: true,
      scope: rootRef,
    },
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative mx-auto my-8 flex w-full max-w-6xl flex-col justify-center sm:my-12",
        className,
      )}
    >
      <div ref={labelRef}>
        <p
          className={cn(
            "mb-4 text-xs font-medium uppercase tracking-[0.3em] text-muted",
            isPositionRight && "text-right",
          )}
        >
          {jobPosition}
        </p>
      </div>

      <div
        className={cn(
          "flex flex-col items-stretch md:flex-row md:items-center",
          isPositionRight && "md:flex-row-reverse",
        )}
      >
        <div
          ref={imageRef}
          className="group relative aspect-[3/2] w-full shrink-0 overflow-hidden md:w-[58%]"
        >
          <div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/25 via-transparent to-transparent" />
          <Image
            src={imageUrl}
            alt={imageAlt ?? fullName}
            fill
            sizes="(max-width: 767px) calc(100vw - 4rem), (max-width: 1279px) 58vw, 668px"
            className="object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        </div>

        <div
          ref={infoRef}
          className={cn(
            "relative z-20 mt-8 flex min-w-0 flex-1 flex-col gap-8 border border-foreground/10 bg-background/40 p-6 backdrop-blur-md md:-ml-8 md:mt-0 md:gap-12 md:p-8",
            isPositionRight &&
              "items-end text-right md:-mr-8 md:ml-0",
          )}
        >
          <p className="text-4xl leading-[1.05] font-light tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {firstName}
            <br />
            <span>{lastName}</span>
          </p>

          <p
            className={cn(
              "max-w-[48rem] text-base leading-[1.8] text-foreground/80 sm:text-lg",
              isPositionRight && "ml-auto",
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
