import { memo } from "react";
import { CanvasLegend } from "../canvas/CanvasLegend";

export const PlannerHelpSidebar = memo(function PlannerHelpSidebar() {
  return (
    <div className="planner-help-sidebar">
      <div className="planner-help-sidebar__section">
        <div className="planner-help-sidebar__heading">Legend</div>
        <CanvasLegend variant="embedded" />
      </div>

      <div className="planner-help-sidebar__section">
        <div className="planner-help-sidebar__heading">How to Read the Board</div>
        <ul className="planner-help-sidebar__list">
          <li>
            <span className="planner-help-sidebar__badge planner-help-sidebar__badge--target">Target</span>
            {" "}— production goal
          </li>
          <li>
            <span className="planner-help-sidebar__badge planner-help-sidebar__badge--intermediate">Intermediate</span>
            {" "}— mid-chain facility
          </li>
          <li>
            <span className="planner-help-sidebar__badge planner-help-sidebar__badge--raw">Raw</span>
            {" "}— raw material input
          </li>
          <li>
            <span className="planner-help-sidebar__badge planner-help-sidebar__badge--logistics">Logistics</span>
            {" "}— belt / routing infrastructure
          </li>
        </ul>
      </div>

      <div className="planner-help-sidebar__section">
        <div className="planner-help-sidebar__heading">Layout</div>
        <p className="planner-help-sidebar__text">
          Facilities are auto-placed by the solver. Chains flow left to right within each site board. Use the region and site controls above to plan across multiple locations.
        </p>
      </div>
    </div>
  );
});