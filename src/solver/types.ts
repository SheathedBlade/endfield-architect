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
};

export type SolverOutput = {
  nodes: ProductionNode[];
  detectedCycles: DetectedCycle[];
  errors: string[];
};
