import type { DetectedCycle, ItemId, ProductionNode, RegionId } from "@/types";
import type { SolverContext } from "./types";
import {
  actualOutputRate,
  buildSeedCycle,
  facilitiesNeeded,
  isCycleItem,
  requiredInputRate,
  SEED_LOOP_ITEMS,
  selectRecipe,
} from "./utils";

export const solveNode = (
  itemId: ItemId,
  targetRate: number,
  context: SolverContext,
  regionId: RegionId,
  detectedCycles: DetectedCycle[],
  isTarget: boolean,
): ProductionNode => {
  const item = context.itemMap.get(itemId)!;

  // Check if we have a raw mat override
  if (context.manualRawMaterials.has(itemId)) {
    const overrideRate = context.rawInputOverrides[itemId];
    const isCapped = overrideRate !== undefined && targetRate > overrideRate;
    if (isCapped) {
      context.capErrors.push(
        `"${item.displayName}" capped at ${overrideRate}/min (demand: ${targetRate}/min)`,
      );
    }
    const effectiveRate = isCapped ? overrideRate : targetRate;
    return {
      item,
      targetRate: effectiveRate,
      recipe: null,
      facility: null,
      facilityCount: 0,
      isRawMaterial: true,
      isTarget,
      dependencies: [],
    };
  }

  // Check if its a leaf node (raw mat)
  if (item.isRaw) {
    return {
      item,
      targetRate,
      recipe: null,
      facility: null,
      facilityCount: 0,
      isRawMaterial: true,
      isTarget,
      dependencies: [],
    };
  }

  // Check if we arrived at a cycle item (seed/plant loop)
  if (context.visitedItems.has(itemId) && isCycleItem(itemId)) {
    const placeholder: ProductionNode = {
      item,
      targetRate,
      recipe: null,
      facility: null,
      facilityCount: 0,
      isRawMaterial: false,
      isTarget,
      dependencies: [],
      isCyclePlaceholder: true,
      cycleItemId: itemId,
    };
    return placeholder;
  }

  // Check for any other cycle — item already being visited in current branch
  if (context.visitedItems.has(itemId)) {
    const placeholder: ProductionNode = {
      item,
      targetRate,
      recipe: null,
      facility: null,
      facilityCount: 0,
      isRawMaterial: false,
      isTarget,
      dependencies: [],
      isCyclePlaceholder: true,
      cycleItemId: itemId,
    };
    return placeholder;
  }

  // Set node as visited
  context.visitedItems.add(itemId);

  const selectedRecipe = selectRecipe(itemId, context, regionId);
  if (!selectedRecipe) {
    return {
      item,
      targetRate,
      recipe: null,
      facility: null,
      facilityCount: 0,
      isRawMaterial: true,
      isTarget,
      dependencies: [],
    };
  }

  const { recipe, facility } = selectedRecipe;
  const primaryOutput = recipe.outputs.find(
    (output) => output.itemId === itemId,
  )!;
  const facCount = facilitiesNeeded(
    targetRate,
    primaryOutput.amount,
    recipe.craftingTime,
  );
  const producedRate = actualOutputRate(
    facCount,
    primaryOutput.amount,
    recipe.craftingTime,
  );

  const dependencies: ProductionNode[] = [];
  for (const input of recipe.inputs) {
    const inputRate = requiredInputRate(
      producedRate,
      input.amount,
      primaryOutput.amount,
    );
    const dependentNode = solveNode(
      input.itemId,
      inputRate,
      context,
      regionId,
      detectedCycles,
      false,
    );

    // Check if we get the placeholder for the cycle back
    if (dependentNode.isCyclePlaceholder && dependentNode.cycleItemId) {
      if (SEED_LOOP_ITEMS.has(dependentNode.cycleItemId)) {
        const cycle = buildSeedCycle(dependentNode.cycleItemId, [dependentNode]);
        detectedCycles.push(cycle);
      }
      // Non-seed cycles are silently absorbed — the item is already being produced upstream
    }
    dependencies.push(dependentNode);
  }

  // After recursion, unmark visited to allow item to appear in different branch
  context.visitedItems.delete(itemId);

  return {
    item,
    targetRate,
    recipe,
    facility,
    facilityCount: facCount,
    isRawMaterial: false,
    isTarget,
    dependencies,
  };
};
