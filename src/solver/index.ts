import { FACILITY_MAP, ITEM_MAP, RECIPES_BY_OUTPUT } from "@/data/loader";
import type { ProductionNode } from "@/types";
import { solveNode } from "./solve";
import type { SolverContext, SolverInput, SolverOutput } from "./types";

export const solve = (input: SolverInput): SolverOutput => {
  const {
    goals,
    patch,
    activeSiteRegions,
    unlockedSites,
    recipeOverrides,
    rawInputOverrides,
    manualRawMaterials,
  } = input;

  if (!goals.length) return { nodes: [], detectedCycles: [], errors: [] };

  const detectedCycles: SolverOutput["detectedCycles"] = [];
  const errors: string[] = [];
  const nodes: ProductionNode[] = [];

  const primaryRegion = activeSiteRegions[0] ?? "valley";
  for (const goal of goals) {
    const context: SolverContext = {
      patch,
      unlockedSites,
      recipeOverrides,
      rawInputOverrides,
      manualRawMaterials,
      visitedItems: new Set(),
      itemMap: ITEM_MAP,
      facilityMap: FACILITY_MAP,
      recipesByOutput: RECIPES_BY_OUTPUT,
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
      errors.push(`Failed to solve for "${goal.itemId}": ${e}`);
    }
  }
  return { nodes, detectedCycles, errors };
};
