import { SITE_MAP } from "@/data/loader";
import type { SiteId } from "@/types";
import type { GraphNodeId, NormalizedGraph, ChainClassification, SiteAssignmentResult, ChainSiteAssignment } from "./types";

export interface SiteScoring {
  siteId: SiteId;
  score: number;
  /** Estimated footprint cost for logistics on this site */
  logisticsCost: number;
}

function scoreSiteForChain(
  siteId: SiteId,
  chain: ChainClassification,
  _graph: NormalizedGraph,
): number {
  let score = 0;
  const site = SITE_MAP.get(siteId);
  if (!site) return -1;

  // Core sites get a modest preference
  if (site.isCore) {
    score += 20;
  } else {
    score -= 10;
  }

  // Apply placement hint modifiers
  switch (chain.placementHint) {
    case "core_preferred":
      if (site.isCore) score += 30;
      else score -= 10;
      break;
    case "outpost_friendly":
      if (!site.isCore) score += 25;
      // core gets no bonus here — outposts win
      break;
    case "logistics_heavy":
      // Logistics-heavy chains prefer sites with more depot capacity
      score += site.depotPorts.inputs * 2;
      score += site.depotPorts.outputs * 2;
      break;
    case "self_contained":
      // Self-contained chains can go anywhere
      score += 5;
      break;
  }

  // Seed loops prefer outposts (they are lower priority production)
  if (chain.role === "seed_loop" && !site.isCore) {
    score += 20;
  }

  // Penalize over-assignment to same site (spread load)
  // (This would be informed by current assignment state in a full implementation)

  return score;
}

function getLogisticsCost(siteId: SiteId): number {
  const site = SITE_MAP.get(siteId);
  if (!site) return 999;
  // Wuling internal logistics is more expensive (buses take interior space)
  if (site.id === "wuling_core") return 15;
  // Valley Core has perimeter slot overhead
  if (site.id === "valley_core") return 10;
  // Outposts are simpler
  if (!site.isCore) return 5;
  return 8;
}

export function assignSites(
  graph: NormalizedGraph,
  classifications: ChainClassification[],
  availableSites: SiteId[],
): SiteAssignmentResult {
  const assignments: ChainSiteAssignment[] = [];

  // Filter to only unlocked sites that are available
  const validSites = availableSites.filter((sid) => SITE_MAP.has(sid));
  if (validSites.length === 0) {
    return { assignments: [], unassignedNodes: graph.nodes.map((n) => n.id) };
  }

  // Sort chains by priority: final_assembly > intermediate > raw_processing > import_fed > seed_loop
  const chainPriority: Record<string, number> = {
    final_assembly: 0,
    intermediate: 1,
    raw_processing: 2,
    import_fed: 3,
    seed_loop: 4,
  };

  const sortedClassifications = [...classifications].sort((a, b) => {
    const pa = chainPriority[a.role] ?? 5;
    const pb = chainPriority[b.role] ?? 5;
    return pa - pb;
  });

  const assignedNodeIds = new Set<GraphNodeId>();

  for (const chain of sortedClassifications) {
    // Score each site for this chain
    const siteScores: SiteScoring[] = validSites.map((siteId) => ({
      siteId,
      score: scoreSiteForChain(siteId, chain, graph),
      logisticsCost: getLogisticsCost(siteId),
    }));

    // Sort by score descending, then by logistics cost ascending
    siteScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.logisticsCost - b.logisticsCost;
    });

    const primarySite = siteScores[0].siteId;

    // Assign all nodes in this chain to the primary site
    const nodeAssignments = chain.nodeIds
      .filter((nodeId) => !assignedNodeIds.has(nodeId))
      .map((nodeId, idx) => ({
        nodeId,
        siteId: primarySite,
        facilityInstanceIndex: idx,
      }));

    for (const na of nodeAssignments) {
      assignedNodeIds.add(na.nodeId);
    }

    assignments.push({
      chainId: chain.chainId,
      primarySiteId: primarySite,
      nodeAssignments,
    });
  }

  // Any unassigned nodes (shouldn't happen with our classification)
  const unassignedNodes = graph.nodes
    .filter((n) => !assignedNodeIds.has(n.id))
    .map((n) => n.id);

  return { assignments, unassignedNodes };
}