import { memo } from "react";

interface CanvasLegendProps {
  variant?: "overlay" | "embedded";
}

export const CanvasLegend = memo(function CanvasLegend({
  variant = "overlay",
}: CanvasLegendProps) {
  const rootClass =
    variant === "embedded"
      ? "canvas-legend canvas-legend--embedded"
      : "canvas-legend";

  return (
    <div className={rootClass}>
      <div className="canvas-legend__title">Legend</div>
      <div className="canvas-legend__rows">
        <div className="canvas-legend__row">
          <div
            className="canvas-legend__swatch"
            style={{
              background: "var(--color-accent)",
              border: "1.5px solid var(--color-accent)",
            }}
          />
          <span>Goal / Target</span>
        </div>
        <div className="canvas-legend__row">
          <div
            className="canvas-legend__swatch"
            style={{
              background: "var(--color-bg-surface)",
              border: "1.5px solid var(--color-border-mid)",
            }}
          />
          <span>Intermediate</span>
        </div>
        <div className="canvas-legend__row">
          <div
            className="canvas-legend__swatch"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
            }}
          />
          <span>Raw / Imported</span>
        </div>
        <div className="canvas-legend__row">
          <div
            className="canvas-legend__swatch"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1.5px dashed var(--color-text-muted)",
            }}
          />
          <span>Logistics</span>
        </div>
      </div>
    </div>
  );
});
