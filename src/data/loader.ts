import {
  FACILITY_CATEGORIES,
  PATCHES,
  REGION_IDS,
  type Patch,
  type RegionId,
} from "@/types/constants";
import { z } from "zod";

import type { Facility, Item, Recipe, Region, Site } from "@/types";
import allFacilities from "./facilities.json";
import allItems from "./items.json";
import allRecipes from "./recipes.json";
import allRegions from "./regions.json";
import allSites from "./sites.json";

const PatchSchema = z.enum(PATCHES);
const RegionIdSchema = z.enum(REGION_IDS);

const ItemSchema = z.object({
  id: z.string(),
  isLiquid: z.boolean(),
  isRaw: z.boolean(),
  isByproduct: z.boolean(),
  patch: PatchSchema,
});

const PortSchema = z.object({
  inputSlots: z.number().int().nonnegative(),
  outputSlots: z.number().int().nonnegative(),
  inputPorts: z.number().int().nonnegative(),
  outputPorts: z.number().int().nonnegative(),
  pipeInputs: z.number().int().nonnegative(),
  pipeOutputs: z.number().int().nonnegative(),
});

const FluidModeSchema = z.object({
  additionalPipeInputs: z.number().int().nonnegative(),
  additionalPipeOutputs: z.number().int().nonnegative(),
  unlockedInPatch: PatchSchema,
  regions: z.union([z.literal("all"), z.array(RegionIdSchema).min(1)]),
});

const PlacementCapSchema = z.object({
  default: z.number().int().positive(),
  upgrades: z
    .array(
      z.object({
        patch: PatchSchema,
        cap: z.number().int().positive(),
      }),
    )
    .optional(),
});

const ParallelRecipesSchema = z.object({
  default: z.number().int().positive(),
  upgrades: z
    .array(
      z.object({
        patch: PatchSchema,
        count: z.number().int().positive(),
      }),
    )
    .optional(),
});

const FacilitySchema = z.object({
  id: z.string(),
  powerConsumption: z.number().nonnegative(),
  category: z.enum(FACILITY_CATEGORIES),
  patch: PatchSchema,
  regions: z.union([z.literal("all"), z.array(RegionIdSchema).min(1)]),
  gridSize: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  ports: PortSchema,
  fluidMode: FluidModeSchema.optional(),
  placementCap: PlacementCapSchema.optional(),
  parallelRecipes: ParallelRecipesSchema.optional(),
});

const RecipeItemSchema = z.object({
  itemId: z.string(),
  amount: z.number().positive(),
});

const RecipeSchema = z.object({
  id: z.string(),
  facility: z.string(),
  craftingTime: z.number().positive(),
  fluidMode: z.boolean(),
  patch: PatchSchema,
  inputs: z.array(RecipeItemSchema).min(1),
  outputs: z.array(RecipeItemSchema).min(1),
});

const SiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  regionId: RegionIdSchema,
  patch: PatchSchema,
  isCore: z.boolean(),
  gridSize: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  depotPorts: z.object({
    inputs: z.number().int().positive(),
    outputs: z.number().int().positive(),
  }),
});

const RegionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

function validate<T>(name: string, schema: z.ZodType<T>, data: unknown): T[] {
  const result = z.array(schema).safeParse(data);
  if (!result.success) {
    console.error(
      `[Endfield-Architect] Invalid ${name} data: `,
      z.treeifyError(result.error),
    );
    throw new Error(`Failed to load ${name} - check console for details.`);
  }
  return result.data;
}

export const ITEMS = validate("items", ItemSchema, allItems) as Item[];
export const FACILITIES = validate(
  "facilities",
  FacilitySchema,
  allFacilities,
) as Facility[];
export const RECIPES = validate(
  "recipes",
  RecipeSchema,
  allRecipes,
) as Recipe[];
export const SITES = validate("sites", SiteSchema, allSites) as Site[];
export const REGIONS = validate(
  "regions",
  RegionSchema,
  allRegions,
) as Region[];

export const ITEM_MAP = new Map(ITEMS.map((i) => [i.id, i]));
export const FACILITY_MAP = new Map(FACILITIES.map((f) => [f.id, f]));
export const RECIPE_MAP = new Map(RECIPES.map((r) => [r.id, r]));
export const SITE_MAP = new Map(SITES.map((s) => [s.id, s]));
export const REGION_MAP = new Map(REGIONS.map((r) => [r.id, r]));

export const RECIPES_BY_OUTPUT = RECIPES.reduce((map, recipe) => {
  for (const output of recipe.outputs) {
    const existing = map.get(output.itemId) ?? [];
    map.set(output.itemId, [...existing, recipe]);
  }
  return map;
}, new Map<string, typeof RECIPES>());

export const RECIPES_BY_FACILITY = RECIPES.reduce((map, recipe) => {
  const existing = map.get(recipe.facility) ?? [];
  map.set(recipe.facility, [...existing, recipe]);

  return map;
}, new Map<string, typeof RECIPES>());

export const SITES_BY_REGION = SITES.reduce((map, site) => {
  const existing = map.get(site.regionId) ?? [];
  map.set(site.regionId, [...existing, site]);

  return map;
}, new Map<string, typeof SITES>());

export function getFacilitiesForRegion(regionId: RegionId) {
  return FACILITIES.filter(
    (f) =>
      f.regions === "all" ||
      (Array.isArray(f.regions) && f.regions.includes(regionId)),
  );
}

export function getAvailableRecipes(patch: Patch, regionId: RegionId) {
  const availableFacilityIds = new Set(
    getFacilitiesForRegion(regionId).map((f) => f.id),
  );
  return RECIPES.filter(
    (r) => r.patch <= patch && availableFacilityIds.has(r.facility),
  );
}

export function validateData() {
  const errors: string[] = [];
  for (const recipe of RECIPES) {
    for (const input of recipe.inputs) {
      if (!ITEM_MAP.has(input.itemId))
        errors.push(
          `Recipe "${recipe.id}" input references unknown item "${input.itemId}"`,
        );
    }
    for (const output of recipe.outputs) {
      if (!ITEM_MAP.has(output.itemId))
        errors.push(
          `Recipe "${recipe.id}" output references unknown item "${output.itemId}"`,
        );
    }
    if (!FACILITY_MAP.has(recipe.facility))
      errors.push(
        `Recipe "${recipe.id}" references unknown facility "${recipe.facility}"`,
      );
  }

  for (const site of SITES) {
    if (!REGION_MAP.has(site.regionId))
      errors.push(
        `Site "${site.id}" references unknown region "${site.regionId}"`,
      );
  }

  if (errors.length > 0) {
    errors.forEach((e) =>
      console.error(`[Endfield-Architect] Data integrity error: ${e}`),
    );
    throw new Error(
      `Data integrity check failed with ${errors.length} error(s) — check console`,
    );
  }

  console.info(
    `[Endfield-Architect] Data has loaded successfully! ${ITEMS.length} items, ${FACILITIES.length} facilities, ${RECIPES.length} recipes`,
  );
}
