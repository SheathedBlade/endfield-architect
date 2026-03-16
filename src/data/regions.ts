import { z } from "zod";

export const RegionSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Region = z.infer<typeof RegionSchema>;

export const REGIONS = [
  {
    id: "valley4",
    name: "Valley IV",
  },
  {
    id: "wuling",
    name: "Wuling",
  },
] as const satisfies Region[];

export const REGION_IDS = REGIONS.map((region) => region.id) as [
  string,
  ...string[],
];
export const REGION_MAP = new Map(REGIONS.map((region) => [region.id, region]));
