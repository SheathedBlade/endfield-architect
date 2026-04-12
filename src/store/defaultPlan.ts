import { SiteId, type ProductionPlan } from "@/types";
import { LATEST_PATCH } from "@/types/constants";

export const DEFAULT_PLAN: ProductionPlan = {
  version: LATEST_PATCH,
  goals: [],
  regionalTransfer: {
    unlocked: false,
    ttvCapPerHour: 0,
    activeTransfers: [],
  },
  unlockedSites: [SiteId.VALLEY_CORE],
  rawInputOverrides: {},
  recipeOverrides: {},
  nodes: [],
  detectedCycles: [],
  errors: [],
};