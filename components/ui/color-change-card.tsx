"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export type ColorChangeCardProps = {
  eyebrow: string;
  heading: string;
  description: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageClassName?: string;
  imageTreatmentClassName?: string;
  accent: string;
  index: number;
  prefersReducedMotion?: boolean;
};

function AnimatedHeading({ heading }: { heading: string }) {
  return (
    <h3
      aria-label={heading}
      className="text-2xl font-semibold leading-none tracking-[-0.025em] sm:text-3xl"
    >
      <span aria-hidden="true" className="flex flex-wrap">
        {Array.from(heading).map((letter, index) => {
          const visibleLetter = letter === " " ? "\u00a0" : letter;

          return (
            <span
              key={`${letter}-${index}`}
              className="relative inline-block h-[0.98em] overflow-hidden"
            >
              <span
                data-card-letter-out
                className="block leading-[0.98] will-change-transform"
              >
                {visibleLetter}
              </span>
              <span
                data-card-letter-in
                className="absolute left-0 top-full block leading-[0.98] will-change-transform"
              >
                {visibleLetter}
              </span>
            </span>
          );
        })}
      </span>
    </h3>
  );
}

export default function ColorChangeCard({
  eyebrow,
  heading,
  description,
  href,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  imageClassName = "w-1/2 max-w-72",
  imageTreatmentClassName = "",
  accent,
  index,
  prefersReducedMotion = false,
}: ColorChangeCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const card = cardRef.current;

      if (
        !card ||
        !contextSafe ||
        prefersReducedMotion ||
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches
      ) {
        return;
      }

      const media = card.querySelector<HTMLElement>("[data-card-media]");
      const mediaWash = card.querySelector<HTMLElement>("[data-card-media-wash]");
      const logo = card.querySelector<HTMLElement>("[data-card-logo]");
      const arrow = card.querySelector<SVGElement>("[data-card-arrow]");
      const outgoingLetters = gsap.utils.toArray<HTMLElement>(
        "[data-card-letter-out]",
        card,
      );
      const incomingLetters = gsap.utils.toArray<HTMLElement>(
        "[data-card-letter-in]",
        card,
      );

      const animateIn = contextSafe(() => {
        gsap.to(media, {
          scale: 1.025,
          duration: 0.7,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(mediaWash, {
          opacity: 0.68,
          duration: 0.55,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(logo, {
          y: -3,
          scale: 1.07,
          duration: 0.65,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(outgoingLetters, {
          yPercent: -115,
          duration: 0.48,
          ease: "power3.inOut",
          stagger: 0.012,
          overwrite: "auto",
        });
        gsap.to(incomingLetters, {
          yPercent: -100,
          duration: 0.48,
          ease: "power3.inOut",
          stagger: 0.012,
          overwrite: "auto",
        });
        gsap.to(arrow, {
          rotation: -45,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });
      });

      const animateOut = contextSafe(() => {
        gsap.to(media, {
          scale: 1,
          duration: 0.65,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(mediaWash, {
          opacity: 0.2,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(logo, {
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(outgoingLetters, {
          yPercent: 0,
          duration: 0.42,
          ease: "power3.inOut",
          stagger: {
            each: 0.008,
            from: "end",
          },
          overwrite: "auto",
        });
        gsap.to(incomingLetters, {
          yPercent: 0,
          duration: 0.42,
          ease: "power3.inOut",
          stagger: {
            each: 0.008,
            from: "end",
          },
          overwrite: "auto",
        });
        gsap.to(arrow, {
          rotation: 0,
          duration: 0.45,
          ease: "power3.out",
          overwrite: "auto",
        });
      });

      const handlePointerLeave = () => {
        if (document.activeElement !== card) {
          animateOut();
        }
      };

      card.addEventListener("pointerenter", animateIn);
      card.addEventListener("pointerleave", handlePointerLeave);
      card.addEventListener("focus", animateIn);
      card.addEventListener("blur", animateOut);

      return () => {
        card.removeEventListener("pointerenter", animateIn);
        card.removeEventListener("pointerleave", handlePointerLeave);
        card.removeEventListener("focus", animateIn);
        card.removeEventListener("blur", animateOut);
      };
    },
    {
      scope: cardRef,
      dependencies: [prefersReducedMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <a
      ref={cardRef}
      data-project-card
      data-project-reveal
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${heading}`}
      className="group relative block h-68 w-full overflow-hidden bg-[#26232b] text-white outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        data-card-media
        aria-hidden="true"
        className="absolute inset-0 flex origin-center items-center justify-center overflow-hidden will-change-transform"
      >
        <span
          data-card-media-wash
          className="absolute inset-0 opacity-20"
          style={{ backgroundColor: accent }}
        />
        <span className="absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:34px_34px]" />
        <div
          data-card-logo
          className="flex w-full items-center justify-center px-8 pb-8 will-change-transform sm:px-12"
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            className={`h-auto max-h-28 object-contain ${imageClassName} ${imageTreatmentClassName}`}
          />
        </div>
      </div>

      <span
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-linear-to-t from-black/90 via-black/15 to-black/10"
      />

      <div className="relative z-20 flex h-full flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white/55">
            {String(index).padStart(2, "0")}
          </p>
          <ArrowRight
            data-card-arrow
            aria-hidden="true"
            className="size-7 shrink-0 text-white/80 will-change-transform"
            strokeWidth={1.5}
          />
        </div>

        <div>
          <p className="mb-2 text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-white/60">
            {eyebrow}
          </p>
          <AnimatedHeading heading={heading} />
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/65 sm:text-sm">
            {description}
          </p>
        </div>
      </div>
    </a>
  );
}
