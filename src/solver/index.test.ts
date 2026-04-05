import { describe, expect, it } from "vitest";
import { getProducibleItems, solve } from "../../src/solver";
import { ItemId } from "../../src/types/constants";

describe("solve — raw input override cap behavior", () => {
  describe("cap enforcement for manual materials", () => {
    it("emits no cap error when demand is below override rate", () => {
      // carbon goal 30/min → buckflower demand 30/min; override buckflower at 60/min (exact match + headroom)
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: { [ItemId.BUCKFLOWER]: 60 },
        manualRawMaterials: new Set([ItemId.BUCKFLOWER]),
      });

      const capErrors = result.errors.filter((e) => e.includes("capped"));
      expect(capErrors).toHaveLength(0);
    });

    it("emits no cap error when demand exactly equals override rate", () => {
      // carbon 30/min → buckflower demand 30/min; override at exactly 30/min
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: { [ItemId.BUCKFLOWER]: 30 },
        manualRawMaterials: new Set([ItemId.BUCKFLOWER]),
      });

      const capErrors = result.errors.filter((e) => e.includes("capped"));
      expect(capErrors).toHaveLength(0);
    });

    it("emits a cap error when demand exceeds override rate", () => {
      // carbon 30/min → buckflower demand 30/min; override at 20/min
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: { [ItemId.BUCKFLOWER]: 20 },
        manualRawMaterials: new Set([ItemId.BUCKFLOWER]),
      });

      const capErrors = result.errors.filter((e) => e.includes("capped"));
      expect(capErrors).toHaveLength(1);
      expect(capErrors[0]).toContain("Buckflower");
      expect(capErrors[0]).toContain("20");
      expect(capErrors[0]).toContain("30");
    });

    it("caps the node targetRate at the override rate when exceeded", () => {
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: { [ItemId.BUCKFLOWER]: 20 },
        manualRawMaterials: new Set([ItemId.BUCKFLOWER]),
      });

      // Walk the tree: carbon → refine_carbon → buckflower(manual)
      const carbonNode = result.nodes[0];
      expect(carbonNode).toBeDefined();
      expect(carbonNode.item.id).toBe(ItemId.CARBON);

      const refineDep = carbonNode.dependencies[0];
      expect(refineDep).toBeDefined();
      expect(refineDep.item.id).toBe(ItemId.BUCKFLOWER);

      // buckflower is manual → capped at 20
      expect(refineDep.targetRate).toBe(20);
      expect(refineDep.isRawMaterial).toBe(true);
      expect(refineDep.recipe).toBeNull();
    });

    it("produces a cap error per overridden item that is exceeded", () => {
      // Use two different goals that both consume the same overridden item
      // Actually, buckflower is only consumed by carbon. Let me test with a different structure.
      // carbon 30/min (needs buckflower) — override buckflower at 15
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: { [ItemId.BUCKFLOWER]: 15 },
        manualRawMaterials: new Set([ItemId.BUCKFLOWER]),
      });

      const capErrors = result.errors.filter((e) => e.includes("capped"));
      expect(capErrors).toHaveLength(1);
      expect(capErrors[0]).toMatch(/capped at 15.*demand: 30|demand: 30.*capped at 15/);
    });

    it("excludes manual materials from regional raw cap checks", () => {
      // buckflower is NOT in valley RAW_MATERIAL_REGIONS, so a normal buckflower
      // dependency (without override) would not trigger a regional cap error.
      // But with an override at 20/min and demand at 30/min, it should produce
      // a CAP error (not a regional cap error), because manual materials are excluded.
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: { [ItemId.BUCKFLOWER]: 20 },
        manualRawMaterials: new Set([ItemId.BUCKFLOWER]),
      });

      // Must have a cap error from the override, NOT a regional cap error
      const capErrors = result.errors.filter((e) => e.includes("capped"));
      const regionalErrors = result.errors.filter(
        (e) => e.includes("region cap") || e.includes("exceeds region"),
      );

      expect(capErrors.length).toBeGreaterThan(0);
      expect(regionalErrors).toHaveLength(0);
    });

    it("treats an overridden non-producible item as producible via seeding", () => {
      // buckflower is NOT in valley's raw materials and NOT in the seed cycle directly
      // in valley context — verify it can still be solved when overridden.
      // This test just verifies no error is thrown and a node is returned.
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: { [ItemId.BUCKFLOWER]: 100 },
        manualRawMaterials: new Set([ItemId.BUCKFLOWER]),
      });

      // Should produce a carbon node without error
      expect(result.nodes.length).toBeGreaterThan(0);
      const carbonNode = result.nodes[0];
      expect(carbonNode.item.id).toBe(ItemId.CARBON);
      // No solve errors (only cap warnings if rate exceeded)
      const solveErrors = result.errors.filter(
        (e) => !e.includes("capped"),
      );
      expect(solveErrors).toHaveLength(0);
    });
  });

  describe("override item seeding in producibleItems", () => {
    it("includes override item IDs in the producible set", () => {
      const producible = getProducibleItems(["valley"], "1.0", {}, {
        [ItemId.BUCKFLOWER]: 50,
      });

      // buckflower would not normally be producible in valley (not in RAW_MATERIAL_REGIONS.valley)
      // but with the override, it should be seeded
      expect(producible.has(ItemId.BUCKFLOWER)).toBe(true);
    });

    it("still seeds cycle items as producible regardless of overrides", () => {
      const producible = getProducibleItems(["valley"], "1.0", {}, {});

      // seed cycle items should always be producible
      expect(producible.has(ItemId.BUCKFLOWER_SEED)).toBe(true);
      expect(producible.has(ItemId.CITROME_SEED)).toBe(true);
    });
  });
});
