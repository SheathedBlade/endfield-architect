import {
  FACILITY_MAP,
  ITEM_MAP,
  RECIPES_BY_OUTPUT,
  REGION_MAP,
} from "@/data/loader";
import {
  RAW_MATERIAL_REGIONS,
  type ItemId,
  type Patch,
  type ProductionNode,
  type RecipeId,
  type RegionId,
} from "@/types";
import { solveNode } from "./solve";
import type { SolverContext, SolverInput, SolverOutput } from "./types";
import { computeProducibleItems } from "./utils";

export function getProducibleItems(
  regions: RegionId[],
  patch: Patch,
  recipeOverrides: Partial<Record<ItemId, RecipeId>> = {},
  rawInputOverrides: Partial<Record<ItemId, number>> = {},
): Set<ItemId> {
  if (regions.length === 0) return new Set();

  const primaryRegion = regions[0];
  const context: SolverContext = {
    patch: patch,
    unlockedSites: [],
    recipeOverrides,
    rawInputOverrides,
    manualRawMaterials: new Set(),
    externalInputRates: new Map(),
    remainingExternalInputRates: new Map(),
    visitedItems: new Set(),
    itemMap: ITEM_MAP,
    facilityMap: FACILITY_MAP,
    recipesByOutput: RECIPES_BY_OUTPUT,
    producibleItems: new Set(),
    capErrors: [],
  };

  return computeProducibleItems(context, primaryRegion);
}

const sumRawMaterialRates = (
  nodes: ProductionNode[],
  rates: Map<string, number>,
): void => {
  for (const node of nodes) {
    if (node.isRawMaterial && node.targetRate > 0) {
      const current = rates.get(node.item.id) ?? 0;
      rates.set(node.item.id, current + node.targetRate);
    }
    if (node.dependencies.length > 0) {
      sumRawMaterialRates(node.dependencies, rates);
    }
  }
};

const checkRawMaterialCaps = (
  rates: Map<string, number>,
  region: RegionId,
  errors: string[],
): void => {
  const caps = RAW_MATERIAL_REGIONS[region];
  for (const [itemId, rate] of rates) {
    const cap = caps[itemId as keyof typeof caps];
    if (cap !== undefined && cap !== Infinity && rate > cap) {
      const itemName = ITEM_MAP.get(itemId as ItemId)?.displayName ?? itemId;
      const regionName = REGION_MAP.get(region)?.name ?? region;
      errors.push(
        `"${itemName}" (${rate}/min) exceeds ${regionName} cap (${cap}/min)`,
      );
    }
  }
};

export const solve = (input: SolverInput): SolverOutput => {
  const {
    goals,
    patch,
    activeSiteRegions,
    unlockedSites,
    recipeOverrides,
    rawInputOverrides,
    manualRawMaterials,
    externalInputRates = {},
  } = input;

  if (!goals.length) return { nodes: [], detectedCycles: [], errors: [] };

  const detectedCycles: SolverOutput["detectedCycles"] = [];
  const errors: string[] = [];
  const nodes: ProductionNode[] = [];

  const primaryRegion = activeSiteRegions[0] ?? "valley";

  // Build mutable remaining external supply pool from input rates
  const remainingExternalInputRates = new Map<ItemId, number>(
    Object.entries(externalInputRates).map(([id, rate]) => [id as ItemId, rate]),
  );

  const tempContext: SolverContext = {
    patch,
    unlockedSites,
    recipeOverrides,
    rawInputOverrides,
    manualRawMaterials,
    externalInputRates: new Map<ItemId, number>(
      Object.entries(externalInputRates).map(([id, rate]) => [id as ItemId, rate]),
    ),
    remainingExternalInputRates,
    visitedItems: new Set(),
    itemMap: ITEM_MAP,
    facilityMap: FACILITY_MAP,
    recipesByOutput: RECIPES_BY_OUTPUT,
    producibleItems: new Set(),
    capErrors: [],
  };

  const producibleItems = computeProducibleItems(tempContext, primaryRegion);

  for (const goal of goals) {
    const context: SolverContext = {
      patch,
      unlockedSites,
      recipeOverrides,
      rawInputOverrides,
      manualRawMaterials,
      externalInputRates: tempContext.externalInputRates,
      remainingExternalInputRates: tempContext.remainingExternalInputRates,
      visitedItems: new Set(),
      itemMap: ITEM_MAP,
      facilityMap: FACILITY_MAP,
      recipesByOutput: RECIPES_BY_OUTPUT,
      producibleItems,
      capErrors: tempContext.capErrors,
    };

    try {
      const node = solveNode(
        goal.itemId,
        goal.targetRate,
        context,
        primaryRegion,
        detectedCycles,
        true,
      );
      nodes.push(node);
    } catch (e) {
      const itemName = ITEM_MAP.get(goal.itemId)?.displayName ?? goal.itemId;
      errors.push(`Failed to solve for "${itemName}": ${e}`);
    }
  }

  const rawMaterialRates = new Map<string, number>();
  sumRawMaterialRates(nodes, rawMaterialRates);

  // Strip manual materials from cap check since they're capped inline in solveNode
  const ratesWithoutManual = new Map(
    [...rawMaterialRates.entries()].filter(
      ([id]) => !manualRawMaterials.has(id as ItemId),
    ),
  );
  checkRawMaterialCaps(ratesWithoutManual, primaryRegion, errors);

  // Append cap warnings from override enforcement
  errors.push(...tempContext.capErrors);

  return { nodes, detectedCycles, errors };
};
