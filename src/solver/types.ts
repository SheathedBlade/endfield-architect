import type {
  DetectedCycle,
  Facility,
  Item,
  ItemId,
  Patch,
  ProductionNode,
  Recipe,
  RecipeId,
  RegionId,
} from "@/types";

export type SolverContext = {
  patch: Patch;
  unlockedSites: string[];
  recipeOverrides: Partial<Record<ItemId, RecipeId>>;
  rawInputOverrides: Partial<Record<ItemId, number>>;
  manualRawMaterials: Set<ItemId>;
  /** Per-minute external supply rates from metastorage transfers.
   * Consumed by the solver before local production is planned.
   */
  externalInputRates: Map<ItemId, number>;
  /** Mutable remaining external supply shared across all goals in one solve run.
   * Depleted as demand is satisfied; reset at start of each solve().
   */
  remainingExternalInputRates: Map<ItemId, number>;
  visitedItems: Set<ItemId>;
  producibleItems: Set<ItemId>;
  capErrors: string[];

  itemMap: Map<string, Item>;
  facilityMap: Map<string, Facility>;
  recipesByOutput: Map<string, Recipe[]>;
};

export type SolverInput = {
  goals: { itemId: ItemId; targetRate: number }[];
  patch: Patch;
  activeSiteRegions: RegionId[];
  unlockedSites: string[];
  recipeOverrides: Partial<Record<ItemId, RecipeId>>;
  rawInputOverrides: Partial<Record<ItemId, number>>;
  manualRawMaterials: Set<ItemId>;
  /** Per-minute external supply rates from metastorage transfers. */
  externalInputRates?: Partial<Record<ItemId, number>>;
};

export type SolverOutput = {
  nodes: ProductionNode[];
  detectedCycles: DetectedCycle[];
  errors: string[];
};
