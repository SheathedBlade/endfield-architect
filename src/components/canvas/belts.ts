/**
 * Converts a pixel path into a sequence of drawable belt segments.
 * Each segment is a { x, y, w, h, type } rect ready to be rendered as CSS.
 */

export type BeltSegmentType = "straight-h" | "straight-v" | "corner" | "end-arrow";

export interface BeltSegment {
  x: number;
  y: number;
  w: number;
  h: number;
  type: BeltSegmentType;
}

const BELT_THICKNESS = 4;

export function pathToSegments(path: { x: number; y: number }[]): BeltSegment[] {
  if (path.length < 2) return [];

  const segments: BeltSegment[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const p0 = path[i];
    const p1 = path[i + 1];

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;

    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) continue;

    // Horizontal segment
    if (Math.abs(dy) < Math.abs(dx)) {
      const minX = Math.min(p0.x, p1.x);
      segments.push({
        x: minX,
        y: p0.y - BELT_THICKNESS / 2,
        w: Math.abs(dx),
        h: BELT_THICKNESS,
        type: "straight-h",
      });
    }
    // Vertical segment
    else {
      const minY = Math.min(p0.y, p1.y);
      segments.push({
        x: p0.x - BELT_THICKNESS / 2,
        y: minY,
        w: BELT_THICKNESS,
        h: Math.abs(dy),
        type: "straight-v",
      });
    }

    // Corner at intermediate points
    if (i > 0 && i < path.length - 2) {
      const prev = path[i - 1];
      const curr = p0;
      const next = p1;

      const prevDx = curr.x - prev.x;
      const prevDy = curr.y - prev.y;
      const nextDx = next.x - curr.x;
      const nextDy = next.y - curr.y;

      const dirChanged = Math.sign(prevDx) !== Math.sign(nextDx) || Math.sign(prevDy) !== Math.sign(nextDy);

      if (dirChanged) {
        const minX = Math.min(prev.x, curr.x, next.x);
        const minY = Math.min(prev.y, curr.y, next.y);
        const maxX = Math.max(prev.x, curr.x, next.x);
        const maxY = Math.max(prev.y, curr.y, next.y);
        segments.push({
          x: minX - 2,
          y: minY - 2,
          w: maxX - minX + 4,
          h: maxY - minY + 4,
          type: "corner",
        });
      }
    }

    // End arrow on last segment
    if (i === path.length - 2) {
      const last = path[path.length - 1];
      const prev = path[path.length - 2];
      const dx = last.x - prev.x;
      const dy = last.y - prev.y;

      if (Math.abs(dy) >= Math.abs(dx)) {
        segments.push({
          x: last.x - BELT_THICKNESS / 2,
          y: dy < 0 ? last.y - 10 : last.y,
          w: BELT_THICKNESS,
          h: 10,
          type: "end-arrow",
        });
      } else {
        segments.push({
          x: dx < 0 ? last.x - 10 : last.x,
          y: last.y - BELT_THICKNESS / 2,
          w: 10,
          h: BELT_THICKNESS,
          type: "end-arrow",
        });
      }
    }
  }

  return segments;
}
