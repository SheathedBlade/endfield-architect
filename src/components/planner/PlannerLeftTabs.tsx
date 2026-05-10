import { memo, useState } from "react";
import GoalInput from "../GoalInput";
import PlannerTools from "../PlannerTools";
import MetastorageTransfer from "../transfers/MetastorageTransfer";
import { GoalGroup } from "../results/GoalGroup";
import { ResultsSummaryStrip } from "../results/ResultsSummaryStrip";
import { useAppStore } from "@/store";
import { X } from "lucide-react";

type TabId = "goals" | "tools" | "transfers" | "summary";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "goals", label: "Goals" },
  { id: "tools", label: "Tools" },
  { id: "transfers", label: "Transfers" },
  { id: "summary", label: "Summary" },
];

const PANEL_TITLES: Record<TabId, string> = {
  goals: "Goals",
  tools: "Tools",
  transfers: "Transfers",
  summary: "Summary",
};

export const PlannerLeftTabs = memo(function PlannerLeftTabs() {
  const [openIsland, setOpenIsland] = useState<TabId | null>(null);
  const nodes = useAppStore((s) => s.plan.nodes);
  const goalNodes = nodes.filter((n) => n.isTarget);

  const handleOpen = (id: TabId) => {
    setOpenIsland((prev) => (prev === id ? null : id));
  };

  const handleClose = () => {
    setOpenIsland(null);
  };

  return (
    <div className="planner-floating-controls">
      {/* Launcher buttons */}
      <div className="planner-floating-controls__dock">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`planner-floating-controls__btn ${openIsland === tab.id ? "planner-floating-controls__btn--active" : ""}`}
            onClick={() => handleOpen(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Floating island panel */}
      {openIsland && (
        <div className="planner-floating-island">
          <div className="planner-floating-island__header">
            <span className="planner-floating-island__title">
              {PANEL_TITLES[openIsland]}
            </span>
            <button
              type="button"
              className="planner-floating-island__close"
              onClick={handleClose}
              aria-label="Close panel"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </div>
          <div className="planner-floating-island__body">
            {openIsland === "goals" && <GoalInput />}
            {openIsland === "tools" && <PlannerTools />}
            {openIsland === "transfers" && <MetastorageTransfer />}
            {openIsland === "summary" && (
              nodes.length > 0 ? (
                <>
                  <ResultsSummaryStrip nodes={nodes} />
                  <div className="planner-summary-goals">
                    {goalNodes.map((goal, i) => (
                      <GoalGroup key={i} node={goal} compact={true} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="planner-summary-empty">
                  <span>No production data yet</span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
});