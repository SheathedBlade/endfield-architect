import type { ItemId, RecipeId, SiteId } from "@/types";
import type { FacilityId } from "@/types/constants";

// ─── Normalized production graph ───────────────────────────────────────────

export type GraphNodeId = string & { readonly __brand: "GraphNodeId" };

export type GraphNode = {
  id: GraphNodeId;
  /** Stable label for display/debugging */
  label: string;
  /** Role within the production tree */
  role: GraphNodeRole;
  itemId: ItemId;
  targetRate: number;
  recipeId: RecipeId | null;
  facilityId: FacilityId | null;
  facilityCount: number;
  exactFacilityCount?: number;
  siteId: SiteId | null;
  /** Source production node index in solver output (for mapping back) */
  sourceNodeIndex?: number;
};

export type GraphNodeRole =
  | "target"       // top-level production goal
  | "intermediate" // mid-chain produced item
  | "raw"          // raw material leaf (isRaw: true)
  | "import"       // external/metastorage supplied
  | "cycle_placeholder"; // non-seed cycle placeholder

export type GraphEdge = {
  id: string & { readonly __brand: "GraphEdgeId" };
  from: GraphNodeId;
  to: GraphNodeId;
  /** Rate of flow along this edge in items/min */
  rate: number;
};

export type NormalizedGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootIds: GraphNodeId[]; // top-level goal node IDs
};

// ─── Chain classification ───────────────────────────────────────────────────

export type ChainRole =
  | "final_assembly"    // terminates at a top-level goal
  | "intermediate"      // multi-step processing chain
  | "raw_processing"    // raw material refinement chain
  | "seed_loop"         // plant/seed cycle cluster
  | "import_fed";       // driven primarily by external supply

export type ChainClassification = {
  chainId: string;
  role: ChainRole;
  nodeIds: GraphNodeId[];
  /** Hint for site assignment scoring */
  placementHint: PlacementHint;
  /** Self-contained chains can be placed on outposts independently */
  isSelfContained: boolean;
};

export type PlacementHint =
  | "core_preferred"      // main production, prefer core sites
  | "outpost_friendly"    // suitable for outpost placement
  | "logistics_heavy"    // requires significant logistics support
  | "self_contained";    // no external inputs beyond raw materials

// ─── Site assignment ─────────────────────────────────────────────────────────

export type SiteAssignment = {
  nodeId: GraphNodeId;
  siteId: SiteId;
  /** Index within the site's local facility list for this node instance */
  facilityInstanceIndex: number;
};

export type ChainSiteAssignment = {
  chainId: string;
  primarySiteId: SiteId;
  nodeAssignments: SiteAssignment[];
  /** Chains that don't fit on primary site */
  overflowChainIds?: string[];
};

export type SiteAssignmentResult = {
  assignments: ChainSiteAssignment[];
  unassignedNodes: GraphNodeId[];
};

// ─── Placement geometry ──────────────────────────────────────────────────────

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlacementFootprint = {
  nodeId: GraphNodeId;
  siteId: SiteId;
  /** Top-left corner within the site grid */
  position: { x: number; y: number };
  /** Grid footprint (width, height) */
  size: [number, number];
  /** Rotation: 0 = as-defined, 90 = rotated */
  rotation: 0 | 90;
  /** Whether this placement was auto-placed or user-adjusted (future) */
  isLocked: boolean;
};

export type SiteLayout = {
  siteId: SiteId;
  /** Facility placements within this site */
  facilityPlacements: PlacementFootprint[];
  /** Logistics placements (bus ports, buses, loaders) within this site */
  logisticsPlacements: LogisticsPlacement[];
  /** Usable area after accounting for corridors/reserved zones */
  usableRect: Rect;
  /** Occupancy fraction (0-1) of usable area */
  occupancy: number;
};

// ─── Logistics placements ───────────────────────────────────────────────────

export type LogisticsNodeId = string & { readonly __brand: "LogisticsNodeId" };

export type LogisticsType = "depot_port" | "depot_bus" | "loader" | "unloader";

export type LogisticsPlacement = {
  id: LogisticsNodeId;
  type: LogisticsType;
  siteId: SiteId;
  position: { x: number; y: number };
  size: [number, number];
  /** Orientation/rotation: 0 = as-defined */
  rotation: 0 | 90;
  /** For ports: which sides have bus connections */
  busConnectionSides?: ("top" | "right" | "bottom" | "left")[];
  /** For buses: which side this bus is attached to its parent port */
  attachedToSide?: "top" | "right" | "bottom" | "left";
  /** For loaders/unloaders: which side of the bus this is attached to */
  attachedToBusSide?: "top" | "right" | "bottom" | "left";
  /** ID of the parent logistics node (port for bus, bus for loader/unloader) */
  parentId: LogisticsNodeId | null;
};

// ─── Structured infeasibility errors ────────────────────────────────────────

export type InfeasibilityReason =
  | "valley_perimeter_slot_exhausted"
  | "site_capacity_exceeded"
  | "facility_overlap"
  | "logistics_attachment_invalid"
  | "out_of_bounds";

export type PlacementFailure = {
  nodeId: GraphNodeId | LogisticsNodeId;
  reason: InfeasibilityReason;
  message: string;
  /** Suggested correction if determinable */
  suggestion?: string;
};

export type LayoutFeasibilityResult = {
  feasible: boolean;
  failures: PlacementFailure[];
};

// ─── Belt routing ─────────────────────────────────────────────────────────────

export type BeltRoute = {
  edgeId: string;
  fromNodeId: GraphNodeId;
  toNodeId: GraphNodeId;
  siteId: SiteId;
  gridPath: { x: number; y: number }[];
  pixelPath: { x: number; y: number }[];
};

// ─── Combined layout result ──────────────────────────────────────────────────

export type LayoutResult = {
  graph: NormalizedGraph;
  classifications: ChainClassification[];
  siteLayouts: SiteLayout[];
  feasibility: LayoutFeasibilityResult;
  beltRoutes: BeltRoute[];
  /** Layout hints for visual arrangement */
  layoutHints?: LayoutHints;
};

export type LayoutHints = {
  nodePositions: Map<GraphNodeId, { x: number; y: number }>;
  layerIndices: Map<GraphNodeId, number>;
};

// ─── Store-facing plan extension ─────────────────────────────────────────────

/** Shape of the derived layout result attached to ProductionPlan */
export type ProductionLayoutResult = LayoutResult;