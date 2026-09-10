// TeamGroupPhoto.tsx — Renders the group photo that sits beneath the "The Team" heading.
// All team photos are stacked in one fixed-ratio frame and crossfaded by opacity so the
// picture swaps as the scroll-driven track moves between constellations (no layout shift).
// Pass a single team to render one static photo (used by the reduced-motion grid).

"use client";

import Image from "next/image";
import type { OfficerTeam } from "./constellationLayout";
import { TEAM_GROUP_PHOTO } from "./sceneConfig";

type TeamGroupPhotoProps = {
  teams: OfficerTeam[];
  activeIndex: number;
  sizes: string;
  animate?: boolean;
  className?: string;
};

export function TeamGroupPhoto({
  teams,
  activeIndex,
  sizes,
  animate = true,
  className = "",
}: TeamGroupPhotoProps) {
  const photoTeams = teams.filter((team) => Boolean(team.groupPhotoUrl));

  if (photoTeams.length === 0) {
    return null;
  }

  const requestedTeamId = teams[activeIndex]?.id;
  const activeTeamId = photoTeams.some((team) => team.id === requestedTeamId)
    ? requestedTeamId
    : photoTeams[0].id;

  return (
    <div className={`${TEAM_GROUP_PHOTO.frame} ${className}`}>
      {photoTeams.map((team, index) => (
        <Image
          key={team.id}
          src={team.groupPhotoUrl as string}
          alt={`The HackUTD ${team.label} team`}
          fill
          sizes={sizes}
          priority={index === 0}
          className={`object-cover ${animate ? TEAM_GROUP_PHOTO.crossfade : ""}`}
          style={{ opacity: team.id === activeTeamId ? 1 : 0 }}
        />
      ))}
      <span aria-hidden className={TEAM_GROUP_PHOTO.innerRing} />
    </div>
  );
}
