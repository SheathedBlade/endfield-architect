/**
 * Belt routing using A* pathfinding.
 *
 * Computes belt routes between connected facilities within a site.
 * Uses pathfinding.js to find collision-free paths through the site grid,
 * routing around facility footprints.
 */

import type { NormalizedGraph, SiteLayout } from "./types";

export type BeltRoute = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  siteId: string;
  gridPath: { x: number; y: number }[];
  pixelPath: { x: number; y: number }[];
};

type PfModule = {
  Grid: new (w: number, h: number, m: number[][]) => unknown;
  AStarFinder: new (opt: {
    heuristic: (dx: number, dy: number) => number;
    diagonalMovement: number;
  }) => {
    findPath(x1: number, y1: number, x2: number, y2: number, grid: unknown): [number, number][];
  };
  DiagonalMovement: { Never: number };
  Heuristic: { euclidean: (dx: number, dy: number) => number };
};

let _pf: PfModule | null = null;

async function getPathfinding(): Promise<PfModule> {
  if (_pf) return _pf;
  const mod = await import("pathfinding");
  _pf = mod as unknown as PfModule;
  return _pf;
}

type NodePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function outputSide(facility: NodePosition): { x: number; y: number } {
  return {
    x: facility.x + facility.width - 1,
    y: facility.y + Math.floor(facility.height / 2),
  };
}

function inputSide(facility: NodePosition): { x: number; y: number } {
  return { x: facility.x, y: facility.y + Math.floor(facility.height / 2) };
}

function buildOccupiedGrid(
  siteLayout: SiteLayout,
  siteWidth: number,
  siteHeight: number,
): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < siteHeight; y++) {
    const row: number[] = [];
    for (let x = 0; x < siteWidth; x++) {
      row.push(0);
    }
    grid.push(row);
  }

  for (const fp of siteLayout.facilityPlacements) {
    const [fw, fh] = fp.size;
    for (let dy = 0; dy < fh; dy++) {
      for (let dx = 0; dx < fw; dx++) {
        const gy = fp.position.y + dy;
        const gx = fp.position.x + dx;
        if (gy >= 0 && gy < siteHeight && gx >= 0 && gx < siteWidth) {
          grid[gy][gx] = 1;
        }
      }
    }
  }

  return grid;
}

async function findGridPath(
  grid: number[][],
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): Promise<{ x: number; y: number }[] | null> {
  const pf = await getPathfinding();
  const width = grid[0].length;
  const height = grid.length;

  const pfGrid = new pf.Grid(width, height, grid);
  const finder = new pf.AStarFinder({
    heuristic: pf.Heuristic.euclidean,
    diagonalMovement: pf.DiagonalMovement.Never,
  });

  const path = finder.findPath(startX, startY, endX, endY, pfGrid);
  if (path.length < 2) return null;

  return path.map((p) => ({ x: p[0], y: p[1] }));
}

export async function routeBelts(
  graph: NormalizedGraph,
  siteLayout: SiteLayout,
  PIXELS_PER_CELL: number,
  gridOriginX: number,
  gridOriginY: number,
): Promise<BeltRoute[]> {
  const routes: BeltRoute[] = [];

  const site = siteLayout.siteId;
  const [siteWidth, siteHeight] =
    siteLayout.usableRect.width > 0
      ? [siteLayout.usableRect.width, siteLayout.usableRect.height]
      : [70, 70];

  const siteGrid = buildOccupiedGrid(siteLayout, siteWidth, siteHeight);

  const nodePositions = new Map<string, NodePosition>();
  for (const fp of siteLayout.facilityPlacements) {
    const node = graph.nodes.find((n) => n.id === fp.nodeId);
    if (!node) continue;
    const [fw, fh] = fp.size;
    nodePositions.set(fp.nodeId, {
      x: fp.position.x,
      y: fp.position.y,
      width: fw,
      height: fh,
    });
  }

  for (const edge of graph.edges) {
    const fromPos = nodePositions.get(edge.from);
    const toPos = nodePositions.get(edge.to);
    if (!fromPos || !toPos) continue;

    const fromNode = graph.nodes.find((n) => n.id === edge.from);
    const toNode = graph.nodes.find((n) => n.id === edge.to);
    if (fromNode?.siteId !== site || toNode?.siteId !== site) continue;

    const start = outputSide(fromPos);
    const end = inputSide(toPos);

    const gridPath = await findGridPath(siteGrid, start.x, start.y, end.x, end.y);
    if (!gridPath) continue;

    const pixelPath = gridPath.map((p) => ({
      x: gridOriginX + p.x * PIXELS_PER_CELL + PIXELS_PER_CELL / 2,
      y: gridOriginY + p.y * PIXELS_PER_CELL + PIXELS_PER_CELL / 2,
    }));

    routes.push({
      edgeId: edge.id,
      fromNodeId: edge.from,
      toNodeId: edge.to,
      siteId: site,
      gridPath,
      pixelPath,
    });
  }

  return routes;
}
