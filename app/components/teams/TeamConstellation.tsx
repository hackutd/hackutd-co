// TeamConstellation.tsx — Renders a single team's constellation: SVG edges connecting members,
// circular nodes for each officer (lead highlighted in pink), and a NodeTooltip on hover/tap.
// Also exports ActiveNodeState, the shared type used by the parent Teams component.

"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import type { ResolvedConstellationLayout } from "./constellationLayout";
import type { ConstellationBox } from "./sceneConfig";
import { NodeTooltip, getInitials } from "./NodeTooltip";

export type ActiveNodeState = {
  teamId: string;
  personId: string;
  pointer: { x: number; y: number };
} | null;

export function TeamConstellation({
  layout,
  box,
  activeNode,
  openNode,
  clearTooltipClose,
  scheduleTooltipClose,
  interactive,
  centerTooltip = false,
}: {
  layout: ResolvedConstellationLayout;
  box: ConstellationBox;
  activeNode: ActiveNodeState;
  openNode: (
    teamId: string,
    personId: string,
    pointer: { x: number; y: number },
  ) => void;
  clearTooltipClose: () => void;
  scheduleTooltipClose: () => void;
  interactive: boolean;
  centerTooltip?: boolean;
}) {
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
      className="relative flex shrink-0 flex-col items-center"
      style={{ width: `${box.width}px` }}
      onMouseEnter={
        interactive && !centerTooltip ? clearTooltipClose : undefined
      }
      onMouseLeave={interactive && !centerTooltip ? scheduleTooltipClose : undefined}
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
                strokeWidth="1"
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {shiftedNodes.map((node) => {
          const rawLinkedInUrl = node.person.linkedinUrl.trim();
          const linkedInUrl = /^https?:\/\//i.test(rawLinkedInUrl)
            ? rawLinkedInUrl
            : "";
          // Touch layouts (centerTooltip) open the fullscreen card only for members
          // without a LinkedIn link — otherwise a tap just follows the link.
          const linkOnly = centerTooltip && Boolean(linkedInUrl);
          const isActive =
            activeNode?.teamId === layout.team.id &&
            activeNode.personId === node.person.id;
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
                  initialPointer={activeNode.pointer}
                  scheduleTooltipClose={scheduleTooltipClose}
                  centered={centerTooltip}
                />
              ) : null}

              <a
                href={linkedInUrl || undefined}
                target={linkedInUrl ? "_blank" : undefined}
                rel={linkedInUrl ? "noreferrer" : undefined}
                role={linkedInUrl ? undefined : "button"}
                tabIndex={0}
                aria-label={
                  linkedInUrl
                    ? `Open ${node.person.name}'s LinkedIn profile`
                    : `${node.person.name}, ${node.person.role}`
                }
                className={`relative flex items-center justify-center overflow-hidden rounded-full border transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  node.isLead
                    ? "constellation-lead border-[3px] border-pink bg-(--color-card) text-foreground/56 hover:scale-[1.04]"
                    : "border-[3px] border-foreground/12 bg-(--color-card) text-foreground/32 hover:scale-[1.07]"
                }`}
                style={nodeButtonStyle}
                onClick={(event) => {
                  if (!interactive || linkedInUrl) {
                    return;
                  }

                  event.preventDefault();
                  openNode(layout.team.id, node.person.id, {
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
                onMouseEnter={
                  interactive && !centerTooltip
                    ? (event) =>
                        openNode(layout.team.id, node.person.id, {
                          x: event.clientX,
                          y: event.clientY,
                        })
                    : undefined
                }
                onMouseLeave={interactive && !centerTooltip ? scheduleTooltipClose : undefined}
                onFocus={
                  interactive && !linkOnly
                    ? (event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        openNode(layout.team.id, node.person.id, {
                          x: rect.left + rect.width / 2,
                          y: rect.top + rect.height / 2,
                        });
                      }
                    : undefined
                }
                onBlur={interactive && !centerTooltip ? scheduleTooltipClose : undefined}
              >
                {node.person.imageUrl ? (
                  <Image
                    src={node.person.imageUrl}
                    alt={node.person.name}
                    fill
                    sizes={`${node.isLead ? box.leadNodeSize : box.nodeSize}px`}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="select-none font-medium tracking-[-0.03em]"
                    style={nodeLabelStyle}
                  >
                    {getInitials(node.person.name)}
                  </span>
                )}
              </a>
            </div>
          );
        })}
      </div>

    </article>
  );
}
