import { FACILITY_MAP, SITE_MAP } from "@/data/loader";
import type { SiteId } from "@/types";
import type { GraphNodeId, NormalizedGraph, PlacementFootprint, SiteLayout, LayoutFeasibilityResult, PlacementFailure, LayoutHints, ChainClassification } from "./types";
import { LOGISTICS_CORRIDOR_WIDTH, MIN_FACILITY_SPACING, SOFT_MAX_DENSITY } from "./logisticsConstants";

interface PlacedRect {
  x: number;
  y: number;
  width: number;
  height: number;
  nodeId: GraphNodeId;
  chainId: string;
}

function rectsOverlap(a: PlacedRect, b: PlacedRect, gap = 0): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

function canPlaceRect(
  rect: PlacedRect,
  existing: PlacedRect[],
  siteWidth: number,
  siteHeight: number,
  gap = MIN_FACILITY_SPACING,
): boolean {
  if (rect.x < 0 || rect.y < 0) return false;
  if (rect.x + rect.width > siteWidth) return false;
  if (rect.y + rect.height > siteHeight) return false;
  for (const e of existing) {
    if (rectsOverlap(rect, e, gap)) return false;
  }
  return true;
}

/**
 * Build a map of nodeId → chainId for quick lookup.
 */
function buildNodeChainMap(classifications: ChainClassification[]): Map<GraphNodeId, string> {
  const map = new Map<GraphNodeId, string>();
  for (const c of classifications) {
    for (const nid of c.nodeIds) {
      map.set(nid, c.chainId);
    }
  }
  return map;
}

/**
 * Get upstream depth (distance from raw inputs) for a node within its chain.
 * Used to sort nodes so processed items are left, raw inputs are right.
 */
function getUpstreamDepth(nodeId: GraphNodeId, graph: NormalizedGraph, chainIds: Set<GraphNodeId>): number {
  const outgoing = graph.edges.filter((e) => e.from === nodeId && chainIds.has(e.to));
  if (outgoing.length === 0) return 0; // leaf — raw or terminal
  return 1 + Math.max(...outgoing.map((e) => getUpstreamDepth(e.to, graph, chainIds)));
}

export function placeFacilities(
  graph: NormalizedGraph,
  nodeSiteAssignments: Map<GraphNodeId, SiteId>,
  _layoutHints: LayoutHints | undefined,
  classifications: ChainClassification[] = [],
): { siteLayouts: SiteLayout[]; feasibility: LayoutFeasibilityResult } {
  const siteLayouts: SiteLayout[] = [];
  const failures: PlacementFailure[] = [];

  const nodeChainMap = buildNodeChainMap(classifications);

  // Group nodes by site
  const siteNodes = new Map<SiteId, GraphNodeId[]>();
  for (const [nodeId, siteId] of nodeSiteAssignments) {
    const existing = siteNodes.get(siteId) ?? [];
    existing.push(nodeId);
    siteNodes.set(siteId, existing);
  }

  for (const [siteId, nodeIds] of siteNodes) {
    const site = SITE_MAP.get(siteId);
    if (!site) continue;

    const [siteWidth, siteHeight] = site.gridSize;
    const placed: PlacedRect[] = [];
    const footprints: PlacementFootprint[] = [];

    // Group nodes by chain
    const chainGroups = new Map<string, GraphNodeId[]>();
    for (const nid of nodeIds) {
      const chainId = nodeChainMap.get(nid) ?? "default";
      const existing = chainGroups.get(chainId) ?? [];
      existing.push(nid);
      chainGroups.set(chainId, existing);
    }

    // Sort chains: final_assembly first, seed_loop last
    const chainPriority: Record<string, number> = {
      final_assembly: 0,
      intermediate: 1,
      raw_processing: 2,
      import_fed: 3,
      seed_loop: 4,
    };
    const sortedChains = [...chainGroups.entries()].sort(([ca], [cb]) => {
      const classA = classifications.find((c) => c.chainId === ca);
      const classB = classifications.find((c) => c.chainId === cb);
      const pa = classA ? (chainPriority[classA.role] ?? 5) : 5;
      const pb = classB ? (chainPriority[classB.role] ?? 5) : 5;
      if (pa !== pb) return pa - pb;
      return ca.localeCompare(cb);
    });

    // Row-based shelf packing with module separation
    let currentRowY = 0;
    let currentRowX = 0;
    let rowHeight = 0;
    let prevChainId: string | null = null;

    // Sort nodes within each chain by upstream depth (processed → raw)
    function sortNodesByDepth(nodes: GraphNodeId[], chainNodeSet: Set<GraphNodeId>): GraphNodeId[] {
      return [...nodes].sort((a, b) => {
        // Sort by upstream depth (lower depth = more processed = left)
        const depthA = getUpstreamDepth(a, graph, chainNodeSet);
        const depthB = getUpstreamDepth(b, graph, chainNodeSet);
        return depthB - depthA;
      });
    }

    for (const [chainId, chainNodeIds] of sortedChains) {
      const chainNodeSet = new Set(chainNodeIds);
      const sortedNodeIds = sortNodesByDepth(chainNodeIds, chainNodeSet);

      for (let ni = 0; ni < sortedNodeIds.length; ni++) {
        const nodeId = sortedNodeIds[ni];
        const node = graph.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        // Get facility size
        const facilityId = node.facilityId;
        let fw = 3;
        let fh = 3;
        if (facilityId) {
          const fac = FACILITY_MAP.get(facilityId);
          if (fac) {
            [fw, fh] = fac.gridSize;
          }
        }

        // New row if needed
        if (currentRowX + fw > siteWidth) {
          currentRowX = 0;
          currentRowY += rowHeight + LOGISTICS_CORRIDOR_WIDTH;
          rowHeight = 0;
        }

        let placedRect: PlacedRect | null = null;

        if (currentRowY + fh <= siteHeight) {
          const rect: PlacedRect = {
            x: currentRowX,
            y: currentRowY,
            width: fw,
            height: fh,
            nodeId,
            chainId,
          };

          if (canPlaceRect(rect, placed, siteWidth, siteHeight)) {
            placedRect = rect;
            placed.push(rect);
            rowHeight = Math.max(rowHeight, fh);
            currentRowX += fw + MIN_FACILITY_SPACING;
          }
        }

        if (placedRect) {
          footprints.push({
            nodeId,
            siteId,
            position: { x: placedRect.x, y: placedRect.y },
            size: [placedRect.width, placedRect.height],
            rotation: 0,
            isLocked: false,
          });
        } else {
          failures.push({
            nodeId,
            reason: "site_capacity_exceeded",
            message: `Could not place ${node.label} (${fw}x${fh}) on ${site.name} — site full`,
            suggestion: "Try unlocking additional sites or reducing production goals",
          });
        }
      }

      // Add corridor between different chains
      if (prevChainId !== null && prevChainId !== chainId) {
        currentRowY += rowHeight + LOGISTICS_CORRIDOR_WIDTH;
        currentRowX = 0;
        rowHeight = 0;
      }
      prevChainId = chainId;
    }

    // Compute occupancy
    const totalPlacedArea = placed.reduce((sum, r) => sum + r.width * r.height, 0);
    const usableArea = siteWidth * siteHeight * SOFT_MAX_DENSITY;
    const occupancy = totalPlacedArea / usableArea;

    siteLayouts.push({
      siteId,
      facilityPlacements: footprints,
      logisticsPlacements: [],
      usableRect: { x: 0, y: 0, width: siteWidth, height: siteHeight },
      occupancy,
    });
  }

  return {
    siteLayouts,
    feasibility: {
      feasible: failures.length === 0,
      failures,
    },
  };
}
