import type { SiteLayout, LogisticsPlacement, PlacementFailure, LogisticsNodeId } from "./types";
import { DEPOT_BUS_PORT_SIZE, DEPOT_BUS_SECTION_SIZE, LOADER_SIZE, WULING_CORE_GRID_SIZE } from "./logisticsConstants";

interface BusPlacement {
  x: number;
  y: number;
  side: "top" | "right" | "bottom" | "left";
  attachedLoaders: LoaderPlacement[];
}

interface LoaderPlacement {
  x: number;
  y: number;
  side: "top" | "right" | "bottom" | "left";
  type: "loader" | "unloader";
}

export interface WulingLogisticsResult {
  logisticsPlacements: LogisticsPlacement[];
  failures: PlacementFailure[];
  portsPlaced: number;
  busesPlaced: number;
  loadersPlaced: number;
}

/**
 * Place internal logistics for Wuling Core.
 * Buses are placed inside the grid.
 * Ports must be placed first; each port has 4 sides for bus attachment.
 * Loaders/unloaders (3x1) attach to bus sides.
 *
 * This is a simple heuristic:
 * - Place one port in the top-left area
 * - Extend buses outward on all 4 sides
 * - Place loaders/unloaders along bus sides
 */
export function placeWulingInternalLogistics(
  siteLayout: SiteLayout,
  requiredInputPorts: number,
  requiredOutputPorts: number,
): WulingLogisticsResult {
  const failures: PlacementFailure[] = [];
  const placements: LogisticsPlacement[] = [];

  const [siteWidth, siteHeight] = WULING_CORE_GRID_SIZE;
  const [portW, portH] = DEPOT_BUS_PORT_SIZE;
  const [busW, busH] = DEPOT_BUS_SECTION_SIZE;
  const [loaderW, loaderH] = LOADER_SIZE;

  // Simple placement: put one port centered, extend buses in 4 directions
  // This is a placeholder strategy — a full implementation would
  // optimize port/bus placement based on actual facility positions

  // Place depot bus port
  const portX = Math.floor(siteWidth / 2) - Math.floor(portW / 2);
  const portY = Math.floor(siteHeight / 2) - Math.floor(portH / 2);

  const portId = `wuling_port_0` as LogisticsNodeId;
  placements.push({
    id: portId,
    type: "depot_port",
    siteId: siteLayout.siteId,
    position: { x: portX, y: portY },
    size: DEPOT_BUS_PORT_SIZE,
    rotation: 0,
    busConnectionSides: ["top", "right", "bottom", "left"],
    parentId: null,
  });

  // Helper to check overlap
  function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }

  const occupied: { x: number; y: number; w: number; h: number }[] = [
    { x: portX, y: portY, w: portW, h: portH },
  ];

  function tryPlaceBus(side: "top" | "right" | "bottom" | "left"): BusPlacement | null {
    let bx = 0, by = 0, bw = busW, bh = busH;

    if (side === "top") {
      bx = portX + Math.floor(portW / 2) - Math.floor(busW / 2);
      by = portY - busH;
    } else if (side === "right") {
      bx = portX + portW;
      by = portY + Math.floor(portH / 2) - Math.floor(busH / 2);
    } else if (side === "bottom") {
      bx = portX + Math.floor(portW / 2) - Math.floor(busW / 2);
      by = portY + portH;
    } else {
      bx = portX - busW;
      by = portY + Math.floor(portH / 2) - Math.floor(busH / 2);
    }

    const rect = { x: bx, y: by, w: bw, h: bh };

    // Check within bounds
    if (bx < 0 || by < 0 || bx + bw > siteWidth || by + bh > siteHeight) {
      return null;
    }

    // Check overlap
    for (const occ of occupied) {
      if (overlaps(rect, occ)) return null;
    }

    occupied.push(rect);
    return { x: bx, y: by, side, attachedLoaders: [] };
  }

  // Place buses on port sides (one per side if there's demand)
  const sides: ("top" | "right" | "bottom" | "left")[] = ["top", "right", "bottom", "left"];
  const busesNeeded = Math.min(
    sides.length,
    Math.max(1, Math.ceil((requiredInputPorts + requiredOutputPorts) / 2)),
  );

  const placedBuses: BusPlacement[] = [];

  for (let i = 0; i < busesNeeded && i < sides.length; i++) {
    const bus = tryPlaceBus(sides[i]);
    if (bus) {
      placedBuses.push(bus);
      const busId = `wuling_bus_${i}` as LogisticsNodeId;
      placements.push({
        id: busId,
        type: "depot_bus",
        siteId: siteLayout.siteId,
        position: { x: bus.x, y: bus.y },
        size: DEPOT_BUS_SECTION_SIZE,
        rotation: 0,
        attachedToSide: bus.side,
        parentId: portId,
      });
    }
  }

  // Place loaders/unloaders on bus sides
  let loaderCount = 0;
  for (const bus of placedBuses) {
    // Place one loader and one unloader per bus (one per opposite sides)
    // We pick two sides for loaders based on available space
    const loaderSides: ("top" | "right" | "bottom" | "left")[] = ["top", "right", "bottom", "left"];
    const busSidesToUse = [loaderSides[(loaderSides.indexOf(bus.side) + 1) % 4], loaderSides[(loaderSides.indexOf(bus.side) + 3) % 4]];

    for (const side of busSidesToUse) {
      // Determine loader position based on side
      let lx = 0, ly = 0;
      if (side === "top") {
        lx = bus.x + Math.floor(busW / 2) - Math.floor(loaderW / 2);
        ly = bus.y - loaderH;
      } else if (side === "right") {
        lx = bus.x + busW;
        ly = bus.y + Math.floor(busH / 2) - Math.floor(loaderH / 2);
      } else if (side === "bottom") {
        lx = bus.x + Math.floor(busW / 2) - Math.floor(loaderW / 2);
        ly = bus.y + busH;
      } else {
        lx = bus.x - loaderW;
        ly = bus.y + Math.floor(busH / 2) - Math.floor(loaderH / 2);
      }

      const loaderRect = { x: lx, y: ly, w: loaderW, h: loaderH };

      // Bounds check
      if (lx < 0 || ly < 0 || lx + loaderW > siteWidth || ly + loaderH > siteHeight) {
        continue;
      }

      // Overlap check
      let hasOverlap = false;
      for (const occ of occupied) {
        if (overlaps(loaderRect, occ)) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) continue;

      occupied.push(loaderRect);

      const loaderType = loaderCount % 2 === 0 ? "loader" : "unloader";
      const loaderId = `wuling_loader_${loaderCount}` as LogisticsNodeId;

      placements.push({
        id: loaderId,
        type: loaderType,
        siteId: siteLayout.siteId,
        position: { x: lx, y: ly },
        size: LOADER_SIZE,
        rotation: 0,
        attachedToBusSide: side,
        parentId: `wuling_bus_${placedBuses.indexOf(bus)}` as LogisticsNodeId,
      });

      loaderCount++;
    }
  }

  return {
    logisticsPlacements: placements,
    failures,
    portsPlaced: 1,
    busesPlaced: placedBuses.length,
    loadersPlaced: loaderCount,
  };
}