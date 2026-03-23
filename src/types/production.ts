import type { ItemId, Patch, RecipeId, RegionId, SiteId } from "./constants";
import type { Facility, Item, Recipe } from "./core";

export type ProductionNode = {
  item: Item;
  targetRate: number;
  recipe: Recipe | null;
  facility: Facility | null;
  // # of machines to hit the target rate
  facilityCount: number;
  // When it is a leaf node
  isRawMaterial: boolean;
  // When it is a production goal
  isTarget: boolean;
  dependencies: ProductionNode[];
  /** Set when player has external materials they put in
   * Ex: Planting/seeding loop in another site such as an outpost
   * Result: Considered as a leaf node
   */
  manualRawMaterials?: Set<ItemId>;
  isCyclePlaceholder?: boolean;
  cycleItemId?: ItemId;
};

export type DetectedCycle = {
  cycleId: string;
  involvedItemIds: ItemId[];
  breakPointItemId: ItemId;
  cycleNodes: ProductionNode[];
  netOutputs: Map<ItemId, number>;
};

export type SiteProductionNode = ProductionNode & {
  sideId: string;
  assignedFacilityIndex: number;
};

export type MetaStorageTransfer = {
  itemId: ItemId;
  amountPerHour: number;
  sourceRegion: RegionId;
  destinationRegion: RegionId;
};

export type RegionalTransferConfig = {
  unlocked: boolean;
  ttvCapPerHour: number;
  activeTransfers: MetaStorageTransfer[];
};

export type Goal = {
  itemId: ItemId;
  targetRate: number;
};

export type ProductionPlan = {
  version: Patch;
  goals: Goal[];
  regionalTransfer: RegionalTransferConfig;
  unlockedSites: SiteId[];
  rawInputOverrides: Partial<Record<ItemId, number>>;
  recipeOverrides: Partial<Record<ItemId, RecipeId>>;
  nodes: SiteProductionNode[];
  detectedCycles: DetectedCycle[];
};
