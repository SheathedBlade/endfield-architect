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
import {
  makeCyclePlaceholder,
  makeExternalLeaf,
  makeRawNode,
  makeUnresolvableNode,
} from "./nodeFactories";

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
    const isFullyCovered = externalRate >= targetRate;
    const coveredRate = isFullyCovered ? targetRate : externalRate;
    const remainingRate = isFullyCovered ? 0 : targetRate - externalRate;

    context.remainingExternalInputRates.set(
      itemId,
      isFullyCovered ? externalRate - targetRate : 0,
    );

    if (isFullyCovered) {
      return makeExternalLeaf(item, coveredRate, isTarget);
    }

    if (context.manualRawMaterials.has(itemId)) {
      const overrideRate = context.rawInputOverrides[itemId];
      const effectiveRate = (overrideRate !== undefined && remainingRate > overrideRate)
        ? overrideRate
        : remainingRate;
      if (overrideRate !== undefined && remainingRate > overrideRate) {
        context.capErrors.push(
          `"${item.displayName}" capped at ${overrideRate}/min (demand: ${remainingRate}/min)`,
        );
      }
      const importedNode = makeExternalLeaf(item, coveredRate, false);
      const localNode = makeRawNode(item, effectiveRate, false);
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

    if (item.isRaw) {
      const importedNode = makeExternalLeaf(item, coveredRate, false);
      const localNode = makeRawNode(item, remainingRate, false);
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

    const localResult = solveNode(
      itemId,
      remainingRate,
      context,
      regionId,
      detectedCycles,
      false,
    );
    const importedNode = makeExternalLeaf(item, coveredRate, false);
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

  if (context.manualRawMaterials.has(itemId)) {
    const overrideRate = context.rawInputOverrides[itemId];
    const isCapped = overrideRate !== undefined && targetRate > overrideRate;
    if (isCapped) {
      context.capErrors.push(
        `"${item.displayName}" capped at ${overrideRate}/min (demand: ${targetRate}/min)`,
      );
    }
    return makeRawNode(item, isCapped ? overrideRate! : targetRate, isTarget);
  }

  if (item.isRaw) {
    return makeRawNode(item, targetRate, isTarget);
  }

  if (context.visitedItems.has(itemId) && isCycleItem(itemId)) {
    return makeCyclePlaceholder(item, itemId, targetRate, isTarget);
  }

  if (context.visitedItems.has(itemId)) {
    return makeCyclePlaceholder(item, itemId, targetRate, isTarget);
  }

  context.visitedItems.add(itemId);

  const selectedRecipe = selectRecipe(itemId, context, regionId);
  if (!selectedRecipe) {
    return makeUnresolvableNode(item, targetRate, isTarget);
  }

  const { recipe, facility } = selectedRecipe;
  const primaryOutput = recipe.outputs.find(
    (output) => output.itemId === itemId,
  )!;

  const exactFac = exactFacilitiesNeeded(
    targetRate,
    primaryOutput.amount,
    recipe.craftingTime,
  );
  const placedFac = placedFacilitiesNeeded(exactFac);
  const actualOutput = actualOutputRate(
    placedFac,
    primaryOutput.amount,
    recipe.craftingTime,
  );
  const util = utilizationRate(exactFac, placedFac);
  const overprod = actualOutput - targetRate;

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

    if (dependentNode.isCyclePlaceholder && dependentNode.cycleItemId) {
      if (SEED_LOOP_ITEMS.has(dependentNode.cycleItemId)) {
        const cycle = buildSeedCycle(dependentNode.cycleItemId, [dependentNode]);
        detectedCycles.push(cycle);
      }
    }
    dependencies.push(dependentNode);
  }

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
