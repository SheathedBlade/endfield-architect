import { describe, expect, it } from "vitest";
import {
  exportPlan,
  importPlan,
} from "../../src/utils/persistence";
import type { ProductionPlan } from "../../src/types";

const MINIMAL_PLAN: ProductionPlan = {
  version: "1.0",
  goals: [{ itemId: "originium_ore", targetRate: 100 }],
  regionalTransfer: {
    unlocked: false,
    ttvCapPerHour: 0,
    activeTransfers: [],
  },
  unlockedSites: ["valley_core"],
  rawInputOverrides: { originium_ore: 50 },
  recipeOverrides: {},
  nodes: [],
  detectedCycles: [],
  errors: [],
};

describe("persistence", () => {
  describe("exportPlan", () => {
    it("returns a non-empty string for a valid plan", () => {
      const hash = exportPlan(MINIMAL_PLAN);
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
    });

    it("sets nodes and detectedCycles to empty arrays in exported data", () => {
      const planWithData: ProductionPlan = {
        ...MINIMAL_PLAN,
        nodes: [{ itemId: "test" }] as never,
        detectedCycles: [{ cycleId: "c1" }] as never,
      };
      const hash = exportPlan(planWithData);
      const decoded = importPlan(hash);
      expect(decoded?.nodes).toEqual([]);
      expect(decoded?.detectedCycles).toEqual([]);
    });

    it("produces consistent output for the same plan", () => {
      const hash1 = exportPlan(MINIMAL_PLAN);
      const hash2 = exportPlan(MINIMAL_PLAN);
      expect(hash1).toBe(hash2);
    });
  });

  describe("importPlan", () => {
    it("returns a valid plan from a hash produced by exportPlan", () => {
      const hash = exportPlan(MINIMAL_PLAN);
      const decoded = importPlan(hash);
      expect(decoded).not.toBeNull();
      expect(decoded?.version).toBe("1.0");
      expect(decoded?.goals).toHaveLength(1);
      expect(decoded?.goals[0].itemId).toBe("originium_ore");
    });

    it("returns null for data with no goals array", () => {
      // "{}" compressed — decodes fine but has no goals
      const result = importPlan("Aw");
      expect(result).toBeNull();
    });

    it("returns null for completely invalid input", () => {
      expect(importPlan("!!not-a-real-lz-string!!")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(importPlan("")).toBeNull();
    });

    it("preserves rawInputOverrides in imported plan", () => {
      const hash = exportPlan(MINIMAL_PLAN);
      const decoded = importPlan(hash);
      expect(decoded?.rawInputOverrides).toEqual({ originium_ore: 50 });
    });

    it("preserves recipeOverrides in imported plan", () => {
      const plan: ProductionPlan = {
        ...MINIMAL_PLAN,
        recipeOverrides: { originium_ore: "refining_unit_basic" } as never,
      };
      const hash = exportPlan(plan);
      const decoded = importPlan(hash);
      expect(decoded?.recipeOverrides).toEqual({
        originium_ore: "refining_unit_basic",
      });
    });

    it("returns null if decoded JSON has no goals", () => {
      // Manually construct a minimal valid LZ string that decodes to {} (no goals)
      // LZString.compressToEncodedURIComponent("{}") — just test the null guard
      const result = importPlan("Aw"); // "{}" compressed
      expect(result).toBeNull();
    });
  });
});
