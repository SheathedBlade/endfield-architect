import type { GraphNode, GraphNodeId, NormalizedGraph } from "./types";
import type { ChainClassification, ChainRole, PlacementHint } from "./types";

// Items that form seed/plant loops — items produced by planting unit that feed back
const SEED_LOOP_ITEM_IDS = new Set<string>([
  "buckflower",
  "citrome",
  "sandleaf",
  "aketine",
]);

// Items in this set are considered "raw processing" chains (pre-refining raw ore)
const RAW_PROCESSING_ITEM_IDS = new Set<string>([
  "originium_ore",
  "amethyst_ore",
  "ferrium_ore",
  "cuprium_ore",
]);

function detectChainRole(nodes: GraphNode[]): ChainRole {
  const itemIds = new Set(nodes.map((n) => n.itemId));

  // Seed/plant loop: chain contains loop items and is self-contained
  const hasLoopItem = [...itemIds].some((id) => SEED_LOOP_ITEM_IDS.has(id));
  const hasExternalInput = nodes.some((n) => n.role === "import");

  if (hasLoopItem && !hasExternalInput) {
    return "seed_loop";
  }

  // Import-fed: chain is driven primarily by external supply
  if (hasExternalInput && nodes.length > 2) {
    return "import_fed";
  }

  const hasRawOre = [...itemIds].some((id) => RAW_PROCESSING_ITEM_IDS.has(id));
  if (hasRawOre && !hasLoopItem) {
    return "raw_processing";
  }

  // Final assembly: terminates at a target node
  if (nodes.some((n) => n.role === "target")) {
    return "final_assembly";
  }

  return "intermediate";
}

function detectPlacementHint(role: ChainRole): PlacementHint {
  switch (role) {
    case "seed_loop":
      return "outpost_friendly";
    case "import_fed":
      return "logistics_heavy";
    case "raw_processing":
      return "outpost_friendly";
    case "final_assembly":
      return "core_preferred";
    default:
      return "core_preferred";
  }
}

function isSelfContained(nodes: GraphNode[]): boolean {
  const hasExternalInput = nodes.some((n) => n.role === "import");
  return !hasExternalInput;
}

export function classifyChains(graph: NormalizedGraph): ChainClassification[] {
  const classifications: ChainClassification[] = [];

  // Group nodes by their root chain (goal chain)
  // We walk from root target nodes and assign a chain ID to each node
  const nodeChainId = new Map<GraphNodeId, string>();
  const chainNodes = new Map<string, GraphNode[]>();

  function buildChainFromRoot(rootId: GraphNodeId, chainId: string) {
    const stack = [rootId];
    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      if (nodeChainId.has(nodeId)) continue;

      nodeChainId.set(nodeId, chainId);
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      if (!chainNodes.has(chainId)) chainNodes.set(chainId, []);
      chainNodes.get(chainId)!.push(node);

      // traverse edges in reverse (from child to parent)
      for (const edge of graph.edges) {
        if (edge.to === nodeId) {
          stack.push(edge.from);
        }
      }
    }
  }

  let chainCounter = 0;
  for (const rootId of graph.rootIds) {
    const chainId = `chain_${chainCounter++}`;
    buildChainFromRoot(rootId, chainId);
  }

  // Also assign any unclassified nodes (shouldn't happen but safety)
  for (const node of graph.nodes) {
    if (!nodeChainId.has(node.id)) {
      const chainId = `chain_${chainCounter++}`;
      nodeChainId.set(node.id, chainId);
      chainNodes.set(chainId, [node]);
    }
  }

  for (const [chainId, nodes] of chainNodes) {
    const role = detectChainRole(nodes);
    classifications.push({
      chainId,
      role,
      nodeIds: nodes.map((n) => n.id),
      placementHint: detectPlacementHint(role),
      isSelfContained: isSelfContained(nodes),
    });
  }

  return classifications;
}

export function getChainForNode(
  classifications: ChainClassification[],
  nodeId: GraphNodeId,
): ChainClassification | undefined {
  return classifications.find((c) => c.nodeIds.includes(nodeId));
}