import type { Item, ItemId, ProductionNode } from "@/types";

/** Makes a raw material leaf node */
export function makeRawNode(
  item: Item,
  targetRate: number,
  isTarget: boolean,
): ProductionNode {
  return {
    item,
    targetRate,
    recipe: null,
    facility: null,
    facilityCount: 0,
    isRawMaterial: true,
    isTarget,
    dependencies: [],
  };
}

/** Makes an external supply leaf node (imported) */
export function makeExternalLeaf(
  item: Item,
  targetRate: number,
  isTarget: boolean,
): ProductionNode {
  return {
    item,
    targetRate,
    recipe: null,
    facility: null,
    facilityCount: 0,
    isRawMaterial: false,
    isTarget,
    dependencies: [],
    isExternalSupply: true,
  };
}

/** Makes a cycle placeholder node */
export function makeCyclePlaceholder(
  item: Item,
  itemId: ItemId,
  targetRate: number,
  isTarget: boolean,
): ProductionNode {
  return {
    item,
    targetRate,
    recipe: null,
    facility: null,
    facilityCount: 0,
    isRawMaterial: false,
    isTarget,
    dependencies: [],
    isCyclePlaceholder: true,
    cycleItemId: itemId,
  };
}

/** Makes a node for an item that cannot be produced (treated as raw) */
export function makeUnresolvableNode(
  item: Item,
  targetRate: number,
  isTarget: boolean,
): ProductionNode {
  return {
    item,
    targetRate,
    recipe: null,
    facility: null,
    facilityCount: 0,
    isRawMaterial: true,
    isTarget,
    dependencies: [],
  };
}
