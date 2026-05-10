import type { SiteLayout, LogisticsPlacement, PlacementFailure, LogisticsNodeId } from "./types";
import { VALLEY_CORE_PERIMETER_SLOTS, VALLEY_CORE_GRID_SIZE } from "./logisticsConstants";

export interface ValleyPerimeterResult {
  logisticsPlacements: LogisticsPlacement[];
  failures: PlacementFailure[];
  slotsUsed: number;
  slotsAvailable: number;
}

/**
 * Place perimeter logistics for Valley Core.
 * Valley has external depot buses outside the 70x70 grid.
 * Loaders/unloaders attach via discrete interior perimeter slots.
 * Each slot is a small interior attachment zone connected to an external bus.
 */
export function placeValleyPerimeterLogistics(
  _siteLayout: SiteLayout,
  requiredSlots: number,
): ValleyPerimeterResult {
  const failures: PlacementFailure[] = [];
  const placements: LogisticsPlacement[] = [];

  if (requiredSlots <= 0) {
    return { logisticsPlacements: placements, failures, slotsUsed: 0, slotsAvailable: VALLEY_CORE_PERIMETER_SLOTS };
  }

  const availableSlots = VALLEY_CORE_PERIMETER_SLOTS;

  if (requiredSlots > availableSlots) {
    failures.push({
      nodeId: "valley_perimeter" as LogisticsNodeId,
      reason: "valley_perimeter_slot_exhausted",
      message: `Valley Core requires ${requiredSlots} perimeter slots but only ${availableSlots} are available.`,
      suggestion: "Try unlocking additional sites or reducing the number of raw material inputs that require perimeter attachment.",
    });
    return {
      logisticsPlacements: [],
      failures,
      slotsUsed: 0,
      slotsAvailable: availableSlots,
    };
  }

  const [siteWidth, _siteHeight] = VALLEY_CORE_GRID_SIZE;
  // Note: slot generation uses slot depth granularity, not all slots are consumed
  // Slots are represented as small interior attachment zones; actual usage is
  // tracked via slotsUsed/slotsAvailable counters rather than individual rects

  // Mark required slots as occupied (simple first-come allocation)
  const slotDepth = 3;
  const SLOT_STEP = 3;

  // Top slots
  let slotCount = 0;
  for (let x = 1; x < siteWidth - 1 && slotCount < requiredSlots; x += SLOT_STEP) {
    placements.push({
      id: `valley_slot_${slotCount}` as LogisticsNodeId,
      type: "unloader", // represent slot attachment as unloader-equivalent
      siteId: "valley_core",
      position: { x, y: 0 },
      size: [slotDepth, slotDepth],
      rotation: 0,
      attachedToBusSide: "top",
      parentId: null,
    });
    slotCount++;
  }

  return {
    logisticsPlacements: placements,
    failures,
    slotsUsed: requiredSlots,
    slotsAvailable: availableSlots,
  };
}