import { SITE_MAP } from "@/data/loader";
import { solve } from "@/solver";
import type { Goal, ItemId, MetaStorageTransfer, Patch, ProductionPlan, RegionId, SiteId } from "@/types";
import type { GraphNodeId } from "@/layout/types";
import { SiteId as SiteIdType } from "@/types";
import { convertToSiteProduction } from "@/utils/siteAssignment";
import { normalizeProductionGraph } from "@/layout/normalizeProductionGraph";
import { classifyChains } from "@/layout/classifyChains";
import { assignSites } from "@/layout/assignSites";
import { placeFacilities } from "@/layout/placeFacilities";
import { placeValleyPerimeterLogistics } from "@/layout/placePerimeterLogistics";
import { placeWulingInternalLogistics } from "@/layout/placeInternalLogistics";
import { routeBelts } from "@/layout/routeBelts";
import { PIXELS_PER_CELL, siteGridOrigin } from "@/layout/gridToCanvas";
import type { LayoutResult } from "@/layout/types";
import type { BeltRoute as LayoutBeltRoute } from "@/layout/types";

export function buildExternalInputRates(
  transfers: MetaStorageTransfer[],
): Partial<Record<ItemId, number>> {
  const map = new Map<ItemId, number>();
  for (const t of transfers) {
    const existing = map.get(t.itemId) ?? 0;
    map.set(t.itemId, existing + t.amountPerHour / 60);
  }
  return Object.fromEntries(map) as Partial<Record<ItemId, number>>;
}

export function doSolve(
  goals: Goal[],
  state: { plan: ProductionPlan; activePatch: Patch },
) {
  const activeSiteRegions = [
    ...new Set(
      state.plan.unlockedSites
        .map((siteId) => SITE_MAP.get(siteId)?.regionId)
        .filter((r) => r !== undefined),
    ),
  ] as RegionId[];

  return solve({
    goals,
    patch: state.activePatch,
    activeSiteRegions,
    unlockedSites: state.plan.unlockedSites,
    recipeOverrides: state.plan.recipeOverrides,
    rawInputOverrides: state.plan.rawInputOverrides,
    manualRawMaterials: new Set<ItemId>(
      Object.keys(state.plan.rawInputOverrides) as ItemId[],
    ),
    externalInputRates: buildExternalInputRates(
      state.plan.regionalTransfer.activeTransfers,
    ),
  });
}

async function buildLayoutResult(
  nodes: import("@/types").ProductionNode[],
  unlockedSites: SiteId[],
): Promise<LayoutResult | null> {
  if (nodes.length === 0) return null;

  const graph = normalizeProductionGraph(nodes);

  const classifications = classifyChains(graph);

  const assignmentResult = assignSites(graph, classifications, unlockedSites);

  const nodeSiteMap: Map<GraphNodeId, SiteId> = new Map();
  for (const ca of assignmentResult.assignments) {
    for (const na of ca.nodeAssignments) {
      nodeSiteMap.set(na.nodeId, na.siteId);
    }
  }

  const layoutHints = {
    nodePositions: new Map<GraphNodeId, { x: number; y: number }>(),
    layerIndices: new Map<GraphNodeId, number>(),
  };

  const { siteLayouts, feasibility } = placeFacilities(graph, nodeSiteMap, layoutHints, classifications);

  const allFailures = [...feasibility.failures];
  const allLogistics: import("@/layout/types").LogisticsPlacement[] = [];

  for (const siteLayout of siteLayouts) {
    const site = SITE_MAP.get(siteLayout.siteId);
    if (!site) continue;

    const rawImportPlacements = siteLayout.facilityPlacements.filter((fp) => {
      const node = graph.nodes.find((n) => n.id === fp.nodeId);
      return node?.role === "raw" || node?.role === "import";
    });
    const uniqueRawItems = new Set(
      rawImportPlacements.map((fp) => {
        const node = graph.nodes.find((n) => n.id === fp.nodeId);
        return node?.itemId ?? fp.nodeId;
      }),
    );
    const requiredSlots = uniqueRawItems.size;

    if (site.id === "valley_core") {
      const valleyResult = placeValleyPerimeterLogistics(siteLayout, requiredSlots);
      allFailures.push(...valleyResult.failures);
      allLogistics.push(...valleyResult.logisticsPlacements);
    } else if (site.id === "wuling_core") {
      const inputPorts = Math.min(site.depotPorts.inputs, requiredSlots);
      const outputPorts = Math.min(site.depotPorts.outputs, Math.ceil(requiredSlots / 2));
      const wulingResult = placeWulingInternalLogistics(siteLayout, inputPorts, outputPorts);
      allFailures.push(...wulingResult.failures);
      allLogistics.push(...wulingResult.logisticsPlacements);
    }
  }

  const finalFeasibility: import("@/layout/types").LayoutFeasibilityResult = {
    feasible: allFailures.length === 0,
    failures: allFailures,
  };

  const finalSiteLayouts = siteLayouts.map((sl) => ({
    ...sl,
    logisticsPlacements: allLogistics.filter((lp) => lp.siteId === sl.siteId),
  }));

  // Route belts for each site
  const gridOrigin = siteGridOrigin();
  const allBeltRoutes: LayoutBeltRoute[] = [];
  for (const sl of finalSiteLayouts) {
    const siteRoutes = await routeBelts(
      graph,
      sl,
      PIXELS_PER_CELL,
      gridOrigin.x,
      gridOrigin.y,
    );
    for (const r of siteRoutes) {
      allBeltRoutes.push({
        edgeId: r.edgeId,
        fromNodeId: r.fromNodeId as GraphNodeId,
        toNodeId: r.toNodeId as GraphNodeId,
        siteId: r.siteId as SiteId,
        gridPath: r.gridPath,
        pixelPath: r.pixelPath,
      });
    }
  }

  return {
    graph,
    classifications,
    siteLayouts: finalSiteLayouts,
    feasibility: finalFeasibility,
    beltRoutes: allBeltRoutes,
    layoutHints,
  };
}

type LayoutPick = Pick<ProductionPlan, "nodes" | "detectedCycles" | "errors" | "layout">;

export async function recomputePlan(
  goals: Goal[],
  state: { plan: ProductionPlan; activePatch: Patch },
): Promise<LayoutPick> {
  const result = doSolve(goals, state);

  const siteNodes = convertToSiteProduction(
    result.nodes,
    state.plan.unlockedSites[0] ?? SiteIdType.VALLEY_CORE,
  );

  const layout = await buildLayoutResult(result.nodes, state.plan.unlockedSites);

  return {
    nodes: siteNodes,
    detectedCycles: result.detectedCycles,
    errors: result.errors,
    layout,
  };
}
