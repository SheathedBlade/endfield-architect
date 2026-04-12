import { SITE_MAP } from "@/data/loader";
import { solve } from "@/solver";
import type { Goal, ItemId, MetaStorageTransfer, Patch, ProductionPlan, RegionId } from "@/types";
import { SiteId as SiteIdType } from "@/types";
import { convertToSiteProduction } from "@/utils/siteAssignment";

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

export function recomputePlan(
  goals: Goal[],
  state: { plan: ProductionPlan; activePatch: Patch },
): Pick<ProductionPlan, "nodes" | "detectedCycles" | "errors"> {
  const result = doSolve(goals, state);

  const siteNodes = convertToSiteProduction(
    result.nodes,
    state.plan.unlockedSites[0] ?? SiteIdType.VALLEY_CORE,
  );

  return {
    nodes: siteNodes,
    detectedCycles: result.detectedCycles,
    errors: result.errors,
  };
}