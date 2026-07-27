// NodeTooltip.tsx — Member popup card shown when a constellation node is hovered or tapped.
// Displays the officer's photo (or initials fallback), name, role, optional quote, and LinkedIn link.
// Also exports getInitials, which is shared with TeamConstellation for node button labels.

"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import type { OfficerMember } from "./constellationLayout";

const VIEWPORT_CLAMP_MARGIN = 16;

export function getInitials(name: string) {
  const segments = name.trim().split(/\s+/).filter(Boolean);
  return segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

export function NodeTooltip({
  person,
  placement,
  teamId,
  clearTooltipClose,
  setActiveTeamId,
  scheduleTooltipClose,
}: {
  person: OfficerMember;
  placement: string;
  teamId: string;
  clearTooltipClose: () => void;
  setActiveTeamId: (teamId: string | null) => void;
  scheduleTooltipClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    let deltaX = 0;
    let deltaY = 0;

    if (rect.top < VIEWPORT_CLAMP_MARGIN) {
      deltaY = VIEWPORT_CLAMP_MARGIN - rect.top;
    } else if (rect.bottom > window.innerHeight - VIEWPORT_CLAMP_MARGIN) {
      deltaY = window.innerHeight - VIEWPORT_CLAMP_MARGIN - rect.bottom;
    }

    if (rect.left < VIEWPORT_CLAMP_MARGIN) {
      deltaX = VIEWPORT_CLAMP_MARGIN - rect.left;
    } else if (rect.right > window.innerWidth - VIEWPORT_CLAMP_MARGIN) {
      deltaX = window.innerWidth - VIEWPORT_CLAMP_MARGIN - rect.right;
    }

    card.style.transform = deltaX !== 0 || deltaY !== 0 ? `translate(${deltaX}px, ${deltaY}px)` : "";
  }, []);

  return (
    <div
      ref={cardRef}
      className={`absolute z-40 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-foreground/12 bg-background/95 px-5 py-4 text-left shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-md ${placement}`}
      onMouseEnter={() => {
        clearTooltipClose();
        setActiveTeamId(teamId);
      }}
      onMouseLeave={scheduleTooltipClose}
      onFocusCapture={() => {
        clearTooltipClose();
        setActiveTeamId(teamId);
      }}
      onBlurCapture={(event) => {
        const relatedTarget = event.relatedTarget;
        if (
          relatedTarget instanceof Node &&
          event.currentTarget.contains(relatedTarget)
        ) {
          return;
        }
        scheduleTooltipClose();
      }}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute right-3 top-3 text-foreground/30 hover:text-foreground/70 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          scheduleTooltipClose();
        }}
      >
        ✕
      </button>
      <div className="flex items-center gap-3">
        {person.imageUrl ? (
          <Image
            src={person.imageUrl}
            alt={person.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover shrink-0 border border-foreground/10"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/6 text-sm font-medium text-foreground/40">
            {getInitials(person.name)}
          </div>
        )}
        <div className="min-w-0 pr-5">
          <p className="text-base font-semibold text-foreground truncate">
            {person.name}
          </p>
          <p className="mt-0.5 text-[0.7rem] uppercase tracking-[0.18em] text-foreground/40 truncate">
            {person.role}
          </p>
        </div>
      </div>
      {person.quote ? (
        <p className="mt-3 text-sm italic leading-snug text-foreground/60 border-l-2 border-pink/40 pl-3">
          &ldquo;{person.quote}&rdquo;
        </p>
      ) : null}
      <div className="mt-4 flex items-center gap-3">
        <a
          href={person.linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/6 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/12 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/70"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </a>
      </div>
    </div>
  );
}
