import {
  ItemId,
  type Recipe,
  type Facility,
  type RegionId,
} from "@/types";
import type { SolverContext } from "../types";
import { isRecipeAvailable } from "./availability";

/**
 * Selects a recipe for an item, based on if it's available, if there are any overrides.
 * Also checks that all dependencies can be sourced from the region.
 * @param itemId ID of output item of recipe
 * @param context Context of where this recipe is being performed
 * @param region Region
 * @returns A recipe for the item
 */
export const selectRecipe = (
  itemId: ItemId,
  context: SolverContext,
  region: RegionId,
): { recipe: Recipe; facility: Facility } | null => {
  const candidates = context.recipesByOutput.get(itemId);
  if (!candidates) return null;

  const available = candidates.filter((recipe: Recipe) => {
    const facility = context.facilityMap.get(recipe.facility);
    if (!facility) return false;
    if (!isRecipeAvailable(recipe, facility, region, context.patch)) return false;

    for (const input of recipe.inputs) {
      if (!context.producibleItems.has(input.itemId)) {
        return false;
      }
    }
    return true;
  });
  if (!available.length) return null;

  const overrideId = context.recipeOverrides[itemId];
  if (overrideId) {
    const override = available.find((r: Recipe) => r.id === overrideId);
    if (override) {
      const facility = context.facilityMap.get(override.facility)!;
      return { recipe: override, facility };
    }
  }

  const recipe = available[0];
  const facility = context.facilityMap.get(recipe.facility)!;
  return { recipe, facility };
};
