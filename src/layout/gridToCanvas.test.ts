import { describe, it, expect } from "vitest";
import { PIXELS_PER_CELL, gridToPixels, footprintToPixels, siteBoardSize, siteGridOrigin, computeSiteBoardOrigins, gridPositionToCanvas } from "./gridToCanvas";

describe("gridToCanvas", () => {
  describe("PIXELS_PER_CELL", () => {
    it("is 12", () => {
      expect(PIXELS_PER_CELL).toBe(12);
    });
  });

  describe("gridToPixels", () => {
    it("converts 3x3 to 36x36", () => {
      const result = gridToPixels([3, 3]);
      expect(result.w).toBe(36);
      expect(result.h).toBe(36);
    });

    it("handles non-square 4x2 (swap for visual consistency)", () => {
      const result = gridToPixels([4, 2]);
      expect(result.w).toBe(24); // min dimension
      expect(result.h).toBe(48); // max dimension
    });
  });

  describe("footprintToPixels", () => {
    it("converts 3x3 rotation 0", () => {
      const result = footprintToPixels([3, 3], 0);
      expect(result.w).toBe(36);
      expect(result.h).toBe(36);
    });

    it("rotates 3x2 footprint 90 degrees", () => {
      const result = footprintToPixels([3, 2], 90);
      expect(result.w).toBe(24); // 2 * 12
      expect(result.h).toBe(36); // 3 * 12
    });
  });

  describe("siteBoardSize", () => {
    it("computes board size for 70x70 site", () => {
      const result = siteBoardSize(70, 70);
      expect(result.boardW).toBe(70 * 12 + 16 * 2);
      expect(result.boardH).toBe(70 * 12 + 16 * 2 + 28);
      expect(result.gridPixelW).toBe(70 * 12);
      expect(result.gridPixelH).toBe(70 * 12);
    });

    it("handles 50x50 site", () => {
      const result = siteBoardSize(50, 50);
      expect(result.boardW).toBe(50 * 12 + 32);
      expect(result.boardH).toBe(50 * 12 + 32 + 28);
    });
  });

  describe("siteGridOrigin", () => {
    it("returns fixed offset from padding and header", () => {
      const result = siteGridOrigin();
      expect(result.x).toBe(16);
      expect(result.y).toBe(16 + 28);
    });
  });

  describe("computeSiteBoardOrigins", () => {
    it("returns sequential origins with gap", () => {
      const sizes: [number, number][] = [[70, 70], [70, 70]];
      const origins = computeSiteBoardOrigins(sizes);
      expect(origins).toHaveLength(2);
      expect(origins[0].x).toBe(0);
      expect(origins[0].y).toBe(0);
      // Second board starts after board 1 + gap
      expect(origins[1].x).toBe(70 * 12 + 32 + 24);
      expect(origins[1].y).toBe(0);
    });

    it("returns single origin for one site", () => {
      const origins = computeSiteBoardOrigins([[70, 70]]);
      expect(origins).toHaveLength(1);
      expect(origins[0].x).toBe(0);
    });
  });

  describe("gridPositionToCanvas", () => {
    it("converts grid position to canvas coordinates", () => {
      const boardOrigin = { x: 100, y: 200 };
      const result = gridPositionToCanvas(5, 10, boardOrigin);
      expect(result.x).toBe(100 + 5 * 12);
      expect(result.y).toBe(200 + 10 * 12);
    });
  });
});
