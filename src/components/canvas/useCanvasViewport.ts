import { useCallback, useRef, useState } from "react";

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 8;
const ZOOM_FACTOR = 0.08;

export function fitViewport(
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

export function worldToScreen(
  wx: number,
  wy: number,
  zoom: number,
  panX: number,
  panY: number,
): { sx: number; sy: number } {
  return { sx: wx * zoom + panX, sy: wy * zoom + panY };
}

export function useCanvasViewport(
  containerRef: React.RefObject<HTMLDivElement | null>,
  worldBounds: { minX: number; minY: number; maxX: number; maxY: number } | null,
) {
  const [viewport, setViewport] = useState<Viewport>({ zoom: 1, panX: 0, panY: 0 });
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const isDragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el || !worldBounds) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    setViewport(fitViewport(worldBounds, w, h));
  }, [worldBounds, containerRef]);

  const zoomIn = useCallback(() => {
    setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom * 1.3) }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewport((v) => ({ ...v, zoom: clampZoom(v.zoom / 1.3) }));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !lastPointer.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setViewport((v) => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    lastPointer.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
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
  }, [containerRef]);

  return {
    viewport,
    viewportRef,
    fit,
    zoomIn,
    zoomOut,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    isDragging,
  };
}
