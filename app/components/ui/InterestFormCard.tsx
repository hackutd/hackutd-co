"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const INTEREST_FORM_URL = "https://acmutd.typeform.com/hack-interest";

function AnimatedInterestHeading() {
  const heading = "Interest Form";

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
                data-interest-letter-out
                className="block leading-[0.98] will-change-transform"
              >
                {visibleLetter}
              </span>
              <span
                data-interest-letter-in
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

type InterestFormCardProps = {
  prefersReducedMotion?: boolean;
};

export default function InterestFormCard({
  prefersReducedMotion = false,
}: InterestFormCardProps) {
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

      const media = card.querySelector<HTMLElement>("[data-interest-media]");
      const wash = card.querySelector<HTMLElement>("[data-interest-wash]");
      const arrow = card.querySelector<SVGElement>("[data-interest-arrow]");
      const outgoingLetters = gsap.utils.toArray<HTMLElement>(
        "[data-interest-letter-out]",
        card,
      );
      const incomingLetters = gsap.utils.toArray<HTMLElement>(
        "[data-interest-letter-in]",
        card,
      );

      const animateIn = contextSafe(() => {
        gsap.to(media, {
          scale: 1.075,
          duration: 0.7,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(wash, {
          opacity: 0.08,
          duration: 0.55,
          ease: "power2.out",
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
          y: -4,
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
        gsap.to(wash, {
          opacity: 0.58,
          duration: 0.5,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(outgoingLetters, {
          yPercent: 0,
          duration: 0.42,
          ease: "power3.inOut",
          stagger: { each: 0.008, from: "end" },
          overwrite: "auto",
        });
        gsap.to(incomingLetters, {
          yPercent: 0,
          duration: 0.42,
          ease: "power3.inOut",
          stagger: { each: 0.008, from: "end" },
          overwrite: "auto",
        });
        gsap.to(arrow, {
          y: 0,
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
      data-about-reveal="from-right"
      href={INTEREST_FORM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open the HackUTD interest form"
      className="group relative block min-h-52 overflow-hidden bg-[#26232b] text-white outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        data-interest-media
        aria-hidden="true"
        className="absolute inset-0 origin-center overflow-hidden bg-[linear-gradient(135deg,var(--color-amber)_0%,var(--color-orange)_28%,var(--color-pink)_62%,var(--color-purple)_100%)] will-change-transform"
      >
        <span className="absolute -left-[12%] -top-[55%] h-[130%] w-[75%] rounded-full bg-white/55 blur-3xl" />
        <span className="absolute -bottom-[65%] right-[2%] h-[125%] w-[70%] rounded-full bg-purple/60 blur-3xl" />
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(255,255,255,0.4),transparent_22%)]" />
        <span className="absolute inset-0 opacity-10 [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:34px_34px]" />
        <span
          data-interest-wash
          className={`absolute inset-0 bg-[#26232b] ${prefersReducedMotion ? "opacity-20" : "opacity-[0.58]"}`}
        />
      </div>

      <span
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-linear-to-t from-black/85 via-black/10 to-black/10"
      />

      <div className="relative z-20 flex min-h-52 flex-col justify-between p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white/60">
            Get involved
          </p>
          <ArrowRight
            data-interest-arrow
            aria-hidden="true"
            className="size-7 shrink-0 text-white/85 will-change-transform"
            strokeWidth={1.5}
          />
        </div>

        <div>
          <AnimatedInterestHeading />
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/70 sm:text-sm">
            Tell us you&apos;re interested in the next HackUTD.
          </p>
        </div>
      </div>
    </a>
  );
}
