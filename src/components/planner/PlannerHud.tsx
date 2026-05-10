import { memo } from "react";
import { StatusRegionControl } from "./StatusRegionControl";
import { StatusSiteControl } from "./StatusSiteControl";
import { ImportExportControls } from "../tools/ImportExportControls";
import { useAppStore } from "@/store";

export const PlannerHud = memo(function PlannerHud() {
  const goalCount = useAppStore((s) => s.plan.goals.length);
  const errors = useAppStore((s) => s.plan.errors);
  const capWarnings = errors.filter((e) => e.includes("capped"));
  const solveErrors = errors.filter((e) => !e.includes("capped"));

  return (
    <div className="planner-hud">
      <div className="planner-hud__left">
        <div className="planner-hud__stat">
          <span className="planner-hud__stat-label">Goals</span>
          <span className="planner-hud__stat-value">{goalCount}</span>
        </div>
        <div className="planner-hud__divider" />
        <StatusRegionControl />
        <div className="planner-hud__divider" />
        <StatusSiteControl />
      </div>

      <div className="planner-hud__right">
        <ImportExportControls compact />
        <div className="planner-hud__divider" />
        {solveErrors.length > 0 && (
          <div className="planner-hud__error-badge" title={solveErrors[0]}>
            <span className="planner-hud__error-dot" />
            <span>{solveErrors.length}</span>
          </div>
        )}
        {capWarnings.length > 0 && (
          <div className="planner-hud__warn-badge" title={capWarnings[0]}>
            <span className="planner-hud__warn-dot" />
            <span>{capWarnings.length}</span>
          </div>
        )}
      </div>
    </div>
  );
});