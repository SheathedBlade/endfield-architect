import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { loadPlanFromURL } from "../utils/persistence";
import { PlannerSurface } from "../components/canvas/PlannerSurface";
import { PlannerHud } from "../components/planner/PlannerHud";
import { PlannerSidebar } from "../components/planner/PlannerSidebar";
import { PlannerLeftTabs } from "../components/planner/PlannerLeftTabs";
import { PlannerHelpSidebar } from "../components/planner/PlannerHelpSidebar";

const PlannerPage = () => {
  const { importPlan } = useAppStore();
  const layout = useAppStore((s) => s.plan.layout);

  const [rightCollapsed, setRightCollapsed] = useState(true);
  const fitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const loaded = loadPlanFromURL();
    if (loaded) importPlan(loaded);
  }, [importPlan]);

  return (
    <div className="planner-workspace">
      {/* Top HUD */}
      <PlannerHud onResetView={fitRef.current ? () => fitRef.current!() : undefined} />

      {/* Main stage */}
      <div className="planner-stage">
        {/* Canvas — always mounted so Pixi stays ready */}
        <PlannerSurface layout={layout} fitRef={fitRef} />

        {/* Floating controls island */}
        <PlannerLeftTabs />

        {/* Right floating help sidebar */}
        {!rightCollapsed && (
          <PlannerSidebar
            side="right"
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed((c) => !c)}
            title="Help"
          >
            <PlannerHelpSidebar />
          </PlannerSidebar>
        )}
      </div>
    </div>
  );
};

export default PlannerPage;