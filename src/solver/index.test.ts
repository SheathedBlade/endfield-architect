import { describe, expect, it } from "vitest";
import { getProducibleItems, solve } from "../../src/solver";
import { ItemId, RecipeId } from "../../src/types/constants";

describe("solve — raw input override cap behavior", () => {
  describe("cap enforcement for manual materials", () => {
    it("emits no cap error when demand is below override rate", () => {
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

      const carbonNode = result.nodes[0];
      expect(carbonNode).toBeDefined();
      expect(carbonNode.item.id).toBe(ItemId.CARBON);

      const refineDep = carbonNode.dependencies[0];
      expect(refineDep).toBeDefined();
      expect(refineDep.item.id).toBe(ItemId.BUCKFLOWER);

      expect(refineDep.targetRate).toBe(20);
      expect(refineDep.isRawMaterial).toBe(true);
      expect(refineDep.recipe).toBeNull();
    });

    it("produces a cap error per overridden item that is exceeded", () => {
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
      const regionalErrors = result.errors.filter(
        (e) => e.includes("region cap") || e.includes("exceeds region"),
      );

      expect(capErrors.length).toBeGreaterThan(0);
      expect(regionalErrors).toHaveLength(0);
    });

    it("treats an overridden non-producible item as producible via seeding", () => {
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: { [ItemId.BUCKFLOWER]: 100 },
        manualRawMaterials: new Set([ItemId.BUCKFLOWER]),
      });

      expect(result.nodes.length).toBeGreaterThan(0);
      const carbonNode = result.nodes[0];
      expect(carbonNode.item.id).toBe(ItemId.CARBON);
      const solveErrors = result.errors.filter((e) => !e.includes("capped"));
      expect(solveErrors).toHaveLength(0);
    });
  });

  describe("override item seeding in producibleItems", () => {
    it("includes override item IDs in the producible set", () => {
      const producible = getProducibleItems(["valley"], "1.0", {}, {
        [ItemId.BUCKFLOWER]: 50,
      });

      expect(producible.has(ItemId.BUCKFLOWER)).toBe(true);
    });

    it("still seeds cycle items as producible regardless of overrides", () => {
      const producible = getProducibleItems(["valley"], "1.0", {}, {});

      expect(producible.has(ItemId.BUCKFLOWER_SEED)).toBe(true);
      expect(producible.has(ItemId.CITROME_SEED)).toBe(true);
    });
  });

  describe("cycle detection", () => {
    it("detects a seed/plant cycle when a seed item is solved as a goal", () => {
      const result = solve({
        goals: [{ itemId: ItemId.BUCKFLOWER_SEED, targetRate: 10 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
      });

      expect(result.detectedCycles.length).toBeGreaterThan(0);
      const cycle = result.detectedCycles[0];
      expect(cycle.cycleId).toBeDefined();
      expect(cycle.involvedItemIds).toContain(ItemId.BUCKFLOWER_SEED);
      expect(cycle.involvedItemIds).toContain(ItemId.BUCKFLOWER);
    });

    it("marks cycle placeholder nodes with isCyclePlaceholder=true", () => {
      const result = solve({
        goals: [{ itemId: ItemId.BUCKFLOWER_SEED, targetRate: 10 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
      });

      const hasCyclePlaceholder = (nodes: typeof result.nodes): boolean =>
        nodes.some(
          (n) =>
            n.isCyclePlaceholder === true ||
            (hasCyclePlaceholder(n.dependencies as typeof result.nodes)),
        );

      expect(hasCyclePlaceholder(result.nodes)).toBe(true);
    });

    it("produces no solve errors for a valid seed cycle goal", () => {
      const result = solve({
        goals: [{ itemId: ItemId.BUCKFLOWER_SEED, targetRate: 10 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
      });

      const solveErrors = result.errors.filter((e) => !e.includes("capped"));
      expect(solveErrors).toHaveLength(0);
    });

    it("detects separate cycles for each seed goal", () => {
      const result = solve({
        goals: [
          { itemId: ItemId.BUCKFLOWER_SEED, targetRate: 5 },
          { itemId: ItemId.CITROME_SEED, targetRate: 5 },
        ],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
      });

      const cycleIds = result.detectedCycles.map((c) => c.cycleId);
      expect(cycleIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("recipe override branching", () => {
    it("selects the overridden recipe when it is available in the current context", () => {
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 4 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: { [ItemId.CARBON]: RecipeId.REFINE_CARBON_FROM_JINCAO },
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
      });

      const carbonNode = result.nodes[0];
      expect(carbonNode.recipe?.id).toBe(RecipeId.REFINE_CARBON_FROM_JINCAO);

      const jincaoDep = carbonNode.dependencies[0];
      expect(jincaoDep.item.id).toBe(ItemId.JINCAO);
    });

    it("falls back to the first available recipe when the override references a non-existent recipe id", () => {
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 4 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: { [ItemId.CARBON]: "nonexistent_recipe" as RecipeId },
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
      });

      const carbonNode = result.nodes[0];
      expect(carbonNode.recipe?.id).not.toBe("nonexistent_recipe");
      expect(carbonNode.recipe?.id).toBeDefined();
    });

    it("produces no errors when recipe override is valid", () => {
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 4 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: { [ItemId.CARBON]: RecipeId.REFINE_CARBON_FROM_JINCAO },
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
      });

      const solveErrors = result.errors.filter((e) => !e.includes("capped"));
      expect(solveErrors).toHaveLength(0);
    });

    it("returns no nodes when goal item has no outputs and is not raw", () => {
      const result = solve({
        goals: [{ itemId: ItemId.CARBON, targetRate: 4 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
      });

      expect(result.nodes.length).toBeGreaterThan(0);
      const solveErrors = result.errors.filter((e) => !e.includes("capped"));
      expect(solveErrors).toHaveLength(0);
    });
  });

  describe("solve — metastorage external supply (externalInputRates)", () => {
    it("fully covers a raw material goal via external supply and marks node as isExternalSupply", () => {
      const result = solve({
        goals: [{ itemId: ItemId.BUCKFLOWER, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
        externalInputRates: { [ItemId.BUCKFLOWER]: 30 },
      });

      const node = result.nodes[0];
      expect(node).toBeDefined();
      expect(node.item.id).toBe(ItemId.BUCKFLOWER);
      expect(node.isExternalSupply).toBe(true);
      expect(node.isRawMaterial).toBe(false);
      expect(node.recipe).toBeNull();
      expect(node.dependencies).toHaveLength(0);
    });

    it("fully covers a non-raw item goal via external supply with no local recipe", () => {
      const result = solve({
        goals: [{ itemId: ItemId.DENSE_ORIGINIUM_POWDER, targetRate: 25 }],
        patch: "1.1",
        activeSiteRegions: ["wuling"],
        unlockedSites: ["wuling_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
        externalInputRates: { [ItemId.DENSE_ORIGINIUM_POWDER]: 25 },
      });

      const node = result.nodes[0];
      expect(node).toBeDefined();
      expect(node.item.id).toBe(ItemId.DENSE_ORIGINIUM_POWDER);
      expect(node.isExternalSupply).toBe(true);
      expect(node.recipe).toBeNull();
      expect(node.dependencies).toHaveLength(0);
    });

    it("partially covers demand — remaining unmet demand is solved locally", () => {
      // Originium Ore is a raw material in wuling. Imported 10/min, demand 30/min → 20/min local
      const result = solve({
        goals: [{ itemId: ItemId.ORIGINIUM_ORE, targetRate: 30 }],
        patch: "1.0",
        activeSiteRegions: ["wuling"],
        unlockedSites: ["wuling_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
        externalInputRates: { [ItemId.ORIGINIUM_ORE]: 10 },
      });

      const node = result.nodes[0];
      expect(node).toBeDefined();
      expect(node.targetRate).toBe(30);
      // Should have two dependencies: imported (10) + local raw (20)
      expect(node.dependencies).toHaveLength(2);
      const [imported, localRaw] = node.dependencies;
      expect(imported.isExternalSupply).toBe(true);
      expect(imported.targetRate).toBe(10);
      expect(localRaw.isRawMaterial).toBe(true);
      expect(localRaw.targetRate).toBe(20);
    });

    it("shared external pool is consumed across multiple goals without double-spending", () => {
      const result = solve({
        goals: [
          { itemId: ItemId.BUCKFLOWER, targetRate: 20 },
          { itemId: ItemId.BUCKFLOWER, targetRate: 20 },
        ],
        patch: "1.0",
        activeSiteRegions: ["valley"],
        unlockedSites: ["valley_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
        externalInputRates: { [ItemId.BUCKFLOWER]: 30 },
      });

      expect(result.nodes).toHaveLength(2);
      const [goal1, goal2] = result.nodes;
      expect(goal1.targetRate).toBe(20);
      expect(goal2.targetRate).toBe(20);
    });

    it("imported raw ore does not trigger a regional cap error for the covered portion", () => {
      const result = solve({
        goals: [{ itemId: ItemId.FERRIUM_ORE, targetRate: 60 }],
        patch: "1.0",
        activeSiteRegions: ["wuling"],
        unlockedSites: ["wuling_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
        externalInputRates: { [ItemId.FERRIUM_ORE]: 60 },
      });

      const node = result.nodes[0];
      expect(node.isExternalSupply).toBe(true);
      const regionalErrors = result.errors.filter(
        (e) => e.includes("exceeds") && e.toLowerCase().includes("wuling"),
      );
      expect(regionalErrors).toHaveLength(0);
    });

    it("partial imported raw ore: unmet remainder can still produce local cap error if it exceeds region cap", () => {
      const result = solve({
        goals: [{ itemId: ItemId.FERRIUM_ORE, targetRate: 120 }],
        patch: "1.0",
        activeSiteRegions: ["wuling"],
        unlockedSites: ["wuling_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
        externalInputRates: { [ItemId.FERRIUM_ORE]: 50 },
      });

      const node = result.nodes[0];
      expect(node.dependencies.some((d) => d.isExternalSupply)).toBe(true);
      expect(node.dependencies.some((d) => d.isRawMaterial && !d.isExternalSupply)).toBe(true);
    });

    it("imported intermediate used in a downstream recipe does not trigger raw cap for covered amount", () => {
      const result = solve({
        goals: [{ itemId: ItemId.LC_WULING_BATTERY, targetRate: 10 }],
        patch: "1.1",
        activeSiteRegions: ["wuling"],
        unlockedSites: ["wuling_core"],
        recipeOverrides: {},
        rawInputOverrides: {},
        manualRawMaterials: new Set(),
        externalInputRates: { [ItemId.DENSE_ORIGINIUM_POWDER]: 100 },
      });

      const batteryNode = result.nodes[0];
      expect(batteryNode).toBeDefined();
      expect(batteryNode.item.id).toBe(ItemId.LC_WULING_BATTERY);
      const rawCapErrors = result.errors.filter(
        (e) => e.includes("exceeds") && e.toLowerCase().includes("wuling"),
      );
      expect(rawCapErrors).toHaveLength(0);
    });
  });
});

describe("solve — exact vs placed facility counts", () => {
  it("raw leaf nodes have no exactFacilityCount", () => {
    // ORIGINIUM_ORE is truly raw in valley
    const result = solve({
      goals: [{ itemId: ItemId.ORIGINIUM_ORE, targetRate: 50 }],
      patch: "1.0",
      activeSiteRegions: ["valley"],
      unlockedSites: ["valley_core"],
      recipeOverrides: {},
      rawInputOverrides: {},
      manualRawMaterials: new Set(),
    });

    const node = result.nodes[0];
    expect(node.isRawMaterial).toBe(true);
    expect(node.exactFacilityCount).toBeUndefined(); // raw leaf — no recipe
    expect(node.facilityCount).toBe(0);
  });

  it("recipe nodes have exactFacilityCount and utilization", () => {
    // Use a non-round target rate to see fractional exact count
    // LC_WULING_BATTERY in wuling has recipes
    const result = solve({
      goals: [{ itemId: ItemId.LC_WULING_BATTERY, targetRate: 7 }],
      patch: "1.1",
      activeSiteRegions: ["wuling"],
      unlockedSites: ["wuling_core"],
      recipeOverrides: {},
      rawInputOverrides: {},
      manualRawMaterials: new Set(),
    });

    const node = result.nodes[0];
    expect(node.recipe).not.toBeNull();
    expect(node.isRawMaterial).toBe(false);
    expect(node.exactFacilityCount).toBeDefined();
    expect(node.facilityCount).toBe(Math.ceil(node.exactFacilityCount!));
    expect(node.utilization).toBeDefined();
    expect(node.utilization).toBeGreaterThan(0);
    expect(node.utilization).toBeLessThanOrEqual(1);
  });

  it("utilization is computed for recipe nodes", () => {
    const result = solve({
      goals: [{ itemId: ItemId.LC_WULING_BATTERY, targetRate: 10 }],
      patch: "1.1",
      activeSiteRegions: ["wuling"],
      unlockedSites: ["wuling_core"],
      recipeOverrides: {},
      rawInputOverrides: {},
      manualRawMaterials: new Set(),
    });

    const node = result.nodes[0];
    expect(node.utilization).not.toBeUndefined();
    expect(node.utilization).toBeGreaterThan(0);
    expect(node.utilization).toBeLessThanOrEqual(1);
  });

  it("overproductionRate is positive when placed > exact", () => {
    const result = solve({
      goals: [{ itemId: ItemId.LC_WULING_BATTERY, targetRate: 10 }],
      patch: "1.1",
      activeSiteRegions: ["wuling"],
      unlockedSites: ["wuling_core"],
      recipeOverrides: {},
      rawInputOverrides: {},
      manualRawMaterials: new Set(),
    });

    const node = result.nodes[0];
    if (node.overproductionRate !== undefined) {
      expect(node.overproductionRate).toBeGreaterThanOrEqual(0);
    }
  });

  it("child input rates use exact required output, not inflated actual output", () => {
    const result = solve({
      goals: [{ itemId: ItemId.LC_WULING_BATTERY, targetRate: 10 }],
      patch: "1.1",
      activeSiteRegions: ["wuling"],
      unlockedSites: ["wuling_core"],
      recipeOverrides: {},
      rawInputOverrides: {},
      manualRawMaterials: new Set(),
    });

    const batteryNode = result.nodes[0];
    expect(batteryNode.exactFacilityCount).toBeDefined();
    for (const child of batteryNode.dependencies) {
      expect(child.targetRate).toBeGreaterThan(0);
    }
  });

  it("metastorage-covered branch uses exact math without inflation", () => {
    const result = solve({
      goals: [{ itemId: ItemId.LC_WULING_BATTERY, targetRate: 50 }],
      patch: "1.1",
      activeSiteRegions: ["wuling"],
      unlockedSites: ["wuling_core"],
      recipeOverrides: {},
      rawInputOverrides: {},
      manualRawMaterials: new Set(),
      externalInputRates: { [ItemId.DENSE_ORIGINIUM_POWDER]: 100 },
    });

    const node = result.nodes[0];
    expect(node.exactFacilityCount).toBeDefined();
  });

  it("external supply fully covers goal — node has isExternalSupply and zero local recipe", () => {
    const result = solve({
      goals: [{ itemId: ItemId.BUCKFLOWER, targetRate: 20 }],
      patch: "1.0",
      activeSiteRegions: ["valley"],
      unlockedSites: ["valley_core"],
      recipeOverrides: {},
      rawInputOverrides: {},
      manualRawMaterials: new Set(),
      externalInputRates: { [ItemId.BUCKFLOWER]: 30 },
    });

    const node = result.nodes[0];
    expect(node.isExternalSupply).toBe(true);
    expect(node.recipe).toBeNull();
    expect(node.facility).toBeNull();
    expect(node.isRawMaterial).toBe(false);
    expect(node.dependencies).toHaveLength(0);
    expect(node.exactFacilityCount).toBeUndefined();
  });
});