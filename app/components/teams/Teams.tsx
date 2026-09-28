// Teams.tsx — Main client component for the Teams section. Renders each officer team as
// an interactive star constellation using layouts from constellationLayout.ts and config
// from sceneConfig.ts. On mobile, page scroll drives a snapping horizontal track that
// centers one constellation at a time.
// On desktop, a sticky viewport with a scroll-driven horizontal track shows all teams.
// Node hover/tap opens a member tooltip; reduced-motion gets a static fallback.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useIsAndroid } from "@/app/hooks/useIsAndroid";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  SECTION_GRADIENT_DATA_ATTR,
  SECTION_GRADIENT_LABEL_DATA_ATTR,
} from "@/app/components/background/sceneConfig";
import {
  ORDERED_OFFICER_TEAMS,
  resolveConstellationLayout,
  type OfficerTeam,
} from "./constellationLayout";
import {
  getDesktopConstellationBox,
  type ConstellationBox,
  TEAM_CLUSTER_BOX,
  TEAM_GRADIENT_LABEL_OVERRIDES,
  TEAM_GROUP_PHOTO,
  TEAMS_COPY,
  TEAMS_LAYOUT,
  TEAMS_SCROLL,
} from "./sceneConfig";
import { TeamConstellation, type ActiveNodeState } from "./TeamConstellation";
import { TeamGroupPhoto } from "./TeamGroupPhoto";

configureScrollTrigger();

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

    // Width is the trigger, not any resize: a phone fires height-only resizes
    // constantly as the address bar slides, and each one used to re-lay out
    // every constellation mid-scroll. Rotation changes the width, so it still
    // re-measures.
    let lastWidth = 0;

    const update = () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;

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

  /**
   * Page scroll drives the horizontal track on both layouts.
   *
   * One scrubbed ScrollTrigger tween rather than a scroll listener: the old
   * listener ran on every scroll event anywhere on the page and read
   * offsetTop/offsetHeight/scrollWidth each time, forcing a layout between
   * GSAP's style writes. ScrollTrigger measures once per refresh, and its scrub
   * supplies the catch-up the hand-rolled lerp used to.
   */
  useGSAP(
    () => {
      if (prefersReducedMotion) return;

      const section = isMobile ? mobileSectionRef.current : sectionRef.current;
      const track = isMobile ? mobileTrackRef.current : trackRef.current;
      const trackViewport = trackViewportRef.current;

      if (!section || !track || (!isMobile && !trackViewport)) return;

      const teamCount = ORDERED_OFFICER_TEAMS.length;
      const maxTranslate = () =>
        Math.max(
          track.scrollWidth -
            (isMobile ? window.innerWidth : (trackViewport?.offsetWidth ?? 0)),
          0,
        );

      const syncDisplayedTeam = (progress: number) => {
        let nextIndex: number;

        if (isMobile) {
          nextIndex = Math.round(progress * (teamCount - 1));
        } else {
          const distance = maxTranslate();
          if (distance <= 0) return;
          const slotWidth = track.scrollWidth / teamCount;
          nextIndex = Math.round((progress * distance) / slotWidth);
        }

        nextIndex = gsap.utils.clamp(0, teamCount - 1, nextIndex);

        if (nextIndex !== activeTeamIndexRef.current) {
          activeTeamIndexRef.current = nextIndex;
          setDisplayedTeamIndex(nextIndex);
        }
      };

      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: () => -maxTranslate(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: TEAMS_SCROLL.scrub,
            invalidateOnRefresh: true,
            onUpdate: (self) => syncDisplayedTeam(self.progress),
            onRefresh: (self) => syncDisplayedTeam(self.progress),
          },
        },
      );
    },
    {
      // The track's width follows the constellation box, so a new box needs a
      // new tween measured against it.
      dependencies: [
        isMobile,
        prefersReducedMotion,
        desktopBox.width,
        desktopBox.height,
        mobileBox.width,
        mobileBox.height,
      ],
      revertOnUpdate: true,
    },
  );

  useEffect(() => {
    if (!isMobile || !prefersReducedMotion) {
      return;
    }

    const track = mobileTrackRef.current;

    if (!track) {
      return;
    }

    let frame = 0;

    const updateDisplayedTeam = () => {
      frame = 0;
      const viewportCenter = track.scrollLeft + track.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      Array.from(track.children).forEach((child, index) => {
        const card = child as HTMLElement;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== activeTeamIndexRef.current) {
        activeTeamIndexRef.current = closestIndex;
        setDisplayedTeamIndex(closestIndex);
      }
    };

    const queueUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(updateDisplayedTeam);
      }
    };

    track.addEventListener("scroll", queueUpdate, { passive: true });
    window.addEventListener("resize", queueUpdate);
    queueUpdate();

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      track.removeEventListener("scroll", queueUpdate);
      window.removeEventListener("resize", queueUpdate);
    };
  }, [isMobile, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (tooltipCloseTimeoutRef.current !== null) {
        window.clearTimeout(tooltipCloseTimeoutRef.current);
      }
    };
  }, []);

  // Stable identities, together with the memoised layouts below, let the
  // memoised TeamConstellation skip re-rendering when only the displayed team
  // changes — which happens several times per pass of the scroll-driven track.
  const clearTooltipClose = useCallback(() => {
    if (tooltipCloseTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(tooltipCloseTimeoutRef.current);
    tooltipCloseTimeoutRef.current = null;
  }, []);

  const scheduleTooltipClose = useCallback(() => {
    clearTooltipClose();
    tooltipCloseTimeoutRef.current = window.setTimeout(() => {
      setActiveNode(null);
      tooltipCloseTimeoutRef.current = null;
    }, TEAMS_SCROLL.tooltipCloseDelayMs);
  }, [clearTooltipClose]);

  const openNode = useCallback(
    (
      teamId: string,
      personId: string,
      pointer: NonNullable<ActiveNodeState>["pointer"],
    ) => {
      clearTooltipClose();
      setActiveNode({ teamId, personId, pointer });
    },
    [clearTooltipClose],
  );

  const desktopLayouts = useMemo(
    () => buildLayouts(ORDERED_OFFICER_TEAMS, desktopBox),
    [desktopBox],
  );
  const mobileLayouts = useMemo(
    () => buildLayouts(ORDERED_OFFICER_TEAMS, mobileBox),
    [mobileBox],
  );
  const displayedTeam =
    ORDERED_OFFICER_TEAMS[displayedTeamIndex] ?? ORDERED_OFFICER_TEAMS[0];
  const sectionGradientAttributes = {
    [SECTION_GRADIENT_DATA_ATTR]: "teams",
    [SECTION_GRADIENT_LABEL_DATA_ATTR]:
      TEAM_GRADIENT_LABEL_OVERRIDES[displayedTeam.id] ?? displayedTeam.label,
  };

  if (isMobile) {
    if (prefersReducedMotion) {
      return (
        <section
          id="team"
          {...sectionGradientAttributes}
          className={`relative overflow-hidden ${TEAMS_LAYOUT.mobileSectionPadding}`}
        >
          <div className="relative mx-auto max-w-6xl">
            <h2 className={TEAMS_LAYOUT.mobileHeading}>
              <span className="block text-foreground">
                {TEAMS_COPY.heading[0]}
              </span>
              <span className="mt-2 block text-pink md:mt-3">
                {TEAMS_COPY.heading[1]}
              </span>
            </h2>

            <TeamGroupPhoto
              teams={ORDERED_OFFICER_TEAMS}
              activeIndex={displayedTeamIndex}
              sizes={TEAM_GROUP_PHOTO.mobileSizes}
              animate={false}
              className={TEAM_GROUP_PHOTO.mobileWrapper}
            />
            <div
              ref={mobileTrackRef}
              className="mt-10 flex overflow-x-auto pb-6"
            >
              {mobileLayouts.map((layout) => (
                <TeamConstellation
                  key={layout.team.id}
                  layout={layout}
                  box={mobileBox}
                  activeNode={activeNode}
                  openNode={openNode}
                  clearTooltipClose={clearTooltipClose}
                  scheduleTooltipClose={scheduleTooltipClose}
                  interactive
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
        {...sectionGradientAttributes}
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
                <span className="block text-foreground">
                  {TEAMS_COPY.heading[0]}
                </span>
                <span className="mt-2 block text-pink md:mt-3">
                  {TEAMS_COPY.heading[1]}
                </span>
              </h2>

              <TeamGroupPhoto
                teams={ORDERED_OFFICER_TEAMS}
                activeIndex={displayedTeamIndex}
                sizes={TEAM_GROUP_PHOTO.mobileSizes}
                className={TEAM_GROUP_PHOTO.mobileWrapper}
              />
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
                    activeNode={activeNode}
                    openNode={openNode}
                    clearTooltipClose={clearTooltipClose}
                    scheduleTooltipClose={scheduleTooltipClose}
                    interactive
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
        {...sectionGradientAttributes}
        className={`relative overflow-hidden ${TEAMS_LAYOUT.mobileSectionPadding} md:px-8 md:py-32`}
      >
        <div className="relative mx-auto max-w-7xl">
          <h2 className={TEAMS_LAYOUT.mobileHeading}>
            <span className="block text-foreground">
              {TEAMS_COPY.heading[0]}
            </span>
            <span className="mt-2 block text-pink md:mt-3">
              {TEAMS_COPY.heading[1]}
            </span>
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {desktopLayouts.map((layout) => (
              <div
                key={layout.team.id}
                className="rounded-[28px] border border-foreground/10 bg-foreground/[0.03] p-6"
              >
                <TeamGroupPhoto
                  teams={[layout.team]}
                  activeIndex={0}
                  sizes={TEAM_GROUP_PHOTO.gridSizes}
                  animate={false}
                  className="mb-6 aspect-[3/2] w-full"
                />
                <TeamConstellation
                  layout={layout}
                  box={desktopBox}
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
      {...sectionGradientAttributes}
      className={`relative ${TEAMS_LAYOUT.desktopSectionMinHeight}`}
    >
      <div className={`sticky top-0 overflow-visible ${TEAMS_LAYOUT.desktopViewportHeight}`}>
        <div className={TEAMS_LAYOUT.desktopContainer}>
          <div className={`relative z-30 ${TEAMS_LAYOUT.introWidth}`}>
            <h2 className={TEAMS_LAYOUT.desktopHeading}>
              <span className="block text-foreground">
                {TEAMS_COPY.heading[0]}
              </span>
              <span className="mt-2 block text-pink md:mt-3">
                {TEAMS_COPY.heading[1]}
              </span>
            </h2>

            <TeamGroupPhoto
              teams={ORDERED_OFFICER_TEAMS}
              activeIndex={displayedTeamIndex}
              sizes={TEAM_GROUP_PHOTO.desktopSizes}
              className={TEAM_GROUP_PHOTO.desktopWrapper}
            />
          </div>

          <div
            ref={trackViewportRef}
            className={`z-0 ${TEAMS_LAYOUT.desktopTrackViewport}`}
          >
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
