import { useMemo } from "react";
import type { ProductionLayoutResult } from "@/layout/types";
import { SITE_MAP, FACILITY_MAP, ITEM_MAP, RECIPES_BY_OUTPUT } from "@/data/loader";
import { siteBoardSize, siteGridOrigin, PIXELS_PER_CELL, INTER_SITE_GAP } from "@/layout/gridToCanvas";
import type { ItemId } from "@/types";
import { type FacilityCategory } from "@/types/constants";

// ─── Domain types ────────────────────────────────────────────────────────────

export interface PlannerBoard {
  id: string;
  siteId: string;
  siteName: string;
  /** Canvas-origin top-left of entire board */
  boardX: number;
  boardY: number;
  /** Full board pixel size */
  boardW: number;
  boardH: number;
  /** Grid area pixel size */
  gridPixelW: number;
  gridPixelH: number;
  /** Grid dimensions in cells */
  gridX: number;
  gridY: number;
  /** Canvas-origin top-left of playable grid area */
  gridOriginX: number;
  gridOriginY: number;
  /** 0–1 */
  occupancy: number;
}

export interface PlannerMachine {
  id: string;
  nodeId: string;
  siteId: string;
  /** Canvas pixel position */
  x: number;
  y: number;
  w: number;
  h: number;
  facilityId: string | null;
  instanceIndex: number;
  facilityCount: number;
  role: string;
  isTarget: boolean;
  facilityName: string;
  outputItemName: string;
  category: FacilityCategory;
  emblemType: string;
}

export interface PlannerLogistics {
  id: string;
  siteId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  logisticsType: string;
  label: string;
}

export interface PlannerBelt {
  edgeId: string;
  pixelPath: { x: number; y: number }[];
}

export interface PlannerSceneModel {
  hasLayout: boolean;
  isFeasible: boolean;
  boards: PlannerBoard[];
  machines: PlannerMachine[];
  logistics: PlannerLogistics[];
  belts: PlannerBelt[];
  worldBounds: { minX: number; minY: number; maxX: number; maxY: number };
  failures: Array<{ message: string; suggestion?: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeSiteOrigins(siteIds: string[]): Map<string, { x: number; y: number }> {
  const sizes: [number, number][] = siteIds.map((sid) => {
    const site = SITE_MAP.get(sid as import("@/types").SiteId);
    return (site?.gridSize ?? [50, 50]) as [number, number];
  });

  const origins: { x: number; y: number }[] = [];
  let currentX = 0;
  for (const [gw, gh] of sizes) {
    const { boardW: _bw } = siteBoardSize(gw, gh);
    origins.push({ x: currentX, y: 0 });
    currentX += _bw + INTER_SITE_GAP;
  }

  const map = new Map<string, { x: number; y: number }>();
  siteIds.forEach((sid, i) => map.set(sid, origins[i]));
  return map;
}

function getOutputItemName(itemId: ItemId): string {
  const item = ITEM_MAP.get(itemId);
  if (item) return item.displayName;
  const recipes = RECIPES_BY_OUTPUT.get(itemId) ?? [];
  if (recipes.length > 0 && recipes[0].outputs.length === 1) {
    return recipes[0].outputs[0].itemId;
  }
  return itemId;
}

export function usePlannerSceneModel(layout: ProductionLayoutResult | null): PlannerSceneModel {
  return useMemo(() => {
    if (!layout) {
      return {
        hasLayout: false,
        isFeasible: false,
        boards: [],
        machines: [],
        logistics: [],
        belts: [],
        worldBounds: { minX: 0, minY: 0, maxX: 1, maxY: 1 },
        failures: [],
      };
    }

    const siteIds = layout.siteLayouts.map((sl) => sl.siteId);
    const siteOrigins = computeSiteOrigins(siteIds);

    const boards: PlannerBoard[] = [];
    const machines: PlannerMachine[] = [];
    const logistics: PlannerLogistics[] = [];

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const sl of layout.siteLayouts) {
      const site = SITE_MAP.get(sl.siteId);
      const siteGrid = site?.gridSize ?? [sl.usableRect.width, sl.usableRect.height];
      const [gridW, gridH] = siteGrid as [number, number];
      const { boardW, boardH, gridPixelW, gridPixelH } = siteBoardSize(gridW, gridH);
      const boardOrigin = siteOrigins.get(sl.siteId) ?? { x: 0, y: 0 };
      const gridOrigin = siteGridOrigin();

      const gridOriginX = boardOrigin.x + gridOrigin.x;
      const gridOriginY = boardOrigin.y + gridOrigin.y;

      boards.push({
        id: `board-${sl.siteId}`,
        siteId: sl.siteId,
        siteName: site?.name ?? sl.siteId,
        boardX: boardOrigin.x,
        boardY: boardOrigin.y,
        boardW,
        boardH,
        gridPixelW,
        gridPixelH,
        gridX: gridW,
        gridY: gridH,
        gridOriginX,
        gridOriginY,
        occupancy: sl.occupancy,
      });

      minX = Math.min(minX, boardOrigin.x);
      minY = Math.min(minY, boardOrigin.y);
      maxX = Math.max(maxX, boardOrigin.x + boardW);
      maxY = Math.max(maxY, boardOrigin.y + boardH);

      for (const fp of sl.facilityPlacements) {
        const graphNode = layout.graph.nodes.find((n) => n.id === fp.nodeId);
        const facilityId = graphNode?.facilityId ?? null;
        const facilityCount = graphNode?.facilityCount ?? 1;

        let facilityGridSize: [number, number] = [3, 3];
        let category: FacilityCategory = "production_1";
        if (facilityId) {
          const fac = FACILITY_MAP.get(facilityId);
          if (fac?.gridSize) facilityGridSize = fac.gridSize;
          if (fac?.category) category = fac.category as FacilityCategory;
        }

        const { w, h } = (() => {
          const [gw, gh] = facilityGridSize;
          if (fp.rotation === 90) return { w: gh * PIXELS_PER_CELL, h: gw * PIXELS_PER_CELL };
          return { w: gw * PIXELS_PER_CELL, h: gh * PIXELS_PER_CELL };
        })();

        const facilityName = facilityId ? (FACILITY_MAP.get(facilityId)?.displayName ?? facilityId) : "";
        const outputItemName = graphNode?.itemId ? getOutputItemName(graphNode.itemId as ItemId) : "";
        const role = graphNode?.role ?? "intermediate";
        const isTarget = role === "target";

        const footprintX = gridOriginX + fp.position.x * PIXELS_PER_CELL;
        const footprintY = gridOriginY + fp.position.y * PIXELS_PER_CELL;

        minX = Math.min(minX, footprintX);
        minY = Math.min(minY, footprintY);
        maxX = Math.max(maxX, footprintX + w);
        maxY = Math.max(maxY, footprintY + h);

        // One tile per PlacementFootprint — facilityCount is production math,
        // not separate visual footprints. Do NOT expand into side-by-side copies.
        machines.push({
          id: fp.nodeId,
          nodeId: fp.nodeId,
          siteId: sl.siteId,
          x: footprintX,
          y: footprintY,
          w,
          h,
          facilityId,
          instanceIndex: 0,
          facilityCount,
          role,
          isTarget,
          facilityName,
          outputItemName,
          category,
          emblemType: facilityId ? `facility-${facilityId}` : "generic",
        });
      }

      for (const lp of sl.logisticsPlacements) {
        const { w, h } = (() => {
          const [gw, gh] = lp.size;
          if (lp.rotation === 90) return { w: gh * PIXELS_PER_CELL, h: gw * PIXELS_PER_CELL };
          return { w: gw * PIXELS_PER_CELL, h: gh * PIXELS_PER_CELL };
        })();

        const wx = gridOriginX + lp.position.x * PIXELS_PER_CELL;
        const wy = gridOriginY + lp.position.y * PIXELS_PER_CELL;

        minX = Math.min(minX, wx);
        minY = Math.min(minY, wy);
        maxX = Math.max(maxX, wx + w);
        maxY = Math.max(maxY, wy + h);

        const labelMap: Record<string, string> = {
          depot_port: "PORT",
          depot_bus: "BUS",
          loader: "LOAD",
          unloader: "UNL",
        };

        logistics.push({
          id: lp.id,
          siteId: sl.siteId,
          x: wx,
          y: wy,
          w,
          h,
          logisticsType: lp.type,
          label: labelMap[lp.type] ?? lp.type,
        });
      }
    }

    const belts: PlannerBelt[] = layout.beltRoutes
      .filter((r) => r.pixelPath.length >= 2)
      .map((r) => ({
        edgeId: r.edgeId,
        pixelPath: r.pixelPath,
      }));

    if (!isFinite(minX)) {
      minX = 0; minY = 0; maxX = 1; maxY = 1;
    }

    return {
      hasLayout: true,
      isFeasible: layout.feasibility.feasible,
      boards,
      machines,
      logistics,
      belts,
      worldBounds: { minX, minY, maxX, maxY },
      failures: layout.feasibility.failures.map((f) => ({
        message: f.message,
        suggestion: f.suggestion,
      })),
    };
  }, [layout]);
}
