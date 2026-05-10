import type { FacilityCategory } from "@/types/constants";

export type FacilityEmblemType =
  | "refining"
  | "shredding"
  | "moulding"
  | "fitting"
  | "planting"
  | "seed_picking"
  | "gearing"
  | "filling"
  | "packaging"
  | "grinding"
  | "reactor"
  | "forge"
  | "separating"
  | "generic";

export interface FacilityVisual {
  baseColor: number;
  emblemType: FacilityEmblemType;
  categoryColor: number;
}

const CATEGORY_COLORS: Record<FacilityCategory, number> = {
  production_1: 0x4a7a9e,
  production_2: 0x8a5a9e,
};

const EMBLEM_MAP: Record<string, FacilityEmblemType> = {
  refining_unit: "refining",
  shredding_unit: "shredding",
  moulding_unit: "moulding",
  fitting_unit: "fitting",
  planting_unit: "planting",
  seed_picking_unit: "seed_picking",
  gearing_unit: "gearing",
  filling_unit: "filling",
  packaging_unit: "packaging",
  grinding_unit: "grinding",
  reactor_crucible: "reactor",
  forge_of_the_sky: "forge",
  separating_unit: "separating",
};

const FACILITY_VISUALS: Record<string, FacilityVisual> = {
  refining_unit: {
    baseColor: 0x5a8ab0,
    emblemType: "refining",
    categoryColor: CATEGORY_COLORS.production_1,
  },
  shredding_unit: {
    baseColor: 0x6a9a40,
    emblemType: "shredding",
    categoryColor: CATEGORY_COLORS.production_1,
  },
  moulding_unit: {
    baseColor: 0xb06030,
    emblemType: "moulding",
    categoryColor: CATEGORY_COLORS.production_1,
  },
  fitting_unit: {
    baseColor: 0x908020,
    emblemType: "fitting",
    categoryColor: CATEGORY_COLORS.production_1,
  },
  planting_unit: {
    baseColor: 0x40a060,
    emblemType: "planting",
    categoryColor: CATEGORY_COLORS.production_1,
  },
  seed_picking_unit: {
    baseColor: 0x60b050,
    emblemType: "seed_picking",
    categoryColor: CATEGORY_COLORS.production_1,
  },
  gearing_unit: {
    baseColor: 0x7a6090,
    emblemType: "gearing",
    categoryColor: CATEGORY_COLORS.production_2,
  },
  filling_unit: {
    baseColor: 0x5090b0,
    emblemType: "filling",
    categoryColor: CATEGORY_COLORS.production_2,
  },
  packaging_unit: {
    baseColor: 0xa07050,
    emblemType: "packaging",
    categoryColor: CATEGORY_COLORS.production_2,
  },
  grinding_unit: {
    baseColor: 0x807060,
    emblemType: "grinding",
    categoryColor: CATEGORY_COLORS.production_2,
  },
  reactor_crucible: {
    baseColor: 0xc04040,
    emblemType: "reactor",
    categoryColor: CATEGORY_COLORS.production_2,
  },
  forge_of_the_sky: {
    baseColor: 0xd08020,
    emblemType: "forge",
    categoryColor: CATEGORY_COLORS.production_2,
  },
  separating_unit: {
    baseColor: 0x408090,
    emblemType: "separating",
    categoryColor: CATEGORY_COLORS.production_2,
  },
};

export function getFacilityVisual(
  facilityId: string | null,
  category: FacilityCategory,
): FacilityVisual {
  if (facilityId && FACILITY_VISUALS[facilityId]) {
    return FACILITY_VISUALS[facilityId];
  }
  return {
    baseColor: 0x3a3a3a,
    emblemType: "generic",
    categoryColor: CATEGORY_COLORS[category] ?? 0x555555,
  };
}

export function getEmblemType(facilityId: string | null): FacilityEmblemType {
  if (facilityId && EMBLEM_MAP[facilityId]) {
    return EMBLEM_MAP[facilityId];
  }
  return "generic";
}

export function getCategoryColor(category: FacilityCategory): number {
  return CATEGORY_COLORS[category] ?? 0x555555;
}

// Role-based colors for corner accent triangles
export const ROLE_COLORS: Record<string, number> = {
  target: 0xffc840,
  intermediate: 0x606060,
  raw: 0x404040,
};
