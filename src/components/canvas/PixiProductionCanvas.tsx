import { PIXELS_PER_CELL, SITE_HEADER_HEIGHT } from "@/layout/gridToCanvas";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PixiSceneModel } from "./usePixiSceneModel";
import { usePixiSceneModel } from "./usePixiSceneModel";
import { createMachineNode, updateMachineNode } from "./MachineRenderer";
import type { PixiFacilityRect } from "./usePixiSceneModel";

// ─── Colors ───────────────────────────────────────────────────────────────────
const GRID_MINOR_COLOR = 0x1e1e1e;
const GRID_MAJOR_COLOR = 0x2a2a2a;
const BELT_COLOR = 0xd4a844;
const BOARD_BG_COLOR = 0x121212;
const BOARD_HEADER_BG_COLOR = 0x1e1e1e;
const BOARD_BORDER_COLOR = 0x2a2a2a;
const BOARD_ACCENT_COLOR = 0xffa500;
const OCCUPANCY_WARN_COLOR = 0x8b4000;
const LOGISTICS_COLOR = 0x4a3a22;
const LOGISTICS_BORDER_COLOR = 0x7a6a3a;

// ─── Viewport constants ───────────────────────────────────────────────────────
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 8;
const ZOOM_FACTOR = 0.08;

interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

function fitViewport(
  worldBounds: { minX: number; minY: number; maxX: number; maxY: number },
  screenW: number,
  screenH: number,
  padding = 48,
): Viewport {
  const contentW = worldBounds.maxX - worldBounds.minX;
  const contentH = worldBounds.maxY - worldBounds.minY;
  if (contentW <= 0 || contentH <= 0) return { zoom: 1, panX: 0, panY: 0 };
  const availW = screenW - padding * 2;
  const availH = screenH - padding * 2;
  const zoom = Math.min(availW / contentW, availH / contentH, 1);
  const panX = (screenW - contentW * zoom) / 2 - worldBounds.minX * zoom;
  const panY = (screenH - contentH * zoom) / 2 - worldBounds.minY * zoom;
  return { zoom, panX, panY };
}

function clampZoom(z: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
}

// ─── Shared text styles (avoid recreating per draw) ────────────────────────────
const BOARD_NAME_STYLE = new TextStyle({
  fontFamily: "Montserrat, sans-serif",
  fontSize: 10,
  fontWeight: "700",
  fill: 0xb0b0b0,
  letterSpacing: 0.06,
});
const BOARD_DIM_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 7,
  fill: 0x444444,
});
const LOGISTICS_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 8,
  fontWeight: "bold",
  fill: 0xc8a84b,
});
const BANNER_STYLE = new TextStyle({
  fontFamily: "monospace",
  fontSize: 8,
  fill: 0xcc8800,
});

// ─── Grid line drawing ────────────────────────────────────────────────────────

function drawBoardGrid(
  g: Graphics,
  gridOriginX: number,
  gridOriginY: number,
  gridPixelW: number,
  gridPixelH: number,
  gridX: number,
  gridY: number,
  zoom: number,
) {
  g.rect(gridOriginX, gridOriginY, gridPixelW, gridPixelH);
  g.fill({ color: 0x0f0f0f });

  const minorAlpha = Math.min(0.25, 0.25 * Math.min(1, zoom * 3));
  if (minorAlpha > 0.04) {
    g.stroke({ width: 0.5, color: GRID_MINOR_COLOR, alpha: minorAlpha });
    for (let cx = 0; cx <= gridX; cx++) {
      const x = gridOriginX + cx * PIXELS_PER_CELL;
      g.moveTo(x, gridOriginY);
      g.lineTo(x, gridOriginY + gridPixelH);
    }
    for (let cy = 0; cy <= gridY; cy++) {
      const y = gridOriginY + cy * PIXELS_PER_CELL;
      g.moveTo(gridOriginX, y);
      g.lineTo(gridOriginX + gridPixelW, y);
    }
  }

  const majorAlpha = Math.min(0.55, 0.45 + zoom * 0.25);
  g.stroke({ width: 1, color: GRID_MAJOR_COLOR, alpha: majorAlpha });
  for (let cx = 0; cx <= gridX; cx += 5) {
    const x = gridOriginX + cx * PIXELS_PER_CELL;
    g.moveTo(x, gridOriginY);
    g.lineTo(x, gridOriginY + gridPixelH);
  }
  for (let cy = 0; cy <= gridY; cy += 5) {
    const y = gridOriginY + cy * PIXELS_PER_CELL;
    g.moveTo(gridOriginX, y);
    g.lineTo(gridOriginX + gridPixelW, y);
  }

  g.stroke({ width: 1.5, color: BOARD_BORDER_COLOR, alpha: 0.6 });
  g.rect(gridOriginX, gridOriginY, gridPixelW, gridPixelH);
}

// ─── Board building (called once per model, returns layer + overlay texts) ────

interface BoardLayerResult {
  boardG: Graphics;
  overlayTexts: Array<{ text: Text; x: number; y: number }>;
}

function buildBoardLayer(
  boards: PixiSceneModel["boards"],
  zoom: number,
): BoardLayerResult {
  const boardG = new Graphics();
  const overlayTexts: Array<{ text: Text; x: number; y: number }> = [];

  for (const board of boards) {
    const { boardX, boardY, boardW, boardH, gridX, gridY, siteName, occupancy } = board;

    // Background + header
    boardG.roundRect(boardX, boardY, boardW, boardH, 4);
    boardG.fill({ color: BOARD_BG_COLOR });
    boardG.stroke({ width: 1.5, color: BOARD_BORDER_COLOR, alpha: 0.7 });

    boardG.rect(boardX, boardY, boardW, SITE_HEADER_HEIGHT);
    boardG.fill({ color: BOARD_HEADER_BG_COLOR });

    boardG.rect(boardX, boardY + SITE_HEADER_HEIGHT - 2, boardW, 2);
    boardG.fill({ color: BOARD_ACCENT_COLOR, alpha: 0.35 });

    // Occupancy bar
    const barW = boardW - 16;
    const barH = 3;
    const barX = boardX + 8;
    const barY = boardY + SITE_HEADER_HEIGHT - 8;
    boardG.rect(barX, barY, barW, barH);
    boardG.fill({ color: 0x1a1a1a });
    const fillW = barW * Math.min(1, occupancy);
    if (fillW > 0) {
      boardG.rect(barX, barY, fillW, barH);
      boardG.fill({ color: occupancy > 0.7 ? OCCUPANCY_WARN_COLOR : 0x306040, alpha: 0.8 });
    }

    // Grid
    drawBoardGrid(
      boardG,
      board.gridOriginX,
      board.gridOriginY,
      board.gridPixelW,
      board.gridPixelH,
      gridX,
      gridY,
      zoom,
    );

    // Overlay texts (world space — will be added to worldContainer so they move with the scene)
    const nameText = new Text({ text: siteName.toUpperCase(), style: BOARD_NAME_STYLE });
    nameText.position.set(boardX + 8, boardY + 7);
    overlayTexts.push({ text: nameText, x: boardX + 8, y: boardY + 7 });

    const dimText = new Text({ text: `${gridX}×${gridY}`, style: BOARD_DIM_STYLE });
    dimText.position.set(boardX + boardW - dimText.width - 6, boardY + 7);
    overlayTexts.push({ text: dimText, x: boardX + boardW - dimText.width - 6, y: boardY + 7 });
  }

  return { boardG, overlayTexts };
}

// ─── Machine cache map ────────────────────────────────────────────────────────
// nodeId -> CachedMachine[]  (one entry per instance)
type MachineCache = Map<string, ReturnType<typeof createMachineNode>>;

function buildMachineLayer(
  facilities: PixiFacilityRect[],
  selectedId: string | null,
  hoveredId: string | null,
  cache: MachineCache,
): { facLayer: Container; overlayTexts: Array<{ text: Text; x: number; y: number }> } {
  const facLayer = new Container();
  const overlayTexts: Array<{ text: Text; x: number; y: number }> = [];

  for (const fac of facilities) {
    let cached = cache.get(fac.id);
    if (!cached) {
      cached = createMachineNode(fac);
      cache.set(fac.id, cached);
    }
    updateMachineNode(cached, fac, {
      selected: fac.id === selectedId,
      hovered: fac.id === hoveredId,
    });
    facLayer.addChild(cached.container);
  }

  return { facLayer, overlayTexts };
}

// ─── Logistics layer (static, rebuilt per model) ─────────────────────────────

function buildLogisticsLayer(
  logistics: PixiSceneModel["logistics"],
): { logG: Graphics; overlayTexts: Array<{ text: Text; x: number; y: number }> } {
  const logG = new Graphics();
  const overlayTexts: Array<{ text: Text; x: number; y: number }> = [];

  for (const log of logistics) {
    const { x, y, w, h, label } = log;
    logG.roundRect(x, y, w, h, 1);
    logG.fill({ color: LOGISTICS_COLOR, alpha: 0.8 });
    logG.stroke({ width: 1, color: LOGISTICS_BORDER_COLOR, alpha: 0.8 });

    const logStyle = LOGISTICS_STYLE.clone();
    const fontSize = Math.max(6, Math.min(9, Math.min(w, h) / 2.8));
    logStyle.fontSize = fontSize;
    const logText = new Text({ text: label, style: logStyle });
    logText.position.set(x + w / 2 - logText.width / 2, y + h / 2 - logText.height / 2);
    overlayTexts.push({ text: logText, x: logText.x, y: logText.y });
  }

  return { logG, overlayTexts };
}

// ─── Belt layer (static, rebuilt per model) ───────────────────────────────────

function buildBeltLayer(belts: PixiSceneModel["belts"]): Graphics {
  const beltsG = new Graphics();
  for (const belt of belts) {
    if (belt.pixelPath.length < 2) continue;
    const pts = belt.pixelPath;
    beltsG.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      beltsG.lineTo(pts[i].x, pts[i].y);
    }
    beltsG.stroke({ width: 2.5, color: BELT_COLOR, alpha: 0.65 });
  }
  return beltsG;
}

// ─── Banner (reused, updated in place) ────────────────────────────────────────

function updateBanner(app: Application, bannerG: Graphics, bannerText: Text, failures: PixiSceneModel["failures"]): void {
  if (failures.length === 0) {
    bannerG.visible = false;
    bannerText.visible = false;
    return;
  }
  bannerG.visible = true;
  bannerText.visible = true;
  bannerG.clear();
  bannerG.rect(0, 0, app.screen.width, 26);
  bannerG.fill({ color: 0x2a1a00, alpha: 0.92 });
  bannerG.stroke({ width: 1, color: 0x7a3a00, alpha: 0.6 });
  bannerText.text = failures.map((f) => `${f.message}${f.suggestion ? ` → ${f.suggestion}` : ""}`).join("  ·  ");
}

// ─── Main canvas component ────────────────────────────────────────────────────

interface PixiProductionCanvasProps {
  layout: import("@/layout/types").ProductionLayoutResult | null;
}

function PixiProductionCanvasInner({ layout }: PixiProductionCanvasProps) {
  const model = usePixiSceneModel(layout);
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const worldContainerRef = useRef<Container | null>(null);
  const overlayContainerRef = useRef<Container | null>(null);

  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, panX: 0, panY: 0 });
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isDragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // Persistent layer refs
  const bgRef = useRef<Graphics | null>(null);
  const bannerGRef = useRef<Graphics | null>(null);
  const bannerTextRef = useRef<Text | null>(null);
  const boardLayerRef = useRef<Container | null>(null);
  const beltLayerRef = useRef<Container | null>(null);
  const logLayerRef = useRef<Container | null>(null);
  const facLayerRef = useRef<Container | null>(null);
  const machineCache = useRef<MachineCache>(new Map());

  // ─── Init Pixi ──────────────────────────────────────────────────────────────

  const initPixi = useCallback(async () => {
    if (!containerRef.current) return;

    const existing = appRef.current;
    if (existing) {
      existing.destroy(true, { children: true, texture: true });
      appRef.current = null;
    }

    const app = new Application();
    await app.init({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: 0x111111,
      resizeTo: containerRef.current,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
    appRef.current = app;

    const worldContainer = new Container();
    const overlayContainer = new Container();
    app.stage.addChild(worldContainer);
    app.stage.addChild(overlayContainer);
    worldContainerRef.current = worldContainer;
    overlayContainerRef.current = overlayContainer;

    // Create persistent objects
    bgRef.current = new Graphics();
    app.stage.addChildAt(bgRef.current, 0);

    bannerGRef.current = new Graphics();
    app.stage.addChild(bannerGRef.current);

    bannerTextRef.current = new Text({ text: "", style: BANNER_STYLE });
    bannerTextRef.current.position.set(8, 7);
    app.stage.addChild(bannerTextRef.current);

    boardLayerRef.current = new Container();
    beltLayerRef.current = new Container();
    logLayerRef.current = new Container();
    facLayerRef.current = new Container();
  }, []);

  // ─── Pixi lifecycle ─────────────────────────────────────────────────────────

  useEffect(() => {
    void initPixi();
    return () => {
      const app = appRef.current;
      if (app) {
        app.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, [initPixi]);

  // ─── Fit to view on first meaningful layout ─────────────────────────────────

  useEffect(() => {
    if (!model.hasLayout) return;
    const newId = JSON.stringify({
      siteLayouts: model.boards.map((b) => b.siteId),
      facilityCount: model.facilities.length,
    });
    if (newId !== layoutId) {
      setLayoutId(newId);
      const app = appRef.current;
      if (app) {
        const fit = fitViewport(model.worldBounds, app.screen.width, app.screen.height);
        setViewport(fit);
      }
    }
  }, [model.hasLayout, model.worldBounds, model.boards, model.facilities, layoutId]);

  // ─── Build static layers when model changes ─────────────────────────────────

  useEffect(() => {
    const app = appRef.current;
    const worldContainer = worldContainerRef.current;
    const overlayContainer = overlayContainerRef.current;
    if (!app || !worldContainer || !overlayContainer || !model.hasLayout) return;

    const { zoom, panX, panY } = viewportRef.current;

    // Remove old layers
    worldContainer.removeChildren();
    overlayContainer.removeChildren();
    machineCache.current.clear();

    // Background
    if (bgRef.current) {
      bgRef.current.clear();
      bgRef.current.rect(0, 0, app.screen.width, app.screen.height);
      bgRef.current.fill({ color: 0x0e0e0e });
    }

    // Boards layer (world space)
    const { boardG, overlayTexts: boardTexts } = buildBoardLayer(model.boards, zoom);
    worldContainer.addChild(boardLayerRef.current!);
    boardLayerRef.current!.removeChildren();
    boardLayerRef.current!.addChild(boardG);

    // Board texts go in worldContainer so they pan/zoom with the scene
    for (const { text } of boardTexts) {
      worldContainer.addChild(text);
    }

    // Belts
    const beltsG = buildBeltLayer(model.belts);
    worldContainer.addChild(beltLayerRef.current!);
    beltLayerRef.current!.removeChildren();
    beltLayerRef.current!.addChild(beltsG);

    // Logistics
    const { logG, overlayTexts: logTexts } = buildLogisticsLayer(model.logistics);
    worldContainer.addChild(logLayerRef.current!);
    logLayerRef.current!.removeChildren();
    logLayerRef.current!.addChild(logG);
    for (const { text } of logTexts) {
      worldContainer.addChild(text);
    }

    // Facilities (cached, built fresh)
    worldContainer.addChild(facLayerRef.current!);
    facLayerRef.current!.removeChildren();
    const { facLayer } = buildMachineLayer(model.facilities, selectedId, hoveredId, machineCache.current);
    facLayerRef.current!.addChild(facLayer);

    // Banner
    if (bannerGRef.current && bannerTextRef.current) {
      updateBanner(app, bannerGRef.current, bannerTextRef.current, model.failures);
    }

    // Apply viewport
    worldContainer.position.set(panX, panY);
    worldContainer.scale.set(zoom);
  }, [model, viewport, selectedId, hoveredId]);

  // ─── Viewport-only update (no scene rebuild) ────────────────────────────────

  useEffect(() => {
    const worldContainer = worldContainerRef.current;
    if (!worldContainer) return;
    const { zoom, panX, panY } = viewport;
    worldContainer.position.set(panX, panY);
    worldContainer.scale.set(zoom);
  }, [viewport]);

  // ─── Hover/select update (only update affected machine nodes) ───────────────

  useEffect(() => {
    const facLayer = facLayerRef.current;
    if (!facLayer) return;
    const cache = machineCache.current;
    for (const fac of model.facilities) {
      const cached = cache.get(fac.id);
      if (cached) {
        updateMachineNode(cached, fac, {
          selected: fac.id === selectedId,
          hovered: fac.id === hoveredId,
        });
      }
    }
  }, [model.facilities, selectedId, hoveredId]);

  // ─── Pointer interactions ───────────────────────────────────────────────────

  const findFacilityAt = useCallback(
    (clientX: number, clientY: number): PixiFacilityRect | null => {
      const v = viewportRef.current;
      for (const fac of model.facilities) {
        const sx = fac.x * v.zoom + v.panX;
        const sy = fac.y * v.zoom + v.panY;
        const sw = fac.w * v.zoom;
        const sh = fac.h * v.zoom;
        if (clientX >= sx && clientX <= sx + sw && clientY >= sy && clientY <= sy + sh) {
          return fac;
        }
      }
      return null;
    },
    [model.facilities],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const facility = findFacilityAt(e.clientX, e.clientY);
      if (facility) {
        setSelectedId((prev) => (prev === facility.id ? null : facility.id));
      } else {
        isDragging.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
      }
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [findFacilityAt],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Skip hover detection while dragging
      if (isDragging.current) {
        setHoveredId(null);
      } else {
        const facility = findFacilityAt(e.clientX, e.clientY);
        setHoveredId(facility ? facility.id : null);
      }

      if (!isDragging.current || !lastPointer.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setViewport((v) => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
    },
    [findFacilityAt],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    lastPointer.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // ─── Wheel zoom ────────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const app = appRef.current;
    if (!app) return;

    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const v = viewportRef.current;
    const factor = e.deltaY < 0 ? 1 + ZOOM_FACTOR : 1 - ZOOM_FACTOR;
    const newZoom = clampZoom(v.zoom * factor);
    const scale = newZoom / v.zoom;
    setViewport({
      zoom: newZoom,
      panX: mouseX - (mouseX - v.panX) * scale,
      panY: mouseY - (mouseY - v.panY) * scale,
    });
  }, []);

  // ─── HUD controls ──────────────────────────────────────────────────────────

  const handleFit = useCallback(() => {
    const app = appRef.current;
    if (!app || !model.hasLayout) return;
    setViewport(fitViewport(model.worldBounds, app.screen.width, app.screen.height));
  }, [model.hasLayout, model.worldBounds]);

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: isDragging.current ? "grabbing" : hoveredId ? "pointer" : "grab",
        }}
      />

      {/* Canvas HUD — top-right controls */}
      <div className="canvas-hud">
        <button
          className="canvas-hud__btn"
          onClick={handleFit}
          title="Reset view"
          aria-label="Reset view"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 5L9 9M5 9L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Empty state */}
      {!model.hasLayout && (
        <div className="production-canvas-empty">
          <div className="production-canvas-empty__inner">
            No layout computed yet. Add goals to generate a layout.
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductionCanvas(props: PixiProductionCanvasProps) {
  return <PixiProductionCanvasInner {...props} />;
}

export default PixiProductionCanvasInner;
