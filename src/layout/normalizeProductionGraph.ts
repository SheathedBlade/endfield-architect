import type { ItemId } from "@/types";
import type { ProductionNode } from "@/types";
import type { GraphNode, GraphNodeId, GraphNodeRole, GraphEdge, NormalizedGraph } from "./types";

let _nodeCounter = 0;
function freshId(label: string): GraphNodeId {
  return `${label}_${_nodeCounter++}` as GraphNodeId;
}

function nodeRole(node: ProductionNode): GraphNodeRole {
  if (node.isTarget) return "target";
  if (node.isRawMaterial) return "raw";
  if (node.isExternalSupply) return "import";
  if (node.isCyclePlaceholder) return "cycle_placeholder";
  return "intermediate";
}

export function normalizeProductionGraph(
  nodes: ProductionNode[],
  sourceIndices?: number[],
): NormalizedGraph {
  _nodeCounter = 0;
  const graphNodes: GraphNode[] = [];
  const graphEdges: GraphEdge[] = [];
  const rootIds: GraphNodeId[] = [];

  function walk(
    node: ProductionNode,
    parentId: GraphNodeId | null,
    parentRate: number,
    _depth: number,
    sourceIndex?: number,
  ): GraphNodeId {
    const role = nodeRole(node);
    const id = freshId(node.item.displayName);

    const graphNode: GraphNode = {
      id,
      label: node.item.displayName,
      role,
      itemId: node.item.id as ItemId,
      targetRate: node.targetRate,
      recipeId: node.recipe?.id ?? null,
      facilityId: node.facility?.id ?? null,
      facilityCount: node.facilityCount,
      exactFacilityCount: node.exactFacilityCount,
      siteId: null,
      sourceNodeIndex: sourceIndex,
    };

    graphNodes.push(graphNode);

    if (node.isTarget) {
      rootIds.push(id);
    }

    if (parentId !== null) {
      graphEdges.push({
        id: `${parentId}_${id}` as GraphEdge["id"],
        from: parentId,
        to: id,
        rate: parentRate,
      });
    }

    if (node.dependencies && node.dependencies.length > 0) {
      for (const dep of node.dependencies) {
        walk(dep, id, node.targetRate, _depth + 1, sourceIndex);
      }
    }

    return id;
  }

  for (let i = 0; i < nodes.length; i++) {
    walk(nodes[i], null, 0, 0, sourceIndices ? sourceIndices[i] : i);
  }

  return { nodes: graphNodes, edges: graphEdges, rootIds };
}