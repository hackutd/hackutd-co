import constellationTemplatesData from "@/app/data/constellation-templates.json";
import officerTeamsData from "@/app/data/officer-teams.json";

export type OfficerMember = {
  id: string;
  name: string;
  role: string;
  linkedinUrl: string;
  quote?: string;
};

export type OfficerTeam = {
  id: string;
  label: string;
  order: number;
  lead: OfficerMember;
  members: OfficerMember[];
};

export type ConstellationNode = {
  id: string;
  x: number;
  y: number;
};

export type ConstellationEdge = {
  fromId: string;
  toId: string;
};

export type ConstellationAppendRule = {
  fromNodeId: string;
  toNodeId: string;
  stepX: number;
  stepY: number;
};

export type ConstellationTemplate = {
  id: string;
  name: string;
  starCount: number;
  leadNodeId: string;
  nodes: ConstellationNode[];
  edges: ConstellationEdge[];
  append: ConstellationAppendRule;
};

export type ResolvedOfficerNode = ConstellationNode & {
  person: OfficerMember;
  isLead: boolean;
  isOverflow: boolean;
};

export type RenderedConstellationEdge = {
  fromId: string;
  toId: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
};

export type RenderedOfficerNode = ResolvedOfficerNode & {
  renderX: number;
  renderY: number;
};

export type ResolvedConstellationLayout = {
  team: OfficerTeam;
  template: ConstellationTemplate;
  nodes: RenderedOfficerNode[];
  edges: RenderedConstellationEdge[];
};

const officerTeams = officerTeamsData as OfficerTeam[];
const constellationTemplates = constellationTemplatesData as ConstellationTemplate[];

export const ORDERED_OFFICER_TEAMS = officerTeams
  .slice()
  .sort((left, right) => left.order - right.order);

function hashString(input: string) {
  let hash = 0;

  for (const character of input) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function pickTemplate(teamId: string, peopleCount: number) {
  const availableCounts = Array.from(
    new Set(constellationTemplates.map((template) => template.starCount)),
  ).sort((left, right) => left - right);

  const chosenCount =
    availableCounts.filter((count) => count <= peopleCount).at(-1) ??
    availableCounts[0];
  const candidates = constellationTemplates.filter(
    (template) => template.starCount === chosenCount,
  );

  return candidates[hashString(teamId) % candidates.length];
}

function getAssignmentOrder(template: ConstellationTemplate) {
  return [
    template.leadNodeId,
    ...template.nodes
      .map((node) => node.id)
      .filter((nodeId) => nodeId !== template.leadNodeId),
  ];
}

function fitNodesToBox(
  nodes: ResolvedOfficerNode[],
  width: number,
  height: number,
  padding: number,
  verticalBias: number,
) {
  const minX = Math.min(...nodes.map((node) => node.x));
  const maxX = Math.max(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxY = Math.max(...nodes.map((node) => node.y));
  const rawWidth = Math.max(maxX - minX, 0.01);
  const rawHeight = Math.max(maxY - minY, 0.01);
  const scale = Math.min(
    (width - padding * 2) / rawWidth,
    (height - padding * 2) / rawHeight,
  );
  const contentWidth = rawWidth * scale;
  const contentHeight = rawHeight * scale;
  const offsetX = (width - contentWidth) / 2;
  const centeredOffsetY = (height - contentHeight) / 2;
  const offsetY = Math.min(
    centeredOffsetY + verticalBias,
    height - contentHeight - padding * 0.4,
  );

  return nodes.map((node) => ({
    ...node,
    renderX: (node.x - minX) * scale + offsetX,
    renderY: (node.y - minY) * scale + offsetY,
  }));
}

export function resolveConstellationLayout(
  team: OfficerTeam,
  width: number,
  height: number,
  padding: number,
  verticalBias = 0,
): ResolvedConstellationLayout {
  const people = [team.lead, ...team.members];
  const template = pickTemplate(team.id, people.length);
  const assignmentOrder = getAssignmentOrder(template);
  const selectedNodeIds = assignmentOrder.slice(
    0,
    Math.min(people.length, template.nodes.length),
  );
  const selectedNodeIdSet = new Set(selectedNodeIds);
  const resolvedNodes: ResolvedOfficerNode[] = template.nodes
    .filter((node) => selectedNodeIdSet.has(node.id))
    .map((node) => ({
      ...node,
      person:
        people[
          selectedNodeIds.findIndex((selectedNodeId) => selectedNodeId === node.id)
        ],
      isLead: node.id === template.leadNodeId,
      isOverflow: false,
    }));
  const resolvedEdges: ConstellationEdge[] = template.edges.filter(
    (edge) =>
      selectedNodeIdSet.has(edge.fromId) && selectedNodeIdSet.has(edge.toId),
  );

  if (people.length > template.nodes.length) {
    const anchorNode = template.nodes.find(
      (node) => node.id === template.append.toNodeId,
    );

    if (anchorNode) {
      let previousNodeId = anchorNode.id;

      for (
        let overflowIndex = 0;
        overflowIndex < people.length - template.nodes.length;
        overflowIndex += 1
      ) {
        const person = people[template.nodes.length + overflowIndex];
        const overflowNodeId = `overflow-${overflowIndex + 1}`;
        resolvedNodes.push({
          id: overflowNodeId,
          x: anchorNode.x + template.append.stepX * (overflowIndex + 1),
          y: anchorNode.y + template.append.stepY * (overflowIndex + 1),
          person,
          isLead: false,
          isOverflow: true,
        });
        resolvedEdges.push({
          fromId: previousNodeId,
          toId: overflowNodeId,
        });
        previousNodeId = overflowNodeId;
      }
    }
  }

  const renderedNodes = fitNodesToBox(
    resolvedNodes,
    width,
    height,
    padding,
    verticalBias,
  );
  const nodeMap = new Map(
    renderedNodes.map((node) => [node.id, { x: node.renderX, y: node.renderY }]),
  );
  const renderedEdges = resolvedEdges
    .map((edge) => {
      const from = nodeMap.get(edge.fromId);
      const to = nodeMap.get(edge.toId);

      if (!from || !to) {
        return null;
      }

      return { fromId: edge.fromId, toId: edge.toId, from, to };
    })
    .filter((edge): edge is RenderedConstellationEdge => edge !== null);

  return {
    team,
    template,
    nodes: renderedNodes,
    edges: renderedEdges,
  };
}
