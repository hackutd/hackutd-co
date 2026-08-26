// Teams.tsx — Main client component for the Teams section. Renders each officer team as
// an interactive star constellation using layouts from constellationLayout.ts and config
// from sceneConfig.ts. On mobile, page scroll drives a snapping horizontal track that
// centers one constellation at a time.
// On desktop, a sticky viewport with a scroll-driven horizontal track shows all teams.
// Node hover/tap opens a member tooltip; reduced-motion gets a static snap-scroll fallback.

"use client";

import { useEffect, useRef, useState } from "react";
import { useIsAndroid } from "@/app/hooks/useIsAndroid";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import {
  ORDERED_OFFICER_TEAMS,
  resolveConstellationLayout,
  type OfficerTeam,
} from "./constellationLayout";
import {
  getDesktopConstellationBox,
  type ConstellationBox,
  TEAM_CLUSTER_BOX,
  TEAMS_COPY,
  TEAMS_LAYOUT,
  TEAMS_SCROLL,
} from "./sceneConfig";
import { TeamConstellation, type ActiveNodeState } from "./TeamConstellation";

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
  const mobileSectionRef = useRef<HTMLElement>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const trackViewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tooltipCloseTimeoutRef = useRef<number | null>(null);
  const activeTeamIndexRef = useRef(0);
  const isMobile = useIsMobile();
  const isAndroid = useIsAndroid();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayedTeamIndex, setDisplayedTeamIndex] = useState(0);
  const [desktopBox, setDesktopBox] = useState<ConstellationBox>(
    TEAM_CLUSTER_BOX.desktop,
  );
  const [mobileBox, setMobileBox] = useState<ConstellationBox>(TEAM_CLUSTER_BOX.mobile);
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
    if (!isMobile) return;

    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (isAndroid) {
        const clampedW = Math.min(w, 412);
        const nodeSize = Math.round(Math.min(38 + (clampedW - 360) * 0.05, 44));
        const leadNodeSize = Math.round(nodeSize * 1.3);
        setMobileBox({
          width: w,
          // Leave room for the section heading above the constellation.
          height: Math.round(h * 0.38),
          padding: Math.round(w * 0.08),
          verticalBias: 12,
          leadNodeSize,
          nodeSize,
        });
      } else {
        setMobileBox({
          width: w,
          // Leave room for the section heading above the constellation.
          height: Math.round(h * 0.40),
          padding: Math.round(w * 0.07),
          verticalBias: 16,
          leadNodeSize: 58,
          nodeSize: 44,
        });
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isMobile, isAndroid]);

  useEffect(() => {
    if (!isMobile || prefersReducedMotion) return;

    const section = mobileSectionRef.current;
    const track = mobileTrackRef.current;

    if (!section || !track) return;

    let frame = 0;
    let currentX = 0;
    let targetX = 0;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const updateTarget = () => {
      const maxTranslate = Math.max(track.scrollWidth - window.innerWidth, 0);
      const scrollableDistance = Math.max(
        section.offsetHeight - window.innerHeight,
        1,
      );
      const progress = clamp(
        (window.scrollY - section.offsetTop) / scrollableDistance,
        0,
        1,
      );

      const slotWidth = track.scrollWidth / ORDERED_OFFICER_TEAMS.length;
      const nextIndex = clamp(
        Math.round(progress * (ORDERED_OFFICER_TEAMS.length - 1)),
        0,
        ORDERED_OFFICER_TEAMS.length - 1,
      );

      // Snap to center the active constellation in the viewport
      targetX = clamp(
        nextIndex * slotWidth + slotWidth / 2 - window.innerWidth / 2,
        0,
        maxTranslate,
      );

      if (nextIndex !== activeTeamIndexRef.current) {
        activeTeamIndexRef.current = nextIndex;
        setDisplayedTeamIndex(nextIndex);
      }

      if (progress <= 0.001 || progress >= 0.999) {
        currentX = targetX;
        track.style.transform = `translate3d(${-currentX}px, 0, 0)`;
        return;
      }

      queueRender();
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
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(renderTrack);
    };

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);
    updateTarget();

    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateTarget);
      window.removeEventListener("resize", updateTarget);
      track.style.transform = "";
    };
  }, [isMobile, prefersReducedMotion]);

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
  const mobileLayouts = buildLayouts(ORDERED_OFFICER_TEAMS, mobileBox);

  if (isMobile) {
    if (prefersReducedMotion) {
      return (
        <section
          id="team"
          className={`relative overflow-hidden ${TEAMS_LAYOUT.mobileSectionPadding}`}
        >
          <div className="relative mx-auto max-w-6xl">
            <h2 className={TEAMS_LAYOUT.mobileHeading}>
              {TEAMS_COPY.heading[0]}
              <br />
              {TEAMS_COPY.heading[1]}
            </h2>
            <div className="mt-10 flex snap-x snap-mandatory overflow-x-auto pb-6">
              {mobileLayouts.map((layout) => (
                <TeamConstellation
                  key={layout.team.id}
                  layout={layout}
                  box={mobileBox}
                  activeTeamId={activeTeamId}
                  setActiveTeamId={setActiveTeamId}
                  activeNode={activeNode}
                  openNode={openNode}
                  clearTooltipClose={clearTooltipClose}
                  scheduleTooltipClose={scheduleTooltipClose}
                  interactive
                  showCaption
                  centerTooltip
                />
              ))}
            </div>
          </div>
        </section>
      );
    }

    return (
      <section
        id="team"
        ref={mobileSectionRef}
        className="relative"
        style={{ minHeight: `${100 + ORDERED_OFFICER_TEAMS.length * 22}vh` }}
      >
        <div className={`sticky top-0 overflow-hidden ${isAndroid ? TEAMS_LAYOUT.mobileViewportHeightAndroid : TEAMS_LAYOUT.mobileViewportHeight}`}>
          <div className="relative flex h-full flex-col">
            {/* Top info zone */}
            <div
              className="shrink-0 overflow-y-auto px-5 pt-16 pb-3"
              style={{ maxHeight: isAndroid ? "52%" : "50%" }}
            >
              <h2 className={TEAMS_LAYOUT.mobileHeading}>
                {TEAMS_COPY.heading[0]}
                <br />
                {TEAMS_COPY.heading[1]}
              </h2>
            </div>

            {/* Bottom constellation zone: takes all remaining space */}
            <div className="relative mt-2 min-h-0 flex-1 overflow-hidden">
              <div
                ref={mobileTrackRef}
                className="flex h-full w-max items-start will-change-transform"
                style={{ gap: "0px" }}
              >
                {mobileLayouts.map((layout) => (
                  <TeamConstellation
                    key={layout.team.id}
                    layout={layout}
                    box={mobileBox}
                    activeTeamId={activeTeamId}
                    setActiveTeamId={setActiveTeamId}
                    activeNode={activeNode}
                    openNode={openNode}
                    clearTooltipClose={clearTooltipClose}
                    scheduleTooltipClose={scheduleTooltipClose}
                    interactive
                    showCaption
                    centerTooltip
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 pb-3 pt-1">
              {ORDERED_OFFICER_TEAMS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === displayedTeamIndex
                      ? "w-4 bg-foreground/60"
                      : "w-1 bg-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (prefersReducedMotion) {
    return (
      <section
        id="team"
        className={`relative overflow-hidden ${TEAMS_LAYOUT.mobileSectionPadding} md:px-8 md:py-32`}
      >
        <div className="relative mx-auto max-w-7xl">
          <h2 className={TEAMS_LAYOUT.mobileHeading}>
            {TEAMS_COPY.heading[0]}
            <br />
            {TEAMS_COPY.heading[1]}
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {desktopLayouts.map((layout) => (
              <div
                key={layout.team.id}
                className="rounded-[28px] border border-foreground/10 bg-foreground/[0.03] p-6"
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
      className={`relative ${TEAMS_LAYOUT.desktopSectionMinHeight}`}
    >
      <div className={`sticky top-0 overflow-visible ${TEAMS_LAYOUT.desktopViewportHeight}`}>
        <div className={TEAMS_LAYOUT.desktopContainer}>
          <div className={`relative z-30 ${TEAMS_LAYOUT.introWidth}`}>
            <h2 className={TEAMS_LAYOUT.desktopHeading}>
              {TEAMS_COPY.heading[0]}
              <br />
              {TEAMS_COPY.heading[1]}
            </h2>
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
