import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../../src/store";
import { ItemId, RecipeId } from "../../src/types/constants";
import type { ProductionPlan } from "../../src/types";

const MOCK_PLAN: ProductionPlan = {
  version: "1.0",
  goals: [],
  regionalTransfer: {
    unlocked: false,
    ttvCapPerHour: 0,
    activeTransfers: [],
  },
  unlockedSites: ["valley_core"],
  rawInputOverrides: {},
  recipeOverrides: {},
  nodes: [],
  detectedCycles: [],
  errors: [],
};

describe("store actions", () => {
  beforeEach(() => {
    useAppStore.setState({
      plan: { ...MOCK_PLAN },
      activePatch: "1.0",
      activeRegion: "valley",
    });
  });

  describe("setRawInputOverride", () => {
    it("adds a raw input override", () => {
      useAppStore.getState().setRawInputOverride(ItemId.CARBON, 120);
      const { plan } = useAppStore.getState();
      expect(plan.rawInputOverrides[ItemId.CARBON]).toBe(120);
    });

    it("overwrites an existing override", () => {
      useAppStore.getState().setRawInputOverride(ItemId.CARBON, 100);
      useAppStore.getState().setRawInputOverride(ItemId.CARBON, 200);
      const { plan } = useAppStore.getState();
      expect(plan.rawInputOverrides[ItemId.CARBON]).toBe(200);
    });

    it("adds multiple different overrides", () => {
      useAppStore.getState().setRawInputOverride(ItemId.CARBON, 100);
      useAppStore.getState().setRawInputOverride(ItemId.ORIGINIUM_ORE, 50);
      const { plan } = useAppStore.getState();
      expect(plan.rawInputOverrides[ItemId.CARBON]).toBe(100);
      expect(plan.rawInputOverrides[ItemId.ORIGINIUM_ORE]).toBe(50);
    });
  });

  describe("removeRawInputOverride", () => {
    it("removes an existing override", () => {
      useAppStore.getState().setRawInputOverride(ItemId.CARBON, 100);
      useAppStore.getState().removeRawInputOverride(ItemId.CARBON);
      const { plan } = useAppStore.getState();
      expect(plan.rawInputOverrides[ItemId.CARBON]).toBeUndefined();
    });

    it("does nothing when removing a non-existent override", () => {
      // carbon has no override set, removing it should be a no-op
      expect(() => useAppStore.getState().removeRawInputOverride(ItemId.CARBON)).not.toThrow();
    });
  });

  describe("setRecipeOverride", () => {
    it("adds a recipe override", () => {
      useAppStore.getState().setRecipeOverride(ItemId.CARBON, RecipeId.REFINE_CARBON);
      const { plan } = useAppStore.getState();
      expect(plan.recipeOverrides[ItemId.CARBON]).toBe(RecipeId.REFINE_CARBON);
    });

    it("overwrites an existing recipe override", () => {
      useAppStore.getState().setRecipeOverride(ItemId.CARBON, RecipeId.REFINE_CARBON);
      useAppStore.getState().setRecipeOverride(ItemId.CARBON, RecipeId.REFINE_STABILIZED_CARBON);
      const { plan } = useAppStore.getState();
      expect(plan.recipeOverrides[ItemId.CARBON]).toBe(RecipeId.REFINE_STABILIZED_CARBON);
    });
  });

  describe("removeRecipeOverride", () => {
    it("removes an existing recipe override", () => {
      useAppStore.getState().setRecipeOverride(ItemId.CARBON, RecipeId.REFINE_CARBON);
      useAppStore.getState().removeRecipeOverride(ItemId.CARBON);
      const { plan } = useAppStore.getState();
      expect(plan.recipeOverrides[ItemId.CARBON]).toBeUndefined();
    });
  });

  describe("importPlan", () => {
    it("imports a full production plan", () => {
      const fullPlan: ProductionPlan = {
        version: "1.1",
        goals: [{ itemId: ItemId.CARBON, targetRate: 30 }],
        regionalTransfer: {
          unlocked: false,
          ttvCapPerHour: 0,
          activeTransfers: [],
        },
        unlockedSites: ["valley_core", "wuling_core"],
        rawInputOverrides: { [ItemId.ORIGINIUM_ORE]: 200 },
        recipeOverrides: { [ItemId.CARBON]: RecipeId.REFINE_CARBON },
        nodes: [],
        detectedCycles: [],
        errors: [],
      };

      useAppStore.getState().importPlan(fullPlan);

      const { plan, activePatch } = useAppStore.getState();
      expect(activePatch).toBe("1.1");
      expect(plan.goals).toHaveLength(1);
      expect(plan.goals[0].itemId).toBe(ItemId.CARBON);
      expect(plan.unlockedSites).toContain("wuling_core");
      expect(plan.rawInputOverrides[ItemId.ORIGINIUM_ORE]).toBe(200);
      expect(plan.recipeOverrides[ItemId.CARBON]).toBe(RecipeId.REFINE_CARBON);
    });

    it("sets activePatch from the imported plan version", () => {
      const plan: ProductionPlan = {
        ...MOCK_PLAN,
        version: "1.1",
      };
      useAppStore.getState().importPlan(plan);
      expect(useAppStore.getState().activePatch).toBe("1.1");
    });
  });

  describe("setRawInputOverride — integration with solver", () => {
    it("recalculates plan when override is set on an existing goal", () => {
      // Set up a carbon goal first
      useAppStore.getState().addGoal({
        itemId: ItemId.CARBON,
        targetRate: 30,
      });

      // At this point buckflower demand is 30/min (carbon 30/min × 1 buckflower)
      // Override buckflower at 20/min → should produce a cap warning
      useAppStore.getState().setRawInputOverride(ItemId.BUCKFLOWER, 20);

      const { plan } = useAppStore.getState();
      expect(plan.rawInputOverrides[ItemId.BUCKFLOWER]).toBe(20);

      const capErrors = plan.errors.filter((e) => e.includes("capped"));
      expect(capErrors.length).toBeGreaterThan(0);
      expect(capErrors[0]).toContain("Buckflower");
    });

    it("removes cap error when override is removed", () => {
      // Set up a carbon goal
      useAppStore.getState().addGoal({
        itemId: ItemId.CARBON,
        targetRate: 30,
      });

      // Override buckflower at 20/min → cap warning
      useAppStore.getState().setRawInputOverride(ItemId.BUCKFLOWER, 20);
      expect(
        useAppStore.getState().plan.errors.filter((e) => e.includes("capped")).length,
      ).toBeGreaterThan(0);

      // Remove the override
      useAppStore.getState().removeRawInputOverride(ItemId.BUCKFLOWER);

      const { plan } = useAppStore.getState();
      expect(plan.rawInputOverrides[ItemId.BUCKFLOWER]).toBeUndefined();

      // No cap errors without the override
      const capErrors = plan.errors.filter((e) => e.includes("capped"));
      expect(capErrors).toHaveLength(0);
    });

    it("addGoal respects existing raw input overrides in the solve", () => {
      // Set an override first (high cap — no warning expected)
      useAppStore.getState().setRawInputOverride(ItemId.BUCKFLOWER, 100);

      // Add carbon goal — demand is 30, cap is 100 → no warning
      useAppStore.getState().addGoal({ itemId: ItemId.CARBON, targetRate: 30 });

      const { plan } = useAppStore.getState();
      const capErrors = plan.errors.filter((e) => e.includes("capped"));
      expect(capErrors).toHaveLength(0);
    });
  });
});
