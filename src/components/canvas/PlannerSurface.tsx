import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductionLayoutResult } from "@/layout/types";
import { usePlannerSceneModel } from "./usePlannerSceneModel";
import { useCanvasViewport } from "./useCanvasViewport";
import { BoardLayer } from "./BoardLayer";
import { LogisticsLayer } from "./LogisticsLayer";
import { pathToSegments } from "./belts";
import type { PlannerMachine, PlannerBelt } from "./usePlannerSceneModel";
import { getFacilityVisual } from "./facilityVisuals";
import { ROLE_COLORS } from "./facilityVisuals";

interface PlannerSurfaceProps {
  layout: ProductionLayoutResult | null;
  /** Forwards the fit() function to PlannerPage so PlannerHud can call it */
  fitRef?: React.MutableRefObject<(() => void) | null>;
}

export function PlannerSurface({ layout, fitRef }: PlannerSurfaceProps) {
  const model = usePlannerSceneModel(layout);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    viewport,
    fit,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  } = useCanvasViewport(containerRef, model.hasLayout ? model.worldBounds : null);

  // Expose fit to parent via ref
  if (fitRef) fitRef.current = fit;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fit to content on first meaningful layout
  useEffect(() => {
    if (!model.hasLayout) return;
    // Small delay to ensure container is sized
    const timer = setTimeout(() => {
      fit();
    }, 10);
    return () => clearTimeout(timer);
  }, [model.hasLayout, fit]);

  // Click-to-select on machine tiles
  const handleWorldClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const tile = target.closest("[data-machine-id]") as HTMLElement | null;
    if (tile) {
      const id = tile.getAttribute("data-machine-id");
      setSelectedId((prev) => (prev === id ? null : id));
    } else {
      setSelectedId(null);
    }
  }, []);

  const transform = `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`;

  return (
    <div
      className="planner-surface"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >


      <div className="planner-surface__viewport">
        <div
          className="planner-surface__world"
          style={{ transform }}
          onClick={handleWorldClick}
        >
          <BoardLayer boards={model.boards} />
          <LogisticsLayer logistics={model.logistics} />
          <BeltLayer belts={model.belts} />
          <MachineLayer
            machines={model.machines}
            selectedId={selectedId}
          />
        </div>
      </div>

    </div>
  );
}

// ─── Belt Layer ──────────────────────────────────────────────────────────────

function BeltLayer({ belts }: { belts: PlannerBelt[] }) {
  return (
    <div className="belt-layer">
      {belts.map((belt) => {
        const segments = pathToSegments(belt.pixelPath);
        return segments.map((seg, i) => (
          <div
            key={`${belt.edgeId}-${i}`}
            className={`belt-segment ${seg.type}`}
            style={{
              left: seg.x,
              top: seg.y,
              width: seg.w || undefined,
              height: seg.h || undefined,
            }}
          />
        ));
      })}
    </div>
  );
}

// ─── Machine Layer ────────────────────────────────────────────────────────────

const ROLE_TRI_SIZE = 8;

function MachineLayer({
  machines,
  selectedId,
}: {
  machines: PlannerMachine[];
  selectedId: string | null;
}) {
  return (
    <div className="machine-layer">
      {machines.map((m) => {
        const visual = getFacilityVisual(m.facilityId, m.category);
        const roleColor =
          ROLE_COLORS[m.role as keyof typeof ROLE_COLORS] ??
          ROLE_COLORS.intermediate;

        return (
          <div
            key={m.id}
            data-machine-id={m.id}
            className={[
              "machine-tile",
              m.isTarget ? "target" : "",
              selectedId === m.id ? "selected" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              left: m.x,
              top: m.y,
              width: m.w,
              height: m.h,
              background: "#" + visual.baseColor.toString(16).padStart(6, "0"),
            }}
          >
            <div className="machine-tile__body" />
            <div className="machine-tile__label">{m.facilityName || "???"}</div>
            <div
              className="machine-tile__sublabel"
              style={{ top: m.facilityName ? 16 : 3 }}
            >
              {m.outputItemName || "???"}
            </div>
            <div
              className="machine-tile__corner-role"
              style={{
                borderWidth: `${ROLE_TRI_SIZE}px ${ROLE_TRI_SIZE}px 0 0`,
                borderColor: `${roleColor} transparent transparent transparent`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
