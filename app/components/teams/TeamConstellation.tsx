// TeamConstellation.tsx — Renders a single team's constellation: SVG edges connecting members,
// circular nodes for each officer (lead highlighted in pink), and a NodeTooltip on hover/tap.
// Also exports ActiveNodeState, the shared type used by the parent Teams component.

"use client";

import type { CSSProperties } from "react";
import type { ResolvedConstellationLayout } from "./constellationLayout";
import type { ConstellationBox } from "./sceneConfig";
import { NodeTooltip, getInitials } from "./NodeTooltip";

export type ActiveNodeState = {
  teamId: string;
  personId: string;
} | null;

function getMemberCountLabel(memberCount: number) {
  return `${memberCount} MEMBERS`;
}

function getTeamOpacity(activeTeamId: string | null, teamId: string) {
  if (!activeTeamId || activeTeamId === teamId) return 1;
  return 0.25;
}

function getTooltipPlacement(nodeX: number, nodeY: number, box: ConstellationBox) {
  let horizontal = "left-1/2 -translate-x-1/2";

  if (nodeX < box.width * 0.18) {
    horizontal = "left-0 translate-x-0";
  } else if (nodeX > box.width * 0.82) {
    horizontal = "right-0 translate-x-0";
  }

  const vertical = nodeY < box.height * 0.34 ? "top-full mt-4" : "bottom-full mb-4";
  return `${vertical} ${horizontal}`;
}

export function TeamConstellation({
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
    { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY },
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

    if (!fromNode || !toNode) return null;

    const dx = toNode.renderX - fromNode.renderX;
    const dy = toNode.renderY - fromNode.renderY;
    const distance = Math.hypot(dx, dy) || 1;
    const fromRadius = (fromNode.isLead ? box.leadNodeSize : box.nodeSize) / 2 + 3;
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
          className="absolute inset-0 h-full w-full overflow-visible text-foreground"
          viewBox={`0 0 ${box.width} ${box.height}`}
        >
          {layout.edges.map((edge, index) => {
            const trimmedEdge = trimEdge(edge.fromId, edge.toId);
            if (!trimmedEdge) return null;
            return (
              <line
                key={`${layout.team.id}-edge-${index}`}
                x1={trimmedEdge.x1}
                y1={trimmedEdge.y1}
                x2={trimmedEdge.x2}
                y2={trimmedEdge.y2}
                stroke="currentColor"
                strokeOpacity="0.16"
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
          const tooltipPlacement = getTooltipPlacement(node.shiftedX, node.renderY, box);
          const nodePositionStyle: CSSProperties = {
            left: `${node.shiftedX}px`,
            top: `${node.renderY}px`,
            zIndex: isActive ? 30 : node.isLead ? 12 : 8,
          };
          const nodeButtonStyle: CSSProperties = {
            width: node.isLead ? `${box.leadNodeSize}px` : `${box.nodeSize}px`,
            height: node.isLead ? `${box.leadNodeSize}px` : `${box.nodeSize}px`,
            boxShadow: node.isLead ? "0 0 0 8px rgba(243, 22, 103, 0.08)" : "none",
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
                <NodeTooltip
                  person={node.person}
                  placement={tooltipPlacement}
                  teamId={layout.team.id}
                  clearTooltipClose={clearTooltipClose}
                  setActiveTeamId={setActiveTeamId}
                  scheduleTooltipClose={scheduleTooltipClose}
                />
              ) : null}

              <button
                type="button"
                aria-label={`${node.person.name}, ${node.person.role}`}
                className={`flex items-center justify-center rounded-full border transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  node.isLead
                    ? "constellation-lead border-[3px] border-pink bg-(--color-card) text-foreground/56 hover:scale-[1.04]"
                    : "border-[3px] border-foreground/12 bg-(--color-card) text-foreground/32 hover:scale-[1.07]"
                }`}
                style={nodeButtonStyle}
                onClick={
                  interactive
                    ? () => openNode(layout.team.id, node.person.id)
                    : undefined
                }
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
          <p className="text-[0.72rem] uppercase tracking-[0.18em] text-foreground/30">
            {layout.template.name}
          </p>
          <h3 className="text-3xl font-medium tracking-[-0.03em] text-foreground">
            {layout.team.label}
          </h3>
          <p className="mt-2 text-[0.78rem] uppercase tracking-[0.1em] text-foreground/34">
            {memberCountLabel}
          </p>
        </div>
      ) : null}
    </article>
  );
}
