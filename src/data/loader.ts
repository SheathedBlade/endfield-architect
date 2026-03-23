import { FACILITY_CATEGORIES, PATCHES, REGION_IDS } from "@/types/constants";
import { z } from "zod";

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
  facilityId: z.string(),
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

export const ITEMS = validate("items", ItemSchema, allItems);
export const FACILITIES = validate("facilities", FacilitySchema, allFacilities);
export const RECIPES = validate("recipes", RecipeSchema, allRecipes);
export const SITES = validate("sites", SiteSchema, allSites);
export const REGIONS = validate("regions", RegionSchema, allRegions);

export const ITEM_MAP = new Map(ITEMS.map((i) => [i.id, i]));
export const FACILITY_MAP = new Map(FACILITIES.map((f) => [f.id, f]));
export const RECIPE_MAP = new Map(RECIPES.map((r) => [r.id, r]));
export const SITE_MAP = new Map(SITES.map((s) => [s.id, s]));
export const REGION_MAP = new Map(REGIONS.map((r) => [r.id, r]));
