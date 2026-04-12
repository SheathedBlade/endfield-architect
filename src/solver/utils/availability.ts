import {
  RAW_MATERIAL_REGIONS,
  type ItemId,
  type Facility,
  type Patch,
  type Recipe,
  type RegionId,
} from "@/types";

/**
 * Checks if the recipe is available for the patch, region, and if it's in fluid mode
 * @param recipe Selected recipe
 * @param facility
 * @param region
 * @param patch Selected patch
 */
export const isRecipeAvailable = (
  recipe: Recipe,
  facility: Facility,
  region: RegionId,
  patch: Patch,
): boolean => {
  if (recipe.patch > patch) return false;
  if (recipe.fluidMode) {
    if (!facility.fluidMode) return false;
    const fluidRegions = facility.fluidMode.regions;
    if (fluidRegions !== "all" && !fluidRegions.includes(region)) return false;
  }
  return true;
};

/**
 * Checks if a raw material is available in the given region
 */
export const isRawMaterialAvailable = (
  itemId: ItemId,
  region: RegionId,
): boolean => {
  return itemId in RAW_MATERIAL_REGIONS[region];
};
