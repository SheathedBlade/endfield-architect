import {
  ItemId,
  type DetectedCycle,
  type Facility,
  type Patch,
  type ProductionNode,
  type Recipe,
  type RegionId,
} from "@/types";
import type { SolverContext } from "./types";

/**
 * Calculates production rate per min
 * @param outputAmount # of items produced per craft
 * @param craftingTime # Amount of time to craft once
 */
export const calculateRate = (
  outputAmount: number,
  craftingTime: number,
): number => {
  return (outputAmount * 60) / craftingTime;
};

/**
 * Calculates the number of facilities needed to reach target rate, rounded up
 * @param targetRate
 * @param outputAmount
 * @param craftingTime
 */
export const facilitiesNeeded = (
  targetRate: number,
  outputAmount: number,
  craftingTime: number,
): number => {
  const ratePerFacility = calculateRate(outputAmount, craftingTime);
  return Math.ceil(targetRate / ratePerFacility);
};

/**
 * Gets actual rate with given facilities
 * @param facilityCount
 * @param outputAmount
 * @param craftingTime
 */
export function actualOutputRate(
  facilityCount: number,
  outputAmount: number,
  craftingTime: number,
): number {
  return facilityCount * calculateRate(outputAmount, craftingTime);
}

/**
 * Calculates input rate required given an input/output item ratio
 * @param targetOutputRate
 * @param inputAmount
 * @param outputAmount
 */
export const requiredInputRate = (
  targetOutputRate: number,
  inputAmount: number,
  outputAmount: number,
): number => {
  return (inputAmount / outputAmount) * targetOutputRate;
};

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
    if (fluidRegions !== "all" || !fluidRegions.includes(region)) return false;
  }
  return true;
};

/**
 * Selects a recipe for an item, based on if it's available, if there are any overrides
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

  const available = candidates.filter((recipe) => {
    const facility = context.facilityMap.get(recipe.facility);
    if (!facility) return false;
    return isRecipeAvailable(recipe, facility, region, context.patch);
  });
  if (!available.length) return null;

  const overrideId = context.recipeOverrides[itemId];
  if (overrideId) {
    const override = available.find((r) => r.id === overrideId);
    if (override) {
      const facility = context.facilityMap.get(override.facility)!;
      return { recipe: override, facility };
    }
  }

  const recipe = available[0];
  const facility = context.facilityMap.get(recipe.facility)!;
  return { recipe, facility };
};

export const SEED_LOOP_ITEMS = new Set<ItemId>([
  "buckflower_seed",
  "citrome_seed",
  "sandleaf_seed",
  "aketine_seed",
  "jincao_seed",
  "yazhen_seed",
]);

export const PLANT_LOOP_ITEMS = new Set<ItemId>([
  "buckflower",
  "citrome",
  "aketine",
  "sandleaf",
  "yazhen",
  "jincao",
]);

export const SEED_NET_OUTPUT: Partial<Record<ItemId, number>> = {
  buckflower_seed: 1,
  citrome_seed: 1,
  sandleaf_seed: 1,
  aketine_seed: 1,
  jincao_seed: 0,
  yazhen_seed: 0,
};

export const PLANT_NET_OUTPUT: Partial<Record<ItemId, number>> = {
  buckflower: 1,
  citrome: 1,
  sandleaf: 1,
  aketine: 1,
  jincao: 2,
  yazhen: 2,
};

export const SEED_TO_PLANT: Partial<Record<ItemId, ItemId>> = {
  buckflower_seed: "buckflower",
  citrome_seed: "citrome",
  sandleaf_seed: "sandleaf",
  aketine_seed: "aketine",
  jincao_seed: "jincao",
  yazhen_seed: "yazhen",
};

export const PLANT_TO_SEED: Partial<Record<ItemId, ItemId>> = {
  buckflower: "buckflower_seed",
  citrome: "citrome_seed",
  sandleaf: "sandleaf_seed",
  aketine: "aketine_seed",
  jincao: "jincao_seed",
  yazhen: "yazhen_seed",
};

export const isCycleItem = (itemId: ItemId) => {
  return SEED_LOOP_ITEMS.has(itemId) || PLANT_LOOP_ITEMS.has(itemId);
};

export function isSeed(itemId: ItemId): boolean {
  return SEED_LOOP_ITEMS.has(itemId);
}

export function isPlant(itemId: ItemId): boolean {
  return PLANT_LOOP_ITEMS.has(itemId);
}

/**
 * Builds a detection cycle for the seed/plant loop
 * Recursion stops at the seeds
 * @param seedItemId Seed item
 * @param cycleNodes Production nodes in the cycle
 */
export const buildSeedCycle = (
  seedItemId: ItemId,
  cycleNodes: ProductionNode[],
): DetectedCycle => {
  const plantItemId = SEED_TO_PLANT[seedItemId]!;
  const seedNet = SEED_NET_OUTPUT[seedItemId] ?? 0;
  const plantNet = PLANT_NET_OUTPUT[plantItemId] ?? 0;

  return {
    cycleId: `seed_loop_${seedItemId}`,
    involvedItemIds: [seedItemId, plantItemId],
    breakPointItemId: seedItemId,
    cycleNodes,
    netOutputs: new Map<ItemId, number>([
      [plantItemId, plantNet],
      [seedItemId, seedNet],
    ]),
  };
};
