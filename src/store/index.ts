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
import { recomputePlan } from "./recomputePlan";

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

function recomputeSync(state: { plan: ProductionPlan; activePatch: Patch }): Pick<ProductionPlan, "nodes" | "detectedCycles" | "errors" | "layout"> {
  const { plan } = state;
  if (plan.goals.length === 0) {
    return { nodes: [], detectedCycles: [], errors: [], layout: null };
  }
  const result = doSolve(plan.goals, state);
  const siteNodes = convertToSiteProduction(
    result.nodes,
    plan.unlockedSites[0] ?? SiteId.VALLEY_CORE,
  );
  return {
    nodes: siteNodes,
    detectedCycles: result.detectedCycles,
    errors: result.errors,
    layout: null,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  plan: DEFAULT_PLAN,
  activePatch: LATEST_PATCH,
  activeRegion: "valley",

  setPatch: (patch) => {
    get().clearGoals();
    set((state) => ({
      activePatch: patch,
      plan: { ...state.plan, version: patch, layout: null },
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
          layout: null,
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

      const syncResult = recomputeSync({ plan: { ...state.plan, goals: newGoals }, activePatch: state.activePatch });

      void recomputePlan(newGoals, { plan: state.plan, activePatch: state.activePatch }).then((result) => {
        set((s) => ({ plan: { ...s.plan, layout: result.layout } }));
      }).catch((err) => {
        console.error("[store] addGoal layout recompute failed:", err);
      });

      return {
        plan: {
          ...state.plan,
          goals: newGoals,
          nodes: syncResult.nodes,
          detectedCycles: syncResult.detectedCycles,
          errors: syncResult.errors,
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
            layout: null,
          },
        };
      }

      const syncResult = recomputeSync({ plan: { ...state.plan, goals: remainingGoals }, activePatch: state.activePatch });

      void recomputePlan(remainingGoals, { plan: state.plan, activePatch: state.activePatch }).then((result) => {
        set((s) => ({ plan: { ...s.plan, layout: result.layout } }));
      }).catch((err) => {
        console.error("[store] removeGoal layout recompute failed:", err);
      });

      return {
        plan: {
          ...state.plan,
          goals: remainingGoals,
          nodes: syncResult.nodes,
          detectedCycles: syncResult.detectedCycles,
          errors: syncResult.errors,
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
        layout: null,
      },
    })),

  updateGoal: (goal) =>
    set((state) => {
      const newGoals = state.plan.goals.map((g) =>
        g.itemId === goal.itemId ? goal : g,
      );

      const syncResult = recomputeSync({ plan: { ...state.plan, goals: newGoals }, activePatch: state.activePatch });

      void recomputePlan(newGoals, { plan: state.plan, activePatch: state.activePatch }).then((result) => {
        set((s) => ({ plan: { ...s.plan, layout: result.layout } }));
      }).catch((err) => {
        console.error("[store] updateGoal layout recompute failed:", err);
      });

      return {
        plan: {
          ...state.plan,
          goals: newGoals,
          nodes: syncResult.nodes,
          detectedCycles: syncResult.detectedCycles,
          errors: syncResult.errors,
        },
      };
    }),

  unlockSite: (siteId) => {
    set((state) => ({
      plan: {
        ...state.plan,
        unlockedSites: state.plan.unlockedSites.includes(siteId)
          ? state.plan.unlockedSites
          : [...state.plan.unlockedSites, siteId],
      },
    }));
    get().calculate();
  },

  lockSite: (siteId) => {
    set((state) => {
      const site = SITE_MAP.get(siteId);
      if (site?.isCore) return state;
      return {
        plan: {
          ...state.plan,
          unlockedSites: state.plan.unlockedSites.filter((s) => s !== siteId),
        },
      };
    });
    get().calculate();
  },

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
    const syncResult = recomputeSync({ plan, activePatch: plan.version as Patch });

    void recomputePlan(plan.goals, { plan, activePatch: plan.version as Patch }).then((result) => {
      set((s) => ({ plan: { ...s.plan, layout: result.layout } }));
    }).catch((err) => {
      console.error("[store] importPlan layout recompute failed:", err);
    });

    set({
      plan: {
        ...plan,
        nodes: syncResult.nodes,
        detectedCycles: syncResult.detectedCycles,
        errors: syncResult.errors,
        layout: syncResult.layout,
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
    const syncResult = recomputeSync({ plan: state.plan, activePatch: state.activePatch });

    void recomputePlan(state.plan.goals, { plan: state.plan, activePatch: state.activePatch }).then((result) => {
      set((s) => ({ plan: { ...s.plan, layout: result.layout } }));
    }).catch((err) => {
      console.error("[store] calculate layout recompute failed:", err);
    });

    set((s) => ({
      plan: {
        ...s.plan,
        nodes: syncResult.nodes,
        detectedCycles: syncResult.detectedCycles,
        errors: syncResult.errors,
      },
    }));
  },
}));