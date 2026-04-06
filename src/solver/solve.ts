import type { DetectedCycle, ItemId, ProductionNode, RegionId } from "@/types";
import type { SolverContext } from "./types";
import {
  actualOutputRate,
  buildSeedCycle,
  exactFacilitiesNeeded,
  isCycleItem,
  placedFacilitiesNeeded,
  requiredInputRate,
  SEED_LOOP_ITEMS,
  selectRecipe,
  utilizationRate,
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

  // Check if we have a metastorage external supply for this item
  const externalRate = context.remainingExternalInputRates.get(itemId);
  if (externalRate !== undefined && externalRate > 0) {
    // Determine how much of the demand can be covered by external supply
    const isFullyCovered = externalRate >= targetRate;
    const coveredRate = isFullyCovered ? targetRate : externalRate;
    const remainingRate = isFullyCovered ? 0 : targetRate - externalRate;

    // Consume the used external supply
    context.remainingExternalInputRates.set(
      itemId,
      isFullyCovered ? externalRate - targetRate : 0,
    );

    if (isFullyCovered) {
      // Fully covered by external supply — return an imported leaf node
      return {
        item,
        targetRate: coveredRate,
        recipe: null,
        facility: null,
        facilityCount: 0,
        isRawMaterial: false,
        isTarget,
        dependencies: [],
        isExternalSupply: true,
      };
    }

    // Partially covered — solve the remaining demand locally
    // First try to satisfy remaining from raw input overrides
    if (context.manualRawMaterials.has(itemId)) {
      const overrideRate = context.rawInputOverrides[itemId];
      const isCapped = overrideRate !== undefined && remainingRate > overrideRate;
      if (isCapped) {
        context.capErrors.push(
          `"${item.displayName}" capped at ${overrideRate}/min (demand: ${remainingRate}/min)`,
        );
      }
      const effectiveRate = isCapped ? overrideRate : remainingRate;
      const importedNode: ProductionNode = {
        item,
        targetRate: coveredRate,
        recipe: null,
        facility: null,
        facilityCount: 0,
        isRawMaterial: false,
        isTarget: false,
        dependencies: [],
        isExternalSupply: true,
      };
      const localNode: ProductionNode = {
        item,
        targetRate: effectiveRate,
        recipe: null,
        facility: null,
        facilityCount: 0,
        isRawMaterial: true,
        isTarget: false,
        dependencies: [],
      };
      return {
        item,
        targetRate,
        recipe: null,
        facility: null,
        facilityCount: 0,
        isRawMaterial: false,
        isTarget,
        dependencies: [importedNode, localNode],
      };
    }

    // Remaining is raw demand — add imported leaf then local raw leaf
    if (item.isRaw) {
      const importedNode: ProductionNode = {
        item,
        targetRate: coveredRate,
        recipe: null,
        facility: null,
        facilityCount: 0,
        isRawMaterial: false,
        isTarget: false,
        dependencies: [],
        isExternalSupply: true,
      };
      const localNode: ProductionNode = {
        item,
        targetRate: remainingRate,
        recipe: null,
        facility: null,
        facilityCount: 0,
        isRawMaterial: true,
        isTarget: false,
        dependencies: [],
      };
      return {
        item,
        targetRate,
        recipe: null,
        facility: null,
        facilityCount: 0,
        isRawMaterial: false,
        isTarget,
        dependencies: [importedNode, localNode],
      };
    }

    // Remaining requires recipe — solve locally and prepend imported leaf
    const localResult = solveNode(
      itemId,
      remainingRate,
      context,
      regionId,
      detectedCycles,
      false,
    );
    const importedNode: ProductionNode = {
      item,
      targetRate: coveredRate,
      recipe: null,
      facility: null,
      facilityCount: 0,
      isRawMaterial: false,
      isTarget: false,
      dependencies: [],
      isExternalSupply: true,
    };
    return {
      item,
      targetRate,
      recipe: localResult.recipe,
      facility: localResult.facility,
      facilityCount: localResult.facilityCount,
      isRawMaterial: false,
      isTarget,
      dependencies: [importedNode, ...localResult.dependencies],
    };
  }

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

  // Exact fractional count for math precision
  const exactFac = exactFacilitiesNeeded(
    targetRate,
    primaryOutput.amount,
    recipe.craftingTime,
  );
  // Placed whole-machine count for grid/building
  const placedFac = placedFacilitiesNeeded(exactFac);
  // Actual output if all placed machines run
  const actualOutput = actualOutputRate(
    placedFac,
    primaryOutput.amount,
    recipe.craftingTime,
  );
  // Utilization fraction
  const util = utilizationRate(exactFac, placedFac);
  // Overproduction vs required
  const overprod = actualOutput - targetRate;

  // Children use exact required output rate, not inflated actual output
  const dependencies: ProductionNode[] = [];
  for (const input of recipe.inputs) {
    const inputRate = requiredInputRate(
      targetRate,
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
    facilityCount: placedFac,
    exactFacilityCount: exactFac,
    actualOutputRate: actualOutput,
    utilization: util,
    overproductionRate: overprod,
    isRawMaterial: false,
    isTarget,
    dependencies,
  };
};
