import {
  ItemId,
  RAW_MATERIAL_REGIONS,
  type RegionId,
} from "@/types";
import type { SolverContext } from "../types";
import { isRecipeAvailable } from "./availability";
import { SEED_LOOP_ITEMS, PLANT_LOOP_ITEMS } from "./cycles";

/**
 * Precomputes the set of all items that can be fully produced in a region,
 * including all their dependencies. Uses iterative fixed-point iteration.
 * Cycle items (seeds/plants) are seeded as producible since the solver
 * handles the seed/plant loop with its own cycle detection.
 */
export const computeProducibleItems = (
  context: SolverContext,
  region: RegionId,
): Set<ItemId> => {
  const producible = new Set<ItemId>();

  for (const [itemId] of context.itemMap) {
    const item = context.itemMap.get(itemId)!;
    if (item.isRaw && isRawMaterialAvailable(itemId as ItemId, region)) {
      producible.add(itemId as ItemId);
    }
  }

  for (const seedId of SEED_LOOP_ITEMS) {
    producible.add(seedId);
  }
  for (const plantId of PLANT_LOOP_ITEMS) {
    producible.add(plantId);
  }

  for (const itemId of Object.keys(context.rawInputOverrides) as ItemId[]) {
    producible.add(itemId);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const [itemId, recipes] of context.recipesByOutput) {
      if (producible.has(itemId as ItemId)) continue;

      for (const recipe of recipes) {
        const facility = context.facilityMap.get(recipe.facility);
        if (!facility) continue;
        if (!isRecipeAvailable(recipe, facility, region, context.patch)) continue;

        const allInputsProducible = recipe.inputs.every((input: { itemId: ItemId }) =>
          producible.has(input.itemId),
        );
        if (allInputsProducible) {
          producible.add(itemId as ItemId);
          changed = true;
          break;
        }
      }
    }
  }

  return producible;
};

function isRawMaterialAvailable(itemId: ItemId, region: RegionId): boolean {
  return itemId in RAW_MATERIAL_REGIONS[region];
}
