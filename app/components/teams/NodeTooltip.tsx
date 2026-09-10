// NodeTooltip.tsx — Polaroid-print officer card shown when a constellation node is hovered
// or tapped: square photo up top, name/role/quote captioned below on white print stock.
// Desktop cards chase the pointer like the Timeline recap card; touch layouts use a centered portal.

"use client";

import { useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import type { OfficerMember } from "./constellationLayout";
import { TEAM_POLAROID, TEAM_TOOLTIP } from "./sceneConfig";

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
      className={`z-50 text-left ${
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
      <div className={TEAM_POLAROID.print}>
        <div className={TEAM_POLAROID.photo}>
          {person.imageUrl ? (
            <Image
              src={person.imageUrl}
              alt={person.name}
              fill
              sizes={`${TEAM_TOOLTIP.width}px`}
              className="object-cover"
            />
          ) : (
            <span className={TEAM_POLAROID.initials}>
              {getInitials(person.name)}
            </span>
          )}
        </div>

        <div className={TEAM_POLAROID.caption}>
          <p className={TEAM_POLAROID.name}>{person.name}</p>
          <p className={TEAM_POLAROID.role}>{person.role}</p>

          {person.quote ? (
            <p className={TEAM_POLAROID.quote}>
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
