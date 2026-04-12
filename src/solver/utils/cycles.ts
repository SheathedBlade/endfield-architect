import {
  ItemId,
  type DetectedCycle,
  type ProductionNode,
} from "@/types";

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
