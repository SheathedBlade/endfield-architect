interface CanvasHudProps {
  zoom: number;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function CanvasHud({ zoom, onFit, onZoomIn, onZoomOut }: CanvasHudProps) {
  return (
    <div className="canvas-hud">
      <button className="canvas-hud__btn" onClick={onFit} title="Fit to view">
        ⊙
      </button>
      <button className="canvas-hud__btn" onClick={onZoomOut} title="Zoom out">
        −
      </button>
      <span className="canvas-hud__zoom">{Math.round(zoom * 100)}%</span>
      <button className="canvas-hud__btn" onClick={onZoomIn} title="Zoom in">
        +
      </button>
    </div>
  );
}
