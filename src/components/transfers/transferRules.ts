import { ITEM_MAP, REGION_MAP } from "@/data/loader";
import type { ItemId, RegionId } from "@/types";
import { REGION_IDS } from "@/types/constants";

export const TRANSFERABLE_RAW_ORES = new Set<ItemId>([
  "originium_ore",
  "amethyst_ore",
  "ferrium_ore",
  "cuprium_ore",
]);

export const ALL_REGIONS = REGION_IDS.map((rid) => ({
  value: rid,
  label: REGION_MAP.get(rid)?.name ?? rid,
}));

export function buildTransferableItems() {
  return Array.from(ITEM_MAP.values())
    .filter(
      (item) =>
        !item.isLiquid &&
        (!item.isRaw || TRANSFERABLE_RAW_ORES.has(item.id as ItemId)),
    )
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map((item) => ({ value: item.id as ItemId, label: item.displayName }));
}

export function buildSourceRegions(activeRegion: RegionId) {
  return ALL_REGIONS.filter((opt) => opt.value !== activeRegion);
}
