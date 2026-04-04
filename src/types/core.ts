import type {
  FacilityCategory,
  FacilityId,
  ItemId,
  Patch,
  RecipeId,
  RegionId,
  SiteId,
} from "./constants";

export type Item = {
  id: ItemId;
  displayName: string;
  isLiquid: boolean;
  isRaw: boolean;
  isByproduct: boolean;
  patch: Patch;
  iconUrl?: string;
};

export type RecipeItem = {
  itemId: ItemId;
  amount: number;
};

export type Recipe = {
  id: RecipeId;
  facility: FacilityId;
  craftingTime: number;
  fluidMode: boolean;
  patch: Patch;
  inputs: RecipeItem[];
  outputs: RecipeItem[];
};

export type Facility = {
  id: FacilityId;
  displayName: string;
  powerConsumption: number;
  gridSize: [number, number];
  regions: "all" | RegionId[];
  category: FacilityCategory;
  patch: Patch;
  ports: {
    inputSlots: number;
    outputSlots: number;
    inputPorts: number;
    outputPorts: number;
    pipeInputs: number;
    pipeOutputs: number;
  };
  fluidMode?: {
    additionalPipeInputs: number;
    additionalPipeOutputs: number;
    unlockedInPatch: Patch;
    regions: "all" | RegionId[];
  };
  placementCap?: {
    default: number;
    upgrades?: { patch: Patch; cap: number }[];
  };
  parallelRecipes?: {
    default: number;
    upgrades?: { patch: Patch; count: number }[];
  };
  iconUrl?: string;
};

export type Site = {
  id: SiteId;
  name: string;
  regionId: RegionId;
  patch: Patch;
  isCore: boolean;
  gridSize: [number, number];
  depotPorts: {
    inputs: number;
    outputs: number;
  };
};

export type Region = {
  id: RegionId;
  name: string;
};
