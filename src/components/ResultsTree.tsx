import { useState, useMemo } from "react";
import type { ProductionNode } from "@/types";
import { GoalGroup } from "./results/GoalGroup";
import { ResultsSummaryStrip } from "./results/ResultsSummaryStrip";
import { DependencyTree } from "./results/DependencyTree";

type ViewMode = "summary" | "detailed";

const ResultsTree = ({ nodes }: { nodes: ProductionNode[] }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("summary");

  const goalNodes = useMemo(
    () => nodes.filter((n) => n.isTarget),
    [nodes],
  );

  if (nodes.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-header">
        <span>Production Plan</span>
        <div className="results-view-toggle ml-auto">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === "summary" ? "active" : ""}`}
            onClick={() => setViewMode("summary")}
          >
            Summary
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === "detailed" ? "active" : ""}`}
            onClick={() => setViewMode("detailed")}
          >
            Detailed
          </button>
        </div>
      </div>

      <div className="panel-body">
        {viewMode === "summary" ? (
          <div className="results-summary-view">
            <ResultsSummaryStrip nodes={nodes} />
            <div className="goal-groups">
              {goalNodes.map((goal, i) => (
                <GoalGroup key={i} node={goal} compact={true} />
              ))}
            </div>
          </div>
        ) : (
          <div className="results-detailed-view">
            <div className="tree-root-list">
              {nodes.map((node, i) => (
                <DependencyTree
                  key={i}
                  node={node}
                  depth={0}
                  compact={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsTree;
