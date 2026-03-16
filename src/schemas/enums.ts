import { z } from "zod";

export const PatchVersionSchema = z.enum(["1.0", "1.1"]);
export const MachineTypeSchema = z.enum([
  "refining_unit",
  "shredding_unit",
  "planting_unit",
  "grinding_unit",
  "fitting_unit",
  "gearing_unit",
  "filling_unit",
  "forge_of_the_sky",
  "fluid_tank",
  "moulding_unit",
  "packaging_unit",
  "reactor_crucible",
  "seed-picking_unit",
  "separating_unit",
]);

export const SiteSchema = z.enum([
  "valley4_core",
  "wuling_core",
  "refugee_camp",
  "infra_station",
  "reconstruction_hq",
  "sky_king_flats",
]);

export type PatchVersion = z.infer<typeof PatchVersionSchema>;
export type MachineType = z.infer<typeof MachineTypeSchema>;
export type Site = z.infer<typeof SiteSchema>;
