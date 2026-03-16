import { z } from "zod";

// Machine Category
export const MachineCategorySchema = z.enum([
  "production_1",
  "production_2",
  "logistics_units",
  "depot_access",
  "power",
]);

export const PortSchema = z.object({
  inputs: z.number().int().nonnegative(),
  outputs: z.number().int().nonnegative(),
  pipeInputs: z.number().int().nonnegative().default(0),
  pipeOutputs: z.number().int().nonnegative().default(0),
});

export const FluidModeSchema = z.object({
  supported: z.boolean(),
  additionalPipeInputs: z.number().int().nonnegative().optional(),
  additionalPipeOutputs: z.number().int().nonnegative().optional(),
  unlockedInPatch: z.enum(["1.0", "1.1"]).optional(),
  regions: z.union([z.literal("all"), z.array(z.string()).min(1)]).optional(),
});

export const PlacementCapSchema = z.object({
  default: z.number().int().positive(),
  upgrades: z
    .array(
      z.object({
        patch: z.enum(["1.0", "1.1"]),
        cap: z.number().int().positive(),
      }),
    )
    .optional(),
});

export const MachineSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: MachineCategorySchema,
  patch: z.enum(["1.0", "1.1"]),
  powerDraw: z.number().nonnegative(),
  powerSource: z.enum(["electric", "water", "none"]),
  gridSize: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  regions: z.union([z.literal("all"), z.array(z.string()).min(1)]),
  ports: PortSchema,
  fluidMode: FluidModeSchema.optional(),
  placementCap: PlacementCapSchema.optional(),
});

export type Machine = z.infer<typeof MachineSchema>;
export type MachineCategory = z.infer<typeof MachineCategorySchema>;
export type Ports = z.infer<typeof PortSchema>;
export type FluidMode = z.infer<typeof FluidModeSchema>;
export type PlacementCap = z.infer<typeof PlacementCapSchema>;

export const MACHINES = [
  {
    id: "refining_unit",
    name: "Refining Unit",
    category: "production_1",
    patch: "1.0",
    powerDraw: 5,
    powerSource: "electric",
    gridSize: [3, 3],
    regions: "all",
    ports: {
      inputs: 3,
      outputs: 3,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
    fluidMode: {
      supported: true,
      additionalPipeInputs: 1,
      additionalPipeOutputs: 1,
      unlockedInPatch: "1.1",
      regions: ["wuling"],
    },
  },
  {
    id: "shredding_unit",
    name: "Shredding Unit",
    category: "production_1",
    patch: "1.0",
    powerDraw: 5,
    powerSource: "electric",
    gridSize: [3, 3],
    regions: "all",
    ports: {
      inputs: 3,
      outputs: 3,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
    fluidMode: {
      supported: false,
    },
  },
  {
    id: "planting_unit",
    name: "Planting Unit",
    category: "production_1",
    patch: "1.0",
    powerDraw: 20,
    powerSource: "electric",
    gridSize: [5, 5],
    regions: "all",
    ports: {
      inputs: 5,
      outputs: 5,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
    fluidMode: {
      supported: true,
      additionalPipeInputs: 1,
      additionalPipeOutputs: 0,
      unlockedInPatch: "1.1",
      regions: ["wuling"],
    },
  },
  {
    id: "seed-picking_unit",
    name: "Seed-Picking Unit",
    category: "production_1",
    patch: "1.0",
    powerDraw: 10,
    powerSource: "electric",
    gridSize: [5, 5],
    regions: "all",
    ports: {
      inputs: 5,
      outputs: 5,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
  },
  {
    id: "fitting_unit",
    name: "Fitting Unit",
    category: "production_1",
    patch: "1.0",
    powerDraw: 20,
    powerSource: "electric",
    gridSize: [3, 3],
    regions: "all",
    ports: {
      inputs: 3,
      outputs: 3,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
  },
  {
    id: "moulding_unit",
    name: "Moulding Unit",
    category: "production_1",
    patch: "1.0",
    powerDraw: 10,
    powerSource: "electric",
    gridSize: [3, 3],
    regions: "all",
    ports: {
      inputs: 3,
      outputs: 3,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
  },
  {
    id: "gearing_unit",
    name: "Gearing Unit",
    category: "production_2",
    patch: "1.0",
    powerDraw: 10,
    powerSource: "electric",
    gridSize: [6, 4],
    regions: "all",
    ports: {
      inputs: 6,
      outputs: 6,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
  },
  {
    id: "filling_unit",
    name: "Filling Unit",
    category: "production_2",
    patch: "1.0",
    powerDraw: 20,
    powerSource: "electric",
    gridSize: [6, 4],
    regions: "all",
    ports: {
      inputs: 6,
      outputs: 6,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
    fluidMode: {
      supported: true,
      additionalPipeInputs: 1,
      additionalPipeOutputs: 0,
      unlockedInPatch: "1.1",
      regions: ["wuling"],
    },
  },
  {
    id: "packaging_unit",
    name: "Packaging Unit",
    category: "production_2",
    patch: "1.0",
    powerDraw: 20,
    powerSource: "electric",
    gridSize: [6, 4],
    regions: "all",
    ports: {
      inputs: 6,
      outputs: 6,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
  },
  {
    id: "grinding_unit",
    name: "Grinding Unit",
    category: "production_2",
    patch: "1.0",
    powerDraw: 50,
    powerSource: "electric",
    gridSize: [6, 4],
    regions: "all",
    ports: {
      inputs: 6,
      outputs: 6,
      pipeInputs: 0,
      pipeOutputs: 0,
    },
  },
  {
    id: "reactor_crucible",
    name: "Reactor Crucible",
    category: "production_2",
    patch: "1.0",
    powerDraw: 50,
    powerSource: "electric",
    gridSize: [5, 5],
    regions: ["wuling"],
    ports: {
      inputs: 2,
      outputs: 2,
      pipeInputs: 2,
      pipeOutputs: 2,
    },
  },
  {
    id: "forge_of_the_sky",
    name: "Forge of the Sky",
    category: "production_2",
    patch: "1.0",
    powerDraw: 50,
    powerSource: "electric",
    gridSize: [5, 5],
    regions: ["wuling"],
    ports: {
      inputs: 5,
      outputs: 5,
      pipeInputs: 1,
      pipeOutputs: 0,
    },
    placementCap: {
      default: 2,
      upgrades: [
        {
          patch: "1.1",
          cap: 4,
        },
      ],
    },
  },
  {
    id: "separating_unit",
    name: "Separating Unit",
    category: "production_2",
    patch: "1.0",
    powerDraw: 20,
    powerSource: "electric",
    gridSize: [6, 4],
    regions: ["wuling"],
    ports: {
      inputs: 6,
      outputs: 6,
      pipeInputs: 0,
      pipeOutputs: 1,
    },
  },
  {
    id: "water_treatment_unit",
    name: "Water Treatment Unit",
    category: "production_1",
    patch: "1.1",
    powerDraw: 50,
    powerSource: "electric",
    gridSize: [3, 3],
    regions: ["wuling"],
    ports: {
      inputs: 0,
      outputs: 0,
      pipeInputs: 1,
      pipeOutputs: 0,
    },
  },
] as const satisfies Machine[];

export const MACHINE_MAP = new Map(
  MACHINES.map((machine) => [machine.id, machine]),
);
export const CAPPED_MACHINES = MACHINES.filter(
  (machine) => machine.placementCap !== undefined,
);

export const MACHINES_BY_CATEGORY = {
  production_1: MACHINES.filter(
    (machine) => machine.category === "production_1",
  ),
  production_2: MACHINES.filter(
    (machine) => machine.category === "production_2",
  ),
  logistics_units: MACHINES.filter(
    (machine) => machine.category === "logistics_units",
  ),
  depot_access: MACHINES.filter(
    (machine) => machine.category === "depot_access",
  ),
  power: MACHINES.filter((machine) => machine.category === "power"),
} as const;
