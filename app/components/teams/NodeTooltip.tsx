// NodeTooltip.tsx — Square officer card shown when a constellation node is hovered or tapped.
// Desktop cards chase the pointer like the Timeline recap card; touch layouts use a centered portal.

"use client";

import { useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import type { OfficerMember } from "./constellationLayout";
import { TEAM_TOOLTIP } from "./sceneConfig";

gsap.registerPlugin(useGSAP);

export function getInitials(name: string) {
  const segments = name.trim().split(/\s+/).filter(Boolean);
  return segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

export function NodeTooltip({
  person,
  initialPointer,
  scheduleTooltipClose,
  centered = false,
}: {
  person: OfficerMember;
  initialPointer: { x: number; y: number };
  scheduleTooltipClose: () => void;
  centered?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const card = cardRef.current;

      if (!card || centered) {
        return;
      }

      const cardWidth = card.offsetWidth;
      const cardHeight = card.offsetHeight;
      let pointer = initialPointer;

      const getTarget = () => {
        const halfWidth = cardWidth / 2;
        const minX = halfWidth + TEAM_TOOLTIP.edgeMargin;
        const maxX = Math.max(
          minX,
          window.innerWidth - halfWidth - TEAM_TOOLTIP.edgeMargin,
        );
        const minY = TEAM_TOOLTIP.edgeMargin;
        const maxY = Math.max(
          minY,
          window.innerHeight - cardHeight - TEAM_TOOLTIP.edgeMargin,
        );
        const above = pointer.y - TEAM_TOOLTIP.gap - cardHeight;
        const below = pointer.y + TEAM_TOOLTIP.gap;

        return {
          x: gsap.utils.clamp(minX, maxX, pointer.x),
          y: gsap.utils.clamp(minY, maxY, above >= minY ? above : below),
        };
      };

      const start = getTarget();
      gsap.set(card, {
        xPercent: -50,
        x: start.x,
        y: start.y,
        autoAlpha: prefersReducedMotion ? 1 : 0,
      });

      let follow: (target: { x: number; y: number }) => void;

      if (prefersReducedMotion) {
        follow = (target) => gsap.set(card, target);
      } else {
        gsap.to(card, {
          autoAlpha: 1,
          scale: 1,
          duration: TEAM_TOOLTIP.reveal.duration,
          ease: TEAM_TOOLTIP.reveal.ease,
          startAt: { scale: TEAM_TOOLTIP.reveal.scaleFrom },
        });
        const quickX = gsap.quickTo(card, "x", TEAM_TOOLTIP.follow);
        const quickY = gsap.quickTo(card, "y", TEAM_TOOLTIP.follow);
        follow = (target) => {
          quickX(target.x);
          quickY(target.y);
        };
      }

      const updatePosition = () => {
        follow(getTarget());
      };
      const onPointerMove = (event: PointerEvent) => {
        pointer = { x: event.clientX, y: event.clientY };
        updatePosition();
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("resize", updatePosition);
        gsap.killTweensOf(card);
      };
    },
    {
      scope: cardRef,
      dependencies: [
        centered,
        initialPointer.x,
        initialPointer.y,
        person.id,
        prefersReducedMotion,
      ],
      revertOnUpdate: true,
    },
  );

  const card = (
    <div
      ref={cardRef}
      className={`z-50 border border-foreground/15 bg-background/95 p-3 text-left shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-md ${
        centered
          ? "relative visible pointer-events-auto opacity-100"
          : "invisible fixed left-0 top-0 pointer-events-none opacity-0"
      }`}
      style={{
        width: `min(${TEAM_TOOLTIP.width}px, calc(100vw - 2rem))`,
        height: `${TEAM_TOOLTIP.height}px`,
        willChange: centered ? "auto" : "transform, opacity",
      }}
    >
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
        {person.imageUrl ? (
          <Image
            src={person.imageUrl}
            alt={person.name}
            width={80}
            height={80}
            sizes="80px"
            className="h-20 w-20 border border-foreground/10 object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center border border-foreground/10 bg-foreground/6 text-base font-medium text-foreground/45">
            {getInitials(person.name)}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-lg font-semibold leading-tight text-foreground">
            {person.name}
          </p>
          <p className="mt-1.5 text-[0.68rem] uppercase leading-relaxed tracking-[0.14em] text-foreground/48">
            {person.role}
          </p>

          {person.quote ? (
            <p className="mt-2 border-l border-pink/55 pl-2.5 text-[0.78rem] italic leading-[1.35] text-foreground/68">
              &ldquo;{person.quote}&rdquo;
            </p>
          ) : null}
        </div>
      </div>

    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  if (!centered) {
    return createPortal(card, document.body);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          scheduleTooltipClose();
        }
      }}
    >
      {card}
    </div>,
    document.body,
  );
}
