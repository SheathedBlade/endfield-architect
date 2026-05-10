interface CanvasHudProps {
  onFit: () => void;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function CanvasHud({ onFit, zoom, onZoomIn, onZoomOut }: CanvasHudProps) {
  // Single-button mode: only onFit provided (new Reset View button)
  if (!onZoomIn && !onZoomOut) {
    return (
      <div className="canvas-hud">
        <button
          className="canvas-hud__btn"
          onClick={onFit}
          title="Reset view"
          aria-label="Reset view"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 5L9 9M5 9L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  // Legacy 4-button mode (zoom in / out / fit / %)
  return (
    <div className="canvas-hud">
      <button className="canvas-hud__btn" onClick={onFit} title="Fit to view">
        ⊙
      </button>
      <button className="canvas-hud__btn" onClick={onZoomOut} title="Zoom out">
        −
      </button>
      <span className="canvas-hud__zoom">{Math.round((zoom ?? 1) * 100)}%</span>
      <button className="canvas-hud__btn" onClick={onZoomIn} title="Zoom in">
        +
      </button>
    </div>
  );
}
