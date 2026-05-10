import { memo, useState } from "react";
import GoalInput from "../GoalInput";
import PlannerTools from "../PlannerTools";
import MetastorageTransfer from "../transfers/MetastorageTransfer";
import { GoalGroup } from "../results/GoalGroup";
import { ResultsSummaryStrip } from "../results/ResultsSummaryStrip";
import { PlannerTabsModal } from "./PlannerTabsModal";
import { useAppStore } from "@/store";
import type { SiteProductionNode } from "@/types";
import { ChevronDown, Eraser } from "lucide-react";

type TabId = "tools" | "transfers" | "summary";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "tools", label: "Tools" },
  { id: "transfers", label: "Transfers" },
  { id: "summary", label: "Summary" },
];

function renderTabContent(tab: TabId, nodes: SiteProductionNode[], goalNodes: SiteProductionNode[]) {
  switch (tab) {
    case "tools":
      return <PlannerTools />;
    case "transfers":
      return <MetastorageTransfer />;
    case "summary":
      return nodes.length > 0 ? (
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
      );
  }
}

export const PlannerLeftTabs = memo(function PlannerLeftTabs() {
  const [activeModalTab, setActiveModalTab] = useState<TabId | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const nodes = useAppStore((s) => s.plan.nodes);
  const goals = useAppStore((s) => s.plan.goals);
  const goalNodes = nodes.filter((n) => n.isTarget);
  const clearGoals = useAppStore((s) => s.clearGoals);

  const handleModalOpen = (id: TabId) => {
    setActiveModalTab((prev) => (prev === id ? null : id));
  };

  const handleModalClose = () => {
    setActiveModalTab(null);
  };

  const handleGoalsToggle = () => {
    setGoalsOpen((o) => !o);
  };

  const handleClearAll = () => {
    clearGoals();
    setShowClearConfirm(false);
  };

  return (
    <>
      {/* Goals floating island — anchored to bottom-left of stage */}
      <div
        className={`planner-goals-island ${!goalsOpen ? "island-closed" : ""}`}
      >
        <div className="planner-goals-island__header" onClick={handleGoalsToggle}>
          <span className="planner-goals-island__title">Goals</span>

          {/* Clear / Confirm controls */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {goals.length > 0 && !showClearConfirm && (
              <button
                type="button"
                className="planner-goals-island__clear"
                onClick={() => setShowClearConfirm(true)}
              >
                <Eraser className="w-3 h-3" strokeWidth={2} />
                <span>Clear</span>
              </button>
            )}
            {showClearConfirm && (
              <div className="planner-goals-island__confirm">
                <span className="planner-goals-island__confirm-text">
                  Clear {goals.length}?
                </span>
                <button
                  type="button"
                  className="planner-goals-island__confirm-yes"
                  onClick={handleClearAll}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className="planner-goals-island__confirm-no"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              className="planner-goals-island__toggle"
              onClick={(e) => {
                e.stopPropagation();
                handleGoalsToggle();
              }}
              aria-label={goalsOpen ? "Collapse" : "Expand"}
            >
              <ChevronDown
                size={12}
                strokeWidth={2.5}
                style={{ transform: goalsOpen ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 200ms" }}
              />
            </button>
          </div>
        </div>
        {goalsOpen && (
          <div className="planner-goals-island__body">
            <GoalInput />
          </div>
        )}
      </div>

      {/* Top-left tab dock */}
      <div className="planner-floating-controls">
        <div className="planner-floating-controls__dock">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`planner-floating-controls__btn ${activeModalTab === tab.id ? "planner-floating-controls__btn--active" : ""}`}
              onClick={() => handleModalOpen(tab.id)}
              aria-expanded={activeModalTab === tab.id}
              aria-haspopup="dialog"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modal panel for Tools / Transfers / Summary */}
      <PlannerTabsModal
        open={activeModalTab !== null}
        tab={activeModalTab}
        onClose={handleModalClose}
      >
        {activeModalTab ? renderTabContent(activeModalTab, nodes, goalNodes) : null}
      </PlannerTabsModal>
    </>
  );
});