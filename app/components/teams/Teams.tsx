"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import {
  ORDERED_OFFICER_TEAMS,
  resolveConstellationLayout,
  type OfficerTeam,
  type ResolvedConstellationLayout,
} from "./constellationLayout";
import {
  getDesktopConstellationBox,
  type ConstellationBox,
  TEAM_CLUSTER_BOX,
  TEAMS_BACKGROUND_STARS,
  TEAMS_COPY,
  TEAMS_LAYOUT,
  TEAMS_SCROLL,
} from "./sceneConfig";

type ActiveNodeState = {
  teamId: string;
  personId: string;
} | null;

function getInitials(name: string) {
  const segments = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return segments
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

function getMemberCountLabel(memberCount: number) {
  return `${memberCount} MEMBERS`;
}

function getTeamOpacity(activeTeamId: string | null, teamId: string) {
  if (!activeTeamId || activeTeamId === teamId) {
    return 1;
  }

  return 0.25;
}

function getTooltipPlacement(
  nodeX: number,
  nodeY: number,
  box: ConstellationBox,
) {
  let horizontal = "left-1/2 -translate-x-1/2";

  if (nodeX < box.width * 0.18) {
    horizontal = "left-0 translate-x-0";
  } else if (nodeX > box.width * 0.82) {
    horizontal = "right-0 translate-x-0";
  }

  const vertical =
    nodeY < box.height * 0.34 ? "top-full mt-4" : "bottom-full mb-4";

  return `${vertical} ${horizontal}`;
}

function areBoxesEqual(left: ConstellationBox, right: ConstellationBox) {
  return (
    left.width === right.width &&
    left.height === right.height &&
    left.padding === right.padding &&
    left.verticalBias === right.verticalBias &&
    left.leadNodeSize === right.leadNodeSize &&
    left.nodeSize === right.nodeSize
  );
}

function TeamConstellation({
  layout,
  box,
  activeTeamId,
  setActiveTeamId,
  activeNode,
  openNode,
  clearTooltipClose,
  scheduleTooltipClose,
  interactive,
  showCaption = true,
}: {
  layout: ResolvedConstellationLayout;
  box: ConstellationBox;
  activeTeamId: string | null;
  setActiveTeamId: (teamId: string | null) => void;
  activeNode: ActiveNodeState;
  openNode: (teamId: string, personId: string) => void;
  clearTooltipClose: () => void;
  scheduleTooltipClose: () => void;
  interactive: boolean;
  showCaption?: boolean;
}) {
  const teamOpacity = getTeamOpacity(activeTeamId, layout.team.id);
  const memberCountLabel = getMemberCountLabel(layout.nodes.length);
  const graphBounds = layout.nodes.reduce(
    (bounds, node) => {
      const radius = (node.isLead ? box.leadNodeSize : box.nodeSize) / 2 + 6;

      return {
        minX: Math.min(bounds.minX, node.renderX - radius),
        maxX: Math.max(bounds.maxX, node.renderX + radius),
      };
    },
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
    },
  );
  const graphWidth = graphBounds.maxX - graphBounds.minX;
  const graphOffsetX = (box.width - graphWidth) / 2 - graphBounds.minX;
  const shiftedNodes = layout.nodes.map((node) => ({
    ...node,
    shiftedX: node.renderX + graphOffsetX,
  }));
  const nodeMap = new Map(shiftedNodes.map((node) => [node.id, node]));

  const trimEdge = (fromId: string, toId: string) => {
    const fromNode = nodeMap.get(fromId);
    const toNode = nodeMap.get(toId);

    if (!fromNode || !toNode) {
      return null;
    }

    const dx = toNode.renderX - fromNode.renderX;
    const dy = toNode.renderY - fromNode.renderY;
    const distance = Math.hypot(dx, dy) || 1;
    const fromRadius =
      (fromNode.isLead ? box.leadNodeSize : box.nodeSize) / 2 + 3;
    const toRadius = (toNode.isLead ? box.leadNodeSize : box.nodeSize) / 2 + 3;

    return {
      x1: fromNode.shiftedX + (dx / distance) * fromRadius,
      y1: fromNode.renderY + (dy / distance) * fromRadius,
      x2: toNode.shiftedX - (dx / distance) * toRadius,
      y2: toNode.renderY - (dy / distance) * toRadius,
    };
  };

  return (
    <article
      className="relative flex shrink-0 flex-col items-center transition-opacity duration-300"
      style={{ opacity: teamOpacity, width: `${box.width}px` }}
      onMouseEnter={
        interactive
          ? () => {
            clearTooltipClose();
            setActiveTeamId(layout.team.id);
          }
          : undefined
      }
      onMouseLeave={interactive ? scheduleTooltipClose : undefined}
    >
      <div
        className="relative"
        style={{ width: `${box.width}px`, height: `${box.height}px` }}
      >
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox={`0 0 ${box.width} ${box.height}`}
        >
          {layout.edges.map((edge, index) => {
            const trimmedEdge = trimEdge(edge.fromId, edge.toId);

            if (!trimmedEdge) {
              return null;
            }

            return (
              <line
                key={`${layout.team.id}-edge-${index}`}
                x1={trimmedEdge.x1}
                y1={trimmedEdge.y1}
                x2={trimmedEdge.x2}
                y2={trimmedEdge.y2}
                stroke="rgba(255, 255, 255, 0.16)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {shiftedNodes.map((node) => {
          const isActive =
            activeNode?.teamId === layout.team.id &&
            activeNode.personId === node.person.id;
          const tooltipPlacement = getTooltipPlacement(
            node.shiftedX,
            node.renderY,
            box,
          );
          const nodePositionStyle: CSSProperties = {
            left: `${node.shiftedX}px`,
            top: `${node.renderY}px`,
            zIndex: isActive ? 30 : node.isLead ? 12 : 8,
          };
          const nodeButtonStyle: CSSProperties = {
            width: node.isLead ? `${box.leadNodeSize}px` : `${box.nodeSize}px`,
            height: node.isLead ? `${box.leadNodeSize}px` : `${box.nodeSize}px`,
            boxShadow: node.isLead
              ? "0 0 0 8px rgba(243, 22, 103, 0.08)"
              : "none",
          };
          const nodeLabelStyle: CSSProperties = {
            fontSize: node.isLead
              ? `${Math.round(box.leadNodeSize * 0.42)}px`
              : `${Math.round(box.nodeSize * 0.46)}px`,
          };

          return (
            <div
              key={`${layout.team.id}-${node.person.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={nodePositionStyle}
            >
              {isActive ? (
                <div
                  className={`absolute z-40 w-72 rounded-2xl border border-white/12 bg-black/95 px-5 py-4 text-left shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-md ${tooltipPlacement}`}
                  onMouseEnter={() => {
                    clearTooltipClose();
                    setActiveTeamId(layout.team.id);
                  }}
                  onMouseLeave={scheduleTooltipClose}
                  onFocusCapture={() => {
                    clearTooltipClose();
                    setActiveTeamId(layout.team.id);
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
                    className="absolute right-3 top-3 text-white/30 hover:text-white/70 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      scheduleTooltipClose();
                    }}
                  >
                    ✕
                  </button>
                  <div className="flex items-center gap-3">
                    {node.person.imageUrl ? (
                      <Image
                        src={node.person.imageUrl}
                        alt={node.person.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full object-cover shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-sm font-medium text-white/40">
                        {getInitials(node.person.name)}
                      </div>
                    )}
                    <div className="min-w-0 pr-5">
                      <p className="text-base font-semibold text-foreground truncate">
                        {node.person.name}
                      </p>
                      <p className="mt-0.5 text-[0.7rem] uppercase tracking-[0.18em] text-white/40 truncate">
                        {node.person.role}
                      </p>
                    </div>
                  </div>
                  {node.person.quote ? (
                    <p className="mt-3 text-sm italic leading-snug text-white/60 border-l-2 border-pink/40 pl-3">
                      &ldquo;{node.person.quote}&rdquo;
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center gap-3">
                    <a
                      href={node.person.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/6 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/70"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </a>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                aria-label={`${node.person.name}, ${node.person.role}`}
                className={`flex items-center justify-center rounded-full border transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${node.isLead
                  ? "constellation-lead border-[3px] border-pink bg-[#1f1f1f] text-white/56 hover:scale-[1.04]"
                  : "border-[3px] border-white/12 bg-[#1f1f1f] text-white/32 hover:scale-[1.07]"
                  }`}
                style={nodeButtonStyle}
                onMouseEnter={
                  interactive
                    ? () => openNode(layout.team.id, node.person.id)
                    : undefined
                }
                onMouseLeave={interactive ? scheduleTooltipClose : undefined}
                onFocus={
                  interactive
                    ? () => openNode(layout.team.id, node.person.id)
                    : undefined
                }
                onBlur={interactive ? scheduleTooltipClose : undefined}
              >
                <span
                  className="select-none font-medium tracking-[-0.03em]"
                  style={nodeLabelStyle}
                >
                  {getInitials(node.person.name)}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {showCaption ? (
        <div className="mt-6 w-[15rem] text-left">
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-white/30">
            {layout.template.name}
          </p>
          <h3 className="text-3xl font-medium tracking-[-0.03em] text-foreground">
            {layout.team.label}
          </h3>
          <p className="mt-2 text-[0.78rem] uppercase tracking-[0.1em] text-white/34">
            {memberCountLabel}
          </p>
        </div>
      ) : null}
    </article>
  );
}

function MobileTeamCard({
  layout,
  box,
  activeNode,
  setActiveTeamId,
  openNode,
  clearTooltipClose,
  scheduleTooltipClose,
}: {
  layout: ResolvedConstellationLayout;
  box: ConstellationBox;
  activeNode: ActiveNodeState;
  setActiveTeamId: (teamId: string | null) => void;
  openNode: (teamId: string, personId: string) => void;
  clearTooltipClose: () => void;
  scheduleTooltipClose: () => void;
}) {
  const memberCountLabel = getMemberCountLabel(layout.nodes.length);

  return (
    <div className="min-w-[85vw] snap-center rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:min-w-[23rem]">
      <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/26">
        HACKUTD
      </p>
      <p className="mt-3 text-[0.72rem] uppercase tracking-[0.18em] text-white/30">
        {layout.template.name}
      </p>
      <h3 className="mt-2 text-xl font-medium text-foreground">{layout.team.label}</h3>
      <p className="mt-2 text-[0.78rem] uppercase tracking-[0.1em] text-white/34">
        {memberCountLabel}
      </p>
      <div className="mt-6">
        <TeamConstellation
          layout={layout}
          box={box}
          activeTeamId={layout.team.id}
          setActiveTeamId={setActiveTeamId}
          activeNode={activeNode}
          openNode={openNode}
          clearTooltipClose={clearTooltipClose}
          scheduleTooltipClose={scheduleTooltipClose}
          interactive
          showCaption={false}
        />
      </div>
    </div>
  );
}

function buildLayouts(teams: OfficerTeam[], box: ConstellationBox) {
  return teams.map((team) =>
    resolveConstellationLayout(
      team,
      box.width,
      box.height,
      box.padding,
      box.verticalBias,
    ),
  );
}


export default function Teams() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackViewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tooltipCloseTimeoutRef = useRef<number | null>(null);
  const descTransitionRef = useRef<number | null>(null);
  const activeTeamIndexRef = useRef(0);
  const isMobile = useIsMobile();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayedTeamIndex, setDisplayedTeamIndex] = useState(0);
  const [descVisible, setDescVisible] = useState(true);
  const [desktopBox, setDesktopBox] = useState<ConstellationBox>(
    TEAM_CLUSTER_BOX.desktop,
  );
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<ActiveNodeState>(null);

  useEffect(() => {
    if (isMobile) {
      return;
    }

    const trackViewport = trackViewportRef.current;

    if (!trackViewport) {
      return;
    }

    const updateDesktopBox = () => {
      const nextBox = getDesktopConstellationBox(
        trackViewport.offsetWidth,
        window.innerHeight,
      );

      setDesktopBox((currentBox) =>
        areBoxesEqual(currentBox, nextBox) ? currentBox : nextBox,
      );
    };

    updateDesktopBox();

    const resizeObserver = new ResizeObserver(updateDesktopBox);
    resizeObserver.observe(trackViewport);
    window.addEventListener("resize", updateDesktopBox);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDesktopBox);
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile || prefersReducedMotion) {
      return;
    }

    const section = sectionRef.current;
    const trackViewport = trackViewportRef.current;
    const track = trackRef.current;

    if (!section || !trackViewport || !track) {
      return;
    }

    let frame = 0;
    let currentX = 0;
    let targetX = 0;
    let maxTranslate = 0;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const updateTarget = () => {
      const scrollableDistance = Math.max(
        section.offsetHeight - window.innerHeight,
        1,
      );
      const progress = clamp(
        (window.scrollY - section.offsetTop) / scrollableDistance,
        0,
        1,
      );
      targetX = progress * maxTranslate;

      if (maxTranslate > 0) {
        const slotWidth = track.scrollWidth / ORDERED_OFFICER_TEAMS.length;
        const nextIndex = clamp(
          Math.round((progress * maxTranslate) / slotWidth),
          0,
          ORDERED_OFFICER_TEAMS.length - 1,
        );
        if (nextIndex !== activeTeamIndexRef.current) {
          activeTeamIndexRef.current = nextIndex;
          setDescVisible(false);
          if (descTransitionRef.current !== null) {
            window.clearTimeout(descTransitionRef.current);
          }
          descTransitionRef.current = window.setTimeout(() => {
            setDisplayedTeamIndex(nextIndex);
            setDescVisible(true);
            descTransitionRef.current = null;
          }, 200);
        }
      }

      if (progress <= 0.001 || progress >= 0.999) {
        currentX = targetX;
        track.style.transform = `translate3d(${-currentX}px, 0, 0)`;
        return;
      }

      queueRender();
    };

    const updateMetrics = () => {
      maxTranslate = Math.max(track.scrollWidth - trackViewport.offsetWidth, 0);
      updateTarget();
    };

    const renderTrack = () => {
      currentX += (targetX - currentX) * TEAMS_SCROLL.smoothing;

      if (Math.abs(targetX - currentX) < 0.12) {
        currentX = targetX;
      }

      track.style.transform = `translate3d(${-currentX}px, 0, 0)`;

      if (currentX !== targetX) {
        frame = window.requestAnimationFrame(renderTrack);
        return;
      }

      frame = 0;
    };

    const queueRender = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(renderTrack);
    };

    updateMetrics();

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(trackViewport);
    resizeObserver.observe(track);
    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateMetrics);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", updateMetrics);
      track.style.transform = "";
    };
  }, [desktopBox.height, desktopBox.width, isMobile, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (tooltipCloseTimeoutRef.current !== null) {
        window.clearTimeout(tooltipCloseTimeoutRef.current);
      }
      if (descTransitionRef.current !== null) {
        window.clearTimeout(descTransitionRef.current);
      }
    };
  }, []);

  const clearTooltipClose = () => {
    if (tooltipCloseTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(tooltipCloseTimeoutRef.current);
    tooltipCloseTimeoutRef.current = null;
  };

  const scheduleTooltipClose = () => {
    clearTooltipClose();
    tooltipCloseTimeoutRef.current = window.setTimeout(() => {
      setActiveNode(null);
      setActiveTeamId(null);
      tooltipCloseTimeoutRef.current = null;
    }, TEAMS_SCROLL.tooltipCloseDelayMs);
  };

  const openNode = (teamId: string, personId: string) => {
    clearTooltipClose();
    setActiveTeamId(teamId);
    setActiveNode({ teamId, personId });
  };

  const desktopLayouts = buildLayouts(ORDERED_OFFICER_TEAMS, desktopBox);
  const mobileLayouts = buildLayouts(ORDERED_OFFICER_TEAMS, TEAM_CLUSTER_BOX.mobile);

  if (isMobile) {
    return (
      <section
        id="team"
        className={`relative overflow-hidden bg-background ${TEAMS_LAYOUT.mobileSectionPadding}`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {TEAMS_BACKGROUND_STARS.map((star) => {
            const starStyle: CSSProperties = {
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            };

            return (
              <span
                key={star.id}
                className="absolute rounded-full bg-white"
                style={starStyle}
              />
            );
          })}
        </div>

        <div className="relative mx-auto max-w-6xl">
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/26">
            {TEAMS_COPY.eyebrow}
          </p>
          <h2 className={TEAMS_LAYOUT.mobileHeading}>
            {TEAMS_COPY.heading[0]}
            <br />
            {TEAMS_COPY.heading[1]}
          </h2>

          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-6">
            {mobileLayouts.map((layout) => (
              <MobileTeamCard
                key={layout.team.id}
                layout={layout}
                box={TEAM_CLUSTER_BOX.mobile}
                activeNode={activeNode}
                setActiveTeamId={setActiveTeamId}
                openNode={openNode}
                clearTooltipClose={clearTooltipClose}
                scheduleTooltipClose={scheduleTooltipClose}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (prefersReducedMotion) {
    return (
      <section
        id="team"
        className={`relative overflow-hidden bg-background ${TEAMS_LAYOUT.mobileSectionPadding} md:px-8 md:py-32`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {TEAMS_BACKGROUND_STARS.map((star) => {
            const starStyle: CSSProperties = {
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            };

            return (
              <span
                key={star.id}
                className="absolute rounded-full bg-white"
                style={starStyle}
              />
            );
          })}
        </div>

        <div className="relative mx-auto max-w-7xl">
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/26">
            {TEAMS_COPY.eyebrow}
          </p>
          <h2 className={TEAMS_LAYOUT.mobileHeading}>
            {TEAMS_COPY.heading[0]}
            <br />
            {TEAMS_COPY.heading[1]}
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {desktopLayouts.map((layout) => (
              <div
                key={layout.team.id}
                className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"
              >
                <TeamConstellation
                  layout={layout}
                  box={desktopBox}
                  activeTeamId={layout.team.id}
                  setActiveTeamId={setActiveTeamId}
                  activeNode={activeNode}
                  openNode={openNode}
                  clearTooltipClose={clearTooltipClose}
                  scheduleTooltipClose={scheduleTooltipClose}
                  interactive
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="team"
      ref={sectionRef}
      className={`relative bg-background ${TEAMS_LAYOUT.desktopSectionMinHeight}`}
    >
      <div className={`sticky top-0 overflow-visible ${TEAMS_LAYOUT.desktopViewportHeight}`}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {TEAMS_BACKGROUND_STARS.map((star) => {
            const starStyle: CSSProperties = {
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            };

            return (
              <span
                key={star.id}
                className="absolute rounded-full bg-white"
                style={starStyle}
              />
            );
          })}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-pink/25 to-transparent" />
        </div>

        <div className={TEAMS_LAYOUT.desktopContainer}>
          <div className={`relative z-30 ${TEAMS_LAYOUT.introWidth}`}>
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/26">
              {TEAMS_COPY.eyebrow}
            </p>
            <h2 className={TEAMS_LAYOUT.desktopHeading}>
              {TEAMS_COPY.heading[0]}
              <br />
              {TEAMS_COPY.heading[1]}
            </h2>
            <p
              className="mt-5 text-lg leading-relaxed text-white/50 transition-opacity duration-200"
              style={{ opacity: descVisible ? 1 : 0 }}
            >
              {ORDERED_OFFICER_TEAMS[displayedTeamIndex]?.description ?? ""}
            </p>
          </div>

          <div
            ref={trackViewportRef}
            className={`z-0 ${TEAMS_LAYOUT.desktopTrackViewport}`}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-32 bg-gradient-to-r from-background via-background/96 to-transparent" />
            <div
              ref={trackRef}
              className="flex w-max items-start will-change-transform"
              style={{
                gap: `${TEAMS_SCROLL.desktopGap}px`,
                paddingRight: `${TEAMS_SCROLL.desktopTrailingSpace}px`,
              }}
            >
              {desktopLayouts.map((layout, index) => (
                <div
                  key={layout.team.id}
                  className="flex items-center gap-4"
                  style={
                    index === 0
                      ? { paddingLeft: `${TEAMS_SCROLL.firstConstellationOffset}px` }
                      : undefined
                  }
                >
                  <TeamConstellation
                    layout={layout}
                    box={desktopBox}
                    activeTeamId={activeTeamId}
                    setActiveTeamId={setActiveTeamId}
                    activeNode={activeNode}
                    openNode={openNode}
                    clearTooltipClose={clearTooltipClose}
                    scheduleTooltipClose={scheduleTooltipClose}
                    interactive
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
