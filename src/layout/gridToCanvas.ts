/**
 * Grid-to-canvas coordinate conversion and sizing constants.
 *
 * All visual rendering in the Canvas uses this module as the single source
 * of truth for:
 *   - grid cell size in pixels
 *   - site board padding and spacing
 *   - footprint → pixel size conversion
 *   - rotation-aware sizing
 *   - multi-site board layout offsets
 *
 * This decouples physical placement logic from visual rendering so that
 * changes to pixel scale or board layout don't ripple through every renderer.
 */

// ─── Pixel scale ─────────────────────────────────────────────────────────────

/** One grid unit = PIXELS_PER_CELL pixels */
export const PIXELS_PER_CELL = 12;

// ─── Site board layout ────────────────────────────────────────────────────────

/** Padding around the playable grid area within a site board (pixels) */
export const SITE_BOARD_PADDING = 16;

/** Extra gap between multiple site boards rendered side by side (pixels) */
export const INTER_SITE_GAP = 24;

/** Height of the site name header band at the top of a board (pixels) */
export const SITE_HEADER_HEIGHT = 28;

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Convert a grid-unit width/height to pixels */
export function gridToPixels(dim: [number, number]): { w: number; h: number } {
  const [gw, gh] = dim;
  const isRotated = gw > gh;
  const pixelW = (isRotated ? gh : gw) * PIXELS_PER_CELL;
  const pixelH = (isRotated ? gw : gh) * PIXELS_PER_CELL;
  return { w: pixelW, h: pixelH };
}

/** Convert a grid-unit width/height to pixels, respecting rotation flag */
export function footprintToPixels(
  footprint: [number, number],
  rotation: 0 | 90,
): { w: number; h: number } {
  const [gw, gh] = footprint;
  if (rotation === 90) {
    return { w: gh * PIXELS_PER_CELL, h: gw * PIXELS_PER_CELL };
  }
  return { w: gw * PIXELS_PER_CELL, h: gh * PIXELS_PER_CELL };
}

/** Full board pixel size for a site with given grid dimensions */
export function siteBoardSize(gridW: number, gridH: number): {
  boardW: number;
  boardH: number;
  gridPixelW: number;
  gridPixelH: number;
} {
  const gridPixelW = gridW * PIXELS_PER_CELL;
  const gridPixelH = gridH * PIXELS_PER_CELL;
  return {
    boardW: gridPixelW + SITE_BOARD_PADDING * 2,
    boardH: gridPixelH + SITE_BOARD_PADDING * 2 + SITE_HEADER_HEIGHT,
    gridPixelW,
    gridPixelH,
  };
}

/** Grid origin within a site board (top-left of the playable grid area) */
export function siteGridOrigin(): { x: number; y: number } {
  return {
    x: SITE_BOARD_PADDING,
    y: SITE_BOARD_PADDING + SITE_HEADER_HEIGHT,
  };
}

/**
 * Playable grid rect within a board (inside the padded area, below the header).
 */
export function siteGridRect(boardX: number, boardY: number, gridPixelW: number, gridPixelH: number): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const origin = siteGridOrigin();
  return {
    x: boardX + origin.x,
    y: boardY + origin.y,
    w: gridPixelW,
    h: gridPixelH,
  };
}

/**
 * Board rect (full board including header + padding + grid).
 */
export function siteBoardRect(boardX: number, boardY: number, boardW: number, boardH: number): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  return { x: boardX, y: boardY, w: boardW, h: boardH };
}

/**
 * Compute canvas positions for multiple site boards arranged in a row.
 * Returns each board's canvas top-left origin.
 */
export function computeSiteBoardOrigins(
  siteGridSizes: [number, number][],
): { x: number; y: number }[] {
  const origins: { x: number; y: number }[] = [];
  let currentX = 0;

  for (const [gw, gh] of siteGridSizes) {
    const { boardW } = siteBoardSize(gw, gh);
    origins.push({ x: currentX, y: 0 });
    currentX += boardW + INTER_SITE_GAP;
  }

  return origins;
}

/** Convert a grid-local placement position to canvas pixel position */
export function gridPositionToCanvas(
  gridX: number,
  gridY: number,
  boardOrigin: { x: number; y: number },
): { x: number; y: number } {
  return {
    x: boardOrigin.x + gridX * PIXELS_PER_CELL,
    y: boardOrigin.y + gridY * PIXELS_PER_CELL,
  };
}

/**
 * Compute world bounds for a set of sites with grid sizes.
 * Useful for fitting the viewport.
 */
export function computeWorldBounds(siteGridSizes: [number, number][]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let currentX = 0;

  for (const [gw, gh] of siteGridSizes) {
    const { boardW, boardH } = siteBoardSize(gw, gh);
    minX = Math.min(minX, currentX);
    minY = Math.min(minY, 0);
    maxX = Math.max(maxX, currentX + boardW);
    maxY = Math.max(maxY, boardH);
    currentX += boardW + INTER_SITE_GAP;
  }

  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  }
  return { minX, minY, maxX, maxY };
}