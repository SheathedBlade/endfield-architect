import * as z from "zod";

export const SiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  regionId: z.string(),
  patch: z.enum(["1.0", "1.1"]),
  gridSize: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  unlocked: z.boolean(),
  isCoreAIC: z.boolean(),
});

export type Site = z.infer<typeof SiteSchema>;

export const SITES = [
  /* Valley IV */
  {
    id: "valley4_core",
    name: "Valley IV Core AIC",
    regionId: "valley4",
    patch: "1.0",
    gridSize: [70, 70],
    unlocked: true,
    isCoreAIC: true,
  },
  {
    id: "refugee_camp",
    name: "Refugee Camp",
    regionId: "valley4",
    patch: "1.0",
    gridSize: [50, 50],
    unlocked: false,
    isCoreAIC: false,
  },
  {
    id: "infra_station",
    name: "Infrastructure Station",
    regionId: "valley4",
    patch: "1.0",
    gridSize: [50, 50],
    unlocked: false,
    isCoreAIC: false,
  },
  {
    id: "reconstruction_hq",
    name: "Reconstruction HQ",
    regionId: "valley4",
    patch: "1.0",
    gridSize: [50, 50],
    unlocked: false,
    isCoreAIC: false,
  },
  /* Wuling */
  {
    id: "wuling_core",
    name: "Wuling Core AIC",
    regionId: "wuling",
    patch: "1.0",
    gridSize: [70, 70],
    unlocked: true,
    isCoreAIC: true,
  },
  {
    id: "sky_king_flats",
    name: "Sky King Flats",
    regionId: "wuling",
    patch: "1.0",
    gridSize: [50, 50],
    unlocked: false,
    isCoreAIC: false,
  },
] as const satisfies Site[];

export const SITE_MAP = new Map(SITES.map((site) => [site.id, site]));

export function getSitesByRegion(regionId: string): Site[] {
  return SITES.filter((site) => site.regionId === regionId);
}

export function getCoreAICSite(regionId: string): Site | undefined {
  return SITES.find((site) => site.regionId === regionId && site.isCoreAIC);
}
