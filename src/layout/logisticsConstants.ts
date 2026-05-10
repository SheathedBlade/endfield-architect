/**
 * Logistics geometry and rule constants.
 *
 * These dimensions are not yet present in game data files, so they are
 * centralized here for easy adjustment. Once the game data is extended
 * with official logistics entity sizes, these should be replaced by
 * imports from the data layer.
 */

// Depot logistics entity dimensions
export const DEPOT_BUS_PORT_SIZE: [number, number] = [4, 4];   // width, height in grid units
export const DEPOT_BUS_SECTION_SIZE: [number, number] = [4, 8];

// Loader/unloader dimensions (identical geometry, different direction semantics)
export const LOADER_SIZE: [number, number] = [3, 1];
export const UNLOADER_SIZE: [number, number] = [3, 1];

// Attachment sides for bus-port and bus-loader connections
export type AttachmentSide = "top" | "right" | "bottom" | "left";

// Valley Core perimeter slot rules
// The Valley Core site has external depot buses outside the 70x70 grid.
// Loaders/unloaders attach via discrete interior perimeter slots along the
// outer edge of the grid, connected to the external buses.
// Slot capacity is derived from the number of depot port connections.
export const VALLEY_CORE_PERIMETER_SLOTS = 14; // matches depotPorts.inputs count
export const VALLEY_CORE_GRID_SIZE = [70, 70] as const;

// Wuling Core bus placement rules
// Buses are placed inside the grid. No perimeter-slot restriction.
// Ports must be placed before buses; buses attach to port sides;
// loaders/unloaders attach to bus sides.
export const WULING_CORE_GRID_SIZE = [70, 70] as const;
export const WULING_SUBSITE_GRID_SIZE = [50, 50] as const;

// General site logistics constants
export const LOGISTICS_CORRIDOR_WIDTH = 2; // grid units reserved between facility rows
export const MIN_FACILITY_SPACING = 1;     // minimum grid units between facility footprints

// Soft density ceiling as a fraction of usable site area
// (leaves room for corridors, logistics zones, and future expansion)
export const SOFT_MAX_DENSITY = 0.75;