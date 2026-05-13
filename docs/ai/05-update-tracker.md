# Update Tracker — Meaningful Changes

> Log meaningful changes to the project here. Meaningful = changes that affect AI context, repo structure, system behavior, or developer understanding. Not every commit — only things worth remembering.

---

## 2026-04-26 — Phase 2 Canvas board upgrade

**Summary**: Phase 2 canvas transformed from a simple ELK-position graph viewer into a footprint-first factory board renderer. Site boards with visible grids, facility footprints sized from real grid dimensions, logistics rendered as physical infrastructure, and chain-aware module placement.

**Files created**:
- `src/layout/gridToCanvas.ts` — single source of truth for all grid-to-canvas coordinate conversion: PIXELS_PER_CELL (12), site board padding, inter-site gap, footprint-to-pixel conversion, rotation-aware sizing, site board origins, grid position to canvas position
- `src/layout/gridToCanvas.test.ts` — unit tests for gridToCanvas coordinate system
- `src/components/canvas/nodes/SiteOverlayNode.tsx` — React Flow custom node rendering a real site board with visible grid (minor every 5 cells, major every 10), header with site name + dimensions, occupancy badge

**Files modified**:
- `src/layout/buildReactFlowElements.ts` — refactored from ELK-position-first to footprint-first rendering; site overlay nodes now carry boardW/boardH/gridPixelW/gridPixelH; facility and logistics nodes now use gridPositionToCanvas for site-local coordinates; node data includes width/height/gridX/gridY; raw/import nodes use footprint sizing
- `src/components/canvas/ProductionCanvas.tsx` — site overlay nodes merged into flow node array as "siteOverlay" type; removed MiniMap; tuned fitView padding; removed RFNode/RFEdge generic import noise
- `src/components/canvas/useProductionCanvasModel.ts` — typed siteOverlays and nodes explicitly
- `src/components/canvas/nodes/FacilityNode.tsx` — sized from actual footprint dimensions (data.width/data.height); compact label; removed card chrome
- `src/components/canvas/nodes/LogisticsNode.tsx` — sized from footprint; type-based coloring (PORT/BUS/LOAD/UNL labels); dashed border
- `src/components/canvas/nodes/RawNode.tsx` — sized from footprint; compact labels; RAW/IMP suffix
- `src/layout/placeFacilities.ts` — chain-aware module placement: nodes grouped by chain, chains sorted final_assembly→seed_loop, upstream depth sorting (processed items placed left, raw items right), corridor between chains, classifications passed in from recomputePlan
- `src/store/recomputePlan.ts` — classifications now passed to placeFacilities
- `src/styles/globals.css` — added .facility-node, .logistics-node, .raw-node hover styles; canvas viewport min-height adjusted

**Files deleted**:
- `src/components/canvas/SiteOverlay.tsx` — replaced by SiteOverlayNode.tsx (component moved into nodes/ subdirectory)

**Key design decisions**:
- PIXELS_PER_CELL = 12 gives 840px for a 70-cell site (readable at default zoom)
- Site boards use 16px padding and 28px header height
- Grid lines: minor every 5 cells (opacity 0.5), major every 10 cells (full opacity)
- Multiple site boards arranged horizontally with 24px gap
- Facility/logistics nodes are sized from actual Facility.gridSize, LogisticsPlacement.size
- ELK positions still used for ordering hints within placeFacilities, but no longer drive visible coordinates
- Invisible handles (opacity: 0) used so edges connect properly without visual clutter
- Edge rendering de-emphasized: no smoothstep highlight, no arrow markers yet

**Verification**: `npm run build` ✅ `npm run test:run` ✅ 75/75 tests passing (11 new)

---

## 2026-04-15 — Phase 2 implementation: ELK.js + React Flow canvas

**Summary**: Phase 2 implementation executed in full. A generated layout pipeline was built from solver output through graph normalization, chain classification, site assignment, ELK skeleton layout, physical placement, and React Flow canvas rendering. Canvas view replaces Detailed view. Layout is derived-only, never persisted.

**Files created**:
- `src/layout/logisticsConstants.ts` — hardcoded logistics geometry constants (depot bus port 4x4, bus 4x8, loader/unloader 3x1, Valley perimeter slot rules, Wuling bus placement rules)
- `src/layout/types.ts` — Phase 2 layout domain types (NormalizedGraph, ChainClassification, SiteAssignment, PlacementFootprint, LogisticsPlacement, LayoutFeasibilityResult, etc.)
- `src/layout/normalizeProductionGraph.ts` — converts recursive ProductionNode[] into instance-level graph nodes/edges with stable IDs
- `src/layout/classifyChains.ts` — classifies chains by function (final_assembly, intermediate, raw_processing, seed_loop, import_fed) and emits placement hints
- `src/layout/assignSites.ts` — goal-chain-first, core-first site assignment with outpost spill for suitable chains
- `src/layout/buildElkGraph.ts` — builds ELK input graph from assigned production graph
- `src/layout/runElkLayout.ts` — central ELK wrapper with fallback positions on failure
- `src/layout/placeFacilities.ts` — row-based shelf packing inside site bounds, with soft density ceiling and corridor support
- `src/layout/placePerimeterLogistics.ts` — Valley Core-specific: discrete interior perimeter attachment slots for external buses, slot-capacity validation
- `src/layout/placeInternalLogistics.ts` — Wuling Core-specific: depot bus port/bus/loader-unloader placement with attachment rules
- `src/layout/buildReactFlowElements.ts` — converts final LayoutResult into React Flow nodes/edges/site overlays
- `src/components/canvas/ProductionCanvas.tsx` — React Flow canvas wrapper with fitView, controls, minimap
- `src/components/canvas/nodes/FacilityNode.tsx` — custom facility production node renderer
- `src/components/canvas/nodes/RawNode.tsx` — custom raw/import leaf node renderer
- `src/components/canvas/nodes/LogisticsNode.tsx` — custom logistics entity node renderer
- `src/components/canvas/SiteOverlay.tsx` — site boundary and occupancy overlay
- `src/components/canvas/CanvasLegend.tsx` — canvas semantics legend
- `src/components/canvas/useProductionCanvasModel.ts` — memoized adapter from store layout to canvas props

**Files modified**:
- `src/types/production.ts` — added `layout: ProductionLayoutResult | null` field to ProductionPlan
- `src/types/constants.ts` — (no changes needed; SiteId is a proper value enum)
- `src/store/defaultPlan.ts` — added `layout: null` to DEFAULT_PLAN
- `src/store/recomputePlan.ts` — refactored to synchronous `doSolve` path + async `recomputePlanAsync` full pipeline; `buildExternalInputRates` exported for store use
- `src/store/index.ts` — refactored to use recomputeSync for immediate state + async recomputePlanAsync for background layout; all goal/override/transfer actions now centralize through recomputeSync
- `src/components/ResultsTree.tsx` — replaced Detailed view with Canvas view; Summary/Canvas toggle
- `src/utils/persistence.ts` — added `layout: null` to export data; layout explicitly excluded from persisted plans
- `src/utils/persistence.test.ts` — updated test to verify layout is null in exported data
- `src/store/index.test.ts` — added `layout: null` to all MOCK_PLAN constants
- `docs/ai/01-meta.yaml` — updated active status and build description
- `docs/ai/02-system.yaml` — updated phase_2 status to "Implementation in progress"

**Key design decisions**:
- Layout is derived, never persisted — import/export only carries planner intent
- ELK used for dependency ordering/skeleton only, not final geometry
- Valley Core: external buses + discrete interior perimeter slots (14 slots available)
- Wuling Core: internal bus-port-bus-loader/unloader geometry with attachment rules
- Loader and unloader share identical 3x1 geometry; different direction semantics
- All site/logistics/transfer changes now trigger recomputation (fixing a pre-existing gap)
- store uses sync path for immediate UI updates + async path for background layout computation

**Verification**: `npm run build` ✅ `npm run test:run` ✅ 64/64 tests passing
