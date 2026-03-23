import {
  LATEST_PATCH,
  SiteId,
  type Goal,
  type ItemId,
  type MetaStorageTransfer,
  type Patch,
  type ProductionPlan,
  type RecipeId,
  type SiteId as SiteIdType,
} from "@/types";
import { create } from "zustand";

type AppState = {
  plan: ProductionPlan;
  activePatch: Patch;

  setPatch: (patch: Patch) => void;

  addGoal: (goal: Goal) => void;
  removeGoal: (itemId: ItemId) => void;
  updateGoal: (goal: Goal) => void;

  unlockSite: (siteId: SiteIdType) => void;
  lockSite: (siteId: SiteIdType) => void;

  setRawInputOverride: (itemId: ItemId, ratePerMin: number) => void;
  removeRawInputOverride: (itemId: ItemId) => void;

  setRecipeOverride: (itemId: ItemId, recipeId: RecipeId) => void;
  removeRecipeOverride: (itemId: ItemId) => void;

  setRegionalTransferUnlocked: (unlocked: boolean) => void;
  setTTVCap: (cap: number) => void;
  addMetastorageTransfer: (transfer: MetaStorageTransfer) => void;
  removeMetastorageTransfer: (itemId: ItemId) => void;
};

const DEFAULT_PLAN: ProductionPlan = {
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
};

export const useAppStore = create<AppState>((set) => ({
  plan: DEFAULT_PLAN,
  activePatch: LATEST_PATCH,

  setPatch: (patch) =>
    set((state) => ({
      activePatch: patch,
      plan: { ...state.plan, version: patch },
    })),

  addGoal: (goal) =>
    set((state) => ({
      plan: {
        ...state.plan,
        goals: [
          ...state.plan.goals.filter((g) => g.itemId !== goal.itemId),
          goal,
        ],
      },
    })),

  removeGoal: (itemId) =>
    set((state) => ({
      plan: {
        ...state.plan,
        goals: state.plan.goals.filter((g) => g.itemId !== itemId),
      },
    })),

  updateGoal: (goal) =>
    set((state) => ({
      plan: {
        ...state.plan,
        goals: state.plan.goals.map((g) =>
          g.itemId === goal.itemId ? goal : g,
        ),
      },
    })),

  unlockSite: (siteId) =>
    set((state) => ({
      plan: {
        ...state.plan,
        unlockedSites: state.plan.unlockedSites.includes(siteId)
          ? state.plan.unlockedSites
          : [...state.plan.unlockedSites, siteId],
      },
    })),

  lockSite: (siteId) =>
    set((state) => ({
      plan: {
        ...state.plan,
        unlockedSites: state.plan.unlockedSites.filter((s) => s !== siteId),
      },
    })),

  setRawInputOverride: (itemId, ratePerMin) =>
    set((state) => ({
      plan: {
        ...state.plan,
        rawInputOverrides: {
          ...state.plan.rawInputOverrides,
          [itemId]: ratePerMin,
        },
      },
    })),

  removeRawInputOverride: (itemId) =>
    set((state) => {
      const overrides = { ...state.plan.rawInputOverrides };
      delete overrides[itemId];
      return { plan: { ...state.plan, rawInputOverrides: overrides } };
    }),

  setRecipeOverride: (itemId, recipeId) =>
    set((state) => ({
      plan: {
        ...state.plan,
        recipeOverrides: {
          ...state.plan.recipeOverrides,
          [itemId]: recipeId,
        },
      },
    })),

  removeRecipeOverride: (itemId) =>
    set((state) => {
      const overrides = { ...state.plan.recipeOverrides };
      delete overrides[itemId];
      return { plan: { ...state.plan, recipeOverrides: overrides } };
    }),

  setRegionalTransferUnlocked: (unlocked) =>
    set((state) => ({
      plan: {
        ...state.plan,
        regionalTransfer: {
          ...state.plan.regionalTransfer,
          unlocked: unlocked,
        },
      },
    })),

  setTTVCap: (cap) =>
    set((state) => ({
      plan: {
        ...state.plan,
        regionalTransfer: {
          ...state.plan.regionalTransfer,
          ttvCapPerHour: cap,
        },
      },
    })),

  addMetastorageTransfer: (transfer) =>
    set((state) => ({
      plan: {
        ...state.plan,
        regionalTransfer: {
          ...state.plan.regionalTransfer,
          activeTransfers: [
            ...state.plan.regionalTransfer.activeTransfers.filter(
              (t) => t.itemId !== transfer.itemId,
            ),
            transfer,
          ],
        },
      },
    })),

  removeMetastorageTransfer: (itemId) =>
    set((state) => ({
      plan: {
        ...state.plan,
        regionalTransfer: {
          ...state.plan.regionalTransfer,
          activeTransfers: state.plan.regionalTransfer.activeTransfers.filter(
            (t) => t.itemId !== itemId,
          ),
        },
      },
    })),
}));
