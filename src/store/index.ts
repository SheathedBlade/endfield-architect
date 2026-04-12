import { SITE_MAP } from "@/data/loader";
import {
  LATEST_PATCH,
  SiteId,
  type Goal,
  type ItemId,
  type MetaStorageTransfer,
  type Patch,
  type ProductionPlan,
  type RecipeId,
  type RegionId,
  type SiteId as SiteIdType,
} from "@/types";
import { convertToSiteProduction } from "@/utils/siteAssignment";
import { create } from "zustand";
import { DEFAULT_PLAN } from "./defaultPlan";
import { doSolve } from "./recomputePlan";

type AppState = {
  plan: ProductionPlan;
  activePatch: Patch;
  activeRegion: RegionId;

  setPatch: (patch: Patch) => void;
  setActiveRegion: (regionId: RegionId) => void;

  addGoal: (goal: Goal) => void;
  removeGoal: (itemId: ItemId) => void;
  clearGoals: () => void;
  updateGoal: (goal: Goal) => void;

  unlockSite: (siteId: SiteIdType) => void;
  lockSite: (siteId: SiteIdType) => void;

  setRawInputOverride: (itemId: ItemId, ratePerMin: number) => void;
  removeRawInputOverride: (itemId: ItemId) => void;

  setRecipeOverride: (itemId: ItemId, recipeId: RecipeId) => void;
  removeRecipeOverride: (itemId: ItemId) => void;

  importPlan: (plan: ProductionPlan) => void;

  setRegionalTransferUnlocked: (unlocked: boolean) => void;
  setTTVCap: (cap: number) => void;
  clearMetastorageTransfers: () => void;
  addMetastorageTransfer: (transfer: MetaStorageTransfer) => void;
  removeMetastorageTransfer: (itemId: ItemId) => void;

  calculate: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  plan: DEFAULT_PLAN,
  activePatch: LATEST_PATCH,
  activeRegion: "valley",

  setPatch: (patch) => {
    get().clearGoals();
    set((state) => ({
      activePatch: patch,
      plan: { ...state.plan, version: patch },
    }));
  },

  setActiveRegion: (regionId) =>
    set((state) => {
      const sites = SITE_MAP;
      const newUnlocked: SiteIdType[] = [];
      for (const [sid, site] of sites) {
        if (site.regionId === regionId) {
          if (state.plan.unlockedSites.includes(sid as SiteIdType)) {
            newUnlocked.push(sid as SiteIdType);
          }
        }
      }
      const coreSites = Array.from(sites.values())
        .filter((s) => s.regionId === regionId && s.isCore)
        .map((s) => s.id as SiteIdType);
      for (const core of coreSites) {
        if (!newUnlocked.includes(core)) newUnlocked.push(core);
      }
      return {
        activeRegion: regionId,
        plan: {
          ...state.plan,
          unlockedSites: newUnlocked,
          goals: [],
          nodes: [],
          errors: [],
          regionalTransfer: {
            ...state.plan.regionalTransfer,
            activeTransfers: [],
          },
        },
      };
    }),

  addGoal: (goal) =>
    set((state) => {
      const newGoals = [
        ...state.plan.goals.filter((g) => g.itemId !== goal.itemId),
        goal,
      ];

      const result = doSolve(newGoals, state);

      const siteNodes = convertToSiteProduction(
        result.nodes,
        state.plan.unlockedSites[0] ?? SiteId.VALLEY_CORE,
      );

      return {
        plan: {
          ...state.plan,
          goals: newGoals,
          nodes: siteNodes,
          detectedCycles: result.detectedCycles,
          errors: result.errors,
        },
      };
    }),

  removeGoal: (itemId) =>
    set((state) => {
      const remainingGoals = state.plan.goals.filter((g) => g.itemId !== itemId);
      if (remainingGoals.length === 0) {
        return {
          plan: {
            ...state.plan,
            goals: [],
            nodes: [],
            errors: [],
          },
        };
      }

      const result = doSolve(remainingGoals, state);

      const siteNodes = convertToSiteProduction(
        result.nodes,
        state.plan.unlockedSites[0] ?? SiteId.VALLEY_CORE,
      );

      return {
        plan: {
          ...state.plan,
          goals: remainingGoals,
          nodes: siteNodes,
          detectedCycles: result.detectedCycles,
          errors: result.errors,
        },
      };
    }),

  clearGoals: () =>
    set((state) => ({
      plan: {
        ...state.plan,
        goals: [],
        nodes: [],
        errors: [],
      },
    })),

  updateGoal: (goal) =>
    set((state) => {
      const newGoals = state.plan.goals.map((g) =>
        g.itemId === goal.itemId ? goal : g,
      );

      const result = doSolve(newGoals, state);

      const siteNodes = convertToSiteProduction(
        result.nodes,
        state.plan.unlockedSites[0] ?? SiteId.VALLEY_CORE,
      );

      return {
        plan: {
          ...state.plan,
          goals: newGoals,
          nodes: siteNodes,
          detectedCycles: result.detectedCycles,
          errors: result.errors,
        },
      };
    }),

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
    set((state) => {
      const site = SITE_MAP.get(siteId);
      if (site?.isCore) return state;
      return {
        plan: {
          ...state.plan,
          unlockedSites: state.plan.unlockedSites.filter((s) => s !== siteId),
        },
      };
    }),

  setRawInputOverride: (itemId, ratePerMin) => {
    set((state) => ({
      plan: {
        ...state.plan,
        rawInputOverrides: {
          ...state.plan.rawInputOverrides,
          [itemId]: ratePerMin,
        },
      },
    }));
    get().calculate();
  },

  removeRawInputOverride: (itemId) => {
    set((state) => {
      const overrides = { ...state.plan.rawInputOverrides };
      delete overrides[itemId];
      return { plan: { ...state.plan, rawInputOverrides: overrides } };
    });
    get().calculate();
  },

  setRecipeOverride: (itemId, recipeId) => {
    set((state) => ({
      plan: {
        ...state.plan,
        recipeOverrides: {
          ...state.plan.recipeOverrides,
          [itemId]: recipeId,
        },
      },
    }));
    get().calculate();
  },

  removeRecipeOverride: (itemId) => {
    set((state) => {
      const overrides = { ...state.plan.recipeOverrides };
      delete overrides[itemId];
      return { plan: { ...state.plan, recipeOverrides: overrides } };
    });
    get().calculate();
  },

  importPlan: (plan) => {
    const state = { plan, activePatch: plan.version as Patch };
    const result = doSolve(plan.goals, state);

    const siteNodes = convertToSiteProduction(
      result.nodes,
      plan.unlockedSites[0] ?? SiteId.VALLEY_CORE,
    );

    set({
      plan: {
        ...plan,
        nodes: siteNodes,
        detectedCycles: result.detectedCycles,
        errors: result.errors,
      },
      activePatch: plan.version as Patch,
    });
  },

  setRegionalTransferUnlocked: (unlocked) =>
    set((state) => ({
      plan: {
        ...state.plan,
        regionalTransfer: {
          ...state.plan.regionalTransfer,
          unlocked,
        },
      },
    })),

  clearMetastorageTransfers: () =>
    set((state) => ({
      plan: {
        ...state.plan,
        regionalTransfer: {
          ...state.plan.regionalTransfer,
          activeTransfers: [],
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

  calculate: () => {
    const state = get();
    const { plan, activePatch } = state;
    if (plan.goals.length === 0) return;

    const result = doSolve(plan.goals, { plan, activePatch });

    const siteNodes = convertToSiteProduction(
      result.nodes,
      plan.unlockedSites[0] ?? SiteId.VALLEY_CORE,
    );

    set((state) => ({
      plan: {
        ...state.plan,
        nodes: siteNodes,
        detectedCycles: result.detectedCycles,
        errors: result.errors,
      },
    }));
  },
}));